---
layout: post
title:  docker搭建ftp服务器
tags: docker ftp
thread: docker
---

## 前言
系统环境: Red Hat Enterprise Linux Server release 7.4 (Maipo)
系统IP: 192.168.1.86

## FTP模式
FTP协议有两种工作方式：PORT方式和PASV方式，中文意思为主动式和被动式

PORT（主动）方式的连接过程是：客户端向服务器的FTP端口（默认是21）发送连接请求，服务器接受连接，建立一条命令链路当需要传送数据时，客户端在命令链路上用PORT命令告诉服务器：我打开了XXXX端口，你过来连接我于是服务器从20端口向客户端的XXXX端口发送连接请求，建立一条数据链路来传送数据

PASV（被动）方式的连接过程是：客户端向服务器的FTP端口（默认是21）发送连接请求，服务器接受连接，建立一条命令链路当需要传送数据时，服务器在命令链路上用PASV命令告诉客户端：我打开了XXXX端口，你过来连接我于是客户端向服务器的XXXX端口发送连接请求，建立一条数据链路来传送数据

## 概括
* **主动模式**: 服务器向客户端敲门，然后客户端开门
* **被动模式**: 客户端向服务器敲门，然后服务器开门

所以，如果你是如果通过代理上网的话，就不能用主动模式，因为服务器敲的是上网代理服务器的门，而不是敲客户端的门。而且有时候，客户端也不是轻易就开门的，因为有防火墙阻挡，除非客户端开放大于1024的高端端口

## 克隆项目
> git clone https://github.com/seekplum/vsftpd.git

## 编译镜像
> docker build -t vsftpd .

## 启动容器

```bash
docker run -d -v /home/ftp:/home/ftp \
-p 20:20 \
-p 21:21 \
-p 47000-47400:47000-47400 \
-e FTP_USER=test -e FTP_PASS=test -e PASV_ADDRESS=0.0.0.0 \
-e PASV_MIN_PORT=47000 -e PASV_MAX_PORT=47400 \
--name vsftpd \
vsftpd
```

## 进入交互式容器

> docker exec -it vsftpd bash

## 本地测试

### 进入交互式容器
> docker exec -it vsftpd bash

### 进入ftp命令行
```bash
ftp 127.0.0.1 21  # 默认端口就是21， 可以不填

# 接下来输入用户名和密码 test/test

dir  # 查看目录下的文件
```

## python上传文件

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import tempfile

from contextlib import contextmanager
from ftplib import FTP

# ftp服务器相关配置
FTP_HOST = "192.168.1.85"
FTP_USERNAME = "test"
FTP_PASSWORD = "test"
FTP_ROOT = "/home/ftp/test"
FTP_PORT = 21

ACTIVE_MODE = 0  # 主动模式
PASSIVE_MODE = 1  # 被动模式


@contextmanager
def ftp_connect(host, username, password, port):
    """获取ftp连接

    :param host ftp主机
    :type host str

    :param username ftp用户名
    :type username str

    :param password ftp密码
    :type password str

    :param port ftp端口
    :type port int
    """
    ftp_conn = FTP()
    ftp_conn.set_debuglevel(2)
    ftp_conn.connect(host, port)
    ftp_conn.login(username, password)
    yield ftp_conn
    ftp_conn.quit()


def upload_file(local_path, remote_path):
    """上传文件到ftp服务器

    :param local_path: 本地文件路径
    :type local_path str

    :param remote_path: 目标服务器路径
    :type remote_path str
    """
    buf_size = 1024 * 1  # 每次读取的文件大小
    with ftp_connect(FTP_HOST, FTP_USERNAME, FTP_PASSWORD, FTP_PORT) as ftp_conn:
        old_pasv = ftp_conn.passiveserver
        # 修改模式
        if old_pasv == PASSIVE_MODE:
            ftp_conn.set_pasv(ACTIVE_MODE)
        try:
            # 上传文件
            with open(local_path, 'rb') as fp:
                ftp_conn.storbinary('STOR ' + remote_path, fp, buf_size)
        finally:
            # 修改回原来的模式
            if old_pasv != ftp_conn.passiveserver:
                ftp_conn.set_pasv(old_pasv)


@contextmanager
def make_temp_file(suffix="_test", prefix="test_", clean=True):
    """创建临时文件

    :param suffix 临时文件后缀
    :type suffix str

    :param prefix 临时文件前缀
    :type suffix str

    :param clean 是否清除临时文件
    :type clean bool
        True 在with语句之后删除文件
    """
    curr_path = os.path.dirname(os.path.abspath(__file__))
    temp_file = tempfile.mktemp(suffix=suffix, prefix=prefix, dir=curr_path)
    try:
        yield temp_file
    finally:
        if clean and os.path.isfile(temp_file):
            os.remove(temp_file)


def test():
    """测试上传文件
    """
    with make_temp_file() as temp_file:
        file_name = os.path.basename(temp_file)
        with open(temp_file, "a") as f:
            f.write(file_name)
        upload_file(temp_file, os.path.join(FTP_ROOT, file_name))


if __name__ == '__main__':
    test()
```
