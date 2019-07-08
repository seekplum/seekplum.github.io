---
layout: post
title:  Docker Swarm集群
categories: docker
tags: docker swarm
thread: docker
---

## 环境信息

* ubuntu1: 192.168.1.7 (swarm-manager)
* ubuntu2: 192.168.1.8 (swarm-work1)
* ubuntu3: 192.168.1.9 (swarm-work2)

## swarm-manager上创建swarm

* 获取当前机器IP

```bash
ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1
```

* 创建

```bash
docker swarm init --advertise-addr 192.168.1.7
```

--advertise-addr: 指定与其他node通信的地址

* 查看当前swarm的node

```bash
docker node ls
```

* 把swarm-work1加入到swarm中

复制刚刚创建时提示的命令，在两个work节点执行

```bash
docker swarm join --token SWMTKN-1-4ma185sbk9umfk9ju0qnt88yrj8wxidk24ap9wf689xnxst4pe-7tw50gu7asl76xnbh0x1osptj 192.168.1.7:2377
```

若刚刚提示的命令被刷掉了，可以通过下面的命令进行查看

```bash
docker swarm join-token worker
```

## 运行service

* 在manager节点创建

```bash
docker service create --name web_server httpd
```

* 查看swarm中的service

```bash
docker service ls
```

REPLICAS 显示当前副本信息，0/1 的意思是 web_server 这个 service 期望的容器副本数量为 1，目前已经启动的副本数量为 0。也就是当前 service 还没有部署完成。

* 查看 service 每个副本的状态

```bash
docker service ps web_server
```

## service伸缩

* 增加副本数

```bash
docker service scale web_server=5
```

默认配置下manager node 也是 worker node,所以swarm-manager上也会运行副本。如果不希望在manager上运行service，可以执行以下命令

```bash
docker node update --availability drain ubuntu1
```

`Drain` 表示 swarm-manager 已经不负责运行 service

* 减少副本数

```bash
docker service scale web_server=3
```
