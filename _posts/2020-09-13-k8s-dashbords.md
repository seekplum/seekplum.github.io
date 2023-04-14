---
layout: post
title: k8s dashboard
tags: kubernetes dashboard
thread: kubernetes
---

## Dashboard

为了提供更丰富的用户体验，Kubernetes 还开发了一个基于 Web 的 Dashboard，用户可以用 Kubernetes Dashboard 部署容器化的应用、监控应用的状态、执行故障排查任务以及管理 Kubernetes 各种资源。

在 Kubernetes Dashboard 中可以查看集群中应用的运行状态，也能够创建和修改各种 Kubernetes 资源，比如 Deployment、Job、DaemonSet 等。用户可以 Scale Up/Down Deployment、执行 Rolling Update、重启某个 Pod 或者通过向导部署新的应用。Dashboard 能显示集群中各种资源的状态以及日志信息。Kubernetes Dashboard 提供了 kubectl 的绝大部分功能。

## 安装

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.4/aio/deploy/recommended.yaml

kubectl --namespace=kubernetes-dashboard get deployment kubernetes-dashboard

kubectl --namespace=kubernetes-dashboard get service kubernetes-dashboard
```

因为 Service 是 ClusterIP 类型，为了方便使用，我们可通过 `kubectl --namespace=kubernetes-dashboard edit service kubernetes-dashboard` 修改成 NodePort 类型。
