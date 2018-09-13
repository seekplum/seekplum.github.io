---
layout: post
title:  持续学习docker<四>-Machine
categories: docker
tags: docker Machine
thread: docker
---
## 前言

### 为什么要有Machine
之前的学习过程中都是只有一个docker host,所有容器都是运行在一个host上，但是真实的环境中会有多个host，对于这样的`multi-host`环境，如何进行管理？

### 面临的问题
为所有的host安装和配置docker, 步骤较多，对于多主机环境手工方式效率低且不容易保证一致性。

### 如何解决
Docker Machine 可以批量安装和配置 docker host，这个 host 可以是本地的虚拟机、物理机，也可以是公有云中的云主机。

## 环境配置
Docker Machine 支持在不同的环境下安装配置 docker host，包括：

* 1.常规 Linux 操作系统
* 2.虚拟化平台 - VirtualBox、VMWare、Hyper-V
* 3.OpenStack
* 4.公有云 - Amazon Web Services、Microsoft Azure、Google Compute Engine、Digital Ocean 等

Docker Machine 为这些环境起了一个统一的名字：`provider`。对于某个特定的 provider，Docker Machine 使用相应的 driver 安装和配置 docker host。

![Docker Machine架构](/static/images/docker/docker-machine.jpg)

## 安装Docker Machine
* [官方文档](https://docs.docker.com/machine/install-machine/#install-machine-directly)

不同操作系统的安装方式会有所区别

* 验证查看版本

> docker-machine version

### tab补全
为了得到更好的体验，我们可以安装 bash completion script，这样在 bash 能够通过 tab 键补全 docker-mahine 的子命令和参数。

[completion script](https://github.com/docker/machine/tree/master/contrib/completion/bash),设置shell提示`PS1='[\u@\h \W$(__docker_machine_ps1)]\$ '`.

注: 以下操作在macos下

* 1.安装工具
```bash
brew install docker-completion
brew install docker-compose-completion
brew install docker-machine-completion
```

* 2.设置命令行提示符

注:**本环境安装了oh-my-zsh**，可以通过`echo $PS1`或者`echo $PROMPT`查看当前的默认提示符

vi ~/.bashrc

```bash
source '/usr/local/etc/bash_completion.d/docker-machine-prompt.bash'
export PS1='${ret_status} %{$fg[cyan]%}%c%{$reset_color%}$(__docker_machine_ps1) $(git_prompt_info)'
```

**需要在其他soure前面(比如还有soure ~/python27env)，不然会python27env的提示符给弄丢**

使设置生效

> source ~/.zshrc

## 创建Machine
> docker-machine --debug create \-\-driver generic \-\-generic-ip-address=192.168.1.78 \-\-generic-ssh-key ~/.ssh/seekplum  \-\-generic-ssh-user=root \-\-generic-ssh-port=22 host78

docker-machine详细命令参见: [https://docs.docker.com/machine/](https://docs.docker.com/machine/)

命令分析：

* --debug: 输出信息开启debug级别，可以看到详细信息
* create: 创建docker主机
* --driver generic: 驱动类型 generic 支持linux通用服务器，还支持很多种云主机
* --generic-ip-address=192.168.1.78: 指定主机IP
* --generic-ssh-key ~/.ssh/seekplum: 指定ssh登陆私钥
* --generic-ssh-user=root: 指定ssh登陆用户名
* --generic-ssh-port=22: 指定ssh登陆端口
* host78: 主机名称

**创建过程**
* 1.通过 ssh 登录到远程主机
* 2.安装 docker
* 3.拷贝证书
* 4.配置 docker daemon
* 5.启动 docker

**注意：在创建过程中会读取`/etc/os-release`文件，但此文件在`Centos7`之后才有，所以如果远程服务器是6.x，就无法通过docker-machine来安装docker。**

* 查看: docker-machine ls
* 删除: docker-machine rm -y \<machine-name\>

### 依赖冲突解决方法
```text
因为依赖关系问题而跳过的软件包：
    initscripts-9.49.41-1.el7_5.1.x86_64 来自 updates
```

* 卸载冲突包

```bash
cp /etc/os-release  /etc/os-release.bak
rpm -e redhat-release-server-7.4-18.el7.x86_64 \-\-nodeps
cp /etc/os-release.bak  /etc/os-release
```

### 创建错误
```text
Reading CA certificate from /Users/seekplum/.docker/machine/certs/ca.pem
Reading client certificate from /Users/seekplum/.docker/machine/certs/cert.pem
Reading client key from /Users/seekplum/.docker/machine/certs/key.pem
Error creating machine: Error checking the host: Error checking and/or regenerating the certs: There was an error validating certificates for host "192.168.1.98:2376": dial tcp 192.168.1.98:2376: getsockopt: connection refused
You can attempt to regenerate them using 'docker-machine regenerate-certs [name]'.
Be advised that this will trigger a Docker daemon restart which might stop running containers.

notifying bugsnag: [Error creating machine: Error checking the host: Error checking and/or regenerating the certs: There was an error validating certificates for host "192.168.1.98:2376": dial tcp 192.168.1.98:2376: getsockopt: connection refused
You can attempt to regenerate them using 'docker-machine regenerate-certs [name]'.
Be advised that this will trigger a Docker daemon restart which might stop running containers.
```

错误原因是防火墙开启着，关闭防火墙后成功

### 关闭防火墙
* 关闭firewall

> systemctl stop firewalld.service

* 禁止firewall开机启动

> systemctl disable firewalld.service

* 查看默认防火墙状态

关闭后显示notrunning，开启后显示running

> firewall-cmd \-\-state

## 管理Machine
执行远程 docker 命令我们需要通过 `-H` 指定目标主机的连接字符串，比如：

> docker -H tcp://10.10.20.98:2376 ps

Docker Macheine，显示访问`host98`需要的所有环境变量

> docker-machine env host98

* 进入host98 docker所在主机

> eval $(docker-machine env host98)

如果你用的不是docker命令，而是`ls`, `cat`这些命令，操作指令还是由本机来完成的。**只有docker命令才是由host98来完成**

**docker-machine env 并不是让你真的登录到服务器，不是保持跟服务器的连接，而是当你操作docker命令的时候，往env中设置的host上发送数据。**

* 退出host98主机的docker

> eval $(docker-machine env -u

`-u`: unset

命令行提示符已经变了，其原因是我们之前在`$HOME/.bashrc` 中配置了 `PS1='[\u@\h \W$(__docker_machine_ps1)]\$'`，用于显示当前 docker host。

* `docker-machine upgrade <host1> <host2>`: 更新 machine 的 docker 到最新版本，可以批量执行
* `docker-machine config <host1>`: 查看 machine 的 docker daemon 配置
* `docker-machine scp host1:/tmp/a host2:/tmp/b`: 在不同 machine 之间拷贝文件


## 参考
* [oh-my-zsh终端用户名设置（PS1)](https://blog.csdn.net/jichunw/article/details/80088995)

