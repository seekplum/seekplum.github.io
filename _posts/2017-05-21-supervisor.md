---
layout: post
title:  supervisor配置
categories: supervisor
tags: supervisor
thread: supervisor
---

## 安装

```bash
pip install supervisor
```

## 创建配置文件

```bash
echo_supervisord_conf > /etc/supervisord.conf
```

若提示没有权限，则使用以下命令进行创建

```bash
sudo su - root -c "echo_supervisord_conf > /etc/supervisord.conf" 
```

## 配置导入

```text
[include]
files = conf.d/*.conf
```

## 配置文件描述

```text
[program:flask-service]
command=xxx ; 启动命令，可以看出与手动在命令行启动的命令是一样的
directory=xxx ; 执行启动命令时的目录
process_name=%(program_name)s
numprocs=1
startretries = 3     ; 启动失败自动重试次数，默认是 3
startsecs = 5        ; 启动 5 秒后没有异常退出，就当作已经正常启动了
redirect_stderr=true ; 把 stderr 重定向到 stdout，默认 falsestdout_logfile_maxbytes = 20MB  ; stdout 日志文件大小，默认 50MB
stdout_logfile=/xxx/logs/%(program_name)s.log
stdout_logfile_maxbytes=1MB
stdout_logfile_backups=10
stdout_capture_maxbytes=1MB
stdout_events_enabled=false
stopasgroup=true
autostart = true     ; 在 supervisord 启动的时候也自动启动
autorestart=true ; 程序异常退出后自动重启
environment=
    PATH="/xxx/packages/pythonenv/python27env/bin:/usr/local/opt/ncurses/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
```

### 使用浏览器来管理

使用浏览器来管理，只需要注释掉如下几行就可以了。

```text
;[inet_http_server]         ; inet (TCP) server disabled by default
;port=127.0.0.1:9001        ; (ip_address:port specifier, *:port for ;all iface)
;username=user              ; (default is no username (open server))
;password=123               ; (default is no password (open server))
```

## 启动supervisor

默认的配置文件路径就是 `/etc/supervisord.conf` ,如果是默认路径 -c 可以忽略

```bash
supervisord -c /etc/supervisord.conf
```

## 使用supervisorctl

```bash
supervisorctl -c /etc/supervisord.conf
> status    # 查看程序状态
> stop usercenter   # 关闭 usercenter 程序
> start usercenter  # 启动 usercenter 程序
> restart usercenter    # 重启 usercenter 程序
> reread    # 读取有更新(增加)的配置文件，不会启动新添加的程序
> update    # 重启配置文件修改过的程序
```

## supervisorctl 命令介绍

```text
# 停止某一个进程，program_name 为 [program:x] 里的 x
supervisorctl stop program_name
# 启动某个进程
supervisorctl start program_name
# 重启某个进程
supervisorctl restart program_name
# 结束所有属于名为 groupworker 这个分组的进程 (start，restart 同理)
supervisorctl stop groupworker:
# 结束 groupworker:name1 这个进程 (start，restart 同理)
supervisorctl stop groupworker:name1
# 停止全部进程，注：start、restart、stop 都不会载入最新的配置文件
supervisorctl stop all
# 载入最新的配置文件，停止原有进程并按新的配置启动、管理所有进程
supervisorctl reload(最好不要使用，建议进入supervisorctl后执行update)
# 根据最新的配置文件，启动新配置或有改动的进程，配置没有改动的进程不会受影响而重启
supervisorctl update
```

## 开机自启动

### 编辑脚本

[Linux Supervisor开机启动脚本](https://github.com/seekplum/deploy/blob/develop/roles/install/files/seekplum_supervisord)

增加reload接口版本

[Linux Supervisor开机启动脚本2](https://github.com/seekplum/deploy/blob/develop/roles/install/files/seekplum_supervisord2)

### 增加可执行权限

```bash
chmod +x /etc/rc.d/init.d/supervisord
```

### 添加到开机启动项

```bash
chkconfig --add supervisord
chkconfig supervisord on
```

## 过程中碰到的错误

* 错误1

Error: Another program is already listening on a port that one of our HTTP servers is configured to use.  Shut this program down first before starting supervisord.

解决方法：

```bash
unlink /var/run/supervisor.sock
unlink /tmp/supervisor.sock
```

* 错误2

BACKOFF   unknown error making dispatchers for 'web_server': EACCES
FATAL     unknown error making dispatchers for 'web_server': EACCES

原因：log.log文件是管理员创建，普通用户没有修改的权利

解决方法：`chmod 777 log.log`

* 错误3

unix:///tmp/supervisor.sock no such file

原因：端口被占用

解决方法：

```bash
ps aux | grep supervisor
kill 端口号
```
