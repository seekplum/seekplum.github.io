---
layout: post
title:  python项目部署
categories: python
tags: deployment
thread: deployment
---
## 检查环境

1.检查系统版本
> cat /etc/issue

2.检查32bit还是64bit

> getconf LONG_BIT

3.检查home目录大小是否超过512G(返回的单位是 MB)

> df -Pm /home\|sed -n \'2p\'\|awk \'{print $4}\'

4.检查cpu数量

> lscpu \|grep \"^CPU(s):\"\|cut -d\':\' -f2

5.检查操作系统内存是否大于4G

> cat /proc/meminfo(查看 Memtoal大小)

6.检测端口是否被占用(10001),只能检查到`当前用户`端口占用情况(需要root权限)

> netstat -alnp \| grep :10001 \| grep LISTEN

7.检查用户是否存在，不存在则创建

> id hjd
> sudo useradd -m hjd # 不存在用户，进行创建,创建用户自动会创建 /home/user目录

* 检查home目录下是否存在hjd目录，不存在则创建，存在则修改目录所有者为hjd

> sudo mkdir hjd
> sudo chown -R hjd:hjd /home/hjd
> id hjd # 再次检查


## 执行安装脚本
1.创建目录

> sudo mkdir -p /home/hjd/logs/{mysql, nginx, redis, supervisor}  # 一次创建多个目录

2.拷贝文件

3.初始化项目

4.安装软件

5.设置开机自启动