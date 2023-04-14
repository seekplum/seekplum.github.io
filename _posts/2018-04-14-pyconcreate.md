---
layout: post
title:  pyconcrete加密
tags: pyconcrete加密
thread: pyconcrete
---

1.解压[glibc](http://ftp.gnu.org/gnu/libc/glibc-2.14.tar.gz)

> tar zxvf glibc-2.14.tar.gz -C /tmp

2.创建glibc`编译`目录

> mkdir /tmp/glibc-2.14/build

3.进入目录并进行编译

```bash
env_path="/root/packages/pythonenv/2.7.18"

mkdir -p ${env_path}/glibc-2.14/etc
scp /etc/ld.so.conf ${env_path}/glibc-2.14/etc/ld.so.conf

cd /tmp/glibc-2.14/build
../configure --prefix=${env_path}
```

4.进入编译目录

```bash
make -j
make install
```

5.进入env环境

> source ${env_path}/bin/activate

6.安装`pyconcrete`包

```bash
pip install pyconcrete --egg --install-option="--passphrase=Pokidij/vFxQ="
```

7.在env/bin/active的最后加入一行(有时不需要手动加,在安装glibc安装后已经存在)

> export LD_LIBRARY_PATH=${env_path}/glibc-2.14/lib:$LD_LIBRARY_PATH

8.替换env中的pyconcrete-admin.py文件,文件在附件中

9.执行加密操作`(加密main.py, server.py 过滤a.py, b.py不加密)`

> ${env_path}/bin/pyconcrete-admin.py compile \-\-source=main.py server.py \-\-pye \-\-remove-pyc \-\-remove-py \-\-ignore-file-list a.py b.py

