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
* 日志路径: /var/log/messages
* 匹配关键字1: "conn( SyncTarget -> Connected )"  # 服务启动的关键字
* 匹配关键字2: "conn( Disconnecting -> StandAlone )"  # 服务关闭的关键字
* 匹配关键字3: "PingAck did not arrive in time"  # 脑裂的关键字
* 忽略关键字1: ignore  # 忽略的关键字

针对指定路径，可以监听特定关键字，当关键字出现时调用指定的api通知业务方

## 日志内容
```text
Dec 24 11:23:59 sto16 kernel: wuyan: bond_arp_rcv: ib1/0 av 1 sv 1 sip 172.16.130.11 tip 172.16.130.12
Dec 24 11:23:59 sto16 kernel: drbd r0: conn( StandAlone -> Unconnected )
Dec 24 11:23:59 sto16 kernel: drbd r0: Starting receiver thread (from drbd_w_r0 [8971])
Dec 24 11:23:59 sto16 kernel: drbd r0: receiver (re)started
Dec 24 11:23:59 sto16 kernel: drbd r0: conn( Unconnected -> WFConnection )
Dec 24 11:23:59 sto16 kernel: wuyan: ifname = ib1
Dec 24 11:23:59 sto16 kernel: wuyan: ifname = ib1
```

## 配置文件
```text
<store>
    @type http
    endpoint_url    http://127.0.01:10019/api/v1/test
    http_method     post
    serializer      json
    raise_on_error  true
    custom_headers  {"x-access-token": "xx"}
</store>
```

## 未完待续
...
