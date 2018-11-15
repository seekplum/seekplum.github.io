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

## 目标
* 1.Fluentd可以动态的重载配置，支持修改采集日志路径替换和Elastaic主机服务端替换
* 2.Fluentd中需要包含自身节点信息，用于查询时进行过滤
* 3.Kibana或Elasticsearch支持精确查询、模糊查询和组合查询等方式，方便产品聚合整个集群日志
* 4.Elasticsearch提供排序、搜索、分页等API功能
* 5.环境部署支持无外网部署

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

### 配置conf文件
[在线测试format是否正确](http://fluentular.herokuapp.com/)，建议先通过该网站测试通过后再填写到conf文件中。

#### 配置nginx采集
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

#### 配置supervisor采集
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

### 项（Term）
一条搜索语句被拆分为一些项（term）和操作符（operator）。项有两种类型：单独项和短语。

单独项就是一个单独的单词，例如 "test" ，"hello"。

短语是一组被双引号包围的单词，例如 "hello dolly"。

多个项可以用布尔操作符连接起来形成复杂的查询语句（AND OR ）。
 
 
### 域（Field）
Lucene支持域。您可以指定在某一个域中搜索，或者就使用默认域。域名及默认域是具体索引器实现决定的。kibana的默认域就是message …. message会包含你所有日志，包括你grok过滤之后的。 
他的搜索语法是：  域名+”:”+搜索的项名。

### 精确查询
关键字查询，`hostname: qdata` 或 `hostname: "qdata"` 会根据`text`自动分词的结果，可能会查出主机名为`qdata-98lite`的数据。

`hostname: qdata` 和 `hostname: "qdata"` 两者区别在于`hostname: qdata*`可以查询qdta开头的主机名，而`hostname: "qdata*"`中的`*`只是普通字符。

需要使用`hostname.keyword: qdata`方式才可以避免`text`类型自动分词带来的影响。

### 模糊查询
* ~: 在一个单词后面加上~启用模糊搜索，可以搜到一些拼写错误的单词

比如 `first~` 这种也能匹配到 `frist`, 还可以设置编辑距离（整数），指定需要多少相似度,`cromm~1` 会匹配到 `from` 和 `chrome`

**注: 默认`2`，越大越接近搜索的原始值，设置为1基本能搜到80%拼写错误的单词**
 
### 邻近搜索(Proximity Searches)
在短语后面加上`~`，可以搜到被隔开或顺序不同的单词

比如`"where select"~5` 表示 select 和 where 中间可以隔着5个单词，可以搜到 `select password from users where id=1`

### 通配符
* 使用符号”?”表示单个任意字符的通配。
* 使用符号”*”表示多个任意字符的通配。

单个任意字符匹配的是所有可能单个字符。例如，搜索”text或者”test”，可以这样：
te?t

**注意：您不能在搜索的项开始使用*或者?符号。**

### 错误1
* 错误提示

> No cached mapping for this field. Refresh field list from the Settings >Indices page

* 原因

没有建立缓存映射

* 解决方法

Management->Kibana->Index Patterns->refresh

### 错误2[未解决]
* 错误现象

> 通配符 `?`, 模糊查询 `~`, 临近搜索 为什么都没有生效？

* 原因

未知

* 解决方法

未知

### 错误3
* 错误现象

字段中含有 `-` 会拆分存储，即存多份数据。比如data-backup，即使是精确搜索`data`，还是会出现`qdata-backup`的数据。

* 原因

5.*之后，把string字段设置为了过时字段，引入text，keyword字段

这两个字段都可以存储字符串使用，但建立索引和搜索的时候是不太一样的

keyword: 存储数据时候，不会分词建立索引

text: 存储数据时候，会自动分词，并生成索引（这是很智能的，但在有些字段里面是没用的，所以对于有些字段使用text则浪费了空间）。

* 解决方法

原方式在`Discover`中是 `hostname: qdata`进行查询的, 修改为`hostname.keyword: qdata`进行查询即可。

## Elasticsearch
[中文版是基于Elasticsearch 2.x版本](https://www.elastic.co/guide/cn/elasticsearch/guide/current/foreword_id.html)，目前最新是6.4.1版本，建议直接阅读[最新官方文档](https://www.elastic.co/guide/index.html)。

### 官方客户端
* python: [github地址](https://github.com/elastic/elasticsearch-py)，[使用文档链接](https://elasticsearch-py.readthedocs.io/en/master/index.html)
* golang: [github地址](https://github.com/elastic/go-elasticsearch)

## 搭建td-agent yum源
参考这篇[搭建本地yum源](/local-yum-repo)博客进行操作

## 参考资料
* [在fluentd数据中增加主机名](https://www.fluentd.org/guides/recipes/apache-add-hostname)
* [在kibana里使用lucene语法进行搜索query搜索](http://xiaorui.cc/2015/02/13/%E5%9C%A8kibana%E9%87%8C%E4%BD%BF%E7%94%A8lucene%E8%AF%AD%E6%B3%95%E8%BF%9B%E8%A1%8C%E6%90%9C%E7%B4%A2query%E6%90%9C%E7%B4%A2/)
* [ELK：kibana使用的lucene查询语法](https://segmentfault.com/a/1190000002972420)