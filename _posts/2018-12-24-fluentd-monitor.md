---
layout: post
title: flunetd日志监控/告警实践
categories: fluentd
tags: efk fluentd
thread: fluentd
---
## 依赖插件
* [fluent-plugin-out-http](https://github.com/fluent-plugins-nursery/fluent-plugin-out-http)
* [fluent-plugin-prometheus](https://github.com/fluent/fluent-plugin-prometheus)

## 需求
针对指定路径，可以监听特定关键字，当关键字出现时调用指定的api通知业务方，也可以直接把数据保存到prometheus中

* 日志路径: /var/log/messages
* 匹配关键字1: "conn( SyncTarget -> Connected )"  # 服务启动的关键字
* 匹配关键字2: "conn( Disconnecting -> StandAlone )"  # 服务关闭的关键字
* 匹配关键字3: "PingAck did not arrive in time"  # 脑裂的关键字
* 忽略关键字1: ignore  # 忽略的关键字

## 日志内容示例
```text
Dec 24 11:23:59 sto16 kernel: wuyan: bond_arp_rcv: ib1/0 av 1 sv 1 sip 172.16.130.11 tip 172.16.130.12
Dec 24 11:23:59 sto16 kernel: drbd r0: conn( StandAlone -> Unconnected )
Dec 24 11:23:59 sto16 kernel: drbd r0: Starting receiver thread (from drbd_w_r0 [8971])
Dec 24 11:23:59 sto16 kernel: drbd r0: receiver (re)started
Dec 24 11:23:59 sto16 kernel: drbd r0: conn( Unconnected -> WFConnection )
Dec 24 11:23:59 sto16 kernel: wuyan: ifname = ib1
Dec 24 11:23:59 sto16 kernel: wuyan: ifname = ib1
```

## 配置

### td-agent配置
```bash
cat >>/etc/td-agent/td-agent.conf<<EOF

<source>
  @type prometheus
  bind 0.0.0.0
  port 24231
  metrics_path /metrics
</source>
<source>
  @type monitor_agent
</source>
<source>
  @type prometheus_monitor
</source>
<source>
  @type prometheus_output_monitor
</source>
<source>
  @type prometheus_tail_monitor
</source>
EOF
```

### 采集配置
```bash
cat >/etc/td-agent/conf.d/mxvote.conf<<EOF
<source>
  @type tail
  path /var/log/messages
  exclude_path []
  path_key tailed_path
  pos_file /var/log/td-agent/messages.mxvote.pos
  tag mxvote

  format multiline
  multiline_flush_interval 5s
  format_firstline /\w+ \d+ \d+:\d+:\d+/
  format1 /^(?<log_time>\w+ \d+ \d+:\d+:\d+) (?<hostname>.*) kernel: drbd r\d+: conn\( Unconnected -> WFConnection \)/

  time_format %b %d %H:%M:%S
</source>

<filter mxvote>
  @type record_transformer
  <record>
    hostname com39
    ip 10.10.100.39
    log_type mxvote

  </record>
</filter>

<filter mxvote>
  @type dio
  keys log_time
</filter>

<match mxvote>
  @type copy
  @include mxvote.conf.d/*.conf
</match>
EOF
```

### 接收api请求配置文件
```bash
cat >/etc/td-agent/conf.d/mxvote.conf.d/api.conf<<EOF
<store>
    @type http
    endpoint_url    http://127.0.01:10019/api/v1/test
    http_method     post
    serializer      json
    raise_on_error  true
    custom_headers  {"x-access-token": "xx"}
</store>
EOF
```

### 指标配置文件
```bash
cat >/etc/td-agent/conf.d/mxvote.conf.d/metric.conf<<EOF
<store>
    @type prometheus
    <metric>
        name mxvote_startup_times
        type counter
        desc Count the number of times mxvote has been started
        <labels>
            host ${ip}
            name ${hostname}
            tag ${tag}
        </labels>
    </metric>
</store>
EOF
```

### 重载配置
> /etc/init.d/td-agent reload

## 结合Prometheus
* 触发采集

> echo \"Dec 24 11:27:59 sto16 kernel: drbd r0: conn( Unconnected -> WFConnection )\" \>\> /var/log/messages

* 查看采集结果

![prometheus采集结果](/static/images/efk/prometheus.png)

## 参考
* [fluent/fluent-plugin-prometheus](https://github.com/fluent/fluent-plugin-prometheus)
* [Monitoring Fluentd (Prometheus)](https://docs.fluentd.org/v0.12/articles/monitoring-prometheus)
