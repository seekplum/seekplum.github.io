---
layout: post
title:  VirtualBox 安装服务版 Ubuntu
categories: ubuntu
tags: virtualbox ubuntu
thread: ubuntu
---

## 环境信息

* VirtualBox: 版本 5.2.30 r130521 (Qt5.6.3)
* Ubuntu: 16.04

## 下载Ubuntu

* [官方地址](http://releases.ubuntu.com/16.04/)
* [中科大源](http://mirrors.ustc.edu.cn/ubuntu-releases/16.04/)
* [阿里云开源镜像站](http://mirrors.aliyun.com/ubuntu-releases/16.04/)
* [兰州大学开源镜像站](http://mirror.lzu.edu.cn/ubuntu-releases/16.04/)
* [北京理工大学开源](http://mirror.bit.edu.cn/ubuntu-releases/16.04/)
* [浙江大学](http://mirrors.zju.edu.cn/ubuntu-releases/16.04/)

建议使用阿里云，下载速度较快

## 安装

### 新建VDI

* 1.新建
* 2.虚拟电脑名称和系统类型

```text
名称: ubuntu1
类型: Linux
版本: Ubuntu(64-bit)
```

* 3.内存大小

1024MB

* 4.虚拟硬盘

现在创建虚拟硬盘 -> 创建

虚拟硬盘文件类型 -> VDI(VirtualBox磁盘映像) -> 专家模式

文件位置: 默认
文件大小: 10GB
虚拟硬盘文件类型: VDI(VirtualBox磁盘映像)
存储在物理磁盘上: 动态分配

创建

### 设置ISO

* 1.设置
* 2.存储

控制器:IDE -> 点击 没有盘片 -> 点击右上方 光盘图标 -> 选择一个虚拟光盘文件 -> 在弹出框中选择下载好的iso镜像 -> 打开 -> OK

## 开始安装

* 1.启动
* 2.正常启动
* 3.选择语言并安装

English -> Install Ubuntu Server

* 4.选择语言

Select a language -> English

* 5.选择位置

Select your location -> United States

* 6.跳过检查键盘布局

Configure the keyboard -> No

* 7.选择键盘

Configure the keyboard -> English(US)

Configure the keyboard -> English(US)

* 8.配置主机名

Configure the network -> ubuntu1(输入主机名)

* 9.设置密码

Set up users and passwords -> 输入密码
Set up users and passwords -> 确认密码
Set up users and passwords -> 输入新用户名
Set up users and passwords -> 输入新用户名密码
Set up users and passwords -> 确认新用户名密码
Set up users and passwords -> 创建用户Home目录 -> NO

* 10.设置时区

Configure the clock -> Yes

* 11.分区

Partition disks -> Guided - use entire disk and set up LVM
Partition disks -> Yes
Partition disks -> Yes

* 12.设置代理

Configure the package manager -> Continue

* 13.升级软件

Configuring taske1 -> No automatic updates

* 14.选择安装软件

standaard system utilities 和 OpenSSH server

* 15.安装GRUB

Install the GRUB boot loader on a hard disk -> Yes

* 16.以安装中新建的用户进行登录

## 安装Docker

* 1.安装包，允许 apt 命令 HTTPS 访问 Docker 源。

```bash
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
```

* 2.添加 Docker 官方的 GPG

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```

* 3.将 Docker 的源添加到 /etc/apt/sources.list

```bash
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
```

* 4.安装 Docker

```bash
sudo apt-get update
sudo apt-get install docker-ce
```

## 参考

* [在RedHat 和 Ubuntu 中配置 Delphi 的Linux开发环境（转）](https://www.cnblogs.com/xalion/p/6368899.html)
* [在RedHat 和 Ubuntu 中配置 Delphi 的Linux开发环境（转）](http://chapmanworld.com/2016/12/29/configure-delphi-and-redhat-or-ubuntu-for-linux-development/)
