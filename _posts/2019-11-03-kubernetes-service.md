---
layout: post
title: kubernetes service
categories: kubernetes
tags: docker kubernetes service
thread: kubernetes
---

## 场景

我们不应该期望 Kubernetes Pod 是健壮的，而是要假设 Pod 中的容器很可能因为各种原因发生故障而死掉。Deployment 等 controller 会通过动态创建和销毁 Pod 来保证应用整体的健壮性。换句话说，Pod 是脆弱的，但应用是健壮的。

## 创建Service

Kubernetes Service 从逻辑上代表了一组 Pod，具体是哪些 Pod 则是由 label 来挑选。**Service 有自己 IP，而且这个 IP 是不变的。**客户端只需要访问 Service 的 IP，**Kubernetes 则负责建立和维护 Service 与 Pod 的映射关系**。无论后端 Pod 如何变化，对客户端不会有任何影响，因为 Service 没有变。

* 编写 httpd.yml

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
        image: httpd
        ports:
        - containerPort: 80

```

* 运行pod

```bash
ubuntu2@root  ~ kubectl apply -f httpd.yml
deployment.apps/httpd created
ubuntu2@root  ~ kubectl get pod -o wide
NAME                     READY   STATUS    RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES
httpd-785b97775d-rtjwt   1/1     Running   0          2m53s   10.244.0.15   ubuntu2   <none>           <none>
httpd-785b97775d-sxnh4   1/1     Running   0          2m53s   10.244.2.7    ubuntu1   <none>           <none>
httpd-785b97775d-v5rbq   1/1     Running   0          2m53s   10.244.1.41   ubuntu3   <none>           <none>
ubuntu2@root  ~ curl 10.244.0.15
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~ curl 10.244.2.7
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~ curl 10.244.1.41
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~
```

* 编写 httpd-svc.yml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: httpd-svc
spec:
  selector:
    run: httpd
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 80

```

* 创建service

```bash
ubuntu2@root  ~ kubectl apply -f httpd-svc.yml
service/httpd-svc created
ubuntu2@root  ~ kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
httpd-svc     ClusterIP   10.107.143.191   <none>        8080/TCP   2m55s
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP    6d23h
ubuntu2@root  ~ kubectl get service
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
httpd-svc     ClusterIP   10.107.143.191   <none>        8080/TCP   3m
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP    6d23h
ubuntu2@root  ~ curl 10.107.143.191:8080
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~ kubectl describe service httpd-svc
Name:              httpd-svc
Namespace:         default
Labels:            <none>
Annotations:       kubectl.kubernetes.io/last-applied-configuration:
                     {"apiVersion":"v1","kind":"Service","metadata":{"annotations":{},"name":"httpd-svc","namespace":"default"},"spec":{"ports":[{"port":8080,"p...
Selector:          run=httpd
Type:              ClusterIP
IP:                10.107.143.191
Port:              <unset>  8080/TCP
TargetPort:        80/TCP
Endpoints:         10.244.0.15:80,10.244.1.41:80,10.244.2.7:80
Session Affinity:  None
Events:            <none>
ubuntu2@root  ~
```

`Endpoints` 罗列了三个 Pod 的 IP 和端口。

## Service IP

Service Cluster IP 是一个虚拟 IP，是由 Kubernetes 节点上的 iptables 规则管理的。

可以通过 `iptables-save` 命令打印出当前节点的 iptables 规则

iptables 将访问 Service 的流量转发到后端 Pod，而且使用类似轮询的负载均衡策略。

Cluster 的每一个节点都配置了相同的 iptables 规则，这样就确保了整个 Cluster 都能够通过 Service 的 Cluster IP 访问 Service。

## DNS

* 默认的dns组件

```bash
ubuntu2@root  ~ kubectl get deployment --namespace=kube-system
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
coredns   2/2     2            2           7d1h
```

coredns 是一个 DNS 服务器。每当有新的 Service 被创建，coredns 会添加该 Service 的 DNS 记录。Cluster 中的 Pod 可以通过 `<SERVICE_NAME>`.`<NAMESPACE_NAME>` 访问 Service。

```bash
ubuntu2@root  ~ kubectl run busybox --rm -it --image=busybox /bin/sh
kubectl run --generator=deployment/apps.v1 is DEPRECATED and will be removed in a future version. Use kubectl run --generator=run-pod/v1 or kubectl create instead.
If you don't see a command prompt, try pressing enter.
/ # curl httpd-svc.default:8080
/bin/sh: curl: not found
/ # wget -O index_`date +'%F_%T'`.html httpd-svc.default:8080
Connecting to httpd-svc.default:8080 (10.107.143.191:8080)
saving to 'index_2019-11-03_05:59:44.html'
index_2019-11-03_05: 100% |*****************************************************|    45  0:00:00 ETA
'index_2019-11-03_05:59:44.html' saved
/ # wget -O index_`date +'%F_%T'`.html httpd-svc:8080
Connecting to httpd-svc:8080 (10.107.143.191:8080)
saving to 'index_2019-11-03_05:59:46.html'
index_2019-11-03_05: 100% |*****************************************************|    45  0:00:00 ETA
'index_2019-11-03_05:59:46.html' saved
/ # nslookup httpd-svc
Server:		10.96.0.10
Address:	10.96.0.10:53

** server can't find httpd-svc.default.svc.cluster.local: NXDOMAIN

*** Can't find httpd-svc.svc.cluster.local: No answer
*** Can't find httpd-svc.cluster.local: No answer
*** Can't find httpd-svc.default.svc.cluster.local: No answer
*** Can't find httpd-svc.svc.cluster.local: No answer
*** Can't find httpd-svc.cluster.local: No answer
/ # exit
Session ended, resume using 'kubectl attach busybox-5cf647b64-5cd5r -c busybox -i -t' command when the pod is running
deployment.apps "busybox" deleted
ubuntu2@root  ~
```

DNS 服务器是 `kube-dns.kube-system.svc.cluster.local`，这实际上就是 kube-dns 组件，它本身是部署在 kube-system namespace 中的一个 Service。

`httpd-svc.default.svc.cluster.local` 是 `httpd-svc` 的完整域名。

## 创建 http2-svc

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpd2
  namespace: kube-public
spec:
  selector:
    matchLabels:
      run: httpd2
  replicas: 3
  template:
    metadata:
      labels:
        run: httpd2
    spec:
      containers:
      - name: httpd2
        image: httpd
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: httpd2-svc
  namespace: kube-public
spec:
  selector:
    run: httpd2
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 80

```

* 创建资源

```bash
kubectl apply -f httpd.yml
```

* 查询 `kube-public` 的 Service

```bash
kubectl get service --namespace=kube-public
```

* 访问测试

```bash
ubuntu2@root  ~ kubectl run busybox --rm -it --image=busybox /bin/sh
kubectl run --generator=deployment/apps.v1 is DEPRECATED and will be removed in a future version. Use kubectl run --generator=run-pod/v1 or kubectl create instead.
If you don't see a command prompt, try pressing enter.
/ # wget httpd2-svc:8080
wget: bad address 'httpd2-svc:8080'
/ # wget httpd2-svc.kube-public:8080
Connecting to httpd2-svc.kube-public:8080 (10.111.25.163:8080)
saving to 'index.html'
index.html           100% |*****************************************************|    45  0:00:00 ETA
'index.html' saved
/ # exit
Session ended, resume using 'kubectl attach busybox-5cf647b64-4n24k -c busybox -i -t' command when the pod is running
deployment.apps "busybox" deleted
ubuntu2@root  ~
```

## 外部访问Service

* ClusterIP

Service 通过 Cluster 内部的 IP 对外提供服务，只有 Cluster 内的节点和 Pod 可访问，这是默认的 Service 类型

* NodePort

Service 通过 Cluster 节点的静态端口对外提供服务。Cluster 外部可以通过 `<NodeIP>`:`<NodePort>` 访问 Service。

* LoadBalancer

Service 利用 cloud provider 特有的 load balancer 对外提供服务，cloud provider 负责将 load balancer 的流量导向 Service。目前支持的 cloud provider 有 GCP、AWS、Azur 等。

## NodePort

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpd3
spec:
  selector:
    matchLabels:
      run: httpd3
  replicas: 3
  template:
    metadata:
      labels:
        run: httpd3
    spec:
      containers:
      - name: httpd3
        image: httpd
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: httpd3-svc
spec:
  type: NodePort
  selector:
    run: httpd3
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 80

```

* 创建service

```bash
ubuntu2@root  ~ kubectl apply -f httpd3.yml
deployment.apps/httpd3 created
service/httpd3-svc created
ubuntu2@root  ~ kubectl get service httpd3-svc
NAME         TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
httpd3-svc   NodePort   10.100.247.147   <none>        8080:32348/TCP   13s
ubuntu2@root  ~ netstat -an | grep 32348
tcp6       0      0 :::32348                :::*                    LISTEN
ubuntu2@root  ~ curl 192.168.1.6:32348
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~ ufw status
Status: inactive
ubuntu2@root  ~ curl 192.168.1.5:32348
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~ curl 192.168.1.7:32348
<html><body><h1>It works!</h1></body></html>
ubuntu2@root  ~
```

`EXTERNAL-IP` 为 nodes，表示可通过 Cluster 每个节点自身的 IP 访问 Service。

`PORT(S)` 为 `8080:31147`。8080 是 ClusterIP 31147 则是节点上监听的端口。Kubernetes 会从 `30000-32767` 中分配一个可用的端口，每个节点都会监听此端口并将请求转发给 Service。

* Kubernetes 是如何将 `<NodeIP>`:`<NodePort>` 映射到 Pod 的呢？

与 ClusterIP 一样，也是借助了 iptables。

## 参考

* [Service IP 原理 - 每天5分钟玩转 Docker 容器技术（137）](https://www.cnblogs.com/CloudMan6/p/8503685.html)
