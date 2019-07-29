---
layout: post
title:  持续学习docker(五)-Network
categories: docker
tags: docker Network
thread: docker
---

## 跨主机网络方案

![网络方案](/static/images/docker/docker-network.jpg)

* 1.docker 原生的 overlay 和 macvlan。
* 2.第三方方案：常用的包括 flannel、weave 和 calico。

**如此众多的方案是如何与 docker 集成在一起的?**

答案是：libnetwork 以及 CNM。

## libnetwork & CNM

libnetwork 是 docker 容器网络库，最核心的内容是其定义的 Container Network Model (CNM)，这个模型对容器网络进行了抽象，由以下三类组件组成：

### Sandbox

Sandbox 是容器的网络栈，包含容器的 interface、路由表和 DNS 设置。 Linux Network Namespace 是 Sandbox 的标准实现。Sandbox 可以包含来自不同 Network 的 Endpoint。

### Endpoint

Endpoint 的作用是将 Sandbox 接入 Network。Endpoint 的典型实现是 veth pair，后面我们会举例。**一个 Endpoint 只能属于一个网络，也只能属于一个 Sandbox。**

### Network

Network 包含一组 Endpoint，同一 Network 的 Endpoint 可以直接通信。Network 的实现可以是 Linux Bridge、VLAN 等。

## overlay

为支持容器跨主机通信，Docker 提供了 overlay driver，使用户可以创建基于 VxLAN 的 overlay 网络。VxLAN 可将二层数据封装到 UDP 进行传输，VxLAN 提供与 VLAN 相同的以太网二层服务，但是拥有更强的扩展性和灵活性。

Docerk overlay 网络需要一个 key-value 数据库用于保存网络状态信息，包括 Network、Endpoint、IP 等。`Consul`、`Etcd` 和 `ZooKeeper` 都是 Docker 支持的 key-vlaue 软件，我们这里使用 `Consul`。

### 环境信息

* ubuntu1
* ubuntu2
* ubuntu3

### 准备环境

* 在 `ubuntu1`中 以容器方式运行 Consul：

```bash
docker run -d -p 8500:8500 -h consul --name consul progrium/consul -server -bootstrap
```

在 `ubuntu2` 和 `ubuntu3` 中都修改 docker daemon 的配置文件 `/lib/systemd/system/docker.service`，在 `ExecStart` 最后增加`--cluster-store=consul://<ubuntu1-ip>:8500 --cluster-advertise=enp0s3:2376`

* `--cluster-store`: 指定 consul 的地址。
* `--cluster-advertise`: 告知 consul 自己的连接地址。

重启 docker daemon。

```bash
systemctl daemon-reload  
systemctl restart docker.service
```

查询是否注册成功

访问 `http://<ubuntu1-ip>:8500/ui/#/dc1/kv/docker/nodes/` 页面进行观察。

### 创建overlay网络

在 `ubuntu2` 中创建overlay网络 ov_net1

```bash
docker network create -d overlay ov_net1
```

* 查看当前网络

> docker network ls

我们新创建的 `ov_net1` 的 `SCOPE` 为 `global`，在 `ubuntu3` 中也可以直接看到了。

这是因为创建 `ov_net1` 时 `ubuntu2` 将 overlay 网络信息存入了 consul, `ubuntu3` 读取到了新网络的数据，之后 `ov_net1` 的任何变化都会同步到 `ubuntu2` 和 `ubuntu3`

> docker network inspect ov_net1  # 查看详细信息，其中 IPAM 是指 IP Address Management

* 在 `ubuntu2` 中创建 busybox 容器并连接到ov_net1

```bash
docker run -itd --name bbox1 --network ov_net1 busybox:1.28.3
```

* 查看容器网络配置

```bash
docker exec bbox1 ip r
```

* 在 `ubuntu3` 中创建 busybox 容器并连接到ov_net1

```bash
docker run -itd --name bbox2 --network ov_net1 busybox:1.28.3
```

* 在bbox2中 ping bbox1

```bash
docker exec bbox2 ping -c 2 bbox1
```

**docker 会创建一个 bridge 网络 “docker_gwbridge”，为所有连接到 overlay 网络的容器提供访问外网的能力.**
**overlay 网络中的容器可以直接通信，同时 docker 也实现了 DNS 服务.**

### overlay 网络具体实现

docker会为每个overly网络创建一个独立的 network namespace，其中会有一个 linux bridge br0, 恩打破呢 还有是由 veth pair 实现，一端连接到容器中，另一端连接到namespace的br0上。

br0 除了连接所有的 endpoint，还会连接一个 vxlan 设备，用于与其他 host 建立 vxlan tunnel。容器之间的数据就是通过这个 tunnel 通信的。逻辑网络拓扑结构如图所示：

![网络拓扑结构图](/static/images/docker/overlay-top.jpg)

要查看 overlay 网络的 namespace 可以在 `ubuntu2` 和 `ubuntu3` 上执行 `ip netns`（请确保在此之前执行过 `ln -s /var/run/docker/netns /var/run/netns`）

* 查看 namespace 中的 br0 上的设备

```bash
ip netns exec $(ip netns | grep "(id: 0)" | cut -d" " -f1) brctl show
```

* 查看 vxlan0 设备的具体配置信息

```bash
ip netns exec $(ip netns | grep "(id: 0)" | cut -d" " -f1) ip -d l show vxlan0
```

### overlay隔离

* 在 `ubuntu2` 上创建第二个overlay网络ov_net2

```bash
docker network create -d overlay ov_net2
docker run -itd --name bbox3 --network ov_net2 busybox
```

* 测试不同overlay容器的ping

```bash
docker exec -it bbox3 ping -c 2 10.0.0.2
```

**不同 overlay 网络之间是隔离的。即便是通过 docker_gwbridge 也不能通信.**

* 如果要实现 bbox3 与 bbox1 通信，可以将 bbox3 也连接到 ov_net1

```bash
docker network connect ov_net1 bbox3
```

### overlay IPAM

docker 默认为 overlay 网络分配 24 位掩码的子网（10.0.X.0/24），所有主机共享这个 subnet，容器启动时会顺序从此空间分配 IP。当然我们也可以通过 `--subnet` 指定 IP 空间。

```bash
docker network create -d overlay --subnet 10.22.1.0/24 ov_net3
```

## macvlan

macvlan 本身是 linxu kernel 模块，其功能是允许在同一个物理网卡上配置多个 MAC 地址，即多个 interface，每个 interface 可以配置自己的 IP。macvlan 本质上是一种网卡虚拟化技术，Docker 用 macvlan 实现容器网络就不奇怪了。

macvlan 的最大优点是性能极好，相比其他实现，macvlan 不需要创建 Linux bridge，而是直接通过以太 interface 连接到物理网络。下面我们就来创建一个 macvlan 网络。

### 准备实验环境

在 `ubuntu2`和 `ubuntu3`上创建macvlan。为保证多个 MAC 地址的网络包都可以从 enp0s3 通过，我们需要打开网卡的混杂模式。

```bash
ip link set enp0s3 promisc on
ip link show enp0s3
```

因为 `ubuntu2` 和 `ubuntu3` 是 VirtualBox 虚拟机，还需要在网卡配置选项页中设置混杂模式。

![VirtualBox设置网络混杂模式](/static/images/docker/virtualbox-network.jpg)

### 创建macvlan网络

在 `ubuntu2` 和 `ubuntu3` 中都创建macvlan网络 mac_net1

```bash
docker network create -d macvlan --subnet=172.16.86.0/24 --gateway=172.16.86.1 -o parent=enp0s3 mac_net1
```

* -d macvlan 指定 driver 为 macvlan。
* macvlan 网络是 local 网络，为了保证跨主机能够通信，用户需要自己管理 IP subnet。
* 与其他网络不同，docker 不会为 macvlan 创建网关，这里的网关应该是真实存在的，否则容器无法路由。
* -o parent 指定使用的网络 interface。

* 在 `ubuntu2` 中创建 `bbox4` 并连接到 `mac_net1`

```bash
docker run -itd --name bbox4 --ip=172.16.86.10 --network mac_net1 busybox
```

* 在 `ubuntu3` 中创建 `bbox5` 并连接到 `mac_net1`

```bash
docker run -itd --name bbox5 --ip=172.16.86.11 --network mac_net1 busybox
```

* 在 `ubuntu3` 验证 `bbox4` 和 `bbox5` 的连通性

```bash
docker exec bbox5 ping -c 2 172.16.86.10
```

bbox5 能够 ping 到 bbox4 的 IP 172.16.86.10，但无法解析 "bbox4" 主机名。

**可见 docker 没有为 macvlan 提供 DNS 服务，这点与 overlay 网络是不同的.**

### macvlan 网络结构分析

macvlan 不依赖 Linux bridge，`brctl show` 可以确认没有创建新的 bridge。

* 查看容器 bbox4 的网络设备

```bash
docker exec -it bbox4 ip link
```

除了 lo，容器只有一个 eth0，请注意 eth0 后面的 @if2，这表明该 interface 有一个对应的 interface，其全局的编号为 2。根据 macvlan 的原理，我们有理由猜测这个 interface 就是主机的 enp0s3 ，确认如下：

```bash
ip link show enp0s3
```

可见，容器的 eth0 就是 enp0s3 通过 macvlan 虚拟出来的 interface。容器的 interface 直接与主机的网卡连接，这种方案使得容器无需通过 NAT 和端口映射就能与外网直接通信（只要有网关），在网络上与其他独立主机没有区别。

### 用 sub-interface 实现多 macvlan 网络

macvlan 会独占主机的网卡，也就是说一个网卡只能创建一个 macvlan 网络，否则会报错

* 但主机的网卡数量是有限的，如何支持更多的 macvlan 网络呢？

VLAN 是现代网络常用的网络虚拟化技术，它可以将物理的二层网络划分成多达 4094 个逻辑网络，这些逻辑网络在二层上是隔离的，每个逻辑网络（即 VLAN）由 VLAN ID 区分，VLAN ID 的取值为 1-4094。

Linux 的网卡也能支持 VLAN（apt-get install vlan），同一个 interface 可以收发多个 VLAN 的数据包，不过前提是要创建 VLAN 的 sub-interface。

比如希望 enp0s3 同时支持 VLAN10 和 VLAN20，则需创建 sub-interface enp0s3.10 和 enp0s3.20。

在交换机上，如果某个 port 只能收发单个 VLAN 的数据，该 port 为 Access 模式，如果支持多 VLAN，则为 Trunk 模式，所以接下来实验的前提是：

enp0s3 要接在交换机的 trunk 口上。不过我们用的是 VirtualBox 虚拟机，则不需要额外配置了。

* 在 `ubuntu2` 和 `ubuntu3` 中都修改配置文件

```bash
cat >>/etc/network/interfaces<<EOF

auto enp0s3
iface enp0s3 inet manual

auto enp0s3.10
iface enp0s3.10 inet manual
vlan-raw-device enp0s3

auto enp0s3.20
iface enp0s3.20 inet manual
vlan-raw-device enp0s3
EOF
```

* 启动网卡

```bash
ifup enp0s3.10
ifup enp0s3.20
```

* 分别在 `ubuntu2` 和 `ubuntu3` 中创建macvlan网络

```bash
docker network create -d macvlan --subnet=172.16.10.0/24 --gateway=172.16.10.1 -o parent=enp0s3.10 mac_net10
docker network create -d macvlan --subnet=172.16.20.0/24 --gateway=172.16.20.1 -o parent=enp0s3.20 mac_net20
```

* 在 `ubuntu2` 中运行容器

```bash
docker run -itd --name bbox1 --ip=172.16.10.10 --network mac_net10 busybox
docker run -itd --name bbox2 --ip=172.16.20.10 --network mac_net20 busybox
```

* 在 `ubuntu3` 中运行容器

```bash
docker run -itd --name bbox3 --ip=172.16.10.11 --network mac_net10 busybox
docker run -itd --name bbox4 --ip=172.16.20.11 --network mac_net20 busybox
```

* 在 `ubuntu2` 验证macvlan之间的连通性

```bash
docker exec bbox1 ping -c 2 172.16.10.11
```

**同一 macvlan 网络能通信,不同 macvlan 网络之间不能通信。但更准确的说法应该是：不同 macvlan 网络不能 在二层上 通信。在三层上可以通过网关将 macvlan 连通.**

* 启用ubuntu1的 IP Forwarding

```bash
sysctl net.ipv4.ip_forward
```

输出为 1 则表示启用，如果为 0 可通过如下命令启用

```bash
sysctl -w net.ipv4.ip_forward=1
```

* 在ubuntu1中配置网络

```bash
cat >>/etc/network/interfaces<<EOF

auto enp0s3
iface enp0s3 inet manual

auto enp0s3.10
iface enp0s3.10 inet manual
vlan-raw-device enp0s3

auto enp0s3.20
iface enp0s3.20 inet manual
vlan-raw-device enp0s3
EOF
```

* 在ubuntu1中将网关 IP 配置到 sub-interface

```bash
ifconfig enp0s3.10 172.16.10.1 netmask 255.255.255.0 up
ifconfig enp0s3.20 172.16.20.1 netmask 255.255.255.0 up
```

* 在ubuntu1中添加 iptables 规则，转发不同 VLAN 的数据包。

```bash
iptables -t nat -A POSTROUTING -o enp0s3.10 -j MASQUERADE
iptables -t nat -A POSTROUTING -o enp0s3.20 -j MASQUERADE


iptables -A FORWARD -i enp0s3.10 -o enp0s3.20 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i enp0s3.20 -o enp0s3.10 -m state --state RELATED,ESTABLISHED -j ACCEPT

iptables -A FORWARD -i enp0s3.10 -o enp0s3.20 -j ACCEPT
iptables -A FORWARD -i enp0s3.20 -o enp0s3.10 -j ACCEPT
```

* 在 `ubuntu2` 上 测试 `ubuntu2` 上 `mac_net10` 和 `ubuntu3` 上 `mac_net20`通过

```bash
docker exec bbox1 ping -c 2 172.16.20.11
```

### 分析数据包到达过程

* 1.因为 bbox1 与 bbox4 在不同的 IP 网段，跟据 bbox1 的路由表

```bash
ubuntu2@root➜  ~ docker exec bbox1 ip route
default via 172.16.10.1 dev eth0
172.16.10.0/24 dev eth0 scope link  src 172.16.10.10
```

数据包将发送到网关 `172.16.10.1`

* 2.路由器从 `enp0s3.10` 收到数据包，发现目的地址是 `172.16.20.11`，查看自己的路由表：

```bash
ubuntu@root➜  ~ ip route
default via 10.10.110.254 dev enp0s3
10.10.110.0/24 dev enp0s3  proto kernel  scope link  src 10.10.110.4
172.16.10.0/24 dev enp0s3.10  proto kernel  scope link  src 172.16.10.1
172.16.20.0/24 dev enp0s3.20  proto kernel  scope link  src 172.16.20.1
172.17.0.0/16 dev docker0  proto kernel  scope link  src 172.17.0.1 linkdown
172.18.0.0/16 dev docker_gwbridge  proto kernel  scope link  src 172.18.0.1 linkdown
```

于是将数据包从 `enp0s3.20` 转发出去

* 3.通过 ARP 记录的信息，路由器能够得知 `172.16.20.11` 在 `ubuntu3` 上，于是将数据包发送给 `ubuntu3`
* 4.`ubuntu3` 根据目的地址和 VLAN 信息将数据包发送给 bbox4。

**macvlan 网络的连通和隔离完全依赖 VLAN、IP subnet 和路由，docker 本身不做任何限制，用户可以像管理传统 VLAN 网络那样管理 macvlan.**

## flannel

flannerl是 `CoreOS` 开发的容器网络解决方案、flannel为每个 host 分配一个 `subnet`，容器从此 `subnet` 中分配IP，这些IP可以在host间路由，容器间无需NAT和port mapping就可以跨主机通信。

每个 subnet 都是从一个更大的 IP 池中划分的，flannel 会在每个主机上运行一个叫 flanneld 的 agent，其职责就是从池子中分配 subnet。为了在各个主机间共享信息，flannel 用 etcd（与 consul 类似的 key-value 分布式数据库）存放网络配置、已分配的 subnet、host 的 IP 等信息。

数据包如何在主机间转发是由 backend 实现的。最常用的有 `vxlan` 和 `host-gw`。其他backend可以见[https://github.com/coreos/flannel](https://github.com/coreos/flannel)

### 环境准备

etcd 部署在 `ubuntu1`上，`ubuntu2` 和 `ubuntu3` 上运行 flanneld，首先安装配置 etcd。

### 安装配置etcd，在ubuntu1中操作

```bash
ETCD_VER=v2.3.7
DOWNLOAD_URL=https://github.com/coreos/etcd/releases/download

curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz

mkdir -p /tmp/test-etcd && tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd --strip-components=1

cp /tmp/test-etcd/etcd* /usr/local/bin/
```

* 启动etcd并打开270监听端口

```bash
LOCAL_IP=$(ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1)
screen -S etcd etcd -listen-client-urls http://$LOCAL_IP:2379 -advertise-client-urls http://$LOCAL_IP:2379
```

* 测试 etcd

```bash
etcdctl --endpoints=127.0.0.1:2379 set foo "bar"
etcdctl --endpoints=127.0.0.1:2379 get foo
```

### 安装配置 flannel

#### build flannel，在ubuntu1中操作

* 1.下载并重名image

```bash
docker pull cloudman6/kube-cross:v1.6.2-2
docker tag cloudman6/kube-cross:v1.6.2-2 gcr.io/google_containers/kube-cross:v1.6.2-2
```

* 2.下载flannel源码

```bash
git clone https://github.com/coreos/flannel.git
cd flannel
```

小文件较多, clone会比较慢，可以下载zip包

```bash
curl -L https://github.com/coreos/flannel/archive/master.zip -o /tmp/flannel.zip
cd /tmp && unzip flannel.zip && cd flannel-master
```

* 3.开始构建

```bash
make dist/flanneld-amd64
```

* 4.将 flanneld 执行文件拷贝到 ubuntu2 和 ubuntu3

```bash
scp dist/flanneld-amd64 ubuntu2:/usr/local/bin/flanneld
scp dist/flanneld-amd64 ubuntu3:/usr/local/bin/flanneld
```

#### 将 flannel 网络的配置信息保存到 etcd，在ubuntu1中操作

* 1.先将配置信息写到文件 flannel-config.json 中，内容为：
    - 1.Network 定义该网络的 IP 池为 10.2.0.0/16。
    - 2.SubnetLen 指定每个主机分配到的 subnet 大小为 24 位，即10.2.X.0/24。
    - 3.Backend 为 vxlan，即主机间通过 vxlan 通信，后面我们还会讨论host-gw。

```bash
cat >flannel-config.json<<EOF
{
  "Network": "10.2.0.0/16",
  "SubnetLen": 24,
  "Backend": {
    "Type": "vxlan"
  }
}
EOF
```

* 2.将配置存入etcd

```bash
etcdctl --endpoints=$(ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1):2379 set /docker-test/network/config < flannel-config.json
```

`/docker-test/network/config` 是此 etcd 数据项的 key，其 value 为 `flannel-config.json` 的内容。key 可以任意指定，这个 key 后面会作为 flanneld 的一个启动参数。执行 etcdctl get 确保设置成功。

* 检查是否保存成功

```bash
etcdctl --endpoints=$(ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1):2379 get /docker-test/network/config
```

#### 启动flannel

分别在 `ubuntu2`, `ubuntu3`中执行以下命令进行启动

```bash
screen -S flannel flanneld -etcd-endpoints=http://${UBUNTU1_IP}:2379 -iface=$(ip a | grep "inet " | grep -v -E " lo$| docker" | awk '{print $7}' | uniq | head -n 1) -etcd-prefix=/docker-test/network
```

* `-etcd-endpoints`: 指定 etcd url
* `-iface`: 指定主机间数据传输使用的 interface
* `-etcd-prefix`: 指定 etcd 存放 flannel 网络配置信息的 key

启动flaneld后，内部网络或发生一些变化

```bash
ip addr show flannel.1
```

#### 配置Docker连接flannel

编辑 `ubuntu2` 的Docker配置文件 `/lib/systemd/system/docker.service`，在 `ExecStart` 最后加上

```bash
echo "--bip=$(cat /run/flannel/subnet.env | grep 'SUBNET' | cut -f2 -d'=') --mtu=$(cat /run/flannel/subnet.env | grep 'MTU' | cut -f2 -d'=')"
```

这两个参数的值必须与 /run/flannel/subnet.env 中 FLANNEL_SUBNET 和FLANNEL_MTU 一致。

* 重启Docker

```bash
systemctl daemon-reload && systemctl restart docker
```

#### 将容器连接到flannel网络

* 在 `ubuntu2` 中启动容器 `bbox1`，并查看IP

```bash
docker run -itd --name bbox1 busybox
docker exec bbox1 ip r
```

* 在 `ubuntu3` 中启动容器 `bbox2`

```bash
docker run -itd --name bbox2 busybox
docker exec bbox2 ip r
```

### flannel网络连通性

测试 bbox1 和 bbox2 的连通性

```bash
docker exec bbox1 ping -c 2 ${bbox2IP}

docker exec bbox1 traceroute ${bbox2IP}

docker exec bbox1 traceroute bbox2
```

**flannel 是没有 DNS 服务的，容器无法通过 hostname 通信。**

* flannel 网络隔离

flannel 为每个主机分配了独立的 subnet，但 flannel.1 将这些 subnet 连接起来了，相互之间可以路由。本质上，flannel 将各主机上相互独立的 docker0 容器网络组成了一个互通的大网络，实现了容器跨主机通信。flannel 没有提供隔离。

* flannel 与外网连通性

因为 flannel 网络利用的是默认的 bridge 网络，所以容器与外网的连通方式与 bridge 网络一样，即：

    1.容器通过 docker0 NAT 访问外网

    2.通过主机端口映射，外网可以访问容器

## flanner host-gw backend

与 vxlan 不同，host-gw 不会封装数据包，而是在主机的路由表中创建到其他主机 subnet 的路由条目，从而实现容器跨主机通信。要使用 host-gw 首先修改 flannel 的配置 flannel-config.json：

* 1.ubuntu1 更改配置

```bash
cat >flannel-config.json <<EOF
{
 "Network": "10.2.0.0/16",
 "SubnetLen": 24,
 "Backend": {
   "Type": "host-gw"
 }
}
EOF
```

* 2.ubuntu1 更新etcd数据库

```bash
etcdctl --endpoints=$(ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1):2379 set /docker-test/network/config < flannel-config.json
```

* 3.ubuntu2、ubuntu3重启flanneld

```bash
screen -X -S flannel quit
screen -S flannel flanneld -etcd-endpoints=http://${UBUNTU1_IP}:2379 -iface=$(ip a | grep "inet " | grep -v -E " lo$| docker" | awk '{print $7}' | uniq | head -n 1) -etcd-prefix=/docker-test/network
```

* 4.在ubuntu2、ubuntu3上查看 `/run/flannel/subnet.env` 文件，其MTU值已发生改变
* 5.在ubuntu2、ubuntu3上更新 `/lib/systemd/system/docker.service` 中 `ExecStart` `--mtu` 的值，并重启docker

### host-gw与vxlan对比

* 1.host-gw把每个主机都配置成网关，主机知道其他主机的subnet和转发地址。vxlan则在主机间建议隧道，不同主机的容器都在一个大的网段内
* 2.虽然vxlan与host-gw使用不同的机制建立主机之间连接，但对于容器则无需任何改变
* 3.由于vxlan需要对数据进行额外打包和拆包，性能会稍逊于host-gw

## Weave网络

weave 是 Weaveworks 开发的容器网络解决方案。weave 创建的虚拟网络可以将部署在多个主机上的容器连接起来。对容器来说，weave 就像一个巨大的以太网交换机，所有容器都被接入这个交换机，容器可以直接通信，无需 NAT 和端口映射。除此之外，weave 的 DNS 模块使容器可以通过 hostname 访问。

### 实验环境描述

weave 不依赖分布式数据库（例如 etcd 和 consul）交换网络信息，每个主机上只需运行 weave 组件就能建立起跨主机容器网络。我们在 ubuntu2 和 ubuntu3 上部署 weave 并实践 weave 的各项特性。

### 安装部署weave

* 1.分别在两台虚机上执行

```bash
curl -L git.io/weave -o /usr/local/bin/weave
chmod a+x /usr/local/bin/weave
```

* 2.在ubuntu2上启动weave

```bash
weave launch
```

weave的所有组件都是以容器方式运行的，weave会从docker hub 下载最新的镜像并启动容器。

* `weave`: 是主程序，负责建立 weave 网络，收发数据 ，提供 DNS 服务等。
* `weaveplugin`: 是 libnetwork CNM driver，实现 Docker 网络。
* `weaveproxy`: 提供 Docker 命令的代理服务，当用户运行 Docker CLI 创建容器时，它会自动将容器添加到 weave 网络。

查看docker网络会发现weave会创建一个新的Docker网络 `weave`, `DRIVER` 是 `weavemesh`

### 网络结构分析

* 1.进入weave环境

将后续的 docker 命令发给 weave proxy 处理

```bash
eval $(weave env)
```

* 2.启动容器

```bash
docker run --name bbox1 -itd busybox
```

* 3.查看bbox1的网络配置

```bash
docker exec bbox1 ip address
```

bbox1 有两个网络接口 eth0 和 ethwe，其中 eth0 连接的是默认 bridge 网络，即网桥 docker0。

* 4.在ubuntu2上查看interface

```bash
ip link
brctl show
ip -d link
```

1.vethwe-bridge 与 vethwe-datapath 是 veth pair。

2.vethwe-datapath 的父设备（master）是 datapath。

3.datapath 是一个 openvswitch。

4.vxlan-6784 是 vxlan interface，其 master 也是 datapath，weave 主机间是通过 VxLAN 通信的。

![ubuntu2的网络top](/static/images/docker/weave-top.jpg)

weave 网络包含两个虚拟交换机：Linux bridge `weave` 和 Open vSwitch `datapath`，veth pair `vethwe-bridge` 和 `vethwe-datapath` 将二者连接在一起。weave 和 datapath 分工不同，`weave` 负责将容器接入 weave 网络，`datapath` 负责在主机间 VxLAN 隧道中并收发数据。

* 5.再创建bbox2,测试网络连通性

```bash
docker exec bbox1 hostname
docker run --name bbox2 -itd busybox
docker exec bbox1 ping -c 2 bbox2
```

* 恢复之前的本地docker环境

```bash
eval $(weave env --restore)
```

### weave网络连通

* 1.在ubuntu3上启动weave

```bash
weave launch ${UBUNTU2_IP}
```

必须要指定ubuntu2的IP才能加入到同一个weave网络

* 2.进入weave网络

```bash
eval $(weave env)
```

* 3.创建bbox3

一定要进入weave网络后再创建容器，网络才是连通的

```bash
docker run --name bbox3 -itd busybox
```

* 4.测试网络连通性

```bash
docker exec bbox3 ping -c 2 bbox1
docker exec bbox3 ping -c 2 bbox2
```

### weave网络隔离

默认配置下，weave使用一个大subnet,所有主机的容器都从这个地址空间中分配IP，因为同属一个subnet，容器可以直接通信。

如果要实现网络隔离，可以通过环境变量 `WEAVE_CIDR` 为容器分配不同的subnet的IP

```bash
docker run --name bbox4 -e WEAVE_CIDR=net:10.32.3.0/24 -itd busybox
docker exec bbox4 ip r
docker exec bbox4 ping -c 2 bbox1
```

### weave和外部通信

weave是一个私有的VxLAN网络，默认与外部网络隔离。需要

* 1.首先将主机加入到weave网络
* 2.然后把主机当做访问weave网络的网关

主机加入weave

```bash
weave expose
```

查看网桥信息

```bash
ip addr show weave
```

![ubuntu2的网络结构](/static/images/docker/weave-network.jpg)

weave 网桥位于 root namespace，它负责将容器接入 weave 网络。给 weave 配置同一 subnet 的 IP 其本质就是将 ubuntu2 接入 weave 网络。 ubuntu2 现在已经可以直接与同一 weave 网络中的容器通信了，无论容器是否位于 ubuntu2.

ubuntu2上weave网关

```bash
ip addr show weave | grep "inet " | awk '{print $2}'  # IP需要换成网关 如 10.32.0.3/12 替换成 10.32.0.0/12
```

在ubuntu3上添加路由

```bash
ip route add ${UBUNTU2_MASK} via ${UBUNTU2_IP}
```

* weave到外网

因为容器本身就挂在默认的 bridge 网络上，docker0 已经实现了 NAT，所以容器无需额外配置就能访问外网。

### IPAM

10.32.0.0/12 是 weave 网络使用的默认 subnet，如果此地址空间与现有 IP 冲突，可以通过 --ipalloc-range 分配特定的 subnet。

```bash
weave launch --ipalloc-range 10.2.0.0/16
```

不过请确保所有 host 都使用相同的 subnet。

## Calico 网络

Calico 是一个纯三层的虚拟网络方案，Calico 为每个容器分配一个 IP，每个 host 都是 router，把不同 host 的容器连接起来。与 VxLAN 不同的是，Calico 不对数据包做额外封装，不需要 NAT 和端口映射，扩展性和性能都很好。

与其他容器网络方案相比，Calico 还有一大优势：`network policy`。用户可以动态定义 ACL 规则，控制进出容器的数据包，实现业务需求。

### 环境描述

Calico 依赖 etcd 在不同主机间共享和交换信息，存储 Calico 网络状态。我们将在 ubuntu1 上运行 etcd。

Calico 网络中的每个主机都需要运行 Calico 组件，提供容器 interface 管理、动态路由、动态 ACL、报告状态等功能。

### 配置etcd

* 修改ubuntu2、ubuntu3的docker配置文件

```bash
--cluster-store=etcd://${UBUNTU1_IP}:2379
```

* 两个虚机重启docker

```bash
systemctl daemon-reload && systemctl restart docker
```

### 部署calico

* 两个虚机下载calicoctl

```bash
wget -O /usr/local/bin/calicoctl https://github.com/projectcalico/calicoctl/releases/download/v1.0.2/calicoctl

chmod +x /usr/local/bin/calicoctl
```

* 两个虚机指定新版本需要指定配置文件

```bash
mkdir -p /etc/calico
cat >/etc/calico/caclicoctl.cfg <<EOF
apiVersion: v1
kind: calicoApiConfig
metadata:
spec:
  datastoreType: "etcdv2"
  etcdEndpoints: "http://${UBUNTU1_IP}:2379"
EOF
```

* 在 ubuntu2 和 ubuntu3 上启动 calico

```bash
calicoctl node run -c /etc/calico/caclicoctl.cfg
```

### 创建calico网络

* 等待calico-node容器启动

```bash
docker container ls
```

* 在ubuntu2创建

```bash
docker network create --driver calico --ipam-driver calico-ipam cal_net1
```

`--driver calio`: 指定使用calico的libnetwork CNM driver

`--ipam-driver calico-ipam`: 指定使用calico的IPAM driver管理IP

**calico 为 global 网络，etcd 会将 cal_net 同步到所有主机。**

### Calico网络结构

* 在ubuntu2上运行容器bbox1并连接到cal_net1

```bash
docker container run --net cal_net1 --name bbox1 -tid busybox:1.28.3
```

* 查看bbox1的网络配置

```bash
docker exec bbox1 ip address
```

`cali0` 是 calico interface

* 在ubuntu3上运行容器bbox1并连接到cal_net1

```bash
docker container run --net cal_net1 --name bbox2 -tid busybox:1.28.3
```

* 查看bbox2的网络配置

```bash
docker exec bbox2 ip address show cali0
```

### 测试网络连通性

* bbox1 ping bbox2

```bash
docker exec bbox1 ping -c 2 bbox2
```

* 任一虚机创建网络 cal_net2

```bash
docker network create --driver calico --ipam-driver calico-ipam cal_net2
```

* 在ubuntu2上运行容器bbox3

```bash
docker container run --net cal_net2 --name bbox3 -tid busybox:1.28.3
```

* 查看bbox3的网络配置

```bash
docker exec bbox3 ip address show cali0
```

虽然 bbox1 和 bbox3 都位于同一主机，而且都在一个 subnet，但它们属于不同的 calico 网络，默认不能通行。

calico 默认的 policy 规则是：**容器只能与同一个 calico 网络中的容器通信。**

calico 的每个网络都有一个同名的 profile，profile 中定义了该网络的 policy。我们具体看一下 cal_net1 的 profile：

```bash
calicoctl get profile cal_net1 -o yaml -c /etc/calico/caclicoctl.cfg
```

### 定制Calico网络Policy

calico 能够让用户定义灵活的 policy 规则，精细化控制进出容器的流量，下面我们就来实践一个场景：

1.创建一个新的 calico 网络 cal_web 并部署一个 httpd 容器 web1。

2.定义 policy 允许 cal_net2 中的容器访问 web1 的 80 端口。

* 1.创建cal_web

```bash
docker network create --driver calico --ipam-driver calico-ipam cal_web
```

* 2.在ubuntu2上运行容器web1，连接到cal_web

```bash
docker container run --net cal_web --name web1 -d httpd:2.4.34
```

* 3.查看web1的IP

```bash
docker container exec web1 ip address show cali0
```

* 4.创建policy的web.yaml

```bash
cat >web.yml<<EOF
- apiVersion: v1
  kind: profile
  metadata:
    name: cal_web
  spec:
    ingress:
    - action: allow
      protocol: tcp
      source:
        tag: cal_net2
      destination:
        ports:
        - 80
EOF
```

* 5.应用policy

```bash
calicoctl apply -f web.yml -c /etc/calico/caclicoctl.cfg
```

1.profile 与 cal_web 网络同名，cal_web 的所有容器（web1）都会应用此 profile 中的 policy。

2.ingress 允许 cal_net2 中的容器（bbox3）访问。

3.只开放 80 端口。

现在 bbox3 已经能够访问 web1 的 http 服务了。

### 定制Calico的IP池

* 定义IP Pool

```bash
cat >ip_pool.yml<< EOF
- apiVersion: v1
  kind: ipPool
  metadata:
    cidr: 17.2.0.0/16
EOF
calicoctl create -f ip_pool.yml -c /etc/calico/caclicoctl.cfg
```

* 基于IP Pool 创建网路

```bash
docker network create --driver calico --ipam-driver calico-ipam --subnet=17.2.0.0/16 my_net
```

* 分配subnet中的IP

```bash
docker container run --net my_net --rm busybox ip address show cali0
```

* 分配指定IP

```bash
docker container run --net my_net  --ip 17.2.1.1 --rm busybox ip address show cali0
```

## Docker网络

||Docker Overlay|Macvaln|Flannel vxlan|Flannel host-gw|Weave|Calico|
|:---|:---|:---|:---|:---|:---|:---|
|网络模型|Overlay: VxLAN|Underlay|Overlay:VxLAN|Underlay: 纯三层|Overlay: VxLAN|Underlay: 纯三层|
|Distributed Store|Yes|No|Yes|Yes|No|Yes|
|IPAM|单一subnet|自定义|每个host一个subnet|每个host一个subnet|单一subnet|每个host一个subnet|

### IPAM

Docker Overlay 网络中所有主机共享同一个 subnet，容器启动时会顺序分配 IP，可以通过 --subnet 定制此 IP 空间。

Macvlan 需要用户自己管理 subnet，为容器分配 IP，不同 subnet 通信依赖外部网关。

Flannel 为每个主机自动分配独立的 subnet，用户只需要指定一个大的 IP 池。不同 subnet 之间的路由信息也由 Flannel 自动生成和配置。

Weave 的默认配置下所有容器使用 10.32.0.0/12 subnet，如果此地址空间与现有 IP 冲突，可以通过 --ipalloc-range 分配特定的 subnet。

Calico 从 IP Pool（可定制）中为每个主机分配自己的 subnet。

### 连通与隔离

同一 Docker Overlay 网络中的容器可以通信，但不同网络之间无法通信，要实现跨网络访问，只有将容器加入多个网络。与外网通信可以通过 docker_gwbridge 网络。

Macvlan 网络的连通或隔离完全取决于二层 VLAN 和三层路由。

不同 Flannel 网络中的容器直接就可以通信，没有提供隔离。与外网通信可以通过 bridge 网络。

Weave 网络默认配置下所有容器在一个大的 subnet 中，可以自由通信，如果要实现隔离，需要为容器指定不同的 subnet 或 IP。与外网通信的方案是将主机加入到 weave 网络，并把主机当作网关。

Calico 默认配置下只允许位于同一网络中的容器之间通信，但通过其强大的 Policy 能够实现几乎任意场景的访问控制。

### 性能

性能测试是一个非常严谨和复杂的工程，这里我们只尝试从技术方案的原理上比较各方案的性能。

最朴素的判断是：**Underlay 网络性能优于 Overlay 网络。**

Overlay 网络利用隧道技术，将数据包封装到 UDP 中进行传输。因为涉及数据包的封装和解封，存在额外的 CPU 和网络开销。虽然几乎所有 Overlay 网络方案底层都采用 Linux kernel 的 vxlan 模块，这样可以尽量减少开销，但这个开销与 Underlay 网络相比还是存在的。所以 Macvlan、Flannel host-gw、Calico 的性能会优于 Docker overlay、Flannel vxlan 和 Weave。

Overlay 较 Underlay 可以支持更多的二层网段，能更好地利用已有网络，以及有避免物理交换机 MAC 表耗尽等优势，所以在方案选型的时候需要综合考虑。

## 参考

* [跨主机网络概述](https://www.cnblogs.com/CloudMan6/p/7259266.html)
* [overlay 如何实现跨主机通信](https://www.cnblogs.com/CloudMan6/p/7305989.html)
