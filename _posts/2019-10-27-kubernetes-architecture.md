---
layout: post
title: kubernetes架构
categories: kubernetes
tags: docker kubernetes
thread: kubernetes
---

## Master 节点

Master 是 Kubernetes Cluster 的大脑，运行着如下 Daemon 服务：`kube-apiserver`、`kube-scheduler`、`kube-controller-manager`、`etcd` 和 `Pod 网络`（例如 flannel）

### API Server（kube-apiserver）

API Server 提供 HTTP/HTTPS RESTful API，即 Kubernetes API。API Server 是 Kubernetes Cluster 的前端接口，各种客户端工具（CLI 或 UI）以及 Kubernetes 其他组件可以通过它管理 Cluster 的各种资源。

### Scheduler（kube-scheduler）

Scheduler 负责决定将 Pod 放在哪个 Node 上运行。Scheduler 在调度时会充分考虑 Cluster 的拓扑结构，当前各个节点的负载，以及应用对高可用、性能、数据亲和性的需求。

### Controller Manager（kube-controller-manager）

Controller Manager 负责管理 Cluster 各种资源，保证资源处于预期的状态。Controller Manager 由多种 controller 组成，包括 replication controller、endpoints controller、namespace controller、serviceaccounts controller 等。

不同的 controller 管理不同的资源。例如 replication controller 管理 Deployment、StatefulSet、DaemonSet 的生命周期，namespace controller 管理 Namespace 资源。

### etcd

etcd 负责保存 Kubernetes Cluster 的配置信息和各种资源的状态信息。当数据发生变化时，etcd 会快速地通知 Kubernetes 相关组件。

### Pod 网络

Pod 要能够相互通信，Kubernetes Cluster 必须部署 Pod 网络，flannel 是其中一个可选方案。

## Node节点

Node 是 Pod 运行的地方，Kubernetes 支持 Docker、rkt 等容器 Runtime。 Node上运行的 Kubernetes 组件有 kubelet、kube-proxy 和 Pod 网络（例如 flannel）。

### kubelet

kubelet 是 Node 的 agent，当 Scheduler 确定在某个 Node 上运行 Pod 后，会将 Pod 的具体配置信息（image、volume 等）发送给该节点的 kubelet，kubelet 根据这些信息创建和运行容器，并向 Master 报告运行状态。

**kubelet 是唯一没有以容器形式运行的 Kubernetes 组件，它在 Ubuntu 中通过 Systemd 运行。**

### kube-proxy

service 在逻辑上代表了后端的多个 Pod，外界通过 service 访问 Pod。service 接收到的请求是如何转发到 Pod 的呢？这就是 kube-proxy 要完成的工作。

每个 Node 都会运行 kube-proxy 服务，它负责将访问 service 的 TCP/UPD 数据流转发到后端的容器。如果有多个副本，kube-proxy 会实现负载均衡。

### Pod 网络

Pod 要能够相互通信，Kubernetes Cluster 必须部署 Pod 网络，flannel 是其中一个可选方案。