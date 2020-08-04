---
layout: post
title: 安装mysql
categories: 插件
tags: mysql
thread: mysql
---

## mysql 自动安装

```text
sudo apt-get install mysql-server mysql-client-------------安装mysql，中间会让设置密码，用户已经默认是root
service mysql start---------------------------启动mysql服务
rpm -q mysql----------------------------------查询mysql是否正常安装
/etc/rc.d/init.d/mysqld start-----------------直接启动
chkconfig mysqld on---------------------------设置mysql开机启动
chmod 755 /etc/rc.d/init.d/mysqld-------------修改mysqld执行权限
service mysqld start--------------------------启动mysql服务
service mysqld status-------------------------查看mysql状态
```

## mysql tar 包安装方法

> 注意：my.cnf 中`innodb_buffer_pool_size` 参数，应该根据内存大小进行适当调整，一般设置为系统内存的 50%~70%。修改这个值，需要重启 mysqld 服务。

### 1.删除虚拟环境中旧的 mysql

```base
rm -rf /home/hjd/hjd-dev-env/packages/mysql/
```

### 2.解压 mysql 到原 mysql 目录

```bash
tar zxvf /home/hjd/mysql-5.7.15-linux-glibc2.5-x86_64.tar.gz -C /home/hjd/hjd-dev-env/packages/
```

### 3.解压之后重命名

```bash
mv /home/hjd/hjd-dev-env/packages/mysql-5.7.15-linux-glibc2.5-x86_64/ /home/hjd/hjd-dev-env/packages/mysql/
```

### 4.在 mysql 目录下创建 logs,一定要创建，否则无法安装

```bash
mkdir /home/hjd/hjd-dev-env/packages/mysql/logs
```

### 5.修改文件夹权限

```bash
chown -R hjd:hjd /home/hjd/hjd-dev-env/packages/mysql/
```

### 6.自动创建文件，安装 mysql

```bash
/home/hjd/hjd-dev-env/packages/mysql/bin/mysqld  --defaults-file=/home/hjd/hjd-dev-env/packages/conf/my.cnf --initialize-insecure
```

### 7.启动 mysql

```bash
/home/hjd/hjd-dev-env/packages/mysql/bin/mysqld_safe --defaults-file=/home/hjd/hjd-dev-env/packages/conf/my.cnf &
```

### 8.连接 mysql，初始密码为空，并添加用户

```bash
/home/hjd/hjd-dev-env/packages/mysql/bin/mysql -uroot -S /home/hjd/hjd-dev-env/packages/mysql/tmp/mysql.sock -e "GRANT ALL PRIVILEGES ON *.* TO 'pig'@'%' IDENTIFIED BY 'p7tiULiN0xSp2S03ZHJmHoVBaEYg3NYoRF0h4O7TIEk=';flush privileges;"
```

- 添加用户之后，登陆 mysql(需要刚刚添加的账号密码)

```bash
/home/hjd/hjd-dev-env/packages/mysql/bin/mysql -upig -ppig -S /home/hjd/hjd-dev-env/packages/mysql/tmp/mysql.sock
```

### 9.删除/etc/init.d 中原本的 mysql

```bash
rm /etc/init.d/mysql
```

### 10.修改 mysql 配置

需要按照下面两种方式中的一种进行修改，否则会无法启动 mysql

- 第一种

  1.对 my.cnf 文件做符号链接

> ln -s /home/hjd/hjd-web-env/packages/conf/my.cnf /etc/my.cnf

2.对 sock 文件做符号链接

> ln -s /home/hjd/hjd-web-env/packages/mysql/mysql.sock /tmp/mysql.sock

- 第二种

  1.修改 mysql.server(值位置参考图片)

> basedir=/home/hjd/hjd-web-env/packages/mysql
> datadir=\$basedir/data
> conf=/home/hjd/hjd-web-env/packages/conf/my.cnf

![image](/static/images/mysql/basedir.png)

> mysqld_pid_file_path=/home/hjd/hjd-web-env/packages/mysql/tmp/mysql.pid

![image](/static/images/mysql/pid-file.png)

> conf=/home/hjd/hjd-web-env/packages/conf/my.cnf

![image](/static/images/mysql/conf.png)

> $bindir/mysqld_safe --defaults-file=$conf >/dev/null & # 没有这一行无法在 mysql 生成 tmp 目录，导致 mysql 无法启动

![image](/static/images/mysql/mysqld-safe.png)

2.对 sock 文件做符号链接

> ln -s /home/hjd/hjd-web-env/packages/mysql/mysql.sock /tmp/mysql.sock

### 11.重新复制 mysql.server

```bash
cp /home/hjd/hjd-dev-env/packages/mysql/support-files/mysql.server /etc/init.d/mysql
```

### 12.添加环境变量

```bash
export MYSQL_HOME='/home/hjd/hjd-dev-env/packages/mysql/'
export PATH='$PATH:$MYSQL_HOME/bin'
```

### 13.设置开机启动

```bash
chkconfig --add mysql
chkconfig --level 2345 mysql on
```
