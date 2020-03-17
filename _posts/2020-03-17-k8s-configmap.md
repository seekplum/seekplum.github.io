---
layout: post
title:  k8s 普通配置
tags: kubernetes configmap
thread: kubernetes
---

## ConfigMap

Secret 可以为 Pod 提供密码、Token、私钥等敏感数据；对于一些非敏感数据，比如应用的配置信息，则可以用 ConfigMap。

ConfigMap 的创建和使用方式与 Secret 非常类似，主要的不同是数据以明文的形式存放。

## 创建ConfigMap

* 1.通过 `--from-literal`

```bash
kubectl create configmap myconfigmap --from-literal=config1=abc --from-literal=config2=def
```

* 2.通过 `--from-file`

```bash
echo -n abc > ./config1
echo -n def > ./config2

kubectl create configmap myconfigmap2 --from-file=./config1 --from-file=./config2
```

* 3.通过 `--from-env-file`

```bash
cat > configmap_env.txt <<EOF
config1=abc
config2=def
EOF

kubectl create configmap myconfigmap3 --from-env-file=configmap_env.txt
```

* 4.通过Yaml配置文件

configmap.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myconfigmap4
data:
  config1: abc
  config2: def

```

```bash
kubectl apply -f configmap.yaml
```

* 查看configmap

```bash
kubectl get configmap
```

## 使用

* Volume方式

mypod1.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod1
spec:
  containers:
  - name: mypod1
    image: busybox
    args:
      - /bin/sh
      - -c
      - sleep 10; touch /tmp/healthy; sleep 30000
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: foo
    configMap:
      name: myconfigmap

```

* 环境变量方式

mypod2.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod2
spec:
  containers:
  - name: mypod2
    image: busybox
    args:
      - /bin/sh
      - -c
      - sleep 10; touch /tmp/healthy; sleep 30000
    env:
      - name: CONFIG_1
        valueFrom:
          configMapKeyRef:
            name: myconfigmap
            key: config1
      - name: CONFIG_2
        valueFrom:
          configMapKeyRef:
            name: myconfigmap
            key: config2
```

大多数情况下，配置信息都以文件形式提供，所以在创建 ConfigMap 时通常采用 --from-file 或 YAML 方式，读取 ConfigMap 时通常采用 Volume 方式。

```bash
kubectl apply -f mypod1.yaml -f mypod2.yaml
```

### 采用 YAML 格式编写文件

* 文件方式

logging.conf

```conf
class: logging.handlers.RotatingFileHandler
formatter: precise
level: INFO
filename: %hostname-%timestamp.log
```

```bash
kubectl create configmap myconfigmap5 --from-file=./logging.conf
```

* Yaml配置

logging.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myconfigmap6
data:
  logging.conf: |
    class: logging.handlers.RotatingFileHandler
    formatter: precise
    level: INFO
    filename: %hostname-%timestamp.log

```

```bash
kubectl apply -f logging.yaml
```

* 使用

mypod3.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod3
spec:
  containers:
  - name: mypod3
    image: busybox
    args:
      - /bin/sh
      - -c
      - sleep 10; touch /tmp/healthy; sleep 30000
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
  volumes:
  - name: foo
    configMap:
      name: myconfigmap6
      items:
        - key: logging.conf
          path: myapp/logging.conf
```

```bash
kubectl apply -f mypod3.yaml

kubectl exec -it mypod3 cat /etc/foo/myapp/logging.conf
```
