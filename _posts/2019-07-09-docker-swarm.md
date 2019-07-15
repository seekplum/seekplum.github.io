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

`--advertise-addr`: 指定与其他node通信的地址

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

## failover特性

对ubuntu2进行关机重启，关机后副本会被调度到其它节点

```bash
shutdown -r now
```

## 访问Service

恢复干净的环境，重新部署 web_server

* 删除web_server

```bash
docker service rm web_server
```

* 创建两个副本

```bash
docker service create --name web_server --replicas=2 httpd
```

* 查看服务情况

```bash
docker service ps web_server
```

* 查询副本1所在主机(ubuntu2)上容器IP

```bash
docker inspect web_server.1.2gt7qa7zwu1nx3y5km368cg4u | grep '"IPAddress"'

curl 172.17.0.2
```

说明在同一主机内是可以正常访问的

### 外部访问

* 将 service 暴露外部访问

```bash
docker service update --publish-add 8080:80 web_server
```

在创建时可以直接指定 `--publish-add` 参数进行暴露

```bash
docker service create --name web_server --publish 8080:80 --replicas=2 httpd
```

* 测试

```bash
curl 192.168.1.7:8080
curl 192.168.1.8:8080
curl 192.168.1.9:8080
curl 127.0.0.1:8080
```

**测试发现，即使是没有运行副本的节点，其service也是能正常访问的。这个功能叫做 `routing mesh`.**
