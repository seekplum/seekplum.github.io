---
layout: post
title: kubernetes Job实践
categories: kubernetes
tags: docker kubernetes job jobs
thread: kubernetes
---

## DaemonSet

kube-flannel.yml

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: kube-flannel-ds-arm64
  namespace: kube-system
  labels:
    tier: node
    app: flannel
spec:
  template:
    metadata:
      labels:
        tier: node
        app: flannel
    spec:
      hstNetwork: true
      nodeSeletor:
        beta.kubenetes.io/arch: amd64
      containers:
      - name: kube-flannel
        image: quay.io/coreos/flannel:v0.8.0-amd64
        command: ["/opt/bin/flanneld", "--ip-masq", "--kube-subnet-mgr"]
      - name: install-cni
        image: quay.io/coreos/flannel:v0.8.0-amd64
        command: ["/bin/sh", "-c", "set -e -x; cp -f /etc/kube-flannel/cni-conf.json /etc/cni/net.d/10-flannel.conflist"]

```

* 查询 `kube-proxy` 的YAML文件

```bash
kubectl edit daemonset kube-proxy --namespace=kube-system
```

## 部署node_exporter

* docker部署

```bash
docker run -d \
    -v "/proc:/host/proc" \
    -v "/sys:/host/sys" \
    -v "/:/rootfs" \
    --net=host \
    --name node_exporter \
    prom/node-exporter \
    --path.procfs /host/proc \
    --path.sysfs /host/sys \
    --collector.filesystem.ignored-mount-points "^/(sys|proc|dev|host|etc)($|/)"
```

* 转换为 `node_exporter.yml`

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter-daemonset
spec:
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      hostNetwork: true
      containers:
      - name: node-exporter
        image: prom/node-exporter
        imagePullPolicy: IfNotPresent
        command:
        - /bin/node_exporter
        - --path.procfs
        - /host/proc
        - --path.sysfs
        - /host/sys
        - --collector.filesystem.ignored-mount-points
        - ^/(sys|proc|dev|host|etc)($|/)
        volumeMounts:
        - name: proc
          mountPath: /host/proc
        - name: sys
          mountPath: /host/sys
        - name: root
          mountPath: /rootfs
      volumes:
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
      - name: root
        hostPath:
          path: /

```

* 部署node_expoter

```bash
ubuntu2@root  ~ kubectl apply -f node_exporter.yml
daemonset.apps/node-exporter-daemonset unchanged
ubuntu2@root  ~ kubectl get pod -o wide
NAME                            READY   STATUS    RESTARTS   AGE     IP            NODE      NOMINATED NODE   READINESS GATES
node-exporter-daemonset-2kksq   1/1     Running   0          2m37s   192.168.1.5   ubuntu1   <none>           <none>
node-exporter-daemonset-497ds   1/1     Running   0          2m36s   192.168.1.7   ubuntu3   <none>           <none>
node-exporter-daemonset-qlk8q   1/1     Running   4          2m37s   192.168.1.6   ubuntu2   <none>           <none>
ubuntu2@root  ~
```

## 运行一次性任务

容器按照持续运行的时间可分为两类：服务类容器和工作类容器。

* 服务类容器: 通常持续提供服务，需要一直运行，比如 http server，daemon 等。
* 工作类容器: 则是一次性任务，比如批处理程序，完成后容器就退出。

Kubernetes 的 `Deployment`、`ReplicaSet` 和 `DaemonSet` 都用于`管理服务类容器`；对于`工作类容器`，我们用 `Job`。

* myjob.yml

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: myjob
spec:
  template:
    metadata:
      name: myjob
    spec:
      containers:
      - name: hello
        image: busybox
        command: ["echo", "hello k8s job!"]
      restartPolicy: Never

```

* 运行pod

```bash
ubuntu2@root  ~ kubectl apply -f myjob.yml
job.batch/myjob created
ubuntu2@root  ~ kubectl get job
NAME    COMPLETIONS   DURATION   AGE
myjob   1/1           27s        106s
ubuntu2@root  ~ kubectl get pod
NAME          READY   STATUS      RESTARTS   AGE
myjob-82xkp   0/1     Completed   0          110s
ubuntu2@root  ~ kubectl logs -f myjob-82xkp
hello k8s job!
ubuntu2@root  ~ kubectl delete -f myjob.yml
job.batch "myjob" deleted
```

## job失败

* myerrorjob.yml

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: myerrorjob
spec:
  template:
    metadata:
      name: myjob
    spec:
      containers:
      - name: hello
        image: busybox
        command: ["invald_commond", "hello k8s job!"]
      restartPolicy: Never

```

* 运行job

```bash
ubuntu2@root  ~ kubectl apply -f myerrorjob.yml
job.batch/myerrorjob created
ubuntu2@root  ~ kubectl get job
NAME         COMPLETIONS   DURATION   AGE
myerrorjob   0/1           14s        14s
ubuntu2@root  ~ kubectl get pod
NAME               READY   STATUS               RESTARTS   AGE
myerrorjob-54lwt   0/1     ContainerCannotRun   0          104s
myerrorjob-6hgk5   0/1     ContainerCannotRun   0          83s
myerrorjob-b9qfb   0/1     ContainerCannotRun   0          43s
myerrorjob-rvgrm   0/1     ContainerCreating    0          3s
```

可以看到有多个 Pod，状态均不正常。 查看某个 Pod 的启动日志

```bash
kubectl describe pod myerrorjob-b9qfb

Events:
  Type     Reason     Age        From               Message
  ----     ------     ----       ----               -------
  Normal   Scheduled  <unknown>  default-scheduler  Successfully assigned default/myerrorjob-b9qfb to ubuntu3
  Normal   Pulling    84s        kubelet, ubuntu3   Pulling image "busybox"
  Normal   Pulled     64s        kubelet, ubuntu3   Successfully pulled image "busybox"
  Normal   Created    64s        kubelet, ubuntu3   Created container hello
  Warning  Failed     63s        kubelet, ubuntu3   Error: failed to start container "hello": Error response from daemon: OCI runtime create failed: container_linux.go:345: starting container process caused "exec: \"invald_commond\": executable file not found in $PATH": unknown
```

日志显示没有可执行程序，符合我们的预期。

* 为什么 kubectl get pod 会看到这么多个失败的 Pod？

当第一个 Pod 启动时，容器失败退出，根据 `restartPolicy: Never`，此失败容器不会被重启，但 `Job DESIRED` 的 Pod 是 `1`，目前 `SUCCESSFUL`为 `0`，不满足，所以 `Job controller` 会启动新的 Pod，直到 SUCCESSFUL为 `1`。对于我们这个例子，SUCCESSFUL 永远也到不了 1，所以 Job controller 会一直创建新的 Pod。为了终止这个行为，**只能删除 Job**。

* 把 `restartPolicy` 设置为 `OnFailure`

```bash
apiVersion: batch/v1
kind: Job
metadata:
  name: myerrorjob
spec:
  template:
    metadata:
      name: myjob
    spec:
      containers:
      - name: hello
        image: busybox
        command: ["invald_commond", "hello k8s job!"]
      restartPolicy: OnFailure

```

* 运行job

```bash
ubuntu2@root  ~ kubectl apply -f myerrorjob.yml
job.batch/myerrorjob created
kubectl get pod
NAME               READY   STATUS              RESTARTS   AGE
myerrorjob-74csb   0/1     ContainerCreating   0          8s
ubuntu2@root  ~ kubectl get pod
NAME               READY   STATUS              RESTARTS   AGE
myerrorjob-74csb   0/1     RunContainerError   3          2m32s
ubuntu2@root  ~ kubectl delete -f myerrorjob.yml
job.batch "myerrorjob" deleted
```

只有一个 Pod，不过 `RESTARTS` 为 3，而且不断增加，说明 `OnFailure` 生效，容器失败后会自动重启。

## 并行执行job

可以通过 `parallelism` 设置多个Pod同时运行

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: myjob
spec:
  completions: 6
  parallelism: 2
  template:
    metadata:
      name: myjob
    spec:
      containers:
      - name: hello
        image: busybox
        command: ["echo", "`date +'%Y-%m-%d %H:%M:%S'` hello k8s job!"]
      restartPolicy: OnFailure

```

每次运行两个 Pod，直到总共有 6 个 Pod 成功完成

* 运行job

```bash
ubuntu2@root  ~ kubectl apply -f myjob.yml
job.batch/myjob created
ubuntu2@root  ~ kubectl get job
NAME    COMPLETIONS   DURATION   AGE
myjob   0/6           8s         8s
ubuntu2@root  ~ kubectl get pod
NAME          READY   STATUS              RESTARTS   AGE
myjob-9n5td   0/1     ContainerCreating   0          16s
myjob-xr2ks   0/1     ContainerCreating   0          16s
ubuntu2@root  ~ kubectl delete -f myjob.yml
job.batch "myjob" deleted
```

## 定时执行job

```yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: hello
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: hello
            image: busybox
            command: ["echo", "`date +'%Y-%m-%d %H:%M:%S'` hello k8s job!"]
          restartPolicy: OnFailure

```

* 运行job

```bash
ubuntu2@root  ~ vi mycronjob.yml
ubuntu2@root  ~ kubectl apply -f mycronjob.yml
cronjob.batch/hello created
ubuntu2@root  ~ kubectl get cronjob
NAME    SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
hello   */1 * * * *   False     1        19s             4m58s
ubuntu2@root  ~ kubectl get jobs
NAME               COMPLETIONS   DURATION   AGE
hello-1572668940   1/1           23s        2m45s
hello-1572669000   1/1           23s        105s
hello-1572669060   1/1           22s        45s
```
