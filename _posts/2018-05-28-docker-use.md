---
layout: post
title:  docker常用操作
tags: linux docker
thread: docker
---

## 安装

* 1.前提条件

Docker 要求 Ubuntu 系统的内核版本高于 3.10 ，查看本页面的前提条件来验证你的 Ubuntu 版本是否支持 Docker。

* 2.查看内核版本

```bash
uname -r
```

* 3.获取最新版本的 Docker 安装包

```bash
wget -qO- https://get.docker.com | sh # 需要输入root密码
```

* [4.使用非root权限运行docker](/docker-common-user)
* 5.启动/停止docker服务

```bash
sudo systemctl start docker

sudo systemctl stop docker
```

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

```bash
docker run ubuntu:16.04 /bin/echo Hello world
```

各个参数解析：

* docker: Docker 的二进制执行文件。
* run: 与前面的 docker 组合来运行一个容器。
* ubuntu:16.04: 指定要运行的镜像，Docker首先从本地主机上查找镜像是否存在，如果不存在，Docker 就会从镜像仓库 Docker Hub 下载公共镜像。
* /bin/echo Hello world: 在启动的容器里执行的命令

### redhat6.7安装

```bash
rpm -iUvh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
yum -y install docker-io
```

## 基本使用

### 运行交互式的容器

我们通过docker的两个参数 -i -t，让docker运行的容器实现"对话"的能力

```bash
docker run -i -t ubuntu:16.04 /bin/bash
```

各个参数解析：

* -t: 在新容器内指定一个伪终端或终端。
* -i: 允许你对容器内的标准输入 (STDIN) 进行交互。

### 启动容器（后台模式）

* 使用以下命令创建一个以进程方式运行的容器

```bash
docker run -d ubuntu:16.04 /bin/sh -c "while true; do echo hello world; sleep 1; done"
```

返回的输出结果是容器的ID,对每个容器时唯一的

### 检查容器是否在运行

```bash
docker ps
```

* CONTAINER ID:容器ID
* NAMES:自动分配的容器名称

### 查看容器内标准输出

```bash
docker logs 容器ID
```

或者

```bash
docker logs 容器名字
```

### 停止容器

```bash
docker stop 容器ID
```

或者

```bash
docker stop 容器名称
```

### 查看docker命令行选项

```bash
docker  # 查看到 Docker 客户端的所有命令选项

docker build --help  # 查看build的详细用法
```

## 构建镜像

```bash
docker build -t 镜像名 .  # 其中`.`代表在当前路径在构建
```

## 重命名镜像

```bash
docker tag IMAGE ID(镜像ID) REPOSITORY:TAG(仓库：标签)
```

比如

```bash
docker tag d698781c1863 ftp:ftp
```

重命名后原来旧的镜像还是存在，只是多了 ftp:ftp 的镜像而已

## 修改容器保存为新的image

```bash
docker commit -h
Flag shorthand -h has been deprecated, please use --help

Usage:    docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]]

Create a new image from a container's changes

Options:
  -a, --author string    Author (e.g., "John Hannibal Smith <hannibal@a-team.com>")
  -c, --change list      Apply Dockerfile instruction to the created image
      --help             Print usage
  -m, --message string   Commit message
  -p, --pause            Pause container during commit (default true)
```

* -a: 作者信息
* -c: 使用Dockerfile指令来创建镜像，不确定 -c 参数的使用场景
* -m: 本次修改的描述信息
* -p: 默认情况下，在提交时，容器的执行将被暂停，以保证数据的完整性，可以指定选项 p 来禁止。

**Docker 并不建议用户通过这种方式构建镜像**。原因如下：

* 这是一种手工创建镜像的方式，容易出错，效率低且可重复性弱。比如要在 debian base 镜像中也加入 vi，还得重复前面的所有步骤。
* 更重要的：使用者并不知道镜像是如何创建出来的，里面是否有恶意程序。也就是说无法对镜像进行审计，存在安全隐患。

## 查看镜像详细信息

```bash
docker inspect IMAGE NAME(镜像名)|IMAGE ID(镜像ID)
```

## 进入容器方式

* 1.attach

```bash
docker attach 容器ID|容器名
```

**缺点:当多个窗口同事使用该方式进入时，所有的窗口都同步显示。如果有一个窗口阻塞了，那么其他窗口也无法再进行操作。即只有一个窗口可以操作容器。**

* 2.使用SSH

**需要容器提供了sshd服务，不建议使用。**

* 3.使用nsenter
* 4.使用exec

```bash
docker exec -it 容器ID|容器名 bash
```

## 迁移镜像

### 发布到[Docker镜像中心](https://hub.docker.com)

1.登陆

```bash
docker login
```

之后会让输入用户名、密码，没有则先在[Docker镜像中心](https://hub.docker.com)注册

2.镜像打tag

见[重命名镜像](#重命名镜像)

3.发布镜像

```bash
docker push username/repository:tag
```

### 转为文件传输

1.保存为文件

```bash
docker save -o /tmp/test.tar 镜像名
```

2.确认文件是否生成

```bash
ls -l /tmp/test.tar
```

3.恢复镜像

```bash
docker load -i /tmp/test.tar
```

4.检查是否恢复成功

```bash
docker images
```

## 修改容器配置

比如要修改容器的映射端口

### 常规方法

* 1.停止容器, docker stop
* 2.保存为新的image, docker commit
* 3.重新运行容器, docker run 指定新的端口和镜像

### 修改json文件方式

* 1.停止容器, docker stop
* 2.修改json配置文件，找到端口映射部分内容进行修改,文件位置`/var/lib/docker/containers/容器id`
    - hostconfig.json
    - config.v2.json  # 可能会不需要改
* 3.重启docker, service docker restart
* 4.重新运行容器, docker run

## 查看dockerfile内容

当pull一个镜像后，不知道Dockerfile里面的内容，看知道一些基本的信息，可以用以下方式

1.查看镜像的ID

```bash
docker images
```

2.查看json文件内容

```bash
find / -name "镜像ID*"  | xargs cat | python -m json.tool
```

或者可以尝试逆向分析,请参考[从镜像历史记录逆向分析出Dockerfile](https://andyyoung01.github.io/2016/08/23/%E4%BB%8E%E9%95%9C%E5%83%8F%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95%E9%80%86%E5%90%91%E5%88%86%E6%9E%90%E5%87%BADockerfile/)

## 从私有仓库拉取镜像

1.修改daemon.json文件

vi /etc/docker/daemon.json

```json
{
    "insecure-registries": ["registry.xxx.com"]
}
```

2.重启docker

```bash
systemctl daemon-reload && systemctl restart docker
```

3.登陆

```bash
docker login -u admin -p admin registry.xxx.com
```

4.pull镜像

```bash
docker pull registry.xxx.com/project/IMAGE-NAME:latest
```

## 搭建本地Registry

以`codekoala/pypi`镜像作为示例

### 目标私服启动镜像

```bash
docker run -d -p 5000:5000 -v /registry:/var/lib/registry registry:2
```

### 上传镜像到私服

* 1.修改hosts文件，添加域名和IP的映射
* 2.对镜像打tag

```bash
docker tag codekoala/pypi private.docker.hub:5000/codekoala/pypi
```

**repository 的完整格式为：[registry-host]:[port]/[username]/xxx,只有 Docker Hub 上的镜像可以省略 [registry-host]:[port] 。**

* 3.上传镜像

```bash
docker push private.docker.hub:5000/codekoala/pypi
```

* 4.下载镜像

```bash
docker pull private.docker.hub:5000/codekoala/pypi
```

registry 也支持认证，https 安全传输等特性，具体可以参考[官方文档](https://docs.docker.com/registry/configuration/)

## 批量删除容器

```bash
docker rm -v $(docker ps -aq -f status=exited)
```

## 中国官方镜像加速

* /etc/docker/daemon.json

```json
{
  "registry-mirrors": ["https://registry.docker-cn.com"]
}
```

## 删除所有镜像

```bash
docker images | awk '{if(NR>1)print $3}' | xargs -I {} docker rmi {} --force
```
