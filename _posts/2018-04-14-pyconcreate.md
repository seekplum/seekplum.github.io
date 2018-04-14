---
layout: post
title:  pyconcrete加密
tags: pyconcrete加密
thread: pyconcrete
---

1. 解压glibc
> tar zxvf glibc-2.14.tar.gz -C /tmp

2. 进入glibc目录
> cd /tmp/glibc-2.14/

3. 创建glibc`编译`目录
> mkdir /tmp/glibc-2.14/build

4. 进入目录并进行编译
> cd /tmp/glibc-2.14/build
> ../configure --prefix=/home/sendoh/test-env

5. 进入编译目录
> make -j
> make install

6. 进入env环境
> source /home/sendoh/test-env/bin/activate

7. 安装`pyconcrete`包
> pip install pyconcrete --egg --install-option="--passphrase=Pokidij/vFxQ="

8. 在env/bin/active的最后加入一行(有时不需要手动加,在安装glibc安装后已经存在)
> export LD_LIBRARY_PATH=/home/sendoh/test-env/glibc-2.14/lib:$LD_LIBRARY_PATH

9. 替换env中的pyconcrete-admin.py文件,文件在附件中

10. 执行加密操作`(加密main.py, server.py 过滤a.py, b.py不加密)`
> /home/sendoh/test-env/bin/pyconcrete-admin.py compile --source=main.py server.py --pye --remove-pyc --remove-py --ignore-file-list a.py b.py
