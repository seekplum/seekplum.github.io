---
layout: post
title: Mac安装kubernetes
categories: kubernetes
tags: docker kubernetes
thread: kubernetes
---

## 环境

* OSX 10.13.4 (17E202)

## 安装

* 安装基础软件

> brew update && brew install kubectl && brew cask install docker minikube virtualbox

* 查看版本

```bash
docker --version
docker-compose --version
docker-machine --version
minikube version
kubectl version
kubectl version --client
```

* 版本信息

```text
Docker version 18.09.2, build 6247962
docker-compose version 1.23.2, build 1110ad01
docker-machine version 0.16.1, build cce350d7
minikube version: v1.0.0
Client Version: version.Info{Major:"1", Minor:"14", GitVersion:"v1.14.0", GitCommit:"641856db18352033a0d96dbc99153fa3b27298e5", GitTreeState:"clean", BuildDate:"2019-03-26T00:05:06Z", GoVersion:"go1.12.1", Compiler:"gc", Platform:"darwin/amd64"}
Server Version: version.Info{Major:"1", Minor:"14", GitVersion:"v1.14.0", GitCommit:"641856db18352033a0d96dbc99153fa3b27298e5", GitTreeState:"clean", BuildDate:"2019-03-25T15:45:25Z", GoVersion:"go1.12.1", Compiler:"gc", Platform:"linux/amd64"}
Client Version: version.Info{Major:"1", Minor:"14", GitVersion:"v1.14.0", GitCommit:"641856db18352033a0d96dbc99153fa3b27298e5", GitTreeState:"clean", BuildDate:"2019-03-26T00:05:06Z", GoVersion:"go1.12.1", Compiler:"gc", Platform:"darwin/amd64"}
```

* 关闭报告错误提示

> minikube config set WantReportErrorPrompt false

* 启动，参考[issues 3860](https://github.com/kubernetes/minikube/issues/3860)

```bash
sudo ifconfig vboxnet0 up && minikube start --registry-mirror=https://registry.docker-cn.com --image-repository=registry.cn-hangzhou.aliyuncs.com/google_containers --vm-driver=virtualbox
```

`--kubernetes-version` 可以指定版本，版本信息可以不指定，使用默认对应版本

## 代理docker命令

```bash
eval $(minikube docker-env)

eval $(minikube docker-env -u)
```

## 共享文件

* 1.`minikuber ip` 获取IP
* 2.`minikube ssh` 登录
* 3.`sudo passwd docker` 修改密码
* 4.和正常的主机一样scp就可以了

## 卸载

### 卸载Kubernetes

停止集群，删除镜像，[issues详情](https://github.com/kubernetes/minikube/issues/1043)

```bash
minikube stop; minikube delete; trash ~/.minikube; trash ~/.kube
sudo trash /usr/local/bin/minikube
brew uninstall kubectl kubernetes-cli kubernetes-helm
```

### 卸载Docker

```bash
docker stop $(docker ps -aq) | xargs docker rm -v
docker system prune -af --volumes  # 会删除所有的镜像
```

**注: trash是个回收站功能工具，用于代替`rm`，防止误删除，以 `pip install trash-cli` 命令安装**
