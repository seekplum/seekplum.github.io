---
layout: post
title: kubernetes资源
categories: kubernetes
tags: docker kubernetes
thread: kubernetes
---

## 命令 vs 配置文件

Kubernetes 支持两种方式创建资源：

* 1.用 kubectl 命令直接创建，如下

```bash
kubectl run nginx-deployment --image=nginx:1.7.9 --replicas=2
```

在命令行中通过参数指定资源的属性。

* 2.通过配置文件和 kubectl apply 创建，要完成前面同样的工作，可执行命令：

编写 `nginx.yml` 文件内容

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: web_server
  replicas: 2
  template:
    metadata:
      labels:
        app: web_server
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9

```

1.在 `Deployment` 中必须写 `matchLables`

2.在定义模板的时候必须定义labels,因为 `Deployment.spec.selector` 是必须字段,而他又必须和 `template.labels` 对应

3.template里面定义的内容会应用到下面所有的副本集里面,在 `template.spec.containers` 里面不能定义labels标签.

创建资源

```bash
kubectl apply -f nginx.yml
```

`apiVersion` 的字段可以再官网对应版本查看,比如 [v16.2版本](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.16/#daemonset-v1-apps) 的版本为 `v1`

`kubectl api-versions` 可以查看支持的所有版本

### 基于命令的方式

* 1.简单直观快捷，上手快。
* 2.适合临时测试或实验。

### 基于配置文件的方式

* 1.配置文件描述了 What，即应用最终要达到的状态。
* 2.配置文件提供了创建资源的模板，能够重复部署。
* 3.可以像管理代码一样管理部署。
* 4.适合正式的、跨环境的、规模化部署。

这种方式要求熟悉配置文件的语法，有一定难度.

## Scale Up/Down Deployment

伸缩（Scale Up/Down）是指在线增加或减少 Pod 的副本数。

* 修改副本数为 5, 并执行 apply

```bash
ubuntu2@root  ~ kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   2/2     2            2           7m15s
ubuntu2@root  ~ kubectl get replicaset
NAME                         DESIRED   CURRENT   READY   AGE
nginx-deployment-5b5dfcc76   2         2         2       7m18s
ubuntu2@root  ~ kubectl get pod -o wide
NAME                               READY   STATUS    RESTARTS   AGE     IP           NODE      NOMINATED NODE   READINESS GATES
nginx-deployment-5b5dfcc76-2xfj8   1/1     Running   0          7m20s   10.244.1.6   ubuntu3   <none>           <none>
nginx-deployment-5b5dfcc76-d2dfr   1/1     Running   0          7m20s   10.244.2.5   ubuntu1   <none>           <none>
ubuntu2@root  ~ vi nginx.yml
ubuntu2@root  ~ cat nginx.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: web_server
  replicas: 5
  template:
    metadata:
      labels:
        app: web_server
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9

ubuntu2@root  ~ kubectl apply -f nginx.yml
deployment.apps/nginx-deployment configured
ubuntu2@root  ~ kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   5/5     5            5           7m43s
ubuntu2@root  ~ kubectl get replicaset
NAME                         DESIRED   CURRENT   READY   AGE
nginx-deployment-5b5dfcc76   5         5         5       7m50s
ubuntu2@root  ~ kubectl get pod -o wide
NAME                               READY   STATUS    RESTARTS   AGE     IP           NODE      NOMINATED NODE   READINESS GATES
nginx-deployment-5b5dfcc76-2xfj8   1/1     Running   0          7m53s   10.244.1.6   ubuntu3   <none>           <none>
nginx-deployment-5b5dfcc76-d2dfr   1/1     Running   0          7m53s   10.244.2.5   ubuntu1   <none>           <none>
nginx-deployment-5b5dfcc76-jl4xq   1/1     Running   0          15s     10.244.2.6   ubuntu1   <none>           <none>
nginx-deployment-5b5dfcc76-krj5d   1/1     Running   0          15s     10.244.1.8   ubuntu3   <none>           <none>
nginx-deployment-5b5dfcc76-pw45z   1/1     Running   0          15s     10.244.1.7   ubuntu3   <none>           <none>
ubuntu2@root  ~
```

**出于安全考虑，默认配置下 Kubernetes 不会将 Pod 调度到 Master 节点。**

* Master当Node节点使用

```bash
kubectl taint node `hostname -s` node-role.kubernetes.io/master-
```

* 恢复Master Only

```bash
kubectl taint node `hostname -s` node-role.kubernetes.io/master="":NoSchedule
```

## 用lable控制Pod位置

label 是 key-value 对，各种资源都可以设置 label，灵活添加各种自定义属性。

```bash
kubectl label node ubuntu2 disktype=ssd
kubectl get node --show-labels
```

* 将pod部署到 disktype=ssd 的节点上

```bash
ubuntu2@root  ~ vi nginx.yml
ubuntu2@root  ~ cat nginx.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: web_server
  replicas: 5
  template:
    metadata:
      labels:
        app: web_server
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
      nodeSelector:
        disktype: ssd

ubuntu2@root  ~ kubectl apply -f nginx.yml
deployment.apps/nginx-deployment unchanged
ubuntu2@root  ~ kubectl get pod -o wide
NAME                                READY   STATUS              RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES
nginx-deployment-7bb8d48dd6-29bhz   0/1     ContainerCreating   0          3m27s   <none>        ubuntu2   <none>           <none>
nginx-deployment-7bb8d48dd6-6p56w   1/1     Running             0          36s     10.244.0.9    ubuntu2   <none>           <none>
nginx-deployment-7bb8d48dd6-k8j6f   1/1     Running             0          3m28s   10.244.0.6    ubuntu2   <none>           <none>
nginx-deployment-7bb8d48dd6-mhnzf   1/1     Running             0          34s     10.244.0.10   ubuntu2   <none>           <none>
nginx-deployment-7bb8d48dd6-mkttd   1/1     Running             0          3m28s   10.244.0.7    ubuntu2   <none>           <none>
```

* 删除label

```bash
kubectl label node `hostname -s` disktype-
```

## DaemonSet

Deployment 部署的副本Pod会分布在各个Node上，每个Node都可能运行N个副本。

DaemonSet的不同之处在于: **每个Node上最多只能运行一个副本**

DaemonSet 的典型应用场景有：

* 1.在集群的每个节点上运行存储 Daemon，比如 glusterd 或 ceph。
* 2.在每个节点上运行日志收集 Daemon，比如 flunentd 或 logstash。
* 3.在每个节点上运行监控 Daemon，比如 Prometheus Node Exporter 或 collectd。

Kubernetes 自己就在用 DaemonSet 运行系统组件

```bash
ubuntu2@root  ~ kubectl get daemonset --namespace=kube-system
NAME                      DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                 AGE
kube-flannel-ds-amd64     3         3         3       3            3           <none>                        35h
kube-flannel-ds-arm       0         0         0       0            0           <none>                        35h
kube-flannel-ds-arm64     0         0         0       0            0           <none>                        35h
kube-flannel-ds-ppc64le   0         0         0       0            0           <none>                        35h
kube-flannel-ds-s390x     0         0         0       0            0           <none>                        35h
kube-proxy                3         3         3       3            3           beta.kubernetes.io/os=linux   35h
ubuntu2@root  ~
```
