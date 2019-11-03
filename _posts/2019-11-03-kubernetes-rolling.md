---
layout: post
title: kubernetes 滚动更新
categories: kubernetes
tags: docker kubernetes rolling
thread: kubernetes
---

## 编写 httpd1.yml

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
        image: httpd:2.2.31
        ports:
        - containerPort: 80

```

每次替换的 Pod 数量是可以定制的。Kubernetes 提供了两个参数 `maxSurge` 和 `maxUnavailable` 来精细控制 Pod 的替换数量

## 编写 httpd2.yml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpd
spec:
  revisionHistoryLimit: 10
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
        image: httpd:2.4.16
        ports:
        - containerPort: 80

```

kubectl apply 每次更新应用时 Kubernetes 都会记录下当前的配置，保存为一个 revision（版次），这样就可以回滚到某个特定 revision。

默认配置下，Kubernetes 只会保留最近的几个 revision，可以在 Deployment 配置文件中通过 `revisionHistoryLimit` 属性增加 revision 数量

## 编写 httpd3.yml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpd
spec:
  revisionHistoryLimit: 10
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
        image: httpd:2.4.17
        ports:
        - containerPort: 80

```

## 部署并更新应用

```bash
ubuntu2@root  ~ kubectl apply -f httpd1.yml --record
deployment.apps/httpd created
ubuntu2@root  ~ kubectl get deployment httpd -o wide
NAME    READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES         SELECTOR
httpd   3/3     3            3           17s   httpd        httpd:2.2.31   run=httpd
ubuntu2@root  ~ kubectl apply -f httpd2.yml --record
deployment.apps/httpd configured
ubuntu2@root  ~ kubectl get deployment httpd -o wide
NAME    READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES         SELECTOR
httpd   3/3     1            3           32s   httpd        httpd:2.4.16   run=httpd
ubuntu2@root  ~ kubectl apply -f httpd3.yml --record
deployment.apps/httpd configured
ubuntu2@root  ~ kubectl get deployment httpd -o wide
NAME    READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES         SELECTOR
httpd   3/3     1            3           46s   httpd        httpd:2.4.17   run=httpd
ubuntu2@root  ~
```

`--record` 的作用是将当前命令记录到 revision 记录中，这样我们就可以知道每个 revison 对应的是哪个配置文件。通过 `kubectl rollout history deployment <name>` 查看 revison 历史记录。

```bash
ubuntu2@root  ~ kubectl rollout history deployment httpd
deployment.apps/httpd
REVISION  CHANGE-CAUSE
1         kubectl apply --filename=httpd1.yml --record=true
2         kubectl apply --filename=httpd2.yml --record=true
3         kubectl apply --filename=httpd3.yml --record=true

```

* 回到指定版本

```bash
ubuntu2@root  ~ kubectl rollout undo deployment httpd --to-revision=1
deployment.apps/httpd rolled back
ubuntu2@root  ~ kubectl rollout history deployment httpd
deployment.apps/httpd
REVISION  CHANGE-CAUSE
2         kubectl apply --filename=httpd2.yml --record=true
3         kubectl apply --filename=httpd3.yml --record=true
4         kubectl apply --filename=httpd1.yml --record=true

ubuntu2@root  ~
```
