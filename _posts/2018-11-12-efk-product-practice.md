---
layout: post
title:  EFK在产品中落地
categories: efk
tags: efk Fluentd Elasticsearch Kibana
thread: efk
---

## 前言
上一篇讲到了[EFK的安装和简单使用](/efk)，这种使用只是了解阶段的，没有真正的应用到产品中，本篇就重点来讲述下如何让EFK在产品中落地。

## 架构
![EFK架构](/static/images/efk/fluentd-elasticsearch-kibana.png)

## Fluentd

### 默认的fluentd配置
cat /etc/td-agent/td-agent.conf

```conf
####
## Output descriptions:
##

# Treasure Data (http://www.treasure-data.com/) provides cloud based data
# analytics platform, which easily stores and processes data from td-agent.
# FREE plan is also provided.
# @see http://docs.fluentd.org/articles/http-to-td
#
# This section matches events whose tag is td.DATABASE.TABLE
<match td.*.*>
  @type tdlog
  apikey YOUR_API_KEY

  auto_create_table
  buffer_type file
  buffer_path /var/log/td-agent/buffer/td

  <secondary>
    @type file
    path /var/log/td-agent/failed_records
  </secondary>
</match>

## match tag=debug.** and dump to console
<match debug.**>
  @type stdout
</match>

####
## Source descriptions:
##

## built-in TCP input
## @see http://docs.fluentd.org/articles/in_forward
<source>
  @type forward
</source>

## built-in UNIX socket input
#<source>
#  @type unix
#</source>

# HTTP input
# POST http://localhost:8888/<tag>?json=<json>
# POST http://localhost:8888/td.myapp.login?json={"user"%3A"me"}
# @see http://docs.fluentd.org/articles/in_http
<source>
  @type http
  port 8888
</source>

## live debugging agent
<source>
  @type debug_agent
  bind 127.0.0.1
  port 24230
</source>

####
## Examples:
##

## File input
## read apache logs continuously and tags td.apache.access
#<source>
#  @type tail
#  format apache
#  path /var/log/httpd-access.log
#  tag td.apache.access
#</source>

## File output
## match tag=local.** and write to file
#<match local.**>
#  @type file
#  path /var/log/td-agent/access
#</match>

## Forwarding
## match tag=system.** and forward to another td-agent server
#<match system.**>
#  @type forward
#  host 192.168.0.11
#  # secondary host is optional
#  <secondary>
#    host 192.168.0.12
#  </secondary>
#</match>

## Multiple output
## match tag=td.*.* and output to Treasure Data AND file
#<match td.*.*>
#  @type copy
#  <store>
#    @type tdlog
#    apikey API_KEY
#    auto_create_table
#    buffer_type file
#    buffer_path /var/log/td-agent/buffer/td
#  </store>
#  <store>
#    @type file
#    path /var/log/td-agent/td-%Y-%m-%d/%H.log
#  </store>
#</match>
```

### 重用配置
* 创建配置文件路径并进行配置

```bash
mkdir -p /etc/td-agent/conf.d
echo "@include conf.d/*.conf" >> /etc/td-agent/td-agent.conf
```

### 配置RPC
```bash
cat >>/etc/td-agent/td-agent.conf<<EOF

<system>
  rpc_endpoint 127.0.0.1:24444
</system>

EOF
```

* reload重载

> curl http://127.0.0.1:24444/api/config.reload

效果等价于**/etc/init.d/td-agent reload**

### 修改为root启动
不同程序的日志文件所属权限会不一致，通过`root`用户来保证有权限读取文件。

```bash
sudo sed -i "s/TD_AGENT_USER=td-agent/TD_AGENT_USER=root/g" /etc/init.d/td-agent
sudo sed -i "s/TD_AGENT_GROUP=td-agent/TD_AGENT_GROUP=root/g" /etc/init.d/td-agent
```

## 配置conf文件
[在线测试format是否正确](http://fluentular.herokuapp.com/)，建议先通过该网站测试通过后再填写到conf文件中。

### 配置nginx采集
> mkdir -p /var/log/td-agent/access && chown -R td-agent:td-agent /var/log/td-agent/access

```bash
cat >/etc/td-agent/conf.d/nginx.conf <<EOF
<source>
  @type tail
  path /home/sendoh/qdata-cloud/logs/nginx/access.log
  pos_file /var/log/td-agent/access/access.log.pos

  tag nginx.access
  format /^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^ ]*) +\S*)?" (?<code>[^ ]*) (?<size>[^ ]*) "(?<referer>[^\"]*)" "(?<agent>[^\"]*)" "(?<other>[^ ]*)"$/
  time_format %d/%b/%Y:%H:%M:%S %z
</source>
<match nginx.access>
  @type elasticsearch
  host 192.168.1.78
  port 9200

  flush_interval 2s
  buffer_queue_limit 4096
  buffer_chunk_limit 1024m
  num_threads 4
  logstash_format true
</match>
EOF
```

### 配置supervisor采集
> mkdir -p /var/log/td-agent/supervisor && chown -R td-agent:td-agent /var/log/td-agent/supervisor

```text
2018-11-12 19:50:43,588 INFO success: qdata_worker entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
```

```bash
cat >/etc/td-agent/conf.d/supervisor.conf <<EOF
<source>
  @type tail
  path /home/sendoh/qdata-cloud/logs/supervisor/supervisord.log
  pos_file /var/log/td-agent/supervisor/supervisor.log.pos

  tag supervisor.log 
  format /^(?<time>[^ ]* [^ ]*),(?<line>\d+) (?<level>[^ ]*) (?<state>[^ ]*) (?<name>[^ ]*) entered (?<status>[^ ]*) state, process has stayed up for > than 1 seconds \(startsecs\)$/ 
  time_format %Y-%m-%d %H:%M:%S 
</source>

<filter supervisor.log>
  @type record_transformer
  <record>
    hostname \${hostname}
  </record>
</filter>

<match supervisor.log>
  @type elasticsearch
  host 192.168.1.78
  port 9200

  flush_interval 2s
  buffer_queue_limit 4096
  buffer_chunk_limit 1024m
  num_threads 4
  logstash_format true
</match>
EOF
```

## Kibana


## 参考资料
* [在fluentd数据中增加主机名](https://www.fluentd.org/guides/recipes/apache-add-hostname)
* [在kibana里使用lucene语法进行搜索query搜索](http://xiaorui.cc/2015/02/13/%E5%9C%A8kibana%E9%87%8C%E4%BD%BF%E7%94%A8lucene%E8%AF%AD%E6%B3%95%E8%BF%9B%E8%A1%8C%E6%90%9C%E7%B4%A2query%E6%90%9C%E7%B4%A2/)