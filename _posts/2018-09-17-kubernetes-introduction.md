---
layout: post
title: 入门kubernetes
categories: kubernetes
tags: docker kubernetes
thread: kubernetes
---
## 环境

* OS: OSX 10.13.4 (17E202)
* Python: Python 2.7.16
* JAVA: java version "1.8.0_162"
* Nginx: nginx/1.13.2
* NPM: 5.6.0

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
* 5.克隆仓库代码

```bash
cd $GOPATH/src/github.com
mkdir rinormaloku && cd rinormaloku
git clone https://github.com/rinormaloku/k8s-mastery
```

* 6.查看最后一次commit

```text
commit 2411a2f75c3350a97c933f703f780ddb6505c30e (HEAD -> master, origin/master, origin/HEAD)
Author: Rinor Maloku <rinormaloku37@gmail.com>
Date:   Sun Feb 10 11:19:55 2019 +0100

    Update README.md
```

### 配置React

```bash
cd sa-frontend
npm install
npm run build
```

### 配置Nginx

```bash
cp -r sa-frontend/build/* ~/packages/nginx/html/
```

* 注:

`~/packages/nginx/` 为 `nginx安装目录`

### 配置python应用程序

```bash
cd sa-logic/sa

pip install -r requirements.txt         # 安装项目依赖包
python -m textblob.download_corpora     # 下载 nltk 包到 /usr/local/share/nltk_data/
```

* 启动应用

```bash
python sentiment_analysis.py
```

#### 解决`python -m textblob.download_corpora`报错

* 报错信息

```text
[nltk_data] Error loading brown: <urlopen error [SSL:
[nltk_data]     CERTIFICATE_VERIFY_FAILED] certificate verify failed
[nltk_data]     (_ssl.c:727)>
[nltk_data] Error loading punkt: <urlopen error [SSL:
[nltk_data]     CERTIFICATE_VERIFY_FAILED] certificate verify failed
[nltk_data]     (_ssl.c:727)>
[nltk_data] Error loading wordnet: <urlopen error [SSL:
[nltk_data]     CERTIFICATE_VERIFY_FAILED] certificate verify failed
[nltk_data]     (_ssl.c:727)>
[nltk_data] Error loading averaged_perceptron_tagger: <urlopen error
[nltk_data]     [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify
[nltk_data]     failed (_ssl.c:727)>
[nltk_data] Error loading conll2000: <urlopen error [SSL:
[nltk_data]     CERTIFICATE_VERIFY_FAILED] certificate verify failed
[nltk_data]     (_ssl.c:727)>
[nltk_data] Error loading movie_reviews: <urlopen error [SSL:
[nltk_data]     CERTIFICATE_VERIFY_FAILED] certificate verify failed
[nltk_data]     (_ssl.c:727)>
Finished.
```

说明nltk包无法下载，尝试其它下载方案。**建议使用脚本自动下载**

* 先安装certifi

> pip install certifi

安装后还是无法下载，继续尝试新的方案

* 手动[下载nltk包](http://www.nltk.org/nltk_data/)

```bash
➜ pwd
/usr/local/share/nltk_data
➜ tree -L 2
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

**下载后需要把文件按照上述目录进行移动.**

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

**下载过程会有点慢，需要耐心等待.**

### 配置Spring web app

```bash
cd sa-webapp
mvn install  # mac 下 maven 软件名叫 mvn

cd target
java -jar sentiment-analysis-web-0.0.1-SNAPSHOT.jar --sa.logic.api.url=http://localhost:5000
```

`sa.logic.api.url`: 情绪分析请求的URL

## 容器运行微服务

* 使用虚拟机的缺点：
    - 1.资源效率低下，每个虚拟机都有一个完整的操作系统的额外开销。
    - 2.它依赖于平台。在你的计算机上正常工作的东西，在生产服务器上有可能无法正常工作。
    - 3.与容器相比，属于重量级产品，且扩展较慢。
* 使用容器优点:
    - 1.在Docker的协助下使用宿主机操作系统，资源利用率较高。
    - 2.平台无关。在你的计算机上正常运行的容器在任何地方也都可以正常工作。
    - 3.使用镜像层实现轻量化。

### 编译镜像

```bash
docker build -t seekplum/sa-logic sa-logic
docker build -t seekplum/sa-frontend sa-frontend
docker build -t seekplum/sa-webapp sa-webapp

docker push seekplum/sa-logic
docker push seekplum/sa-frontend
docker push seekplum/sa-webapp
```

### 启动nginx服务

```bash
docker run -d --name sa-frontend -p 80:80 seekplum/sa-frontend
```

### 启动Python应用程序

```bash
docker run -d --name sa-logic -p 5000:5000 seekplum/sa-logic
```

### 启动Spring webapp服务

* SA_LOGIC_API_URL指定为`http://localhost:5000`报错

```text
.springframework.web.client.ResourceAccessException: I/O error on POST request for "http://127.0.0.1:5000/analyse/sentiment": Connection refused (Connection refused); nested exception is java.net.ConnectException: Connection refused (Connection refused)] with root cause
```

**所以在启动 `seekplum/sa-webapp` 容器前需要先启动 `seekplum/sa-logic`，然后查询其IP进行指定**

```bash
SA_LOGIC_IP=$(docker inspect sa-logic | grep '"IPAddress"' | head -n 1 | grep -o -w -E "\d+\.\d+\.\d+\.\d+") # 查询容器IP

docker run -d --name sa-webapp -p 8080:8080 -e SA_LOGIC_API_URL="http://$SA_LOGIC_IP:5000" seekplum/sa-webapp
```

## Kubernetes

Kubernetes是一个容器编排器，它对底层基础设施（容器运行的地方）进行了抽象。

![pod属性](/static/images/docker/kubernetes-server.png)

对开发者这意味着什么？意味着他无须关心节点的数量、容器在哪启动以及它们之间如何通信。他无须处理硬件优化，也无须担心节点会宕机（根据墨菲定律，节点一定会宕机），因为他可以将新节点添加到Kubernetes集群中。Kubernetes会在正常运转的节点上启动容器。它会尽其最大能力来做到这一点。

* API服务器：与集群交互的唯一途径。用于启动或停止容器（误，实为Pod），检查当前状态、日志等。
* Kubelet：监控节点内的容器（误，实为Pod），并与主节点进行通信。
* Pod：一开始可以将Pod当作容器看待。

### Kubernetes实践——Pod

把微服务运行在容器中，虽然行得通，但是设置过程相当繁琐。我们还提到这个解决方案不具有可扩展性和弹性，而Kubernetes则可解决这些问题。本文后续部分，我们会把服务迁移成图13所示的最终结果，由Kubernetes来编排容器。

![Kubernetes管理的集群中的微服务](/static/images/docker/kubernetes-webapp-server.png)

### Pod

那么为什么Kubernetes决定把Pod当作最小的可部署计算单元呢？Pod是做什么的？Pod可以由一个甚至是一组共享相同运行环境的容器组成。

有需要在一个Pod中运行两个容器么？一般会像本示例所做的这样，一个Pod中只运行一个容器。但是，如果两个容器需要共享数据卷，或者它们需要进行进程间通信，或者以其他方式紧密耦合，用Pod就能做到。另外一点，Pod可以让我们不受Docker容器的限制，如果需要的话，我们可以使用其他技术来实现，比如[Rkt](https://coreos.com/rkt/)。

![pod属性](/static/images/docker/pod-property.png)

Pod的主要属性是：

* 1.每个Pod在Kubernetes集群中都有一个唯一的IP地址。
* 2.Pod可以包含多个容器。这些容器共享相同的端口空间，因此它们可以通过localhost进行通信（由此可见，它们不能使用相同的端口），与其他Pod的容器进行通信必须使用其Pod的IP地址。
* 3.Pod中的容器共享相同的数据卷*、相同的IP地址、端口空间、IPC命名空间。
* 4.容器拥有独立的文件系统，不过它们可以使用Kubernetes资源卷来共享数据

### Pod定义

以下是第一个Pod sa-front的清单（manifest）文件，后面是对各个要点的解释。

* sa-frontend-pod.yaml

```yaml
apiVersion: v1
kind: Pod                           # 1
metadata:
  name: sa-frontend                 # 2
  labels:
    app: sa-frontend
spec:                               # 3
  containers:
  - image: seekplum/sa-frontend     # 4
    name: sa-frontend               # 5
    ports:
    - containerPort: 80             # 6
```

* 1.Kind指定我们想要创建的Kubernetes资源的种类。在这个例子中是Pod。
* 2.Name：定义资源的名称。我们将它命名为sa-front。
* 3.Spec是用于定义资源的期望状态的对象。Pod Spec最重要的参数是容器的数组。
* 4.Image是要在此Pod中启动的容器镜像。
* 5.Name是Pod中容器的唯一名称。
* 6.ContainerPort：容器所要监听的端口。这只是面向读者的一个指示信息（删除该端口并不会限制访问）。

### 创建SA前端pod

```bash
kubectl create pod -f sa-frontend-pod.yaml
```

* 检查pod运行状态

```bash
kubectl get pods
```

可以指定 `--watch` 参数，获取更多信息

* 从外部访问应用程序(以端口转发方式)

> kubectl port-forward sa-frontend 8080:80

* 查看日志

> kubectl logs -f sa-frontend

* 删除pod

> kubectl delete -f sa-frontend-pod.yaml

或

> kubectl delete pod sa-frontend

### 向上扩展的错误方法

* sa-frontend-pod2.yaml

```yaml
apiVersion: v1
kind: Pod                           # 1
metadata:
  name: sa-frontend2                # 2 # The only change
  labels:
    app: sa-frontend
spec:                               # 3
  containers:
  - image: seekplum/sa-frontend     # 4
    name: sa-frontend               # 5
    ports:
    - containerPort: 80             # 6
```

```bash
kubectl create pod -f sa-frontend-pod2.yaml
```

### Pod总结

提供静态文件服务的Nginx Web服务器运行在两个不同的Pod中。现在有两个问题：

* 如何将其暴露给外界，以便通过URL进行访问？
* 如何在它们之间进行负载平衡？

![服务之间的负载平衡](/static/images/docker/services-load-balance.png)

## Kubernetes实践——Service

Kubernets的 `Service` 资源为提供相同功能服务的一组Pod充当入口，如下图所示。此类资源负责发现服务和负载平衡，任务繁重。

![Sercie维护IP](/static/images/docker/service-ip.png)

我们的Kubernetes集群是由多个具有不同功能性服务的Pod组成的（前端、Spring WebApp和Flask Python应用程序）。那么问题来了，Service如何知道要定位到哪些Pod？也就是说，它如何生成Pod的端点列表？

答案是，通过标签（Labels）来实现的，这是一个两步过程：

* 1.将标签应用于所有我们希望Service定位的Pod上
* 2.为我们的Service应用一个 `筛选器(selector)`，以定义要定位哪个标记的Pod。

![带有标签的Pod及清单](/static/images/docker/pod-label.png)

### 标签

标签为组织Kubernetes资源提供了一种简单的方法。它们的表现形式为键值对，可以应用于所有资源。

```bash
kubectl apply -f sa-frontend-pod.yaml
kubectl apply -f sa-frontend-pod2.yaml
```

* 通过标签查询pod

```bash
kubectl get pods -l app=sa-frontend
```

* 查询pod的label

```bash
kubectl get pods --show-labels
```

### Service定义

Loadbalancer Service的YAML定义如下所示：

* service-sa-frontend-lb.yaml

```yaml
apiVersion: v1
kind: Service              # 1
metadata:
  name: sa-frontend-lb
spec:
  type: LoadBalancer       # 2
  ports:
  - port: 80               # 3
    protocol: TCP          # 4
    targetPort: 80         # 5
  selector:                # 6
    app: sa-frontend       # 7
```

* 1.Kind：一个Service。
* 2.Type：规格类型，我们选择LoadBalancer是因为我们要实现Pod之间的负载均衡。
* 3.Port：指定Service接收请求的端口。
* 4.Protocol：定义通信协议。
* 5.TargetPort：请求转发的端口。
* 6.Selector：包含选择Pod的参数的对象。
* 7.App：sa-frontend定义了要定位的是打了“app:sa-frontend”标签的Pod。

* 创建Servie

```bash
kubectl create -f service-sa-frontend-lb.yaml
```

* 查询Service状态

```bash
kubectl get svc
```

外部IP处于pending状态（不用等了，它不会变的）。这是因为我们使用的是Minikube。如果我们在Azure或GCP这样的云提供商中执行该操作，将获得一个公网IP，以便在全球范围内访问我们的服务。

Minikube为本地调试提供了一个有用的命令，执行以下命令：

```bash
minikube service sa-frontend-lb
```

这会在你的浏览器中打开Service的IP地址。在Service收到请求后，它会将其转发给其中一个Pod（哪一个无关紧要）。这种抽象让我们可以使用Service作为入口将多个Pod作为一个单元来看待和交互。

### Service总结

本节我们介绍了标签资源，将它们用于Service的筛选器，同时我们定义并创建了一个LoadBalancer Service。这满足了我们扩展应用程序的需求（只需添加新的打上标签的Pod）并使用Service作用入口实现Pod之间的负载均衡。

## Kubernetes实践——Deployment

Deployment资源可以自动迁移应用程序版本，实现零停机，并且可以在失败时快速回滚到前一版本。

## Deployment实践

目前，我们有两个Pod和一个用于暴露这两个Pod并在它们之间做负载均衡的Service（见下图）。我们之前说过，单独部署这些Pod并非理想的方案。它要求每个Pod进行单独管理（创建、更新、删除及监控其健康状况）。快速更新和回滚更是不可能！这是无法接受的，而Kubernetes的Deployment资源则解决了这些问题。

![当前service和pod状态](/static/images/docker/service-current-status.png)

在继续之前，我说明我们想要实现的目标，因为这将为我们提供一个总览，让我们能够理解Deployment资源的清单定义。我们想要的是：

* 1.运行 `seekplum/sa-frontend` 镜像的两个Pod
* 2.零停机时间部署
* 3.为Pod打上app: sa-frontend标签，以便sa-frontend-lb Service能发现这些服务

### Deployment定义

* sa-frontend-deployment.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Deployment            # 1
metadata:
  name: sa-frontend
spec:
  replicas: 2               # 2
  minReadySeconds: 15
  strategy:
    type: RollingUpdate     # 3
    rollingUpdate:
      maxUnavailable: 1     # 4
      maxSurge: 1           # 5
  template:                 # 6
    metadata:
      labels:
        app: sa-frontend    # 7
    spec:
      containers:
        - image: seekplum/sa-frontend
          imagePullPolicy: Always   # 8
          name: sa-frontend
          ports:
            - containerPort: 80
```

* 1.Kind：一个Deployment。
* 2.Replicas是Deployment Spec对象的一个属性，用于定义我们需要运行几个Pod。这里是2个。
* 3.Type指定了这个Deployment在迁移版本时使用的策略。RollingUpdate策略将保证实现零当机时间部署。
* 4.MaxUnavailable是RollingUpdate对象的一个​​属性，用于指定执行滚动更新时不可用的Pod的最大数（与预期状态相比）。我们的部署具有2个副本，这意味着在终止一个Pod后，仍然有一个Pod在运行，这样可以保持应用程序的可访问性。
* 5.MaxSurge是RollingUpdate对象的另一个属性，用于定义可以添加到部署中的最大Pod数量（与预期状态相比）。在我们的部署是，这意味着在迁移到新版本时，我们可以添加一个Pod，也就是同时有3个Pod。
* 6.Template：指定Deployment创建新Pod所用的Pod模板。你马上就发现它与Pod的定义相似。
* 7.app: sa-frontend是使用该模板创建出来的Pod所使用的标签。
* 8.ImagePullPolicy设置为Always表示，每次重新部署时都会拉取容器镜像。

* 创建

```bash
kubectl apply -f sa-frontend-deployment.yaml
```

* 验证

```bash
kubectl get pods
```

### 优点

#### 1.零停机时间滚动部署

* sa-frontend-deployment-green.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Deployment            # 1
metadata:
  name: sa-frontend
spec:
  replicas: 2               # 2
  minReadySeconds: 15
  strategy:
    type: RollingUpdate     # 3
    rollingUpdate:
      maxUnavailable: 1     # 4
      maxSurge: 1           # 5
  template:                 # 6
    metadata:
      labels:
        app: sa-frontend    # 7
    spec:
      containers:
        - image: seekplum/sa-frontend:green
          imagePullPolicy: Always   # 8
          name: sa-frontend
          ports:
            - containerPort: 80
```

* 更新前端版本

```bash
kubectl apply -f sa-frontend-deployment-green.yaml --record
```

* 查看滚动部署状态

```bash
kubectl rollout status deployment sa-frontend
```

* 验证部署

在浏览器上查看更新的内容。执行与之前使用过的同一命令 `minikube service sa-frontend-lb` 打开浏览器，我们可以看到该按钮已更新。

* `滚动更新` 的幕后

在应用新的Deployment后，Kubernetes会对新旧状态进行比较。在我们的示例中，新状态请求两个使用 `seekplum/sa-frontend:green` 的Pod。这与当前运行状态不同，因此它会启用RollingUpdate。

![滚动更新pod](/static/images/docker/rollingupdate-replacing.png)

RollingUpdate会根据我们指定的规则进行操作，即“maxUnavailable: 1”和“maxSurge: 1”。这意味着部署时只能终止一个Pod，并且只能启动一个新的Pod。该过程会不断重复直到所有的Pod都被更换（见上图）。

### 2.回滚到之前的状态

* 查看历史版本

```bash
kubectl rollout history deployment sa-frontend
```

为什么第一个版本的CHANGE-CAUSE是<none>，而第二个版本的CHANGE-CAUSE是 `kubectl apply –filename=sa-frontend-deployment-green.yaml –record=true`？

因为我们在应用新镜像时使用了--record标示

* 回退到上一个版本

```bash
kubectl rollout undo deployment sa-frontend --to-revision=1
```

## Kubernetes和其他实践

### 部署sa-logic Deployment

* sa-logic-deployment.yaml

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: sa-logic
spec:
  replicas: 2
  minReadySeconds: 15
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: sa-logic
    spec:
      containers:
        - image: seekplum/sa-logic
          imagePullPolicy: Always
          name: sa-logic
          ports:
            - containerPort: 5000
```

* 执行命令

```bash
kubectl apply -f sa-logic-deployment.yaml
```

## Service SA-Logic

这里需要说明一下为什么我们需要这项Service。我们的Java应用程序（运行在SA-WebApp Deployment的Pod中）依赖于Python应用程序完成的情绪分析。但是，与之前全部在本地运行不同，现在我们不再是使用单一一个Python应用程序监听一个端口，而是两个甚至更多。

这就是为什么我们需要一个Service“作为提供相同功能服务的一组Pod的入口”。这意味着我们可以使用Service SA-Logic作为所有SA-Logic Pod的入口。

* service-sa-logic.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sa-logic
spec:
  ports:
    - port: 80
      protocol: TCP
      targetPort: 5000
  selector:
    app: sa-logic
```

* 启动

```bash
kubectl apply -f service-sa-logic.yaml --record
```

### 部署SA-WebApp

* sa-web-app-deployment.yaml

```yaml
kind: Deployment
metadata:
  name: sa-web-app
spec:
  replicas: 2
  minReadySeconds: 15
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: sa-web-app
    spec:
      containers:
      - image: seekplum/sa-webapp
        imagePullPolicy: Always
        name: sa-web-app
        env:
          - name: SA_LOGIC_API_URL
            value: "http://sa-logic"
        ports:
          - containerPort: 8080
```

#### KUBE-DNS

Kubernetes有一个特殊的Pod kube-dns。默认情况下，所有Pod都会将其作为DNS服务器。kube-dns一个重要特性是它会为每个新建的Service创建一条DNS记录。

这意味着当我们创建Service sa-logic时，它获得了一个IP地址。它的名字（与IP一起）会被添加到kube-dns记录中。这使得所有的Pod能够将sa-logic转换为SA-Logic Service的IP地址。

* 部署

```bash
kubectl apply -f sa-web-app-deployment.yaml
```

* service-sa-web-app-lb.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sa-web-app-lb
spec:
  type: LoadBalancer
  ports:
  - port: 80
    protocol: TCP
    targetPort: 8080
  selector:
    app: sa-web-app
```

* 部署

```bash
kubectl apply -f service-sa-web-app-lb.yaml
```

## 问题

整个架构完成了。不过还有一点没完善。在部署SA-Frontend Pod时，容器镜像将SA-WebApp指向了`http://localhost:8080/sentiment`。但是现在我们需要将其更新为指向SA-WebApp LoadBalancer（充当SA-WebApp Pod的入口）的IP地址。

* 1.执行以下命令获取SA-WebApp Loadbalancer的IP地址：

```bash
minikube service list
```

* 2.根据第一步执行结果，在 `sa-frontend/src/App.js` 的 `23` 行，把 `http://localhost:8080/sentiment` 修改第一步查询到的IP
* 3.进入 `sa-frontend` 目录，运行 `npm run build` 构建静态文件
* 4.构建容器镜像

```bash
docker build -t seekplum/sa-frontend:minikube .
```

* 5.将镜像推送到 Docker Hub

```bash
docker push seekplum/sa-frontend:minikube
```

* 6.编辑 `sa-frontend-deployment.yaml` 文件使用新的镜像
* 7.执行下面命令

```bash
kubectl apply -f sa-frontend-deployment.yaml
```

刷新一下浏览器，或者再次执行 `minikube service sa-frontend-lb`。现在输入一个句子试试！

![最终项目架构](/static/images/docker/sa-fronntend-logic-webapp.png)

## 总结

这个入门学习从18年9月开始，到19年4月份，总算是安装教程完整的尝试了一遍。开始对kubernetes有了初步的印象，以及使用带来的好处。kubernetes功能强大，需要好好考虑如何落地到我们传统的项目中。请继续努力。

## 参考

* [三小时学会Kubernetes：容器编排详细指南](http://dockone.io/article/5132)
* [Learn Kubernetes in Under 3 Hours: A Detailed Guide to Orchestrating Containers](https://medium.freecodecamp.org/learn-kubernetes-in-under-3-hours-a-detailed-guide-to-orchestrating-containers-114ff420e882)
* [通过Minikube快速搭建一个本地的Kubernetes单节点环境](https://zhuanlan.zhihu.com/p/34487833)
* [Install and Set Up kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
* [Install Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/)