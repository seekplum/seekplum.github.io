---
layout: post
title:  安装filezilla服务器
categories: 软件
tags: ftp 服务器 install
thread: ftp
---

## 安装filezilla

```bash
sudo apt-get install filezilla
```

ssh 连接服务器 默认端口为 22

## 装语言包

```bash
sudo apt-get install filezilla-locales
```

安装完语言包就可以支持中文了

安装成功后，如果出现./filezilla/filezilla.xml、./filezilla/layout.xml等文件不允许些或者说不能够读，可能是权限问题。然后，把这些文件赋予合适的权限就成功了。