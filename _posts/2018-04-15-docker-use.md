---
layout: post
title:  docker学习
tags: linux docker
thread: docker
---

## 安装

* 1.前提条件

Docker 要求 Ubuntu 系统的内核版本高于 3.10 ，查看本页面的前提条件来验证你的 Ubuntu 版本是否支持 Docker。

* 2.查看内核版本

> uname -r

* 3.获取最新版本的 Docker 安装包

> wget -qO- https://get.docker.com \| sh # 需要输入root密码

* [4.使用非root权限运行docker](/docker-common-user)
* 5.启动/停止docker服务

> sudo systemctl start docker

> sudo systemctl stop docker

6.镜像加速

鉴于国内网络问题，后续拉取 Docker 镜像十分缓慢，我们可以需要配置加速器来解决，我使用的是网易的镜像地址：http://hub-mirror.c.163.com。

新版的 Docker 使用 /etc/docker/daemon.json（Linux） 或者 %programdata%\docker\config\daemon.json（Windows） 来配置 Daemon。

请在该配置文件中加入（没有该文件的话，请先建一个）：

```text
{
  "registry-mirrors": ["http://hub-mirror.c.163.com"]
}
```

7.测试运行hello world

> docker run ubuntu:16.04 /bin/echo Hello world

各个参数解析：

* docker: Docker 的二进制执行文件。
* run: 与前面的 docker 组合来运行一个容器。
* ubuntu:16.04: 指定要运行的镜像，Docker首先从本地主机上查找镜像是否存在，如果不存在，Docker 就会从镜像仓库 Docker Hub 下载公共镜像。
* /bin/echo Hello world: 在启动的容器里执行的命令

## 基本使用

### 运行交互式的容器

我们通过docker的两个参数 -i -t，让docker运行的容器实现"对话"的能力

> docker run -i -t ubuntu:16.04 /bin/bash

各个参数解析：

* -t: 在新容器内指定一个伪终端或终端。
* -i: 允许你对容器内的标准输入 (STDIN) 进行交互。

### 启动容器（后台模式）
* 使用以下命令创建一个以进程方式运行的容器

> docker run -d ubuntu:16.04 /bin/sh -c "while true; do echo hello world; sleep 1; done"

返回的输出结果是容器的ID,对每个容器时唯一的

### 检查容器是否在运行

> docker ps

* CONTAINER ID:容器ID
* NAMES:自动分配的容器名称

### 查看容器内标准输出

> docker logs 容器ID

或者

> docker logs 容器名字

### 停止容器
> docker stop 容器ID

或者

> docker stop 容器名称


### 查看docker命令行选项
> docker  # 查看到 Docker 客户端的所有命令选项

> docker build --help  # 查看build的详细用法


## 运行web应用
