---
layout: post
title:  持续学习docker(七)-Monitor
categories: docker
tags: docker monitor
thread: docker
---

### 环境信息

* ubuntu2
* ubuntu3

## 监控子命令

* ps

查看当前运行的容器

```bash
docker ps
docker ps -a
docker container ps
docker container ls
docker container ps -a
```

* top

查看容器中运行的进程

```bash
docker container top <容器名/容器ID>
```

* stats

显示每个容器各种资源使用情况

```bash
docker container stats
```

注意：容器启动时如果没有特别指定内存 limit，stats 命令会显示 host 的内存总量，但这并不意味着每个 container 都能使用到这么多的内存。

## 开源监控工具

* [sysdig](#sysdig)
* [Weave Scope](#WeaveScope)
* [cAdvisor](cAdvisor)
* [Prometheus](Prometheus)

## sysdig

sysdig 是一个轻量级的系统监控工具，同时它还原生支持容器。通过 sysdig 我们可以近距离观察 linux 操作系统和容器的行为。

* 1.启动并进入容器

```bash
docker container run -it --rm --name=sysdig --privileged=true \
    --volume=/var/run/docker.sock:/host/var/run/docker.sock \
    --volume=/dev:/host/dev \
    --volume=/proc:/host/proc:ro \
    --volume=/boot:/host/boot:ro \
    --volume=/lib/modules:/host/lib/modules:ro \
    --volume=/usr:/host/usr:ro \
    sysdig/sysdig
```

* 2.启动sysdig

```bash
csysdig
```

具体操作按交互页面提示进行

sysdig 的特点：

1.监控信息全，包括 Linux 操作系统和容器。

2.界面交互性强。

## WeaveScope

* 1.下载

```bash
curl -L git.io/scope -o /usr/local/bin/scope

chmod a+x /usr/local/bin/scope
```

* 2.容器的方式启动 Weave Scope

```bash
scope launch
```

根据提示在浏览器打开链接访问，提供的是文本页面进行操作

### 多主机监控

在多个主机上都执行以下命令,则可以同时监控多主机

```bash
scope launch ${主机1IP} ${主机2IP} ${主机3IP} ${...}
```

注意: scope的权限是root,不要随便进行暴露

## cAdvisor

* 启动cAdvisor容器

```bash
docker run \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:rw \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  --detach=true \
  --name=cadvisor \
  google/cadvisor:latest
```

通过 http://[HOST_IO]:8080 访问c

特点如下:

1.展示 Host 和容器两个层次的监控数据。

2.展示历史变化数据。

## Prometheus

Prometheus 最大的亮点和先进性是它的多维数据模型。

### Exporters

现有的exporter列表,[详见官网](https://prometheus.io/docs/instrumenting/exporters/)

* 在ubuntu2和ubuntu3上运行Node Exporter

```bash
docker run -d -p 9100:9100 \
-v "/proc:/host/proc" \
-v "/sys:/host/sys" \
-v "/:/rootfs" \
--net=host \
--name=node_exporter \
prom/node-exporter \
--path.procfs /host/proc \
--path.sysfs /host/sys \
--collector.filesystem.ignored-mount-points "^/(sys|proc|dev|host|etc|rootfs/var/lib/docker/containers|rootfs/var/lib/docker/overlay2|rootfs/run/docker/netns|rootfs/var/lib/docker/devicemapper|rootfs/var/lib/docker/aufs)($$|/)"
```

注意，这里我们使用了 --net=host，这样 Prometheus Server 可以直接与 Node Exporter 通信。

* 在ubuntu2和ubuntu3上运行cAdvisor

```bash
docker run \
--volume=/:/rootfs:ro \
--volume=/var/run:/var/run:rw \
--volume=/sys:/sys:ro \
--volume=/var/lib/docker/:/var/lib/docker:ro \
--publish=8080:8080 \
--detach=true \
--name=cadvisor \
--net=host \
google/cadvisor:latest
```

注意，这里我们使用了 --net=host，这样 Prometheus Server 可以直接与 Node Exporter 通信。

* ubuntu2上运行Prometheus Server

配置采集实例

```bash
cat >/tmp/prometheus.yml<<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'codelab-monitor'

rule_files:
#   - "first.rules"

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets:
        - 10.0.2.153:8080
        - 10.0.2.153:9100
        - 10.0.2.204:8080
        - 10.0.2.204:9100
EOF
```

启动prometheus

```bash
docker run -d -p 9090:9090 \
-v /tmp/prometheus.yml:/etc/prometheus/prometheus.yml \
--name prometheus \
--net=host \
prom/prometheus
```

* ubuntu3上启动granafa

```bash
docker run -d -i -p 13000:3000 \
-e "GF_SERVER_ROOT_URL=http://grafana.server.name" \
-e "GF_SECURITY_ADMIN_PASSWORD=admin" \
--net=host \
--name grafana \
grafana/grafana
```

查看已有的Docker Dashbord

[https://grafana.com/grafana/dashboards?dataSource=prometheus&search=docker](https://grafana.com/grafana/dashboards?dataSource=prometheus&search=docker)

## 参考

* [Prometheus 到底 NB 在哪里？- 每天5分钟玩转 Docker 容器技术（84）](https://www.cnblogs.com/CloudMan6/p/7709970.html)
