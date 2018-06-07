---
layout: post
title:  Prometheus、AlertManager、Grafana、exporter监控告警
tags: go prometheus alertmanager grafana
thread: go
---
## 前言
1.这篇内容主要讲实践使用为主，并不会普及太多的原理等知识。想更详细了解请访问[Prometheus官网](https://prometheus.io/)

2.操作的根目录在`/home/prometheus`下

## 目录结构

tree -L 1 /home/prometheus/

```text
/home/prometheus/
├── alertmanager
├── grafana
├── node_exporter
├── packages
└── prometheus
```

tree -L 1 /home/prometheus/packages/

```text
/home/prometheus/packages/
├── alertmanager-0.8.0.linux-amd64.tar.gz
├── grafana-4.3.1.linux-x64.tar.gz
├── node_exporter-0.14.0-rc.2.linux-amd64.tar.gz
└── prometheus-1.5.2.linux-amd64.tar.gz
```

## node_exporter

### 简介
用go语言实现的agent采集端，主要是负责信息的收集，提供给http请求给prometheus访问采集信息。需要部署在被采集的机器上。

### 安装
在github[下载0.14.0版本](https://github.com/prometheus/node_exporter/releases/download/v0.14.0-rc.2/node_exporter-0.14.0-rc.2.linux-amd64.tar.gz)解压即可

### 启动exporter
> /home/prometheus/node_exporter/node_exporter -web.listen-address=:10001

## AlertManager

### 简介
Alertmanager与Prometheus是相互分离的两个部分。Prometheus服务器根据报警规则将警报发送给Alertmanager，然后Alertmanager将silencing、inhibition、aggregation等消息通过电子邮件、PaperDuty和HipChat发送通知。

### 安装
在github[下载0.8.0版本](https://github.com/prometheus/alertmanager/releases/download/v0.8.0/alertmanager-0.8.0.linux-amd64.tar.gz)解压即可

### 使用
1.修改配置文件

vi /home/prometheus/alertmanager/alertmanager.yml

```yaml
global:

 resolve_timeout: 5m

 smtp_smarthost: smtp.163.com:25 # 发送邮箱服务器
 smtp_from: xx@163.com  # 发送邮箱地址
 smtp_auth_username: xx@163.com  # 邮箱用户名
 smtp_auth_password: xx  # 密码

route:
 group_by: [alertname]
 group_wait: 5s
 repeat_interval: 1m
 group_interval: 1m
 receiver: live-monitoring

receivers:
  - name: live-monitoring
    email_configs:
    - to: 1131909224m@sina.cn  # 接收邮箱地址
      headers:
        Subject: '{% raw %}{{  template  "userdefine.subject" .}}{% endraw %}'
      html: '{% raw %}{{ template "email.html" . }}{% endraw %}'

templates:
  - '*.tmpl'
```

2.启动

> /home/prometheus/alertmanager/alertmanager -config.file=/home/prometheus/alertmanager/alertmanager.yml  -web.listen-address=:10012

## Prometheus

### 简介
Prometheus是一个开源的服务监控系统，它通过HTTP协议从远程的机器收集数据并存储在本地的时序数据库上。它提供了一个简单的网页界面、一个功能强大的查询语言以及HTTP接口等等。Prometheus通过安装在远程机器上的exporter来收集监控数据。

配置Prometheus通过`-alertmanager.url`标志与Alertmanager通信

### 安装
在github[下载1.5.2版本](https://github.com/prometheus/prometheus/releases/download/v1.5.2/prometheus-1.5.2.linux-amd64.tar.gz)后解压即可

### 使用

1.创建告警规则文件目录

> mkdir /home/prometheus/prometheus/rules

2.编写告警规则文件

vi /home/prometheus/prometheus/rules/test.rules

```text
ALERT node_load5
	IF node_load5>0
	LABELS {
			severity = "warn" ,
	}
	ANNOTATIONS {

			alertname = "系统负载（5分钟）" ,

			description = "监控主机在过去5分钟内的平均负载是否超出既定范围" ,

			errorcode = "QD-S002" ,

			message = "QD-S002：系统负载达到 <span>{{ $value }}</span>" ,

			suggest = "可尝试检查应用状态是否正常，如活跃连接是否过多等" ,

	}

ALERT node_load5
	IF node_load5>5
	LABELS {
			severity = "critical" ,
	}
	ANNOTATIONS {

			alertname = "系统负载（5分钟）" ,

			description = "监控主机在过去5分钟内的平均负载是否超出既定范围" ,

			errorcode = "QD-S002" ,

			message = "QD-S002：系统负载达到 <span>{{ $value }}</span>" ,

			suggest = "可尝试检查应用状态是否正常，如活跃连接是否过多等" ,

	}
```

3.配置yaml文件

vi /home/prometheus/prometheus/prometheus.yml

```yaml
global:
  scrape_interval:     15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
    - targets:
        - localhost:10011

  - job_name: linux
    static_configs:
      - targets:
          - 127.0.0.01:10001
        labels:
          instance: 127.0.0.1
          host: 127.0.0.1
          ip: 127.0.0.1

rule_files:
  - rules/test.rules
```

其中targets是我们采集的主机和端口，`127.0.0.1`代表agent在本机，`10001`代表agent提供的端口是10001

添加target有两种方式，在prometheus.yml写入则需要手动重载才生效，可以指定yaml文件地址，就不需要重载了

4.启动prometheus

**prometheus存入数据会和系统时间有关，启动前先确认系统时间是否正常**

> /home/prometheus/prometheus/prometheus -config.file=/home/prometheus/prometheus/prometheus.yml -alertmanager.url=http://127.0.0.1:10012 -web.listen-address=:10011

* -config.file: 指定配置文件路径
* -alertmanager.url: alertmanager的web服务接口
* -web.listen-address: prometheus监听接口
* --web.external-url: 指定访问prometheus请求的格式，若不指定该项，那么运行prometheus服务的主机名将能包含 `.`, `_` 字符

5.重载prometheus

此时如告警规则文件发生了修改，可以重载prometheus让新的告警规则生效

> curl -X POST http://localhost:10011/-/reload

## Grafana

### 简介
Grafana是一个开源的功能丰富的数据可视化平台，通常用于时序数据的可视化。它内置了以下数据源的支持:

* cloudwatch
* elasticsearch
* grafana
* grafana-live
* graphite
* influxdb
* mixed
* mysql
* opentsdb
* prometheus

并可以通过插件扩展支持的数据源。

### 安装
1.在aws[下载编译好4.3.1版本](https://s3-us-west-2.amazonaws.com/grafana-releases/release/grafana-4.3.1.linux-x64.tar.gz)

从github上下载则需要自己编译

### 修改配置dashbord文件路径
1.创建路径

> mkdir /home/prometheus/grafana/dashboards

2.修改配置文件

vi /home/prometheus/grafana/conf/defaults.ini

```conf
[dashboards.json]
enabled = true
path = ./dashboards
```

可以把之前自己配置过的dashbord之前展示出来

### 启动
> /home/prometheus/grafana/bin/grafana-server

默认使用的端口是`3000`

### 配置数据源
1.通过浏览器访问`http://grafana服务器IP:/3000/login`(默认用户名密码都是`admin`)

2.登陆后配置`Data Sources`，类型选择`Prometheus`， url则填写`http://127.0.0.1:Prometheus端口`

3.在`Dashbords`中创建新的`dashbords`,通过`view json`复制内容后存入文件中进行传递迁移

### 展示注意
dashbord中的查询参数会从url参数中使用`var-`开头的变量

## 总结
* prometheus

针对监控我们主要的操作是在`修改prometheus的配置文件`，prometheus做了非常多的操作,比如`定时采集`，`存取信息`，`发送告警信息`等

* alertmanager

主要的功能在收到prometheus的告警信息后，进行`告警聚合`，`邮件、webhook 发送`。

* exporter

监控信息的来源，并不一定需要用`go语言`实现，但是go语言的exporter会比较多，而更新比较快。

* grafana

信息的展示，不限于`折线图`，`柱图`等，传统的折线图等的展示都是先由后端启动celery beat等定时异步任务，把取到的数据存入数据苦衷，然后前端发送请求从后台拿到数据通过插件(比如[hcharts](https://www.hcharts.cn/))进行前端的渲染，增加流程非常笨拙，易出错，而且效果也不好。grafana提供了非常友好导入、分享、编辑等机制，不需要前后端技术基础就可以完成图表的展示。
