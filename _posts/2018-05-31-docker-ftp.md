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

**特别注意不能把全路径加上，否则会导致权限不足**

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import tempfile

from contextlib import contextmanager
from ftplib import FTP


class FtpConfig(object):
    """ftp配置信息
    """
    __ftp_config = None

    ACTIVE_MODE = 1  # 主动模式
    PASSIVE_MODE = 0  # 被动模式

    def __init__(self, host, username, password, port, ftp_root):
        self.host = host
        self.username = username
        self.password = password
        self.port = port
        self.ftp_root = ftp_root

    @classmethod
    def get_ftp_object(cls):
        """查询ftp配置信息

        :return ftp配置对象
        :rtype FtpConfig()
        """
        if cls.__ftp_config:
            return cls.__ftp_config
        # ftp服务器相关配置
        # TODO: 配置文件应该单独维护在配置文件中，方便修改，演示用，就不另外拆分了
        host = "192.168.1.86"
        username = "ftp"
        password = "ftp"
        root = "/home/ftp/ftp"
        port = 21
        cls.__ftp_config = cls(host, username, password, port, root)
        return cls.__ftp_config


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


def upload_file(local_path, remote_name):
    """上传文件到ftp服务器

    :param local_path: 本地文件路径
    :type local_path str

    :param remote_name: 目标服务文件名
    :type remote_name str
    """
    buf_size = 1024 * 1  # 每次读取的文件大小
    ftp_obj = FtpConfig.get_ftp_object()
    with ftp_connect(ftp_obj.host, ftp_obj.username, ftp_obj.password, ftp_obj.port) as ftp_conn:
        old_pasv = ftp_conn.passiveserver
        # 修改模式
        if old_pasv == ftp_obj.ACTIVE_MODE:
            ftp_conn.set_pasv(ftp_obj.PASSIVE_MODE)
        try:
            # 上传文件
            with open(local_path, 'rb') as fp:
                # 特别注意不能把全路径加上，否则会导致权限不足
                ftp_conn.storbinary('STOR ' + remote_name, fp, buf_size)
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
        upload_file(temp_file, file_name)


if __name__ == '__main__':
    test()

```
