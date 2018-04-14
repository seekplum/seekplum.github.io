---
layout: post
title:  安装ubuntu
categories: linux
tags: ubuntu
thread: install-ubuntu
---

## 常见问题
> 惠普开机启动 F9
> 戴尔开机启动 F12:戴尔安装完后不能开机启动，还要设置

* **U盘工具：uiso9_cn_V9.6.5.3237_setup.1438226636**

![](/static/images/ubuntu/free-disk.jpg)

> 原因：还有好多空闲分区

![](/static/images/ubuntu/boot-on.jpg)

> 原因：安装系统后无法启动，修改change boot mode settings-->boot mode  is set to :uefi:secure Boot: ON

![](/static/images/ubuntu/uefi.jpg)

## 安装过程，分区介绍
```
/boot        300M
/swap        8G
/            20G
/usr         100G
/var/log     1G
/tmp         5G
/opt         1G
/home        剩余部分
```
