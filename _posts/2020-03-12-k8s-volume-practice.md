---
layout: post
title:  k8s volume实践
tags: kubernetes volume
thread: kubernetes
---

## PV动态供给（Dynamical Provision）

如果没有满足 PVC 条件的 PV，会动态创建 PV。相比静态供给，动态供给有明显的优势：不需要提前创建 PV，减少了管理员的工作量，效率高。

动态供给是通过 StorageClass 实现的，StorageClass 定义了如何创建 PV

* StorageClass standard

```yaml
kind: StorageClass
apiVersion: storeage.k8s.io/v1
metadata:
  name: standard
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
reclainPolicy: Retain

```

* StorageClass slow

```yaml
kind: StorateClass
apiVerison: storage.k8s.io/v1
metadata:
  name: slow
provisioner: kubernetes.io/aws-ebs
parameters:
  type: io1
  zones: us-east-1d, us-east-1c
  iopsPerGB: "10"
```

## MySQL使用 PV 和 PVC

* 1.创建 PV 和 PVC
* 2.部署 MySQL
* 3.向 MySQL 添加数据
* 4.模拟节点宕机故障，Kubernetes 将 MySQL 自动迁移到其他节点
* 5.验证数据一致性

### 创建 PV 和 PVC

* mysql-pv.yaml

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv
spec:
    accessModes:
      - ReadWriteOnce
    capacity:
      storage: 1Gi
    persistentVolumeReclaimPolicy: Retain
    storageClassName: nfs
    nfs:
      path: /nfsdata/mysql-pv
      server: 192.168.1.8

```

* mysql-pvc.yaml

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: nfs

```

* 部署Mysql mysql.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  ports:
  - port: 3306
  selector:
    app: mysql

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - image: mysql:5.6
        name: mysql
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: password
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-pvc

```

* 创建 PV 和 PVC并部署 MySQL

```bash
mkdir -p /nfsdata/mysql-pv

kubectl apply -f mysql-pv.yaml -f mysql-pvc.yaml -f mysql.yaml
```

* 通过客户端访问 MySQL Server

```bash
kubectl run -it --rm --image=mysql:5.6 --restart=Never mysql-client -- mysql -h mysql -ppassword
```

* 更新数据库

```mysql
use mysql;

create table my_id (id int(4));

insert my_id values(1234);

select * from my_id;
```

* 验证高可用

```bash
kubectl get pod -o wide
```

关机pod所在节点

```bash
kubectl run -it --rm --image=mysql:5.6 --restart=Never mysql-client -- mysql -h mysql -ppassword -e "select * from mysql.my_id"
```

**emptyDir 和 hostPath 类型的 Volume 很方便，但可持久性不强，PV 和 PVC 分离了管理员和普通用户的职责。**
