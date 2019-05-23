---
layout: post
title:  Fluentd性能问题排查
tags: Fluentd
thread: Fluentd
---
## 版本信息

* **OS**: Red Hat Enterprise Linux Server release 7.4 (Maipo)
* **kernel**: Linux hostname 3.10.0-693.11.1.el7.x86_64 #1 SMP Fri Oct 27 05:39:05 EDT 2017 x86_64 x86_64 x86_64 GNU/Linux
* **ruby**: ruby 2.0.0p648 (2015-12-16) [x86_64-linux]
* **td-agent**: td-agent 1.3.3


## 现象说明

在配置文件中配置了大量的重复日志采集(比如 `/var/log/messages*` 重复配置了10份)，**ruby安装后没有做任何的调优和参数限制**，监听的日志文件数量为`136`，td-agent运行了两天内存使用就达到了`5.2G`，cpu占有率间歇性持续走高，大概是两分钟一次会飙升到100% 。

* 配置文件内容

![配置文件内容](/static/images/efk/fluentd-conf.jpg)

以下的配置文件的文本内容

```text
# /etc/td-agent/conf.d/messages.conf
<source>
  @type tail
  path /var/log/messages
  exclude_path []
  path_key tailed_path
  pos_file /var/log/td-agent/messages.messages.pos
  tag messages

  format multiline
  multiline_flush_interval 5s
  format_firstline /\w+ \d+ \d+:\d+:\d+/
  format1 /^(?<log_time>\w+ \d+ \d+:\d+:\d+) (?<hostname>\S*) (?<message>.*)/

  time_format %b %d %H:%M:%S
</source>

<filter messages>
  @type record_transformer
  <record>
    hostname xxx
    ip x.x.x.x
    log_type messages

  </record>
</filter>

<filter messages>
  @type dio
  keys log_time
</filter>

<match messages>
  @type copy
  @include messages.conf.d/*.conf
</match>
```

```text
# /etc/td-agent/conf.d/messages.conf.d/x.x.x.x_10015.conf
<store>
  @type elasticsearch
  host x.x.x.x
  port 10015

  time_key time
  flush_interval 2s
  buffer_queue_limit 4096
  buffer_chunk_limit 1024m
  num_threads 4
  logstash_format true
</store>
```

* 配置采集日志数量

![配置采集日志数量](/static/images/efk/log-number.jpg)

* CPU内存使用情况

![CPU内存使用情况](/static/images/efk/cpu-memory-use.jpg)

## 寻找原因

* 查看日志

当发现这个现象后，第一反应是在查看 `/var/log/td-agent/td-agent.log` 日志，相关警告信息如下。

```log
2018-01-10 09:12:51 +0800 [info]: #0 detected rotation of /var/log/xxxx_exporter.log.6; waiting 5 seconds
2018-01-10 09:12:51 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test2" time=2018-01-08 13:06:29.829007891 +0800 record={"log_time"=>1515387560, "level"=>"info", "message"=>"output:  PING x.x.x.x (x.x.x.x) 56(84) bytes of data.\\n\\n--- x.x.x.x ping statistics ---\\n1 packets transmitted, 0 received, 100% packet loss, time 0ms\\n\\n\" source=\"helper.go:101", "tailed_path"=>"/var/log/xxxx_exporter.log.3", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:12:52 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx" time=2018-01-08 13:48:39.054929007 +0800 record={"log_time"=>1515389254, "level"=>"info", "message"=>"output:  PING 192.168.1.88 (192.168.1.88) 56(84) bytes of data.\\n\\n--- 192.168.1.88 ping statistics ---\\n1 packets transmitted, 0 received, 100% packet loss, time 0ms\\n\\n\" source=\"helper.go:101", "tailed_path"=>"/var/log/xxxx_exporter.log.9", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:12:52 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test5" time=2018-01-08 17:58:35.875962904 +0800 record={"level"=>"INFO", "log_time"=>1515401906, "module"=>"util", "message"=>"cmd: tail -n 161 /var/log/messages", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:12:52 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test6" time=2018-01-08 16:40:35.797752215 +0800 record={"level"=>"INFO", "log_time"=>1515385707, "module"=>"util", "message"=>"cmd output:\n    ", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.1", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:12:52 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test5" time=2018-01-08 13:23:58.640995044 +0800 record={"log_time"=>1515388531, "level"=>"info", "message"=>"command:  su - grid -c 'sqlplus '/as sysasm''\" source=\"helper.go:100", "tailed_path"=>"/var/log/xxxx_exporter.log.4", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:13 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test5" time=2018-01-08 15:43:33.195488773 +0800 record={"level"=>"INFO", "log_time"=>1515377090, "module"=>"mxutils", "message"=>"Mxvote cmd: dmsetup table mxvoting\n     output: 0 12582456 linear 147:0 0\n    \n     error message: ", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.2", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:13 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test2" time=2018-01-08 16:58:28.176962647 +0800 record={"level"=>"INFO", "log_time"=>1515368606, "module"=>"util", "message"=>"cmd output:\n    ", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.4", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:13 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test3" time=2018-01-08 18:01:06.570689759 +0800 record={"level"=>"INFO", "log_time"=>1515395454, "module"=>"util", "message"=>"cmd output:\n    ", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.2", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:13 +0800 [info]: #0 detected rotation of /var/log/xxxx_exporter.log.8; waiting 5 seconds
2018-01-10 09:13:14 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx" time=2018-01-08 12:43:42.215172692 +0800 record={"log_time"=>1515386471, "level"=>"info", "message"=>"stderr:  \" source=\"helper.go:102", "tailed_path"=>"/var/log/xxxx_exporter.log.1", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:14 +0800 [info]: #0 detected rotation of /var/log/xxxx_exporter.log.1; waiting 5 seconds
2018-01-10 09:13:14 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test6" time=2018-01-08 15:41:33.081963752 +0800 record={"level"=>"INFO", "log_time"=>1546856351, "module"=>"util", "message"=>"cmd output:\n    ", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.9", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:14 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test3" time=2018-01-08 14:13:02.271125703 +0800 record={"log_time"=>1515390592, "level"=>"info", "message"=>"output:  \" source=\"helper.go:101", "tailed_path"=>"/var/log/xxxx_exporter.log.10", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:14 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test3" time=2018-01-08 13:37:48.928853772 +0800 record={"log_time"=>1515388695, "level"=>"info", "message"=>"stderr:  \" source=\"helper.go:102", "tailed_path"=>"/var/log/xxxx_exporter.log.9", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:14 +0800 [info]: #0 detected rotation of /usr/local/xxxx/logs/xxxx.log.7; waiting 5 seconds
2018-01-10 09:13:35 +0800 [info]: #0 detected rotation of /var/log/xxxx_exporter.log; waiting 5 seconds
2018-01-10 09:13:35 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test4" time=2018-01-08 16:15:38.040842413 +0800 record={"level"=>"ERROR", "log_time"=>1546854427, "module"=>"util", "message"=>"cmd error msg:\n    Invalid entry length (16). Fixed up to 11.\n    None", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.9", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:35 +0800 [info]: #0 detected rotation of /var/log/xxxx_exporter.log.9; waiting 5 seconds
2018-01-10 09:13:36 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test3" time=2018-01-08 16:21:04.504520330 +0800 record={"level"=>"INFO", "log_time"=>1515381249, "module"=>"util", "message"=>"cmd output:\n    ", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.2", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:36 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test3" time=2018-01-08 12:38:02.403610777 +0800 record={"log_time"=>1515385348, "level"=>"info", "message"=>"output:  0000:04:00.1\\n\" source=\"helper.go:101", "tailed_path"=>"/var/log/xxxx_exporter.log.7", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:36 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test3" time=2018-01-08 15:42:38.089622109 +0800 record={"level"=>"INFO", "log_time"=>1515345911, "module"=>"mxutils", "message"=>"Mxvote cmd: ssh -q -o ConnectTimeout=3 172.16.132.19 drbdsetup role 0\n     output: Primary/Primary\n    \n     error message: ", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.6", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
2018-01-10 09:13:36 +0800 [warn]: #0 dump an error event: error_class=TypeError error="no implicit conversion of Fixnum into String" location="/opt/td-agent/embedded/lib/ruby/2.1.0/time.rb:325:in `_parse'" tag="xxxx-test4" time=2018-01-08 16:47:27.462415874 +0800 record={"level"=>"INFO", "log_time"=>1515378538, "module"=>"util", "message"=>"cmd: dmidecode|grep Vendor", "tailed_path"=>"/usr/local/xxxx/logs/xxxx.log.2", "hostname"=>"xxxx", "ip"=>"x.x.x.x", "log_type"=>"xxxx"}
```

* 查看issue

紧接着就是在[github](https://github.com/fluent/fluentd)中搜索相关issue，找到一个关于[td-agnet内存疯长的issue](https://github.com/fluent/fluentd/issues/1414)。根据issue提示，**增加了buffer等相关配置，内存增加问题得到了解决**。

## CPU问题排查方向

* 设置enable_watch_timer
* 修改buffer配置参数是否能生效
* 检查tail相同文件是否会有竟态条件repeat
* dio等插件计算是否有影响
* 检查正则是否合理

## 结论

在修改各种参数和配置后，发现只有把在配置文件中去除`@type dio`部分配置后才不会再出现。

在查阅大量资料后推测，因为`fluent-plugin-dio-1.0.1.gem`插件会把日志中的不同格式时间转成时间戳，在这个过程中导致了CPU使用率较高。

由于`@timestamp`时间和日志时间非常接近，完全可以替代日志中的时间作为筛选条件进行查询。所以把`fluent-plugin-dio-1.0.1.gem`插件移除即可。

## 参考

* [td-agent内存使用率逐渐上升 #1414](https://github.com/fluent/fluentd/issues/1414)
* [fluentd has very high cpu usage #2027](https://github.com/fluent/fluentd/issues/2027)
* [fluentd consuming high CPU at idle, restart PID fixes it #1845](https://github.com/fluent/fluentd/issues/1845)