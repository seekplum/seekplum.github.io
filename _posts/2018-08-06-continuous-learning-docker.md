---
layout: post
title:  持续学习docker
categories: docker
tags: docker images
thread: docker
---

## 容器生态系统

### 容器核心技术
* 容器规范
* 容器runtime
* 容器管理工具
* 容器定义工具
* Registries
* 容器OS

#### 容器规范
容器不是Docker，还有`CoreOS`的`rkt`，为了保证容器生态的健康发展，保证不同容器之间能够兼容，包含Docker、CoreOS、Google在内的若干公司共同成立了一个叫Open Container Initiative（OCI）的组织，其目是制定开放的容器规范。

* runtime spec
* image format spec

**通过这两个规范保证了不同组织和厂商开发的容器能够在不同的runtime上运行，保证了容器的可移植行和互相操作性**

#### 容器 runtime
runtime 是容器真正运行的地方。runtime 需要跟操作系统 kernel 紧密协作，为容器提供运行环境。

* lxc 是 Linux 上老牌的容器 runtime。Docker 最初也是用 lxc 作为 runtime。
* runc 是 Docker 自己开发的容器 runtime，符合 oci 规范，也是现在 Docker 的默认runtime。
* rkt 是 CoreOS 开发的容器 runtime，符合 oci 规范，因而能够运行 Docker 的容器。

#### 容器管理工具
* lxd 是 lxc 对应的管理工具。
* runc 的管理工具是 docker engine。docker engine 包含后台 deamon 和 cli两个部分。我们通常提到 Docker，一般就是指的 docker engine。
* rkt 的管理工具是 rkt cli。

#### 容器定义工具
容器定义工具允许用户定义容器的内容和属性，这样容器就能够被保存，共享和重建。

* docker image 是 docker 容器的模板，runtime 依据 docker image 创建容器。
* dockerfile 是包含若干命令的文本文件，可以通过这些命令创建出 docker image。
* ACI (App Container Image) 与 docker image 类似，只不过它是由 CoreOS 开发的 rkt 容器的 image 格式。

#### Registry
容器是通过 image 创建的，需要有一个仓库来统一存放 image，这个仓库就叫做 Registry。

* [Docker Hub](https://hub.docker.com )是 Docker 为公众提供的托管 Registry，上面有很多现成的 image，为 Docker 用户提供了极大的便利。
* [Quay.io](https://quay.io/)是另一个公共托管 Registry，提供与 Docker Hub 类似的服务。

#### 容器 OS
容器OS是专门运行容器的操作系统。与常规OS相比，容器OS通常体积更小，启动更快。因为是为容器定制的 OS，通常它们运行容器的效率会更高。

* coreos
* atomic
* ubuntu core

### 容器平台技术
容器核心技术使得容器能够在单个 host上运行。而容器平台技术能够让容器作为集群在分布式环境中运行。

* 容器编排引擎
* 容器管理平台
* 基于容器的 PaaS

#### 容器编排引擎
所谓编排（orchestration），通常包括容器管理、调度、集群定义和服务发现等。通过容器编排引擎，容器被有机的组合成微服务应用，实现业务需求。

* docker swarm 是 Docker 开发的容器编排引擎。
* kubernetes 是 Google 领导开发的开源容器编排引擎，同时支持 Docker 和 CoreOS 容器。
* mesos 是一个通用的集群资源调度平台，mesos 与 marathon 一起提供容器编排引擎功能。

#### 容器管理平台
容器管理平台是架构在容器编排引擎之上的一个更为通用的平台。通常容器管理平台能够支持多种编排引擎，抽象了编排引擎的底层实现细节，为用户提供更方便的功能，比如 application catalog 和一键应用部署等。

* Rancher
* ContainerShip

#### 基于容器的 PaaS
基于容器的 PaaS 为微服务应用开发人员和公司提供了开发、部署和管理应用的平台，使用户不必关心底层基础设施而专注于应用的开发。

* Deis
* Flynn
* Dokku

### 容器支持技术
* 容器网络
* 服务发现
* 监控
* 数据管理
* 日志管理
* 安全性

#### 容器网络
容器的出现使网络拓扑变得更加动态和复杂。用户需要专门的解决方案来管理容器与容器，容器与其他实体之间的连通性和隔离性。

* docker network(Docker原生网络解决方案)
* flannel
* weave
* calico

#### 服务发现
动态变化是微服务应用的一大特点。当负载增加时，集群会自动创建新的容器；负载减小，多余的容器会被销毁。容器也会根据 host 的资源使用情况在不同 host 中迁移，容器的 IP 和端口也会随之发生变化。

在这种动态的环境下，必须要有一种机制让 client 能够知道如何访问容器提供的服务。这就是服务发现技术要完成的工作。

服务发现会保存容器集群中所有微服务最新的信息，比如 IP 和端口，并对外提供 API，提供服务查询功能。

* etcd
* consul
* zookeeper

#### 监控
* docker ps/top/stats(Docker 原生的命令行监控工具)
* docker stats API(用户可以通过 HTTP 请求获取容器的状态信息)
* sysdig
* cAdvisor/Heapster
* Weave Scope

#### 数据管理
容器经常会在不同的 host 之间迁移，如何保证持久化数据也能够动态迁移，是 `Flocker` 这类数据管理工具提供的能力。

#### 日志管理
* docker logs
* logspout

> logspout 对日志提供了路由功能，它可以收集不同容器的日志并转发给其他工具进行后处理。

#### 安全性
* OpenSCAP 能够对容器镜像进行扫描，发现潜在的漏洞

## docker、虚拟机
* 容器组成
    - 应用程序本身
    - 依赖：比如应用程序需要的库或其他软件

**容器在 Host 操作系统的用户空间中运行，与操作系统的其他进程隔离。这一点显著区别于的虚拟机。由于所有的容器共享同一个 Host OS，这使得容器在体积上要比虚拟机小很多。另外，启动容器不需要启动整个操作系统，所以容器部署和启动速度更快，开销更小，也更容易迁移。**

![](/static/images/docker/docker-kvm.jpg)

**容器使软件具备了超强的可移植能力**

## Docker核心组件
* Docker 客户端 - Client
* Docker 服务器 - Docker daemon
* Docker 镜像 - Image
* Registry
* Docker 容器 - Container

![](/static/images/docker/docker-architecture.jpg)

默认配置下，Docker daemon 只能响应来自本地 Host 的客户端请求。如果要允许远程客户端请求，需要在配置文件中打开 TCP 监听，步骤如下：

* 编辑配置文件`/etc/systemd/system/multi-user.target.wants/docker.service`，在环境变量 ExecStart 后面添加 `-H tcp://0.0.0.0`，允许来自任意 IP 的客户端连接。
* 重启docker
* 测试

> docker -H x.x.x.x info

## Docker镜像
镜像生成方式

* 通过dockerfile从无到有构建
* 下载已经生成的镜像
* 在现有镜像上创建新的镜像

## base镜像
* 不依赖其他镜像，从 `scratch` 构建
* 其他镜像可以之为基础进行扩展

## rootfs
内核空间是 kernel，Linux 刚启动时会加载 bootfs 文件系统，之后 bootfs 会被卸载掉。

用户空间的文件系统是 rootfs，包含我们熟悉的 /dev, /proc, /bin 等目录。

对于 base 镜像来说，底层直接用 Host 的 kernel，自己只需要提供 rootfs 就行了。

**容器只能使用 Host 的 kernel，并且不能修改。所有容器都共用 host 的kernel，在容器中没办法对 kernel 升级。如果容器对 kernel 版本有要求（比如应用只能在某个 kernel 版本下运行），则不建议用容器，这种场景虚拟机可能更合适。**

## Docker分层结构
* 优点

> 共享资源
>
### 可读写容器层
当容器启动时，一个新的可写层被加载到镜像的顶部。

这一层通常被称作“容器层”，“容器层”之下的都叫“镜像层”。

所有对容器的改动 - 无论添加、删除、还是修改文件都只会发生在容器层中。

**只有容器层是可写的，容器层下面的所有镜像层都是只读的。**

### 添加文件
在容器中创建文件时，新文件被添加到容器层中。

### 读取文件 
在容器中读取某个文件时，Docker会从上往下依次在各镜像层中查找此文件。一旦找到，立即将其复制到容器层，然后打开并读入内存。

### 修改文件
在容器中修改已存在的文件时，Docker会从上往下依次在各镜像层中查找此文件。一旦找到，立即将其复制到容器层，然后修改之。

### 删除文件
在容器中删除文件时，Docker也是从上往下依次在镜像层中查找此文件。找到后，会在容器层中记录下此删除操作。

**只有当需要修改时才复制一份数据，这种特性被称作Copy-on-Write。可见，容器层保存的是镜像变化的部分，不会对镜像本身进行任何修改。**

## 镜像缓存
Docker 会缓存已有镜像的镜像层，构建新镜像时，如果某镜像层已经存在，就直接使用，无需重新创建。

`--no-cache`在构建镜像时不使用缓存

Dockerfile中每个指令都会创建一个镜像层，上层是依赖于下层的。无论什么时候，只要某一层发生变化，其上面所有层的缓存都会失效。当改变了Dockerfile指令执行顺序，或者修改了指令，缓存都会失效。

## Debug Dockerfile
在构建过程中，极有可能在执行某个指令的时候就失败了，我们可以运行最新的这个镜像定位指令失败的原因。


## RUN、CMD、ENTRYPOINT对比
* 1.RUN 执行命令并创建新的镜像层，RUN 经常用于安装软件包。
* 2.CMD 设置容器启动后默认执行的命令及其参数，但 CMD 能够被 docker run 后面跟的命令行参数替换。
* 3.ENTRYPOINT 配置容器启动时运行的命令。

**ENTRYPOINT 不会被忽略，一定会被执行，即使运行 docker run 时指定了其他命令。**

**update 和 install 操作需要放在一个 RUN 指令中执行，这样能够保证每次安装的是最新的包。如果 install 在单独的 RUN 中执行，则会使用 update 创建的镜像层，而这一层可能是很久以前缓存的。**

## Shell、Exec对比
* 1.当指令执行时，shell 格式底层会调用 /bin/sh -c <command> 
* 2.当指令执行时，exec 格式会直接调用 <command>，不会被 shell 解析。


**CMD 和 ENTRYPOINT 推荐使用 Exec 格式，因为指令可读性更强，更容易理解**。RUN 则两种格式都可以。 

**ENTRYPOINT 的 Exec 格式用于设置要执行的命令及其参数，同时可通过 CMD 提供额外的参数。**

**ENTRYPOINT 的 Shell 格式会忽略任何 CMD 或 docker run 提供的参数。**

## 进入容器
* attach 直接进入容器 启动命令 的终端，不会启动新的进程。
* exec 则是在容器中打开新的终端，并且可以启动新的进程。

**如果想直接在终端中查看启动命令的输出，用 attach；其他情况使用 exec。**

如果只是为了查看启动命令的输出，可以使用 `docker logs` 命令, `docker logs -f` 的作用与 tail -f 类似，能够持续打印输出。

## 限制内存
与操作系统类似，容器可使用的内存包括两部分：物理内存和swap.Docker通过下面两组参数来控制容器内存的使用量。

* -m 或 --memory：设置内存的使用限额，例如 100M, 2G。
* --memory-swap：设置 内存+swap 的使用限额。

**如果在启动容器时只指定`-m`而不指定`--memory-swap`，那么`--memory-swap`默认为`-m`的两倍**

**默认情况下，上面两组参数为 -1，即对容器内存和 swap 的使用没有限制。**

### 测试
* 测试命令

> docker run -it -m 200M \-\-memory-swap=300M progrium/stress \-\-vm 1 \-\-vm-bytes 280M

--vm 1：启动 1 个内存工作线程。

--vm-bytes 280M：每个线程分配 280M 内存。

## 限制CPU
默认设置下，所有容器可以平等地使用 host CPU 资源并且没有限制。

Docker 可以通过 `-c` 或 `--cpu-shares` 设置容器使用 CPU 的权重。如果不指定，默认值为 1024。

与内存限额不同，通过`-c`设置的cpu share并不是CPU资源的绝对数量，而是一个相对的权重值。某个容器最终能分配到的 CPU 资源取决于它的 cpu share 占所有容器 cpu share 总和的比例。

**通过 `cpu share` 可以设置容器使用 CPU 的优先级。需要特别注意的是，这种按权重分配 CPU 只会发生在 CPU 资源紧张的情况下。如果权重高的容器处于空闲状态，这时为了利用CPU资源，权重低的容器也可以分配到全部可用的CPU**

### 测试命令
* 启动连个不同权重1024/512的容器
> docker run \-\-name container_A -it -c 1024 progrium/stress \-\-cpu 1

> docker run \-\-name container_B -it -c 512 progrium/stress \-\-cpu 1
 
* 通过`top`命令观察两容器CPU占用





