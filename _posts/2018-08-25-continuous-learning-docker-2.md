---
layout: post
title:  持续学习docker<二>
categories: docker
tags: docker images cgroup namespace pause cpu memory block io
thread: docker
---

## Docker网络
Docker 安装时会自动在 host 上创建三个网络，我们可用 `docker network ls` 命令查看.

### none网络
none 网络就是什么都没有的网络。挂在这个网络下的容器除了 lo，没有其他任何网卡。容器创建时，可以通过 `--network=none` 指定使用 none 网络。

* 适用场景

安全性要求高并且不需要联网的应用可以使用none网络。

### host网络
连接到 host 网络的容器共享 Docker host 的网络栈，容器的网络配置与 host 完全一样。可以通过 `--network=host` 指定使用 host 网络。

* 适用场景
    * 容器对网络传输效率有较高要求
    * 容器需要直接配置host主机网络(docker0)

* 缺点

> 牺牲了灵活性,端口冲突等问题，主机上使用了的端口不能再使用

### bridge网络
Docker 安装时会创建一个 命名为 `docker0` 的 linux bridge。如果不指定`--network`，创建的容器默认都会挂到 `docker0` 上。

容器内网卡和host上的网卡是一对`veth pair`.veth pair 是一种成对出现的特殊网络设备，可以把它们想象成由一根虚拟网线连接起来的一对网卡，网卡的一头在容器中，另一头挂在网桥 docker0 上，其效果就是将容器内网卡也挂在了 docker0 上。


## 网络驱动
除了 none, host, bridge 这三个自动创建的网络，用户也可以根据业务需要创建 user-defined 网络。

Docker 提供三种 user-defined 网络驱动：`bridge`, `overlay` 和 `macvlan`。overlay 和 macvlan 用于创建跨主机的网络.

### 创建网络
> docker network create \-\-driver bridge test_net

* --subnet: 指定子网掩码
* --gateway: 指定网关

* --ip: 容器启动时指定静态IP
**注：只有使用 --subnet 创建的网络才能指定静态 IP。**


## docker容器间连接
同一网络中的容器、网关之间都是可以通信的。**两个容器要能通信，必须要有属于同一个网络的网卡。**

当两个容器的两个的网络属于不同的网桥时，无法直接通信，可以为其中容器添加网卡。

> docker network connect test_net1 httpd1

其中 test_net1 是网桥名， httpd1 是容器名，在添加后直接`ip a`查看即可看到。


## Docker DNS Server
当通过`--name`设置容器名后便可以直接通过`容器名`进行通信。使用 docker DNS 有个限制：**只能在 user-defined 网络中使用**。也就是说，默认的 bridge 网络是无法使用 DNS 的

## joined容器
joined 容器是另一种实现容器间通信的方式。joined 容器非常特别，它可以使两个或多个容器共享一个网络栈，共享网卡和配置信息，joined 容器之间可以通过 127.0.0.1 直接通信。

### 适用场景
* 不同容器中的程序希望通过 loopback 高效快速地通信，比如 web server 与 app server。
* 希望监控其他容器的网络流量，比如运行在独立容器中的网络监控程序。

### 测试
* 创建web服务器

> docker run -itd \-\-name=httpd3 httpd

* 创建 busybox 容器

> docker run -it \-\-name=busybox3 \-\-network=container:httpd3 busybox

* 测试

> wget 127.0.0.1

## 容器访问外网
* 查看`iptables`规则

> iptables -t nat -S

```text
-A POSTROUTING -s 172.17.0.0/16 ! -o docker0 -j MASQUERADE
```

其含义是：来自 172.17.0.0/16 网段的包，目标地址是外网（! -o docker0 即目标地址不是docker0），就把它交给 MASQUERADE 处理。而 MASQUERADE 的处理方式是将包的源地址替换成 host 的地址发送出去，即做了一次网络地址转换（NAT）。

### 测试
* tcpdump监控docker0 上的 icmp（ping）数据包

> tcpdump -i docker0 -n icmp

* tcpdump监控eth0(即宿主机正常up网卡)上的 icmp（ping）数据包

> tcpdump -i eth0 -n icmp

* 进入容器，执行ping操作

> docker run -it --rm --name busybox1 busybox

> ping www.baidu.com

## 外部访问容器
* 端口映射

docker 可将容器对外提供服务的端口映射到 host 的某个端口，外网通过该端口访问容器。容器启动时通过`-p`参数映射端口。

在Virtualbox中也是使用了端口映射使得外部可以访问内部没有配置IP的VDI.

**每一个映射的端口，host 都会启动一个 `docker-proxy` 进程来处理访问容器的流量.**

## 参考
[理解容器之间的连通性 ](https://www.cnblogs.com/CloudMan6/p/7087765.html)