---
layout: post
title:  持续学习docker<三>
categories: docker
tags: docker storage
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

> -v <host path>:<container path>:<mode>

* 优点

> 使用直观高效，易于理解

* 缺点

需要指定 host 文件系统的特定路径，这就限制了容器的可移植性

#### 测试
* 编写html

```
echo "hello docker" > /tmp/index.html
```

* 启动httpd容器

> docker run -d \-\-name httpd1 -p 8081:80 -v /tmp/index.html:/usr/local/apache2/htdocs/index.html:ro httpd

* get请求测试

> curl http://127.0.0.1:8081

### docker managed volume


## 参考
* [Docker 的两类存储资源 - 每天5分钟玩转 Docker 容器技术（38）](https://www.cnblogs.com/CloudMan6/p/7127843.html)