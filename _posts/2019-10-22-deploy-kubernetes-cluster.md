---
layout: post
title: 搭建kubernetes集群
categories: kubernetes
tags: docker kubernetes
thread: kubernetes
---

## 环境信息

* ubuntu1
* ubuntu2(Master节点)
* ubuntu3

## 安装 Docker

所有节点都需要安装 Docker

```bash
apt-get update && apt-get install docker.io
```

## 安装 kubelet、kubeadm 和 kubectl

在所有节点上安装 kubelet、kubeadm 和 kubectl。

kubelet 运行在 Cluster 所有节点上，负责启动 Pod 和容器。

kubeadm 用于初始化 Cluster。

kubectl 是 Kubernetes 命令行工具。通过 kubectl 可以部署和管理应用，查看各种资源，创建、删除和更新各种组件。

```bash
apt-get update && apt-get install -y apt-transport-https

curl -s https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add -

tee /etc/apt/sources.list.d/kubernetes.list <<EOF
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF

apt-get update && apt-get install -y kubelet kubeadm kubectl
```

## ubuntu2 上初始化 Master

在 Master 上执行如下命令

```bash
export LOCAL_IP=$(ip a | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | cut -d "/" -f1 | head -n 1)

kubeadm init --apiserver-advertise-address ${LOCAL_IP} --pod-network-cidr=10.244.0.0/16
```

`--apiserver-advertise-address`: 指明用 Master 的哪个 interface 与 Cluster 的其他节点通信。如果 Master 有多个 interface，建议明确指定，如果不指定，kubeadm 会自动选择有默认网关的 interface。

`--pod-network-cidr` 指定 Pod 网络的范围。Kubernetes 支持多种网络方案，而且不同网络方案对 `--pod-network-cidr` 有自己的要求，这里设置为 `10.244.0.0/16` 是因为我们将使用 flannel 网络方案，必须设置成这个 CIDR。

## 配置 kubectl

* 1.为 `root` 用户配置 kubectl

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

* 2.配置命令自动补全

```bash
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

## 安装 Pod 网络

要让 Kubernetes Cluster 能够工作，必须安装 Pod 网络，否则 Pod 之间无法通信。

Kubernetes 支持多种网络方案，这里我们先使用 flannel，后面还会讨论 Canal。

* 1.执行如下命令部署 flannel

```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

* 2.在 `ubuntu1` 和 `ubuntu3` 上执行join命令

这里的 --token 来自前面 kubeadm init 输出提示，如果当时没有记录下来可以通过 `kubeadm token list` 查看。

```bash
kubeadm join 10.0.2.203:6443 --token 1ko4x6.4dpqqsfwf6labfui \
    --discovery-token-ca-cert-hash sha256:0a85b956366df0a316c0653f1ae5fe3b5f9bc007f409e3cf0fee3b2535c12544
```

* 3.根据提示，查看节点的状态

```bash
ubuntu2@root  ~ kubectl get nodes
NAME      STATUS     ROLES    AGE     VERSION
ubuntu1   NotReady   <none>   2m41s   v1.16.2
ubuntu2   NotReady   master   9m23s   v1.16.2
ubuntu3   NotReady   <none>   2m39s   v1.16.2
ubuntu2@root  ~
```

* 4.查看pod状态

```bash
ubuntu2@root  ~ kubectl get pod --all-namespaces
NAMESPACE     NAME                              READY   STATUS              RESTARTS   AGE
kube-system   coredns-5644d7b6d9-ftn85          0/1     Pending             0          9m47s
kube-system   coredns-5644d7b6d9-vpvgn          0/1     Pending             0          9m47s
kube-system   etcd-ubuntu2                      1/1     Running             0          8m57s
kube-system   kube-apiserver-ubuntu2            1/1     Running             0          8m56s
kube-system   kube-controller-manager-ubuntu2   1/1     Running             0          9m6s
kube-system   kube-flannel-ds-amd64-bq4jw       1/1     Running             0          4m2s
kube-system   kube-flannel-ds-amd64-h5btm       1/1     Running             1          3m23s
kube-system   kube-flannel-ds-amd64-ptdcw       0/1     Evicted             0          72s
kube-system   kube-proxy-5btv9                  1/1     Running             0          3m23s
kube-system   kube-proxy-l4j4t                  0/1     ContainerCreating   0          3m21s
kube-system   kube-proxy-zp2ql                  1/1     Running             0          9m47s
kube-system   kube-scheduler-ubuntu2            1/1     Running             0          8m58s
ubuntu2@root  ~
```

* 查看Pod具体情况

Pending、ContainerCreating、ImagePullBackOff 都表明 Pod 没有就绪，Running 才是就绪状态。

```bash
kubectl describe pod coredns-5644d7b6d9-ftn85 --namespace=kube-system
```

根据输出结果判断原因进行解决，一般都是网络原因，等待一会就好了。

## 总结

可以通过 `kubectl get nodes` 查看各节点状态，不出意外都是正常工作了。
