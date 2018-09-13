---
layout: post
title:  解决docker网络映射报错
tags: docker network
thread: docker
---

## 前言
系统环境: Red Hat Enterprise Linux Server release 7.4 (Maipo)

## 安装brctl工具
> yum install -y bridge-util

## 错误描述

docker: Error response from daemon: driver failed programming external connectivity on endpoint python-test (b32173a31d81bd415b0fa81671c5bb8931530a1d02a8208f22f8326f4e0b13dd):  (iptables failed: iptables --wait -t nat -A DOCKER -p tcp -d 0/0 --dport 4000 -j DNAT --to-destination 172.17.0.3:80 ! -i docker0: iptables: No chain/target/match by that name.
 (exit status 1)).
 
## 安装ifconfig工具
> yum -y install net-tools

## 错误原因
在搭建ftp服务器时，本地访问成功，远程访问失败，把防火墙启动并开发`21`端口后导致docker网络映射失败。

**docker必须要关闭防火墙，具体原因需要进一步分析。**

## 解决方案
* 停止docker

> systmctl stop docker

* 清空nat表的所有链

> iptables -t nat -F

* 停止docker默认网桥

> ifconfig docker0 down

* 删除网桥

> brctl delbr docker0

* 启动docker

> systmctl start docker

