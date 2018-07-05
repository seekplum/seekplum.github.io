---
layout: post
title:  docker容器间通信
tags: docker network communication
thread: docker
---
## 网络模式

### bridge
当Docker进程启动时，会在主机上创建一个名为docker0的虚拟网桥，此主机上启动的Docker容器会连接到这个虚拟网桥上。虚拟网桥的工作方式和物理交换机类似，这样主机上的所有容器就通过交换机连在了一个二层网络中。

从docker0子网中分配一个IP给容器使用，并设置docker0的IP地址为容器的默认网关。在主机上创建一对虚拟网卡veth pair设备，Docker将veth pair设备的一端放在新创建的容器中，并命名为eth0（容器的网卡），另一端放在主机中，以vethxxx这样类似的名字命名，并将这个网络设备加入到docker0网桥中。可以通过brctl show命令查看。

### host
如果启动容器的时候使用host模式，那么这个容器将不会获得一个独立的Network Namespace，而是和宿主机共用一个Network Namespace。容器将不会虚拟出自己的网卡，配置自己的IP等，而是使用宿主机的IP和端口。但是，容器的其他方面，如文件系统、进程列表等还是和宿主机隔离的。

### Container
这个模式指定新创建的容器和已经存在的一个容器共享一个 Network Namespace，而不是和宿主机共享。新创建的容器不会创建自己的网卡，配置自己的 IP，而是和一个指定的容器共享 IP、端口范围等。同样，两个容器除了网络方面，其他的如文件系统、进程列表等还是隔离的。两个容器的进程可以通过 lo 网卡设备通信。

### none
使用none模式，Docker容器拥有自己的Network Namespace，但是，并不为Docker容器进行任何网络配置。也就是说，这个Docker容器没有网卡、IP、路由等信息。需要我们自己为Docker容器添加网卡、配置IP等。

## 查看路由
> route -n

## 同主机通信

### 容器访问主机
两者之间网络可以直接访问

### 主机访问容器
两者之间网络可以直接访问

### 容器访问容器
* 启动服务端容器

> docker run -itd \-\-name web2 seekplum/python2.7-web

* 启动客户端容器

> docker run -itd \-\-name centos1 \-\-link web1:plum centos:centos6.7

* 在客户端测试连接服务端

> curl http://plum:80

## 跨主机通信
* 容器绑定主机端口

> docker run -itd \-\-name web1 -p 8081:80 seekplum/python2.7-web

**直接通过端口映射方式，操作简便，但对多集群应用不方便。**

**让Docker容器之间直接使用自己的IP地址进行通信按实现原理可分别直接路由方式、桥接方式（如pipework）、Overlay隧道方式（如flannel、ovs+gre）等。**


## 参考
[一分钟看懂Docker的网络模式和跨主机通信](https://www.cnblogs.com/yy-cxd/p/6553624.html)