---
layout: post
title:  搭建私有pip源
tags: python pypi server
thread: python
---

## 前言
系统环境: Red Hat Enterprise Linux Server release 7.4 (Maipo)

## 安装docker
* 1.添加repo源

vi /etc/yum.repos.d/docker.repo

```bash
[dockerrepo]
name=Docker Repository
baseurl=https://yum.dockerproject.org/repo/main/centos/7/
enabled=1
gpgcheck=1
gpgkey=https://yum.dockerproject.org/gpg
```

* 2.执行命令进行安装

> yum -y install docker-engine

## 安装htpasswd
> yum -y install httpd-tools

## 启动docker
> systemctl start docker

## 创建本地包目录
mkdir -p /srv/pypi

## 设置pypi用户名密码
> touch /srv/pypi/.htpasswd      # credentials file for adding packages

> htpasswd -s /srv/pypi/.htpasswd yourusername

## 启动docker镜像
> docker run -itd \-\-rm -e PYPI_EXTRA=\"\-\-disable-fallback\" -v /srv/pypi:/srv/pypi:rw -p 8080:80 \-\-name pypi codekoala/pypi

## 配置服务器地址

vi ~/.pypirc, 在本地设置私服地址(比如地址为 192.168.27)

```bash
[distutils]
index-servers =
    pypi
    internal

[pypi]
username:pypiusername
password:pypipassword

[internal]
repository: http://192.168.27:8080
username:yourusername
password:yourpassword
```

## 上传包到私服
> python setup.py sdist upload -r internal

## 从私服安装包
> export PIP_EXTRA_INDEX_URL=http://192.168.1.27:8080  # 设置pip备用源地址

> pip install xxx==x.x.x  # 安装包

## 参考
[使用docker搭建pip私服](https://github.com/codekoala/docker-pypi)
