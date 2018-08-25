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
