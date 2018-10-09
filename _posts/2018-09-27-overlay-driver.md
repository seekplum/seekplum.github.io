---
layout: post
title: Docker Overlay Driver
categories: docker
tags: docker overlay driver
thread: docker
---
## 跨主机网络
为支持容器跨主机通信，Docker 提供了 overlay driver，使用户可以创建基于 VxLAN 的 overlay 网络。VxLAN 可将二层数据封装到 UDP 进行传输，VxLAN 提供与 VLAN 相同的以太网二层服务，但是拥有更强的扩展性和灵活性。

Docerk overlay 网络需要一个 key-value 数据库用于保存网络状态信息，包括 Network、Endpoint、IP 等。`Consul`、`Etcd` 和 `ZooKeeper` 都是 Docker 支持的 key-vlaue 软件，我们这里使用 `Consul`。

> docker run -d -p 8500:8500 -h consul \-\-name consul progrium/consul -server -bootstrap