---
layout: post
title: OpenStack单机环境搭建
tags: python,OpenStack
thread: python
---

## 结论

未安装成功

## 系统版本信息

```text
cat /etc/issue
Ubuntu 16.04.5 LTS \n \l
```

## 更新apt源为阿里源(root用户下操作)

```bash
test -f /etc/apt/sources.list && mv /etc/apt/sources.list /etc/apt/sources.list.$(date +%s).bak
cat >/etc/apt/sources.list <<EOF
deb http://mirrors.aliyun.com/ubuntu/ xenial main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial main

deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-updates main

deb http://mirrors.aliyun.com/ubuntu/ xenial universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial universe
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-updates universe

deb http://mirrors.aliyun.com/ubuntu/ xenial-security main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-security main
deb http://mirrors.aliyun.com/ubuntu/ xenial-security universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-security universe
EOF
```

## 更新软件(root用户下操作)

```bash
sudo apt-get -y update
```

## 设定时间同步(root用户下操作)

* 设定时区

```bash
dpkg-reconfigure tzdata
```

在弹出框中选择 `Asia` -> 再选择 `Shanghai` -> `OK`

* 同步时间

```bash
sudo apt-get install -y ntpdate
sudo ntpdate cn.pool.ntp.org
date +"%F %T"
```

## 创建用户(root用户下操作)

```bash
sudo useradd -s /bin/bash -d /opt/stack -m stack
echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack
```

## 进入 `stack` 用户

```bash
sudo su - stack
```

**注: 无特殊说明的情况下，后续的相关操作都是在 `stack` 用户下进行的.**

## 下载DevStack

```bash
git clone -b stable/queens --depth=1 https://git.openstack.org/openstack-dev/devstack
```

## 创建 local.conf

```bash
cp /opt/stack/devstack/samples/local.conf /opt/stack/devstack/local.conf
cat >>/opt/stack/devstack/local.conf<<EOF

HOST_IP=127.0.0.1

# GIT mirror
GIT_BASE=http://git.trystack.cn
NOVNC_REPO=http://git.trystack.cn/kanaka/noVNC.git
SPICE_REPO=http://git.trystack.cn/git/spice/spice-html5.git
EOF
cp /opt/stack/devstack/samples/local.sh /opt/stack/devstack/
```

## 检查系统版本

```bash
lsb_release -i -s
```

**输出结果可能是有问题的，那么就需要手动修改 `functions-common` 脚本，修改第 `354行`， `os_VENDOR=$(lsb_release -i -s)`为`os_VENDOR="Ubuntu"`.**

## 执行安装脚本

```bash
cd /opt/stack/devstack
./stack.sh
```

## 安装失败进行回退

```bash
cd /opt/stack/devstack
./unstack.sh
./clean.sh
```

## 感受

OpenStack发展也这么多年了，提供的官方文档还无法傻瓜式的进行部署，可见做的确实是不够好的。

通过阅读部分shell安装脚本也可知，缺少考虑各种异常，也未增加命令行参数等接口。也较难通过日志内容进行修复，导致未安装成功，整体安装体验非常不好。

## 访问Dashboard

[http://IP/dashboard](http://IP/dashboard)

## 参考

* [DevStack](https://docs.openstack.org/devstack/latest/)
