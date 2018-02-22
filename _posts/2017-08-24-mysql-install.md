---
layout: post
title:  安装mysql
categories: 插件
tags: mysql
thread: mysql
---

## **mysql安装方法**
> 注意：my.cnf中`innodb_buffer_pool_size` 参数，应该根据内存大小进行适当调整，一般设置为系统内存的50%~70%。修改这个值，需要重启mysqld服务。

### 1.删除虚拟环境中旧的mysql
```
rm -rf /home/hjd/hjd-dev-env/packages/mysql/
```

### 2.解压mysql到原mysql目录
```
tar zxvf /home/hjd/mysql-5.7.15-linux-glibc2.5-x86_64.tar.gz -C /home/hjd/hjd-dev-env/packages/
```

### 3.解压之后重命名
```
mv /home/hjd/hjd-dev-env/packages/mysql-5.7.15-linux-glibc2.5-x86_64/ /home/hjd/hjd-dev-env/packages/mysql/
```

### 4.在mysql目录下创建logs,一定要创建，否则无法安装
```
mkdir /home/hjd/hjd-dev-env/packages/mysql/logs
```

### 5.修改文件夹权限
```
chown -R hjd:hjd /home/hjd/hjd-dev-env/packages/mysql/
```

### 6.自动创建文件，安装mysql
```
/home/hjd/hjd-dev-env/packages/mysql/bin/mysqld  --defaults-file=/home/hjd/hjd-dev-env/packages/conf/my.cnf --initialize-insecure
```

### 7.启动mysql
```
/home/hjd/hjd-dev-env/packages/mysql/bin/mysqld_safe --defaults-file=/home/hjd/hjd-dev-env/packages/conf/my.cnf &
```

### 8.连接mysql，初始密码为空，并添加用户
```
/home/hjd/hjd-dev-env/packages/mysql/bin/mysql -uroot -S /home/hjd/hjd-dev-env/packages/mysql/tmp/mysql.sock -e "GRANT ALL PRIVILEGES ON *.* TO 'pig'@'%' IDENTIFIED BY 'p7tiULiN0xSp2S03ZHJmHoVBaEYg3NYoRF0h4O7TIEk=';flush privileges;"
```

##### 添加用户之后，登陆mysql(需要刚刚添加的账号密码)
```
/home/hjd/hjd-dev-env/packages/mysql/bin/mysql -upig -ppig -S /home/hjd/hjd-dev-env/packages/mysql/tmp/mysql.sock
```

### 9.删除/etc/init.d中原本的mysql
```
rm /etc/init.d/mysql
```

### 10.重新复制mysql.server
```
cp /home/hjd/hjd-dev-env/packages/mysql/support-files/mysql.server /etc/init.d/mysql
```

### 11.添加环境变量
```
export MYSQL_HOME='/home/hjd/hjd-dev-env/packages/mysql/'
export PATH='$PATH:$MYSQL_HOME/bin'
```

### 12.设置开机启动
```
chkconfig --add mysql
chkconfig --level 2345 mysql on
```
