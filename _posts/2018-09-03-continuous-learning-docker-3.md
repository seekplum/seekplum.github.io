---
layout: post
title:  持续学习docker<三>
categories: docker
tags: docker storage volume data-packed
thread: docker
---
## 两类存储资源
* 由`storage driver`管理的镜像层和容器层
* Data Volume

## storage driver
Docker 支持多种 storage driver，有 AUFS、Device Mapper、Btrfs、OverlayFS、VFS 和 ZFS。它们都能实现分层的架构，同时又有各自的特性。对于 Docker 用户来说，具体选择使用哪个 storage driver 是一个难题，因为：

* 1.没有哪个 driver 能够适应所有的场景。
* 2.driver 本身在快速发展和迭代。

不过 Docker 官方给出了一个简单的答案: **优先使用 Linux 发行版默认的 storage driver。**

运行`docker info`可以查看默认的`driver`

## volume
Data Volume 本质上是 Docker Host 文件系统中的目录或文件，能够直接被 mount 到容器的文件系统中。Data Volume 有以下特点：

* 1.Data Volume 是目录或文件，而非没有格式化的磁盘（块设备）。
* 2.容器可以读写 volume 中的数据。
* 3.volume 数据可以被永久的保存，即使使用它的容器已经销毁。

### bind mount
将host上已经存在的目录或者文件mount到容器。通过`-v`参数进行目录共享，默认是`可读写`权限可以进行修改。

> -v \<host path\>:\<container path\>:\<mode\>

* 优点

> 使用直观高效，易于理解

* 缺点

需要指定 host 文件系统的特定路径，这就限制了容器的可移植性

#### 测试
* 编写html

```bash
echo "hello docker" > /tmp/index.html
```

* 启动httpd容器

> docker run -d \-\-name httpd1 -p 8081:80 -v /tmp/index.html:/usr/local/apache2/htdocs/index.html:ro httpd

* get请求测试

> curl http://127.0.0.1:8081

### docker managed volume
docker managed volume 与 bind mount 在使用上的最大区别是不需要指定 mount 源，指明 mount point 就行了。

通过`-v`指定`data volume`即可。

创建过程：

* 1.容器启动时，简单的告诉 docker "我需要一个 volume 存放数据，帮我 mount 到目录 /abc"。
* 2.docker 在 /var/lib/docker/volumes 中生成一个随机目录作为 mount 源。
* 3.如果 /abc 已经存在，则将数据复制到 mount 源，
* 4.将 volume mount 到 /abc

#### 测试
* 启动容器

> docker run -d -p 8081:80 -v /usr/local/apache2/htdocs \-\-name httpd1 httpd 

* 查看容器配置信息

> docker inspect httpd1

**在`Docker version 1.7.1, build 786b29d/1.7.1`版本下，配置信息中并没有包含`Mounts`配置信息，路径信息在`Volumes`中。也无法`docker volume <option>`命令查询信息**

* 查看`Volumes`的路径

所在路径在`/var/lib/docker/volumes/<uuid>/_data`，**其中`<uuid>`并不是容器id，是随机生成的**

### 对比

||bind mount|docker managed volume|
|:---|:---|:---|
|volume 位置|可任意指定|/var/lib/docker/volumes/\<随机uuid\>/_data|
|对已有mount point 影响|隐藏并替换为 volume|原有数据复制到 volume|
|是否支持单个文件|支持|不支持，只能是目录|
|权限控制|可设置为只读，默认为读写权限|无控制，均为读写权限|
|移植性|移植性弱，与 host path 绑定|移植性强，无需指定 host 目录|

## 容器共享数据
* 1.把共享数据放在`bind mount`中，然后将其`mount`到多个容器。
* 2.使用`volume container`

## volume container
volume container 是专门为其他容器提供 volume 的容器。它提供的卷可以是 bind mount，也可以是 docker managed volume。

* 创建`volume container`

>  mkdir /tmp/htdocs && docker create \-\-name vc_data -v /tmp/htdocs/:/usr/local/apache2/htdocs -v /other/useful/tools busybox

**因为 volume container 的作用只是提供数据，所以它本身不需要处于运行状态。**

* 创建测试容器

> docker run -d \-\-name httpd1 -p 80 \-\-volumes-from vc_data httpd

**其他容器通过 --volumes-from 使用 vc_data 这个 volume container.**

### 特点
* 1.与 bind mount 相比，不必为每一个容器指定 host path，所有 path 都在 volume container 中定义好了，容器只需与 volume container 关联，实现了容器与 host 的解耦。
* 使用 volume container 的容器其 mount point 是一致的，有利于配置的规范和标准化，但也带来一定的局限，使用时需要综合考虑。

## data-packed volume container
原理是将数据打包到镜像中，然后通过 docker managed volume 共享。

### 制作镜像
* 目录结构

```text
tree -L 2
.
├── Dockerfile
└── htdocs
    └── index1.html
```

* 编写Dockerfile

```bash
cat >Dockerfile <<EOF
FROM busybox:latest
ADD htdocs /usr/local/apache2/htdocs
VOLUME /usr/local/apache2/htdocs
EOF
```

* 创建文件

> mkdir htdocs

> echo "data-packed volume container\!"  > htdocs/index1.html

* build镜像

> docker build -t datapacked .

* 创建datapacked volume container

> docker create \-\-name vc_data1 datapacked

* 启动web服务器

> docker run -d \-\-name httpd2 -p 80 \-\-volumes-from vc_data1 httpd

* 测试

> curl http://127.0.0.1:32769/index1.html

注：`32769`是通过`docker ps`查询出来的

## volume 生命周期管理
Data Volume 中存放的是重要的应用数据，volume 实际上是 host 文件系统中的目录和文件。

* 备份

volume 的备份实际上是对文件系统的备份

* 恢复

把备份数据拷贝回来即可

* 迁移
    * 1.停止容器
    * 2.迁移后重新启动即可

* 销毁

docker 不会销毁 bind mount，删除数据的工作只能由 host 负责。对于 docker managed volume，在执行 docker rm 删除容器时可以带上 `-v` 参数，docker 会将容器使用到的 volume 一并删除，但前提是没有其他容器 mount 该 volume，目的是保护数据，非常合理。

**查看volume**: docker volume ls
**删除volume**: docker volume rm \<uuid\>
**批量删除**: docker volume rm $(docker volume ls -q)

## 参考
* [Docker 的两类存储资源 - 每天5分钟玩转 Docker 容器技术（38）](https://www.cnblogs.com/CloudMan6/p/7127843.html)