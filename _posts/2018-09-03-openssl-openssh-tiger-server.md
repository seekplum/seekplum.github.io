---
layout: post
title: 源码安装openssl/openssh/tiger-server
categories: linux
tags: openssl openssh tiger-server
thread: linux
---
## openssl

* 1.[下载源码包](https://github.com/openssl/openssl/releases)
* 2.解压tar包
* 3.进入目录

开始配置安装环境、编译并安装

> ./config && make && make install

* 4.设置lib库软链

```
ln -s /usr/local/lib64/libssl.so.1.1 /usr/lib64/libssl.so.1.1
ln -s /usr/local/lib64/libcrypto.so.1.1 /usr/lib64/libcrypto.so.1.1
```

## tiger-server

* 1.[源码包地址](https://github.com/TigerVNC/tigervnc)
* 2.[rpm包地址](https://centos.pkgs.org/6/centos-x86_64/tigervnc-server-1.1.0-24.el6.x86_64.rpm.html)
* 3.[rpm依赖包地址](https://centos.pkgs.org/6/centos-x86_64/libxshmfence-1.2-1.el6.x86_64.rpm.html)
* 4.卸载之前的包

> rpm -qa | grep -i tigervnc | xargs rpm -e

* 5.安装依赖包

> rpm -ivh libxshmfence-1.2-1.el6.x86_64.rpm

* 6.安装新的rpm包

> rpm -ivh tigervnc-server-1.1.0-24.el6.x86_64.rpm

## openssh
在升级openssl后，openssh已经跟着升级了，不需要再去下载[openssh源码包](https://github.com/openssh/openssh-portable)升级。

