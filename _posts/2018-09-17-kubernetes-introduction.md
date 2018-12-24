---
layout: post
title: 入门kubernetes
categories: docker
tags: docker kubernetes
thread: docker
---
## 环境
* OSX 10.13.4 (17E202)
* Python 2.7.14

## 安装

### 安装kubectl
* 安装

> brew install kubernetes-cli

* 查看版本

> kubectl version

### 安装minikube
* 下载

[github地址](https://github.com/kubernetes/minikube/releases/tag/v0.25.2) 选择 `v0.25.2` 版本，高于这个版本在执行 `minikube start` 过程中一直出现各种各样问题，[查看issues详情](https://github.com/kubernetes/minikube/issues/2703)

`v0.25.2` 最新的 kubernetes-version 为 `v1.10.0`

* 拷贝目录

```bash
sudo mv ~/Downloads/minikube-darwin-amd64 /usr/local/bin/minikube
sudo chmod 755 /usr/local/bin/minikube
```

* 查看版本

> /usr/local/bin/minikube version

* 关闭报告错误提示

> minikube config set WantReportErrorPrompt false

* 启动

> sudo minikube start \-\-kubernetes-version v1.13.1

`--kubernetes-version v1.13.1` 指定版本，版本信息可以不指定，使用默认值

### 卸载

停止集群，删除镜像，[issues详情](https://github.com/kubernetes/minikube/issues/1043)

> minikube stop; minikube delete; sudo trash ~/.minikube; sudo trash ~/.kube

> docker stop $(docker ps -aq) \| xargs docker rm -v

> sudo trash /usr/local/bin/minikube

> docker system prune -af --volumes  # 会删除所有的镜像

> brew uninstall kubernetes-cli kubernetes-helm

trash是个回收站功能工具，用于代替`rm`，防止误删除，以 `pip install trash-cli` 命令安装

### 报错
```text
➜  ~ minikube start --kubernetes-version v1.13.1
Starting local Kubernetes v1.13.1 cluster...
Starting VM...
Downloading Minikube ISO
 178.87 MB / 178.87 MB [============================================] 100.00% 0s
Getting VM IP address...
E1219 14:03:57.207483   72064 start.go:210] Error parsing version semver:  Version string empty
Moving files into cluster...
Downloading kubelet v1.13.1
Downloading kubeadm v1.13.1
Finished Downloading kubeadm v1.13.1
Finished Downloading kubelet v1.13.1
Setting up certs...
Connecting to cluster...
Setting up kubeconfig...
Stopping extra container runtimes...
Starting cluster components...
E1219 14:06:54.094254   72064 start.go:342] Error starting cluster:  kubeadm init error
sudo /usr/bin/kubeadm init --config /var/lib/kubeadm.yaml --ignore-preflight-errors=DirAvailable--etc-kubernetes-manifests --ignore-preflight-errors=DirAvailable--data-minikube --ignore-preflight-errors=Port-10250 --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-kube-scheduler.yaml --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-kube-apiserver.yaml --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-kube-controller-manager.yaml --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-etcd.yaml --ignore-preflight-errors=Swap --ignore-preflight-errors=CRI
 running command: : running command:
sudo /usr/bin/kubeadm init --config /var/lib/kubeadm.yaml --ignore-preflight-errors=DirAvailable--etc-kubernetes-manifests --ignore-preflight-errors=DirAvailable--data-minikube --ignore-preflight-errors=Port-10250 --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-kube-scheduler.yaml --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-kube-apiserver.yaml --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-kube-controller-manager.yaml --ignore-preflight-errors=FileAvailable--etc-kubernetes-manifests-etcd.yaml --ignore-preflight-errors=Swap --ignore-preflight-errors=CRI

, output: [init] Using Kubernetes version: v1.13.1
[preflight] Running pre-flight checks
    [WARNING Swap]: running with swap on is not supported. Please disable swap
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
error execution phase preflight: [preflight] Some fatal errors occurred:
    [ERROR ImagePull]: failed to pull image k8s.gcr.io/kube-apiserver:v1.13.1: output: Error response from daemon: Get https://k8s.gcr.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
, error: exit status 1
    [ERROR ImagePull]: failed to pull image k8s.gcr.io/kube-controller-manager:v1.13.1: output: Error response from daemon: Get https://k8s.gcr.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
, error: exit status 1
    [ERROR ImagePull]: failed to pull image k8s.gcr.io/kube-scheduler:v1.13.1: output: Error response from daemon: Get https://k8s.gcr.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
, error: exit status 1
    [ERROR ImagePull]: failed to pull image k8s.gcr.io/kube-proxy:v1.13.1: output: Error response from daemon: Get https://k8s.gcr.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
, error: exit status 1
    [ERROR ImagePull]: failed to pull image k8s.gcr.io/pause:3.1: output: Error response from daemon: Get https://k8s.gcr.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
, error: exit status 1
    [ERROR ImagePull]: failed to pull image k8s.gcr.io/etcd:3.2.24: output: Error response from daemon: Get https://k8s.gcr.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
, error: exit status 1
    [ERROR ImagePull]: failed to pull image k8s.gcr.io/coredns:1.2.6: output: Error response from daemon: Get https://k8s.gcr.io/v2/: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
, error: exit status 1
[preflight] If you know what you are doing, you can make a check non-fatal with `--ignore-preflight-errors=...`
: Process exited with status 1
================================================================================
An error has occurred. Would you like to opt in to sending anonymized crash
information to minikube to help prevent future errors?
To opt out of these messages, run the command:
    minikube config set WantReportErrorPrompt false
================================================================================
Please enter your response [Y/n]: n
```

## 说明
本文是按照[三小时学会Kubernetes：容器编排详细指南](http://dockone.io/article/5132)实际上手操作的，`代码`和`图片`出处均是这篇博客。

## 应用程序
由三个微服务组成。每个微服务都具有一个特定功能：

* SA-Frontend：提供ReactJS静态文件访问的Nginx Web服务器。
* SA-WebApp：处理来自前端请求的Java Web应用程序。
* SA-Logic：执行情绪分析的Python应用程序。

![情绪分析WebApp中的数据流](/static/images/docker/webapp-server.jpg)

微服务不是孤立存在的，它们可以实现“关注点分离”，但还是**需要互相交互**，理解这一点非常重要。

## 实践步骤
* 1.在本地计算机上运行基于微服务的应用程序。
* 2.为微服务应用程序的每个服务构建容器镜像。
* 3.介绍Kubernetes。将基于微服务的应用程序部署到Kubernetes管理的集群中。

## 本地运行微服务

### 准备插件
* 1.[安装Nginx](/nginx)
* 2.[安装Java](/mac-operation/)
* 3.[安装Maven](/mac-operation/)
* 4.[安装Nodejs](/npm-install/)
* 5.[克隆仓库代码](https://github.com/rinormaloku/k8s-mastery)

### 配置React
```bash
cd [SA-Frontend目录]
npm install
npm run build
```

### 配置Nginx
```bash
cp -r [SA-Frontend目录]/build/* [nginx安装目录]/html
```

### 配置python应用程序
```bash
cd [SA-Logic目录]
cd sa

pip install -r requirements.txt
python -m textblob.download_corpora
```

#### 解决`python -m textblob.download_corpora`报错
* 报错信息

```text
[nltk_data] Error loading brown: <urlopen error [SSL:
[nltk_data]     CERTIFICATE_VERIFY_FAILED] certificate verify failed
[nltk_data]     (_ssl.c:841)>
```

* 安装certifi

> pip install certifi

安装后还是无法下载，继续尝试新的方案

* 手动[下载nltk包](http://www.nltk.org/nltk_data/)

```text
(python27env) ➜  nltk_data pwd
/usr/local/share/nltk_data
(python27env) ➜  nltk_data tree -L 2
|-- corpora
|   |-- brown
|   |-- brown.zip
|   |-- conll2000
|   |-- conll2000.zip
|   |-- movie_reviews
|   |-- movie_reviews.zip
|   |-- wordnet
|   `-- wordnet.zip
|-- taggers
|   |-- averaged_perceptron_tagger
|   `-- averaged_perceptron_tagger.zip
`-- tokenizers
    |-- punkt
    `-- punkt.zip

9 directories, 6 files
```

**手动下载到指定目录后成功**

* 脚本下载

```python
import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download()
```

**脚本下载成功**

### 配置Spring web app
```bash
cd [SA-WebApp目录]
maven install

cd target
java -jar sentiment-analysis-web-0.0.1-SNAPSHOT.jar --sa.logic.api.url=http://localhost:5000
```

`sa.logic.api.url`: 情绪分析请求的URL

## 容器运行微服务
* 使用虚拟机的缺点：
    - 资源效率低下，每个虚拟机都有一个完整的操作系统的额外开销。
    - 它依赖于平台。在你的计算机上正常工作的东西，在生产服务器上有可能无法正常工作。
    - 与容器相比，属于重量级产品，且扩展较慢。
* 使用容器优点:
    - 在Docker的协助下使用宿主机操作系统，资源利用率较高。
    - 平台无关。在你的计算机上正常运行的容器在任何地方也都可以正常工作。
    使用镜像层实现轻量化。

### 启动nginx服务
> docker run -d \-\-name sa-frontend -p 80:80 seekplum/sa-frontend

### 启动Spring webapp服务
> docker run -d \-\-name sa-webapp -p 8080:8080 -e SA_LOGIC_API_URL='http://localhost:5000' seekplum/sa-webapp

### 启动Python应用程序
> docker run -d \-\-name sa-logic -p 5000:5000 seekplum/sa-logic

## 安装kubernets
安装方法参考[官网](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

> brew install kubernetes-cli

## Kubernetes实践——Pod
把微服务运行在容器中，虽然行得通，但是设置过程相当繁琐。我们还提到这个解决方案不具有可扩展性和弹性，而Kubernetes则可解决这些问题。本文后续部分，我们会把服务迁移成图13所示的最终结果，由Kubernetes来编排容器。

![Kubernetes管理的集群中的微服务](/static/images/docker/kubernetes-webapp-server.png)

## Pod
那么为什么Kubernetes决定把Pod当作最小的可部署计算单元呢？Pod是做什么的？Pod可以由一个甚至是一组共享相同运行环境的容器组成。

有需要在一个Pod中运行两个容器么？一般会像本示例所做的这样，一个Pod中只运行一个容器。但是，如果两个容器需要共享数据卷，或者它们需要进行进程间通信，或者以其他方式紧密耦合，用Pod就能做到。另外一点，Pod可以让我们不受Docker容器的限制，如果需要的话，我们可以使用其他技术来实现，比如[Rkt](https://coreos.com/rkt/)。

![pod属性](/static/images/docker/pod-property.png)

Pod的主要属性是：
* 1.每个Pod在Kubernetes集群中都有一个唯一的IP地址。
* 2.Pod可以包含多个容器。这些容器共享相同的端口空间，因此它们可以通过localhost进行通信（由此可见，它们不能使用相同的端口），与其他Pod的容器进行通信必须使用其Pod的IP地址。
* 3.Pod中的容器共享相同的数据卷*、相同的IP地址、端口空间、IPC命名空间。
* 4.容器拥有独立的文件系统，不过它们可以使用Kubernetes资源卷来共享数据

## 参考
* [三小时学会Kubernetes：容器编排详细指南](http://dockone.io/article/5132)
* [通过Minikube快速搭建一个本地的Kubernetes单节点环境](https://zhuanlan.zhihu.com/p/34487833)
* [Install and Set Up kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
* [Install Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/)