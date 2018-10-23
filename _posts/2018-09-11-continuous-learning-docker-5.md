---
layout: post
title:  持续学习docker<五>-Network
categories: docker
tags: docker Network
thread: docker
---
## 跨主机网络方案
![网络方案](/static/images/docker/docker-network.jpg)

* 1.docker 原生的 overlay 和 macvlan。
* 2.第三方方案：常用的包括 flannel、weave 和 calico。

**如此众多的方案是如何与 docker 集成在一起的？**

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

* 以容器方式运行 Consul：

> docker run -d -p 8500:8500 -h consul \-\-name consul progrium/consul -server -bootstrap

## 参考
* [跨主机网络概述](https://www.cnblogs.com/CloudMan6/p/7259266.html)