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
docker swarm init --advertise-addr $(ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1)
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

* 把swarm-work1从swarm中删除

```bash
docker swarm leave
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
docker node update --availability drain $(hostname)
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
docker inspect $(docker ps | grep -o -E "web_server\.[0-9]+\.\w+") | grep '"IPAddress"' | head -n 1 | grep -o -E "[0-9\.]+"

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

## routing mesh

* ingress 网络

当我们应用 `--publish-add 8080:80` 时，swarm会重新配置service

```bash
docker network ls
```

`ingress` 网络是 `swarm` 创建时 Docker 为自动我们创建的，swarm 中的每个 node 都能使用 `ingress`。

## 服务发现

一种实现方法是将所有 service 都 publish 出去，然后通过 routing mesh 访问。但明显的缺点是把 memcached 和 mysql 等暴露到外网，增加了安全隐患。

如果不 publish，那么 swarm 就要提供一种机制，能够：

* 1.让 service 通过简单的方法访问到其他 service。
* 2.当 service 副本的 IP 发生变化时，不会影响访问该 service 的其他 service。
* 3.当 service 的副本数发生变化时，不会影响访问该 service 的其他 service。

* 准备镜像

需要在所有work节点都执行,管理节点不需要，因为已经不分配service

```bash
docker pull busybox:1.28.3
docker pull httpd:2.4.34
```

* 创建 overlay 网络

要使用服务发现，需要相互通信的 service 必须属于同一个 overlay 网络，所以我们先得创建一个新的 overlay 网络。

```bash
docker network create --driver overlay myapp_net
```

* 部署service到overlay

```bash
docker service create --name my_web --replicas=3 --network myapp_net httpd:2.4.34
```

* 部署个busybox进行测试，挂载到同一个overlay网络

```bash
docker service create --name test --network myapp_net busybox:1.28.3 sleep 10000000
```

* 验证

查看 test 所在节点

```bash
docker service ps test
```

登录test所在节点，在容器test中ping `my_web`

```bash
docker exec $(docker ps -aq -f name=test.1) ping -c 3 my_web
```

查看每个副本的IP

```bash
docker exec $(docker ps -aq -f name=test.1) nslookup tasks.my_web
```

## 滚动更新

滚动更新降低了应用更新的风险，如果某个副本更新失败，整个更新将暂停，其他副本则可以继续提供服务。同时，在更新的过程中，总是有副本在运行的，因此也保证了业务的连续性。

```bash
docker service update --image httpd:2.4.35 my_web
```

`--image`: 指定新的镜像

更新步骤如下:

* 1.停止第一个副本
* 2.调度任务，选择worker node
* 3.在worker上用新的镜像启动副本
* 4.如果副本(容器)运行成功，则继续更新下一个副本，如果失败，暂停整个更新过程。

新开终端查看更新过程

```bash
watch -n 1 'docker service ps my_web'
```

默认配置下，Swarm 一次只更新一个副本，并且两个副本之间没有等待时间。我们可以通过 `--update-parallelism` 设置并行更新的副本数目，通过 `--update-delay` 指定滚动更新的间隔时间。

```bash
docker service update --replicas 6 --update-parallelism 2 --update-delay 1m30s my_web
```

service 增加到六个副本，每次更新两个副本，间隔时间一分半钟。

查看service配置

```bash
docker service inspect --pretty my_web
```

更新效果不理想，可以进行回滚

```bash
docker service update --rollback my_web
```

注意，`--rollback` 只能回滚到上一次执行 `docker service update` 之前的状态，**并不能无限制地回滚**。

## swarm存储数据

* 1.打包在容器里。

显然不行。除非数据不会发生变化，否则，如何在多个副本直接保持同步呢？

* 2.数据放在 Docker 主机的本地目录中，通过 volume 映射到容器里。

位于同一个主机的副本倒是能够共享这个 volume，但不同主机中的副本如何同步呢？

* 3.利用 Docker 的 volume driver，由外部 storage provider 管理和提供 volume，所有 Docker 主机 volume 将挂载到各个副本。

这是目前最佳的方案。volume 不依赖 Docker 主机和容器，生命周期由 storage provider 管理，volume 的高可用和数据有效性也全权由 provider 负责，Docker 只管使用。

### 准备环境

参考[选择Rex-Raydriver](/continuous-learning-docker-6/#选择Rex-Raydriver)小结，在所有节点都安装部署Rex-Ray,并使用VirtualBox backend

### 创建service

1.创建service

```bash
docker service create --name my_web \
       --publish 8080:80 \
       --mount "type=volume,volume-driver=rexray,source=web_data,target=/usr/local/apache2/htdocs" \
       httpd:2.4.34
```

* `--mount`: 指定数据卷的 volume-driver 为 rexray。
* `source`: 指定数据卷的名字为 web_data，如果不存在，则会新建。
* `target`: 指定将数据卷 mount 到每个副本容器的 /usr/local/apache2/htdocs，即存放静态页面的目录。

2.访问service

```bash
ubuntu2@root  ~ curl http://127.0.0.1:8080
<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>403 Forbidden</title>
</head><body>
<h1>Forbidden</h1>
<p>You don't have permission to access /
on this server.<br />
</p>
</body></html>
```

3.修改文件权限

```bash
ubuntu2@root  ~ docker exec -it $(docker ps | grep -o -E "my_web\.[0-9]+\.\w+") sh
# ls -ld /usr/local/apache2/htdocs
drwxr-xr-x 2 root www-data 4096 Sep 25 05:51 /usr/local/apache2/htdocs
# chmod 755 /usr/local/apache2/htdocs
# exit
ubuntu2@root  ~
```

4.再次访问

```bash
ubuntu2@root  ~ curl http://127.0.0.1:8080
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~
```

### Scale Up(待继续)

增加一个副本

```bash
docker service update --replicas 2 my_web
```

理想的结果应该是：swarm 在 另一个work节点 上启动第二个副本，同时也将挂载 volume `my_web`

## 参考

* [验证 Swarm 数据持久性 - 每天5分钟玩转 Docker 容器技术（104）](https://www.cnblogs.com/CloudMan6/p/8016994.html)
