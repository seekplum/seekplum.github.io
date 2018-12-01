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
* [x] 1.Fluentd可以动态的重载配置，支持修改采集日志路径替换和Elastaic主机服务端替换
* [x] 2.Fluentd中需要包含自身节点信息，用于查询时进行过滤
* [x] 3.Kibana或Elasticsearch支持精确查询、模糊查询和组合查询等方式，方便产品聚合整个集群日志
* [x] 4.Elasticsearch提供排序、搜索、分页等API功能
* [x] 5.EFK环境部署支持无外网部署，td-agent插件支持无外网部署

## Fluentd

### 离线安装插件
以安装 `fluent-plugin-elasticsearch-2.12.0.gem` 为例，[fluent-plugin-elasticsearch插件下载地址](https://rubygems.org/gems/fluent-plugin-elasticsearch)，在官网下载gem包。

* 安装

> td-agent-gem install fluent-plugin-elasticsearch-2.12.0.gem \-\-local

* 处理依赖

fluent-plugin-elasticsearch 插件会依赖 `libcurl-devel`, `gcc`，需要先进行安装

> yum install -y libcurl-devel gcc

* 报错信息

> ERROR:  Could not find a valid gem 'elasticsearch' (>= 0) in any repository

* 报错原因

原因是gem包和rpm包类似，会有依赖关系，需要成功安装所有依赖包后才能安装

* 解决方法
  - 1.直接在官网中下载所有依赖包，只方便于依赖不多的包文件，当依赖包不多时直接下载即可。
  - 2.从缓存中获取，当在线安装gem包成功后，在 `ruby安装路径的cache目录` 中会有相关的依赖gem包，把 `/opt/td-agent/embedded/lib/ruby/gems/2.1.0/cache` 目录拷贝到安装机器后，进入cache目录再次执行上条安装命令即可。

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
* 创建目录

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
* 创建目录

> mkdir -p /var/log/td-agent/supervisor && chown -R td-agent:td-agent /var/log/td-agent/supervisor

* 示例输出

```text
2018-11-12 19:50:43,588 INFO success: qdata_worker entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
```

* 配置文件

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

#### 配置http server采集
* 配置supervisor服务

创建目录

> mkdir /etc/conf.d

配置文件

```bash
cat >/etc/conf.d/http-server.conf <<EOF
[program:http-server]
command=python -m SimpleHTTPServer 80
process_name=%(program_name)s ; process_name expr (default %(program_name)s)
numprocs=1                    ; number of processes copies to start (def 1)
redirect_stderr=true          ; redirect proc stderr to stdout (default false)
stdout_logfile=/tmp/http-server.log
stdout_logfile_maxbytes=1MB   ; max # logfile bytes b4 rotation (default 50MB)
stdout_logfile_backups=10     ; # of stdout logfile backups (default 10)
stdout_capture_maxbytes=1MB   ; number of bytes in 'capturemode' (default 0)
stdout_events_enabled=false   ; emit events on stdout writes (default false)
directory=/tmp
EOF
```

* 设置td-agent配置

创建目录

> mkdir -p /var/log/td-agent/http-server && chown -R td-agent:td-agent /var/log/td-agent/http-server

示例输出

```text
10.10.110.35 - - [16/Nov/2018 02:04:04] "GET / HTTP/1.1" 200 -
```

配置文件

```bash
cat >/etc/td-agent/conf.d/http-server.conf <<EOF
<source>
  @type tail
  path /tmp/http-server.log
  pos_file /var/log/td-agent/http-server/http-server.log.pos

  tag http-server.log
  format /^(?<host>[^ ]*) [^ ]* (?<user>[^ ]*) \[(?<time>.+)\] "(?<method>\w+) (?<path>\S+) (?<version>.+)" (?<code>\d+) (?<other>.*)$/ 
  time_format %d/%b/%Y %H:%M:%S 
</source>

<filter http-server.log>
  @type record_transformer
  <record>
    hostname \${hostname}
  </record>
</filter>

<match http-server.log>
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

* 生成日志

> for i in `seq 1 99 `; do echo "$i"; curl http://localhost:80 ; sleep 1; done >/dev/null 2>&1 &

## Fluent Bit
[官网和Fluentd对比](https://fluentbit.io/documentation/0.8/about/fluentd_and_fluentbit.html)

|组件|用途|
|:---|:---|
|Fluent Bit|拉起在每台宿主机上采集宿主机上的容器日志。（Fluent Bit 比较新一些，但是资源消耗比较低，性能比Fluentd好一些，但稳定性有待于进一步提升）|
|Fluentd|两个用途：1 以日志收集中转中心角色拉起，Deployment部署模式；2 在部分Fluent Bit无法正常运行的主机上，以Daemon Set模式运行采集宿主机上的日志，并发送给日志收集中转中心|

* 安装

配置yum源

```bash
cat >/etc/yum.repos.d/td-bit.repo<<EOF
[td-agent-bit]
name = TD Agent Bit
baseurl = http://packages.fluentbit.io/centos/7
gpgcheck=1
gpgkey=http://packages.fluentbit.io/fluentbit.key
enabled=1
EOF
```

* 启动

> systemctl start td-agent-bit

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
Elasticsearch是一个分布式，可扩展，实时的搜索与数据分析引擎。它能从项目一开始就赋予你的数据以搜索，分析和探索的能力。

Elasticsearch不仅仅是全文搜索，我们还将介绍结构化搜索，数据分析，复杂的语言处理，地理位置和对象间关联关系等。还将探讨如何给数据建模来充分利用Elasticsearch的水平伸缩性，以及在生产环境中如何配置和监视你的集群。

[中文版是基于Elasticsearch 2.x版本](https://www.elastic.co/guide/cn/elasticsearch/guide/current/foreword_id.html)，目前最新是6.4.1版本，建议直接阅读[最新官方文档](https://www.elastic.co/guide/index.html)。

### 官方客户端
* python: [github地址](https://github.com/elastic/elasticsearch-py)，[使用文档链接](https://elasticsearch-py.readthedocs.io/en/master/index.html)
* golang: [github地址](https://github.com/elastic/go-elasticsearch)

### python示例代码
```python
# -*- coding: utf-8 -*-

from elasticsearch import Elasticsearch

ES_HOST = "192.168.1.78"
ES_PORT = 9200


class ElasticSearchClient(object):
    def __init__(self, es):
        """ElasticSearch客户端，支持搜索数据

        :param es: 实例化的es对象
        :type es: Elasticsearch
        :example es: Elasticsearch()
        """
        self._es = es

    def search_body(self, body):
        """搜索数据

        :param body: 查询参数
        :type body: dict
        :example body: {
            "query": {
                "match_phrase": {
                    "name": "alertmanager"
                }
            }
        }

        :rtype dict
        :return 查询结果
        :example {
            'hits': {
                'hits': [
                    {
                        '_score': 0.18232156,
                        '_type': 'fluentd',
                        '_id': 'aybAFWcB90wAhiDJQr4S',
                        '_source': {
                            'status': 'RUNNING',
                            'name': 'alertmanager',
                            'level': 'INFO',
                            '@timestamp': '2018-11-15T13:02:57.000000000+08:00',
                            'hostname': 'qdata-98lite-dev',
                            'state': 'success:',
                            'line': '394'
                        },
                        '_index': 'logstash-2018.11.15'},
                    {
                        '_score': 0.18232156,
                        '_type': 'fluentd',
                        '_id': 'bCYTFmcB90wAhiDJrr6i',
                        '_source': {
                            'status': 'RUNNING',
                            'name': 'alertmanager',
                            'level': 'INFO',
                            '@timestamp': '2018-11-15T14:34:04.000000000+08:00',
                            'hostname': 'qdata-98lite-dev', 'state': 'success:',
                            'line': '520'
                        },
                        '_index': 'logstash-2018.11.15'
                    }],
                'total': 2,
                'max_score': 0.18232156
            },
            '_shards': {
                'successful': 11,
                'failed': 0,
                'skipped': 0,
                'total': 11
            },
            'took': 8,
            'timed_out': False
        }
        """
        return self._es.search(body=body)


def print_text(text):
    print text


def get_data(client):
    """查询数据

    :param client:
    :type client: ElasticSearchClient
    :example client: ElasticSearchClient(es)
    """
    body = {
        "query": {
            "match_phrase": {
                "name": "alertmanager"
            }
        }
    }
    result = client.search_body(body)
    hists = result["hits"]
    total = hists["total"]

    print_text("total: {}".format(total))

    for item in hists["hits"]:
        source = item["_source"]

        timestamp = source["@timestamp"]
        name = source["name"]
        hostname = source["hostname"]
        level = source["level"]
        status = source["status"]

        message = "timestamp: {}, hostname: {}, name: {}, level: {}, status: {}".format(timestamp, hostname, name, level, status)
        print_text(message)


def get_page_data(client, number, page_line):
    """查询分页数据

    :param client:
    :type client: ElasticSearchClient
    :example client: ElasticSearchClient(es)

    :param number: 指定页数
    :type number: int
    :example number: 3

    :param page_line: 每页条数， ElasticSearch中默认值 10 条
    :type page_line: int
    :example page_line: 20
    """
    body = {
        # 搜索
        "query": {
            # 广泛匹配
            "match": {
                "hostname": "host"
            },

            # 精确匹配
            # "match_phrase": {
            #     "hostname": "host-192-168-1-178"
            # }
        },

        # 分页
        "from": number * page_line,
        "size": page_line,

        # 排序
        "sort": {
            "@timestamp": {
                "order": "asc",
                # "order": "desc"
            }
        }

    }

    result = client.search_body(body)

    hists = result["hits"]
    total = hists["total"]

    print_text("total: {}".format(total))

    for item in hists["hits"]:
        source = item["_source"]

        timestamp = source["@timestamp"]
        hostname = source["hostname"]
        code = source["code"]
        method = source["method"]
        host = source["host"]

        message = "timestamp: {}, host: {}, hostname: {}, method: {}, code: {}".format(timestamp, host, hostname, method, code)
        print_text(message)


def main():
    hosts = "{host}:{port}".format(host=ES_HOST, port=ES_PORT)
    es = Elasticsearch(hosts=hosts)
    client = ElasticSearchClient(es)
    get_data(client)
    get_page_data(client, 1, 11)


if __name__ == '__main__':
    main()

```

### go示例代码
```golang
package main

import (
  "fmt"

  "github.com/olivere/elastic"
  "github.com/prometheus/common/log"
  "context"
  "encoding/json"
)

type SupervisorTweet struct {
  Timestamp string `json:"@timestamp"`
  Hostname  string `json:"hostname"`
  Level     string `json:"level"`
  Line      string `json:"line"`
  Name      string `json:"name"`
  State     string `json:"state"`
  Status    string `json:"status"`
}

func CreateElasticSearchClient(url string) (*elastic.Client, error) {
  ctx := context.Background()

  c, err := elastic.NewSimpleClient(elastic.SetURL(url))
  if err != nil {
    log.Errorf("Create Elastic client error: %s NewSimpleClient(%s)", err, url)
    return nil, err
  }

  info, code, err := c.Ping(url).Do(ctx)
  if err != nil {
    log.Errorf("Elastic client can not ping %s, error: %s", url, err)
    return nil, err
  }
  log.Infof("Elastic returned with code %d and version %s", code, info.Version.Number)
  return c, nil
}

func SearchData(client *elastic.Client) {
  termQuery := elastic.NewQueryStringQuery("name:alertmanager")

  searchResult, err := client.Search().Query(termQuery).Do(context.Background())

  if err != nil {
    log.Errorf("Elastic query term error: %s", err)
  }

  if searchResult.Hits.TotalHits > 0 {
    log.Infof("Total: %d", searchResult.Hits.TotalHits)

    for _, hit := range searchResult.Hits.Hits {
      var t SupervisorTweet
      err := json.Unmarshal(*hit.Source, &t)

      if err != nil {
        log.Errorln("Deserialization failed")
      }
      log.Infof("time: %s, hostname: %s, name: %s, status: %s", t.Timestamp, t.Hostname, t.Name, t.Status)
    }
  } else {
    log.Errorln("Found no tweets")
  }
}

func main() {
  fmt.Println("Elastic Demo...")

  url := "http://192.168.1.78:9200"
  c, err := CreateElasticSearchClient(url)
  if err != nil {
    panic("Create ElasticSearch client failed!")
  }
  
  SearchData(c)
}

```

## 搭建td-agent yum源
参考这篇[搭建本地yum源](/local-yum-repo)博客进行操作

## 后续
* [ ] 1.fluentd和fluentbit对比
* [ ] 2.性能测试、稳定性测试
* [ ] 3.业务场景封装

## 参考资料
* [在fluentd数据中增加主机名](https://www.fluentd.org/guides/recipes/apache-add-hostname)
* [在kibana里使用lucene语法进行搜索query搜索](http://xiaorui.cc/2015/02/13/%E5%9C%A8kibana%E9%87%8C%E4%BD%BF%E7%94%A8lucene%E8%AF%AD%E6%B3%95%E8%BF%9B%E8%A1%8C%E6%90%9C%E7%B4%A2query%E6%90%9C%E7%B4%A2/)
* [ELK：kibana使用的lucene查询语法](https://segmentfault.com/a/1190000002972420)