---
layout: post
title:  使用非root权限运行docker
tags: linux docker
thread: docker
---
默认情况下，docker 命令会使用 Unix socket 与 Docker 引擎通讯。而只有 root 用户和 docker 组的用户才可以访问 Docker 引擎的 Unix socket。出于安全考虑，一般 Linux 系统上不会直接使用 root 用户。因此，更好地做法是将需要使用 docker 的用户加入 docker 用户组。

1.添加 docker group

> sudo groupadd docker


2.将用户加入该 group 内

> sudo usermod -aG docker $USER

或者使用下面命令

> sudo gpasswd -a ${USER} docker

3.重启服务

> sudo service docker restart  # centos

> sudo systemctl restart docker  # ubuntu

或者

> sudo /etc/init.d/docker restart

4.切换当前会话到新 group 或者重启 X 会话 

注意:这一步是必须的，否则因为 groups 命令获取到的是缓存的组信息，刚添加的组信息未能生效，所以 docker images 执行时同样有错。

> newgrp - docker
