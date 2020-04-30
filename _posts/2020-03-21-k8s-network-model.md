---
layout: post
title: k8s 网络模型
tags: kubernetes model
thread: kubernetes
---

## Kubernetes 网络模型

Kubernetes 采用的是基于扁平地址空间的网络模型，集群中的每个 Pod 都有自己的 IP 地址，Pod 之间不需要配置 NAT 就能直接通信。另外，同一个 Pod 中的容器共享 Pod 的 IP，能够通过 `localhost` 通信。

每个 Pod 可被看作是一个个独立的系统，而 Pod 中的容器则可被看做同一系统中的不同进程。

## Pod 内容器之间的通信

当 Pod 被调度到某个节点，Pod 中的所有容器都在这个节点上运行，这些容器共享相同的本地文件系统、IPC 和网络命名空间。

不同 Pod 之间不存在端口冲突的问题，因为每个 Pod 都有自己的 IP 地址。当某个容器使用 localhost 时，意味着使用的是容器所属 Pod 的地址空间。

## Pod 之间的通信

Pod 的 IP 是集群可见的，即集群中的任何其他 Pod 和节点都可以通过 IP 直接与 Pod 通信，这种通信不需要借助任何的网络地址转换、隧道或代理技术。Pod 内部和外部使用的是同一个 IP，这也意味着标准的命名服务和发现机制，比如 DNS 可以直接使用。

## Pod 与 Service 的通信

Pod 间可以直接通过 IP 地址通信，但前提是 Pod 得知道对方的 IP。在 Kubernetes 集群中， Pod 可能会频繁的销毁和创建，也就是说 Pod 的 IP 不是固定的。为了解决这个问题，Service 提供了访问 Pod 的抽象层。无论后端的 Pod 如何变化，Service 都作为稳定的前端对外提供服务。同时，Service 还提供了高可用和负载均衡功能，Service 负责将请求转发给正确的 Pod。

## 外部访问

无论是 Pod 的 IP 还是 Service 的 Cluster IP，它们只能在 Kubernetes 集群中可见，对集群之外的世界，这些 IP 都是私有的。

Kubernetes 提供了两种方式让外界能够与 Pod 通信：

- 1.NodePort

Service 通过 Cluster 节点的静态端口对外提供服务。外部可以通过 `<NodeIP>:<NodePort>` 访问 Service。

- 2.LoadBalancer

Service 利用 cloud provider 提供的 load balancer 对外提供服务，cloud provider 负责将 load balancer 的流量导向 Service。目前支持的 cloud provider 有 GCP、AWS、Azur 等。

## Network Policy

Network Policy 是 Kubernetes 的一种资源。Network Policy 通过 Label 选择 Pod，并指定其他 Pod 或外界如何与这些 Pod 通信。

默认情况下，所有 Pod 是非隔离的，即任何来源的网络流量都能够访问 Pod，没有任何限制。当为 Pod 定义了 Network Policy，只有 Policy 允许的流量才能访问 Pod。

## 部署 Canal

部署 Canal 与部署其他 Kubernetes 网络方案非常类似，都是在执行了 kubeadm init 初始化 Kubernetes 集群之后通过 kubectl apply 安装相应的网络方案。**也就是说，没有太好的办法直接切换使用不同的网络方案，基本上只能重新创建集群。**

- 1.初始化集群

```bash
LOCAL_IP=$(ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1)
kubeadm init --apiserver-advertise-address ${LOCAL_IP} --pod-network-cidr=10.244.0.0/16
```

- 2.部署 Canal

```bash
wget https://docs.projectcalico.org/v3.13/getting-started/kubernetes/installation/hosted/canal/canal.yaml

kubectl apply -f canal.yaml
```

- 3.查看相关组件

```bash
kubectl get --namespace=kube-system daemonset canal

kubectl get --namespace=kube-system pod -o wide | grep canal

kubectl describe -n kube-system pod canal
```

## 实践 Network Policy

- 1.部署 httpd 应用

httpd.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpd
spec:
  selector:
    matchLabels:
      run: httpd
  replicas: 3
  template:
    metadata:
      labels:
        run: httpd
    spec:
      containers:
        - name: httpd
          image: httpd:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: httpd-svc
spec:
  type: NodePort
  selector:
    run: httpd
  ports:
    - protocol: TCP
      nodePort: 30000
      port: 8080
      targetPort: 80
```

## 待完成
