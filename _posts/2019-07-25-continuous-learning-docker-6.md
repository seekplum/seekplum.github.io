---
layout: post
title:  持续学习docker(六)-Volume
categories: docker
tags: docker volume
thread: docker
---

### 环境信息

* 宿主机(Mac)
* ubuntu2
* ubuntu3

## 容器分类

从业务数据的角度看，容器可以分为两类：

* 1.无状态（stateless）容器

无状态是指容器在运行过程中不需要保存数据，每次访问的结果不依赖上一次访问，比如提供静态页面的 web 服务器。

* 2.有状态（stateful）容器

有状态是指容器需要保存数据，而且数据会发生变化，访问的结果依赖之前请求的处理结果，最典型的就是数据库服务器。

简单来讲，状态（state）就是数据，如果容器需要处理并存储数据，它就是有状态的，反之则无状态。

## 保存数据

之前我们了解过 data volume 可以存储容器的状态，不过当时讨论的 volume 其本质是 Docker 主机 本地 的目录。

* 本地目录就存在一个隐患：如果 Docker Host 宕机了，如何恢复容器？

一个办法就是定期备份数据，但这种方案还是会丢失从上次备份到宕机这段时间的数据。更好的方案是由专门的 storage provider 提供 volume，Docker 从 provider 那里获取 volume 并挂载到容器。这样即使 Host 挂了，也可以立刻在其他可用 Host 上启动相同镜像的容器，挂载之前使用的 volume，这样就不会有数据丢失。

* Docker 是如何实现这个跨主机管理 data volume 方案的呢？

答案是 volume driver。

## Volume管理

任何一个 data volume 都是由 driver 管理的，创建 volume 时如果不特别指定，将使用 local 类型的 driver，即从 Docker Host 的本地目录中分配存储空间。如果要支持跨主机的 volume，则需要使用第三方 driver。

目前已经有很多可用的 driver，比如使用 Azure File Storage 的 driver，使用 GlusterFS 的 driver，完整的列表可参考 [Docker官方Volume plugins](https://docs.docker.com/engine/extend/legacy_plugins/#volume-plugins)

## 选择 Rex-Ray driver

其原因是：

* 1.Rex-Ray 是开源的，而且社区活跃。[Github仓库地址](https://github.com/rexray/rexray)
* 2.支持多种 backend，VirtualBox 的 Virtual Media、Amazon EBS、Ceph RBD、OpenStack Cinder 等。
* 3.支持多种操作系统，Ubuntu、CentOS、RHEL 和 CoreOS。
* 4.支持多种容器编排引擎，Docker Swarm、Kubernetes 和 Mesos。
* 5.Rex-Ray 安装使用方法非常简单。

## 配置Rex-Ray

* 在ubuntu2和ubuntu3上执行如下命令

```bash
curl -sSL https://rexray.io/install | sh -
```

* 编写配置文件

```bash
cat >/etc/rexray/config.yml<<EOF
libstorage:
  service: virtualbox
virtualbox:
  endpoint: http://$MAC_IP:18083
  volumePath: /Users/seekplum/VirtualBox/Volumes
  controllerName: SATA
EOF
```

## 配置VirtualBox Backend

* 在宿主机上启动vboxwebsrv服务

```bash
vboxwebsrv -H 0.0.0.0
```

* 在宿主机上关闭Virtualbox登录认证

```bash
VBoxManage setproperty websrvauthlibrary null
```

* 两个虚拟机在关机状态下设置存储

设置 -> 存储 -> 控制器: IDE -> 移除所选的存储控制器
设置 -> 存储 -> 控制器: SATA -> 端口数 设置为 30

* 在两个虚机上重启Rex-Ray服务

```bash
systemctl restart rexray.service
```

* 测试 Rex-Ray是否正常

```bash
rexray volume ls
```

## 创建Rex-Ray Volume

* 在ubuntu2上创建volume

```bash
docker volume create --driver rexray --name=mysqldata --opt=size=2

rexray volume ls | grep mysqldata
```

* 在宿主机中进行观察

```bash
ls -l ~/VirtualBox/Volumes/mysqldata
```

## 测试

因为 VirtualBox 使用的是 thin-provisioning，volume 初始分配的空间很小。

接下来我们将：

* 1.在 ubuntu2 上启动 MySQL 容器 mydb_on_ubuntu2，并使用 mysqldata 作为数据卷。
* 2.更新数据库，然后销毁 mydb_on_ubuntu2。
* 3.在 ubuntu3 上启动 MySQL 容器 mydb_on_docker2，也使用 mysqldata 作为数据卷，然后验证数据的有效性。

## 创建容器并使用数据卷

* 1.在ubuntu2上启动MySQL容器

```bash
docker run --name mydb_on_ubuntu2 -v mysqldata:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=password -d mysql
```

`-v mysqldata:/var/lib/mysql` 将之前创建的 volume mount 到 MySQL 的数据目录

* 2.查看挂载信息

```bash
docker volume inspect mysqldata
docker inspect mydb_on_ubuntu2
```

## 更新数据库

* 1.进入MySQL容器并插入数据

```bash
docker exec -it mydb_on_ubuntu2 mysql -ppassword -e "create database if not exists test;create table if not exists test.my_id(id int(4));insert test.my_id values(123);select * from test.my_id;"
```

* 3.删除容器

```bash
docker stop mydb_on_ubuntu2; docker rm mydb_on_ubuntu2
```

## 跨主机使用Rex-Ray

* 1.在ubuntu3上启动MySQL容器

```bash
docker run --name mydb_on_ubuntu3 -v mysqldata:/var/lib/mysql -d mysql
```

不过这次不需要指定环境变量 MYSQL_ROOT_PASSWORD，因为密码已经保存到 mysqldata 里面了。

* 2.检查之前插入的数据是否存在

```bash
docker exec -it mydb_on_ubuntu3 mysql -ppassword -e "select * from test.my_id;"
```

## 小结

Rex-Ray 可以提供跨主机的 volume，其生命周期不依赖 Docker Host 和容器，是 stateful 容器理想的数据存储方式。

如何使用其他 storage provider 的 volume driver，部署和配置 storage provider 会有所不同，不过 Docker 在使用 volume 的方式都是一样的：

* 1.通过 docker volume create --driver 创建 volume。
* 2.创建容器时用 -v 指定上一步创建的 volume。

## 参考

* [跨主机使用 Rex-Ray volume - 每天5分钟玩转 Docker 容器技术（77）](https://www.cnblogs.com/CloudMan6/p/7630205.html)
