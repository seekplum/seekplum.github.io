---
layout: post
title: kubernetes 健康检查
categories: kubernetes
tags: docker kubernetes health check
thread: kubernetes
---

## 默认的监控检查

每个容器启动时都会执行一个进程，此进程由 Dockerfile 的 CMD 或 ENTRYPOINT 指定。如果进程退出时返回码非零，则认为容器发生故障，Kubernetes 就会根据 restartPolicy 重启容器。

* 模拟容器故障

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: healthcheck
  name: healthcheck
spec:
  restartPolicy: OnFailure
  containers:
  - name: healthcheck
    image: busybox
    args:
    - /bin/sh
    - -c
    - sleep 3; exit 1
```

* 创建容器

```bash
ubuntu2@root  ~ kubectl apply -f healthcheck.yml
pod/healthcheck created
ubuntu2@root  ~ kubectl get pod healthcheck
NAME          READY   STATUS             RESTARTS   AGE
healthcheck   0/1     CrashLoopBackOff   3          3m42s
```

通过 `RESTARTS` 可以发现容器进行了重启

## Liveness

Liveness 探测让用户可以自定义判断容器是否健康的条件。如果探测失败，Kubernetes 就会重启容器。

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: liveness
  name: liveness
spec:
  restartPolicy: OnFailure
  containers:
  - name: liveness
    image: busybox
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 10
      periodSeconds: 5

```

探测的方法是：通过 cat 命令检查 /tmp/healthy 文件是否存在。如果命令执行成功，返回值为零，Kubernetes 则认为本次 Liveness 探测成功；如果命令返回值非零，本次 Liveness 探测失败。

initialDelaySeconds: 10 指定容器启动 10 之后开始执行 Liveness 探测，我们一般会根据应用启动的准备时间来设置。比如某个应用正常启动要花 30 秒，那么 initialDelaySeconds 的值就应该大于 30。

periodSeconds: 5 指定每 5 秒执行一次 Liveness 探测。Kubernetes 如果连续执行 3 次 Liveness 探测均失败，则会杀掉并重启容器。

* 创建pod

```bash
ubuntu2@root  ~ vi liveness.yml
ubuntu2@root  ~ kubectl apply -f liveness.yml
pod/liveness created
ubuntu2@root  ~ kubectl get pod liveness
NAME       READY   STATUS    RESTARTS   AGE
liveness   1/1     Running   0          22s
ubuntu2@root  ~ kubectl describe pod liveness | grep "Events:" -A 20
Events:
  Type     Reason     Age                   From               Message
  ----     ------     ----                  ----               -------
  Normal   Scheduled  <unknown>             default-scheduler  Successfully assigned default/liveness to ubuntu3
  Normal   Pulled     101s (x3 over 4m46s)  kubelet, ubuntu3   Successfully pulled image "busybox"
  Normal   Created    101s (x3 over 4m46s)  kubelet, ubuntu3   Created container liveness
  Normal   Started    101s (x3 over 4m46s)  kubelet, ubuntu3   Started container liveness
  Warning  Unhealthy  61s (x9 over 4m16s)   kubelet, ubuntu3   Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
  Normal   Killing    61s (x3 over 4m6s)    kubelet, ubuntu3   Container liveness failed liveness probe, will be restarted
  Normal   Pulling    30s (x4 over 5m6s)    kubelet, ubuntu3   Pulling image "busybox"
ubuntu2@root  ~ kubectl delete -f liveness.yml
pod "liveness" deleted
```

## Readiness

用户通过 Liveness 探测可以告诉 Kubernetes 什么时候通过重启容器实现自愈；Readiness 探测则是告诉 Kubernetes 什么时候可以将容器加入到 Service 负载均衡池中，对外提供服务。

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    test: readiness
  name: readiness
spec:
  restartPolicy: OnFailure
  containers:
  - name: readiness
    image: busybox
    args:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -rf /tmp/healthy; sleep 600
    readinessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 10
      periodSeconds: 5

```

* 创建pod

```bash
ubuntu2@root  ~ vi readiness.yml
ubuntu2@root  ~ kubectl apply -f readiness.yml
pod/readiness created
ubuntu2@root  ~ kubectl get pod readiness
NAME        READY   STATUS              RESTARTS   AGE
readiness   0/1     ContainerCreating   0          10s
ubuntu2@root  ~ kubectl get pod readiness
NAME        READY   STATUS    RESTARTS   AGE
readiness   0/1     Running   0          38s
ubuntu2@root  ~ kubectl describe pod readiness | grep "Events:" -A 20
Events:
  Type    Reason     Age        From               Message
  ----    ------     ----       ----               -------
  Normal  Scheduled  <unknown>  default-scheduler  Successfully assigned default/readiness to ubuntu3
  Normal  Pulling    54s        kubelet, ubuntu3   Pulling image "busybox"
  Normal  Pulled     23s        kubelet, ubuntu3   Successfully pulled image "busybox"
  Normal  Created    23s        kubelet, ubuntu3   Created container readiness
  Normal  Started    23s        kubelet, ubuntu3   Started container readiness
ubuntu2@root  ~ kubectl delete -f readiness.yml
pod "readiness" deleted
```

## 对比

Liveness 探测和 Readiness 探测是两种 Health Check 机制，如果不特意配置，Kubernetes 将对两种探测采取相同的默认行为，即通过判断容器启动进程的返回值是否为零来判断探测是否成功。

两种探测的配置方法完全一样，支持的配置参数也一样。不同之处在于探测失败后的行为：Liveness 探测是重启容器；Readiness 探测则是将容器设置为不可用，不接收 Service 转发的请求。

Liveness 探测和 Readiness 探测是独立执行的，二者之间没有依赖，所以可以单独使用，也可以同时使用。用 Liveness 探测判断容器是否需要重启以实现自愈；用 Readiness 探测判断容器是否已经准备好对外提供服务。

## 在Scale Up中使用 Health Check

对于多副本应用，当执行 Scale Up 操作时，新副本会作为 backend 被添加到 Service 的负载均衡中，与已有副本一起处理客户的请求。考虑到应用启动通常都需要一个准备阶段，比如加载缓存数据，连接数据库等，从容器启动到正真能够提供服务是需要一段时间的。我们可以通过 Readiness 探测判断容器是否就绪，避免将请求发送到还没有 ready 的 backend。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  selector:
    matchLabels:
      run: web
  replicas: 3
  template:
    metadata:
      labels:
        run: web
    spec:
      containers:
      - name: web
        image: myhttpd
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            scheme: HTTP
            path: /healthy
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector:
    run: web
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 80

```

`httpGet`: Kubernetes 对于该方法探测成功的判断条件是 http 请求的返回代码在 `200` - `400` 之间。

## 在 Rolling Update 中使用 Health Check

* 编写配置文件 `app.v1.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  selector:
    matchLabels:
      run: app
  replicas: 10
  template:
    metadata:
      labels:
        run: app
    spec:
      containers:
      - name: app
        image: busybox
        args:
        - /bin/sh
        - -c
        - sleep 10; touch /tmp/healthy; sleep 30000
        readinessProbe:
          exec:
            command:
            - cat
            - /tmp/healthy
          initialDelaySeconds: 10
          periodSeconds: 5

```

* 部署应用

```bash
ubuntu2@root  ~ kubectl apply -f app.v1.yml --record
deployment.apps/app created
ubuntu2@root  ~ kubectl get deployment app
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
app    4/10    10           4           2m28s
ubuntu2@root  ~
ubuntu2@root  ~ kubectl get pod
NAME                   READY   STATUS              RESTARTS   AGE
app-6d76c4459d-6c2wx   1/1     Running             0          2m40s
app-6d76c4459d-bstgp   0/1     Running             0          2m40s
app-6d76c4459d-j4wgq   0/1     ContainerCreating   0          2m40s
app-6d76c4459d-k4ljv   1/1     Running             0          2m40s
app-6d76c4459d-n62pv   0/1     ContainerCreating   0          2m40s
app-6d76c4459d-ntz6q   0/1     ContainerCreating   0          2m40s
app-6d76c4459d-tz6g8   1/1     Running             0          2m40s
app-6d76c4459d-vx2cw   1/1     Running             0          2m40s
app-6d76c4459d-w8dsz   0/1     ContainerCreating   0          2m40s
app-6d76c4459d-xxsj5   1/1     Running
```

* 滚动更新应用，编写配置文件 `app.v2.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  selector:
    matchLabels:
      run: app
  replicas: 10
  template:
    metadata:
      labels:
        run: app
    spec:
      containers:
      - name: app
        image: busybox
        args:
        - /bin/sh
        - -c
        - sleep 30000
        readinessProbe:
          exec:
            command:
            - cat
            - /tmp/healthy
          initialDelaySeconds: 10
          periodSeconds: 5

```

* 更新应用

```bash
ubuntu2@root  ~ vi app.v2.yml
ubuntu2@root  ~ kubectl apply -f app.v2.yml --record
deployment.apps/app configured
ubuntu2@root  ~ kubectl get deployment app
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
app    8/10    5            8           5m40s
ubuntu2@root  ~ kubectl get pod
NAME                   READY   STATUS              RESTARTS   AGE
app-6d76c4459d-6c2wx   1/1     Running             0          5m43s
app-6d76c4459d-bstgp   1/1     Running             0          5m43s
app-6d76c4459d-j4wgq   1/1     Running             0          5m43s
app-6d76c4459d-k4ljv   1/1     Running             0          5m43s
app-6d76c4459d-n62pv   1/1     Terminating         0          5m43s
app-6d76c4459d-ntz6q   1/1     Running             0          5m43s
app-6d76c4459d-tz6g8   1/1     Running             0          5m43s
app-6d76c4459d-vx2cw   1/1     Running             0          5m43s
app-6d76c4459d-w8dsz   1/1     Terminating         0          5m43s
app-6d76c4459d-xxsj5   1/1     Running             0          5m43s
app-77cdb45995-2lblp   0/1     ContainerCreating   0          25s
app-77cdb45995-6dflz   0/1     Running             0          25s
app-77cdb45995-gclmm   0/1     ContainerCreating   0          25s
app-77cdb45995-ktlcp   0/1     ContainerCreating   0          25s
app-77cdb45995-xc85h   0/1     ContainerCreating   0          25s
```

`READY`: `8/10` 表示期望的状态是 10 个 READY 的副本,已经有 8 个READY了。

`UP-TO-DATE`: `5` 表示当前已经完成更新的副本数：即 5 个新副本。

`AVAILABLE`: `8` 表示当前处于 READY 状态的副本数

* 为什么新创建的副本数是 4 个，同时只销毁了 2 个旧副本？

> 原因是: 滚动更新通过参数 `maxSurge` 和 `maxUnavailable` 来控制副本替换的数量

* maxSurge

此参数控制滚动更新过程中副本总数的超过 DESIRED 的上限。maxSurge 可以是具体的整数（比如 3），也可以是百分百，向上取整。**maxSurge 默认值为 25%**。

* maxUnavailable

此参数控制滚动更新过程中，不可用的副本相占 DESIRED 的最大比例。 maxUnavailable 可以是具体的整数（比如 3），也可以是百分百，向下取整。**maxUnavailable 默认值为 25%。**

* 回滚

```bash
ubuntu2@root  ~ kubectl get deployment app
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
app    8/10    5            8           23h
ubuntu2@root  ~ kubectl rollout history deployment app
deployment.apps/app
REVISION  CHANGE-CAUSE
1         kubectl apply --filename=app.v1.yml --record=true
2         kubectl apply --filename=app.v2.yml --record=true

ubuntu2@root  ~ kubectl rollout undo deployment app --to-revision=1
deployment.apps/app rolled back
ubuntu2@root  ~ kubectl get deployment app
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
app    10/10   10           10          23h
```

* 配置 `app.v3.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  strategy:
    rollingUpdate:
      maxSurge: 35%
      maxUnavailable: 35%
  selector:
    matchLabels:
      run: app
  replicas: 10
  template:
    metadata:
      labels:
        run: app
    spec:
      containers:
      - name: app
        image: busybox
        args:
        - /bin/sh
        - -c
        - sleep 30000
        readinessProbe:
          exec:
            command:
            - cat
            - /tmp/healthy
          initialDelaySeconds: 10
          periodSeconds: 5

```

* 更新应用

```bash
ubuntu2@root  ~ vi app.v3.yml
ubuntu2@root  ~ kubectl apply -f app.v3.yml --record
deployment.apps/app configured
ubuntu2@root  ~ kubectl get deployment app
NAME   READY   UP-TO-DATE   AVAILABLE   AGE
app    7/10    7            7           23h
```

## 参考

* [在 Rolling Update 中使用 Health Check - 每天5分钟玩转 Docker 容器技术（146）](https://www.cnblogs.com/CloudMan6/p/8642831.html)
