---
layout: post
title:  制作python虚拟环境包
categories: virtualenv
tags: virtualenv env
thread: virtualenv
---
## Centos换源
```
首先备份/etc/yum.repos.d/CentOS-Base.repo
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
下载对应版本repo文件, 放入/etc/yum.repos.d/(操作前请做好相应备份)
运行以下命令生成缓存
yum clean all
yum makecache
```

> **制作的路径和使用路径必须一致(在/home/hjd/hjd-env下制作， 那拷贝到其他地方使用，使用路径也必须是/home/hjd/hjd-env)**

> yum install zlib* openssl openssl-devel # 相关依赖，此操作先跳过，根据报错进行安装依赖

## 安装 `pip`

> 使用现有的 python 2.6.x 安装pip

> rpm -ivh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm

> yum install -y python-pip

## 安装 virtualenv

> 使用 pip 安装 virtualenv

> pip install virtualenv

## 安装python
~~~
1.创建 hjd-web-env目录
mkdir /home/hjd/hjd-web-env
2.安装python到/home/hjd/hjd-web-env/python27目录
编译安装python，下载地址 http://www.python.org/
./configure --prefix=/home/hjd/hjd-web-env/python27/ --with-zlib --enable-loadable-sqlite-extensions
make && make install
~~~

## 创建虚拟环境包,依赖我们刚刚安装的python2.7

> virtualenv --no-site-packages --distribute --python=/home/hjd/hjd-web-env/python27/bin/python /home/hjd/hjd-web-env/

## 进入虚拟环境

> source /home/hjd/hjd-web-env/bin/activate

## 退出虚拟环境

> deactivate

## 安装oracle, redis

~~~
oracle, redis不用安装，只要把原来hjd/packages目录下的oracle, redis-3.2.0复制到hjd-web-env/package目录下即可,**注意把文件中的hjd-dev-env修改为我们制作的虚拟包的名字**
cp -r /home/hjd/hjd-dev-env/packages/oracle /home/hjd/hjd-web-env/package
cp -r /home/hjd/hjd-dev-env/packages/redis-3.2.0 /home/hjd/hjd-web-env/package

~~~


### 安装nginx

> [下载1.10.1版本nginx](http://nginx.org/download/)
> ./configure --prefix=/home/hjd/hjd-web-env/packages/nginx --with-http_gzip_static_module
> make && make install

### 下载MySQL压缩包，解压修改后再重新压缩

[下载地址](http://101.96.10.60/ftp.ntu.edu.tw/MySQL/Downloads/MySQL-5.7/mysql-5.7.15-linux-glibc2.5-x86_64.tar.gz)

* 修改mysql.server中的值(值位置参考图片)

> basedir=/home/hjd/hjd-web-env/packages/mysql
> datadir=$basedir/data
> conf=/home/hjd/hjd-web-env/packages/conf/my.cnf

![](/static/images/mysql/basedir.png)

> mysqld_pid_file_path=/home/hjd/hjd-web-env/packages/mysql/tmp/mysql.pid

![](/static/images/mysql/pid-file.png)

> conf=/home/hjd/hjd-web-env/packages/conf/my.cnf

![](/static/images/mysql/conf.png)

> $bindir/mysqld_safe --defaults-file=$conf >/dev/null &  # 没有这一行无法在mysql生成tmp目录，导致mysql无法启动

![](/static/images/mysql/mysqld-safe.png)

### 设置LD_LIBRARY_PATH(用于安装cx_Oracle模块)

> export LD_LIBRARY_PATH=/home/hjd/hjd-web-env/packages/oracle/11.2/client64/lib


### 安装虚拟环境所需的python第三方模块(其中有的模块无法直接通过pip进行安装， 请按照解决方法提示后再安装)

* base.txt

~~~

MySQL-python==1.2.5
解决方法：安装依赖包，yum install mysql-devel

~~~

~~~
M2Crypto==0.24.0(确定安装了swig)
解决方法：要先在系统中安装pcre， swig（依赖pcre）
安装pcre: [下载地址](https://sourceforge.net/projects/pcre/files/pcre/)
cd pcre-8.39
./configure && make && make install
安装 swig：[下载地址](http://www.swig.org/download.html)
cd swig-3.0.10
./configure && make && make install

~~~

* dbpool.txt

~~~

gnureadline==6.3.3
解决方法：yum install ncurses*

~~~

~~~
pyping==0.0.4
解决方法： 0.0.4 不存在，安装pyping==0.0.5即可
~~~

## 进入虚拟环境，安装第三方模块包和supervisor

### 安装第三放模块包
> pip install -r xxx.txt

