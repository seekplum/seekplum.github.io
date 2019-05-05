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

* 宿主机(ubuntu)
* ubuntu1
* ubuntu2

### 准备环境

* 在 `ubuntu1`中 以容器方式运行 Consul：

```bash
docker run -d -p 8500:8500 -h consul --name consul progrium/consul -server -bootstrap
```

在 `ubuntu1` 和 `ubuntu2` 中都修改 docker daemon 的配置文件 `/lib/systemd/system/docker.service`，在 `ExecStart` 最后增加`--cluster-store=consul://<ubuntu-ip>:8500 --cluster-advertise=enp0s3:2376`

* `--cluster-store`: 指定 consul 的地址。
* `--cluster-advertise`: 告知 consul 自己的连接地址。

重启 docker daemon。

```bash
systemctl daemon-reload  
systemctl restart docker.service
```

查询是否注册成功

访问 `http://<ubuntu-ip>:8500/ui/#/dc1/kv/docker/nodes/` 页面进行观察。

### 创建overlay网络

在 `ubuntu1` 中创建overlay网络 ov_net1

```bash
docker network create -d overlay ov_net1
```

* 查看当前网络

> docker network ls

我们新创建的 `ov_net1` 的 `SCOPE` 为 `global`，在 `ubuntu2` 中也可以直接看到了。

这是因为创建 `ov_net1` 时 `ubuntu1` 将 overlay 网络信息存入了 consul, `ubuntu2` 读取到了新网络的数据，之后 `ov_net1` 的任何变化都会同步到 `ubuntu1` 和 `ubuntu2`

> docker network inspect ov_net1  # 查看详细信息，其中 IPAM 是指 IP Address Management

* 在 `ubuntu1` 中创建 busybox 容器并连接到ov_net1

```bash
docker run -itd --name bbox1 --network ov_net1 busybox
```

* 查看容器网络配置

```bash
docker exec bbox1 ip r
```

* 在 `ubuntu2` 中创建 busybox 容器并连接到ov_net1

```bash
docker run -itd --name bbox2 --network ov_net1 busybox
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

要查看 overlay 网络的 namespace 可以在 `ubuntu1` 和 `ubuntu2` 上执行 `ip netns`（请确保在此之前执行过 `ln -s /var/run/docker/netns /var/run/netns`）

* 查看 namespace 中的 br0 上的设备

```bash
ip netns exec 1-5e2f2ef16a brctl show
```

* 查看 vxlan0 设备的具体配置信息

```bash
ip netns exec 1-5e2f2ef16a ip -d l show vxlan0
```

### overlay隔离

* 在 `ubuntu1` 上创建第二个overlay网络ov_net2

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

在 `ubuntu1`和 `ubuntu2`上创建macvlan。为保证多个 MAC 地址的网络包都可以从 enp0s3 通过，我们需要打开网卡的混杂模式。

```bash
ip link set enp0s3 promisc on
ip link show enp0s3
```

因为 `ubuntu1` 和 `ubuntu2` 是 VirtualBox 虚拟机，还需要在网卡配置选项页中设置混杂模式。

![VirtualBox设置网络混杂模式](/static/images/docker/virtualbox-network.jpg)

### 创建macvlan网络

在 `ubuntu1` 和 `ubuntu2` 中都创建macvlan网络 mac_net1

```bash
docker network create -d macvlan --subnet=172.16.86.0/24 --gateway=172.16.86.1 -o parent=enp0s3 mac_net1
```

* -d macvlan 指定 driver 为 macvlan。
* macvlan 网络是 local 网络，为了保证跨主机能够通信，用户需要自己管理 IP subnet。
* 与其他网络不同，docker 不会为 macvlan 创建网关，这里的网关应该是真实存在的，否则容器无法路由。
* -o parent 指定使用的网络 interface。

* 在 `ubuntu1` 中创建 `bbox4` 并连接到 `mac_net1`

```bash
docker run -itd --name bbox4 --ip=172.16.86.10 --network mac_net1 busybox
```

* 在 `ubuntu2` 中创建 `bbox5` 并连接到 `mac_net1`

```bash
docker run -itd --name bbox5 --ip=172.16.86.11 --network mac_net1 busybox
```

* 在 `ubuntu2` 验证 `bbox4` 和 `bbox5` 的连通性

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

* 在 `ubuntu1` 和 `ubuntu2` 中都修改配置文件

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

* 分别在 `ubuntu1` 和 `ubuntu2` 中创建macvlan网络

```bash
docker network create -d macvlan --subnet=172.16.10.0/24 --gateway=172.16.10.1 -o parent=enp0s3.10 mac_net10
docker network create -d macvlan --subnet=172.16.20.0/24 --gateway=172.16.20.1 -o parent=enp0s3.20 mac_net20
```

* 在 `ubuntu1` 中运行容器

```bash
docker run -itd --name bbox1 --ip=172.16.10.10 --network mac_net10 busybox
docker run -itd --name bbox2 --ip=172.16.20.10 --network mac_net20 busybox
```

* 在 `ubuntu2` 中运行容器

```bash
docker run -itd --name bbox3 --ip=172.16.10.11 --network mac_net10 busybox
docker run -itd --name bbox4 --ip=172.16.20.11 --network mac_net20 busybox
```

* 在 `ubuntu1` 验证macvlan之间的连通性

```bash
docker exec bbox1 ping -c 2 172.16.10.11
```

**同一 macvlan 网络能通信,不同 macvlan 网络之间不能通信。但更准确的说法应该是：不同 macvlan 网络不能 在二层上 通信。在三层上可以通过网关将 macvlan 连通.**

* 启用宿主机的 IP Forwarding

```bash
sysctl net.ipv4.ip_forward
```

输出为 1 则表示启用，如果为 0 可通过如下命令启用

```bash
sysctl -w net.ipv4.ip_forward=1
```

* 在宿主机中配置网络

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

* 在宿主机中将网关 IP 配置到 sub-interface

```bash
ifconfig enp0s3.10 172.16.10.1 netmask 255.255.255.0 up
ifconfig enp0s3.20 172.16.20.1 netmask 255.255.255.0 up
```

* 在宿主机中添加 iptables 规则，转发不同 VLAN 的数据包。

```bash
iptables -t nat -A POSTROUTING -o enp0s3.10 -j MASQUERADE
iptables -t nat -A POSTROUTING -o enp0s3.20 -j MASQUERADE


iptables -A FORWARD -i enp0s3.10 -o enp0s3.20 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i enp0s3.20 -o enp0s3.10 -m state --state RELATED,ESTABLISHED -j ACCEPT

iptables -A FORWARD -i enp0s3.10 -o enp0s3.20 -j ACCEPT
iptables -A FORWARD -i enp0s3.20 -o enp0s3.10 -j ACCEPT
```

* 在 `ubuntu1` 上 测试 `ubuntu1` 上 `mac_net10` 和 `ubuntu2` 上 `mac_net20`通过

```bash
docker exec bbox1 ping -c 2 172.16.20.11
```

### 分析数据包到达过程

* 1.因为 bbox1 与 bbox4 在不同的 IP 网段，跟据 bbox1 的路由表

```bash
ubuntu1@root➜  ~ docker exec bbox1 ip route
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

* 3.通过 ARP 记录的信息，路由器能够得知 `172.16.20.11` 在 `ubuntu2` 上，于是将数据包发送给 `ubuntu2`
* 4.`ubuntu2` 根据目的地址和 VLAN 信息将数据包发送给 bbox4。

**macvlan 网络的连通和隔离完全依赖 VLAN、IP subnet 和路由，docker 本身不做任何限制，用户可以像管理传统 VLAN 网络那样管理 macvlan.**

## flannel

flannerl是 `CoreOS` 开发的容器网络解决方案、flannel为每个 host 分配一个 `subnet`，容器从此 `subnet` 中分配IP，这些IP可以在host间路由，容器间无需NAT和port mapping就可以跨主机通信。

每个 subnet 都是从一个更大的 IP 池中划分的，flannel 会在每个主机上运行一个叫 flanneld 的 agent，其职责就是从池子中分配 subnet。为了在各个主机间共享信息，flannel 用 etcd（与 consul 类似的 key-value 分布式数据库）存放网络配置、已分配的 subnet、host 的 IP 等信息。

数据包如何在主机间转发是由 backend 实现的。最常用的有 `vxlan` 和 `host-gw`。其他backend可以见[https://github.com/coreos/flannel](https://github.com/coreos/flannel)

### 环境准备

etcd 部署在 `宿主机(ubuntu)`，`ubuntu1` 和 `ubuntu2` 上运行 flanneld，首先安装配置 etcd。

### 安装配置etcd，在宿主机(ubuntu)中操作

```bash
ETCD_VER=v2.3.7
DOWNLOAD_URL=https://github.com/coreos/etcd/releases/download

curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz

mkdir -p /tmp/test-etcd && tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/test-etcd --strip-components=1

cp /tmp/test-etcd/etcd* /usr/local/bin/
```

* 启动etcd并打开270监听端口

```bash
etcd -listen-client-urls http://0.0.0.0:2379 -advertise-client-urls http://127.0.0.1:2379
```

* 测试 etcd

```bash
etcdctl --endpoints=127.0.0.1:2379 set foo "bar"
etcdctl --endpoints=127.0.0.1:2379 get foo
```

### 安装配置 flannel

#### build flannel，在宿主机(ubuntu)中操作

* 1.下载并重名image

```bash
docker pull cloudman6/kube-cross:v1.6.2-2
docker tag cloudman6/kube-cross:v1.6.2-2 gcr.io/google_containers/kube-cross:v1.6.2-2
```

* 2.下载flannel源码

```bash
git clone https://github.com/coreos/flannel.git
```

小文件较多, clone会比较慢，可以下载zip包

```bash
curl -L https://github.com/coreos/flannel/archive/master.zip -o /tmp/flannel.zip
```

* 3.开始构建

```bash
cd flannel
make dist/flanneld-amd64
```

* 4.将 flanneld 执行文件拷贝到 ubuntu1 和 ubuntu2

```bash
scp dist/flanneld-amd64 ubuntu1:/usr/local/bin/flanneld
scp dist/flanneld-amd64 ubuntu2:/usr/local/bin/flanneld
```

#### 将 flannel 网络的配置信息保存到 etcd，在宿主机(ubuntu)中操作

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
etcdctl --endpoints=127.0.0.1:2379 set /docker-test/network/config < flannel-config.json
```

`/docker-test/network/config` 是此 etcd 数据项的 key，其 value 为 `flannel-config.json` 的内容。key 可以任意指定，这个 key 后面会作为 flanneld 的一个启动参数。执行 etcdctl get 确保设置成功。

* 检查是否保存成功

```bash
etcdctl --endpoints=127.0.0.1:2379 get /docker-test/network/config
```

#### 启动flannel

分别在 `ubuntu1`, `ubuntu2`中执行以下命令进行启动

```bash
flanneld -etcd-endpoints=http://<ubuntu-ip>:2379 -iface=enp0s3 -etcd-prefix=/docker-test/network
```

* -etcd-endpoints 指定 etcd url
* -iface 指定主机间数据传输使用的 interface
* -etcd-prefix 指定 etcd 存放 flannel 网络配置信息的 key

#### 配置Docker连接flannel

编辑 `ubuntu1` 的Docker配置文件 `/lib/systemd/system/docker.service`，在 `ExecStart` 最后加上

```bash
echo "--bip=$(cat /run/flannel/subnet.env | grep 'SUBNET' | cut -f2 -d'=') --mtu=$(cat /run/flannel/subnet.env | grep 'MTU' | cut -f2 -d'=')"
```

这两个参数的值必须与 /run/flannel/subnet.env 中 FLANNEL_SUBNET 和FLANNEL_MTU 一致。

* 重启Docker

```bash
systemctl daemon-reload && systemctl restart docker
```

#### 将容器连接到flannel网络

* 在 `ubuntu1` 中启动容器 `bbox1`，并查看IP

```bash
docker run -itd --name bbox1 busybox
docker exec bbox1 ip r
```

* 在 `ubuntu2` 中启动容器 `bbox2`

```bash
docker run -itd --name bbox2 busybox
docker exec bbox2 ip r
```

### flannel网络连通性

测试 bbox1 和 bbox2 的连通性

```bash
docker exec bbox1 ping -c 2 10.2.99.1

docker exec bbox1 traceroute 10.2.99.1
```

* flannel 网络隔离

flannel 为每个主机分配了独立的 subnet，但 flannel.1 将这些 subnet 连接起来了，相互之间可以路由。本质上，flannel 将各主机上相互独立的 docker0 容器网络组成了一个互通的大网络，实现了容器跨主机通信。flannel 没有提供隔离。

* flannel 与外网连通性

因为 flannel 网络利用的是默认的 bridge 网络，所以容器与外网的连通方式与 bridge 网络一样，即：

    1.容器通过 docker0 NAT 访问外网

    2.通过主机端口映射，外网可以访问容器

## 参考

* [跨主机网络概述](https://www.cnblogs.com/CloudMan6/p/7259266.html)
* [overlay 如何实现跨主机通信](https://www.cnblogs.com/CloudMan6/p/7305989.html)