---
layout: post
title:  Python使用cx_Oracle用非业务IP查询数据
tags: cx-Oracle cx_Oracle Python
thread: cx_Oracle
---
## 前言

客户会网络要求较高，不允许使用scan_ip和vip等业务IP来查询数据，只能提供一个可远程SSH登陆的管理IP。在这种场景下，如果都是通过 `sqlplus / as sysdba` 来查询SQL的话，不但解析困难，而且会带来非常多意想不到的坑。因此需要寻找可以更优雅的查询方案。

## 未完待续

还在预研...
