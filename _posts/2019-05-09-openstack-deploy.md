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
cat /etc/issue; free -g; df -Th
Ubuntu 16.04.5 LTS \n \l

              total        used        free      shared  buff/cache   available
Mem:              5           0           5           0           0           5
Swap:             0           0           0
Filesystem                  Type      Size  Used Avail Use% Mounted on
udev                        devtmpfs  2.9G     0  2.9G   0% /dev
tmpfs                       tmpfs     597M  8.4M  589M   2% /run
/dev/mapper/ubuntu--vg-root ext4      8.1G  5.5G  2.2G  72% /
tmpfs                       tmpfs     3.0G     0  3.0G   0% /dev/shm
tmpfs                       tmpfs     5.0M     0  5.0M   0% /run/lock
tmpfs                       tmpfs     3.0G     0  3.0G   0% /sys/fs/cgroup
/dev/sda1                   ext2      720M   58M  626M   9% /boot
tmpfs                       tmpfs     597M     0  597M   0% /run/user/0
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

## 更新pip源(root用户下操作)

```bash
mkdir ~/.pip
cat > ~/.pip/pip.conf<<EOF
[global]
# 默认安装源
index-url = https://pypi.tuna.tsinghua.edu.cn/simple
# 额外源,找不到时使用
extra-index-url = https://pypi.org/simple
# 禁用pip版本检查
disable-pip-version-check = true
# 超时时间
timeout = 600
# 添加可信主机
trusted-host =
    pypi.tuna.tsinghua
    pypi.org


[install]
ignore-installed = true
no-dependencies = yes

[freeze]
timeout = 10

[download]
timeout = 120
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
git clone -b stable/ocata --depth=1 http://git.trystack.cn/openstack-dev/devstack.git /opt/stack/devstack
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

## 整合为自动化脚本

```python
# -*- coding: utf-8 -*-

from __future__ import print_function

import os
import sys

from textwrap import dedent

from fabric.api import env, settings
from fabric.api import run, cd
from fabric.api import local, lcd
from fabric.main import main

# 配置SSH信息
# env.hosts = [host for host in os.environ.get("OPEN_STACK_IP", "").split(",") if host]
env.hosts = ["10.0.1.105"]
env.user = os.environ.get("OPEN_STACK_USE", "root")
# 密钥对生成方式为  ssh-keygen -t rsa -b 4096 -C "email@email.com" -m PEM -f "/tmp/test_key"
# env.key_filename = os.environ.get("OPEN_STACK_KEY_FILE", "%s/.ssh/id_rsa" % os.environ["HOME"])
env.key_filename = "/tmp/test_key"
env.password = os.environ.get("OPEN_STACK_PASS", "")
env.port = os.environ.get("OPEN_STACK_PORT", 22)
print(
    "hosts: %s\n user: %s, port: %s, password: %s, key filename: %s" % (
        env.hosts, env.user, env.port, env.password, env.key_filename)
)


class OpenStackDeploy(object):
    def __init__(self, run_cmd, run_cd):
        self.run_cmd = run_cmd
        self.run_cd = run_cd

        self._stack_user = "stack"
        self._stack_home = "/opt/stack"
        self._stack_branch = "stable/queen"
        self._stack_origin = "https://git.openstack.org/openstack-dev/devstack"
        self._stack_root = os.path.join(self._stack_home, "devstack")

    @classmethod
    def get_deploy(cls):
        if env.hosts:
            run_cmd, run_cd = run, cd
        else:
            run_cmd, run_cd = local, lcd
        return cls(run_cmd, run_cd)

    def _check_os_version(self):
        self.run_cmd("cat /etc/issue")

    def _check_os_memory(self):
        self.run_cmd("free -g")

    def _check_os_disk(self):
        self.run_cmd("df -Th")

    def check(self):
        self._check_os_version()
        self._check_os_memory()
        self._check_os_disk()

    def backup_source(self):
        cmd = dedent("""\
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
        """)
        self.run_cmd(cmd)

    def update_soft(self):
        self.run_cmd("sudo apt-get -y update")

    def sync_time(self):
        cmd_list = [
            'sudo apt-get install -y ntpdate',
            'sudo ntpdate cn.pool.ntp.org',
            'date +"%F %T"',
        ]
        for cmd in cmd_list:
            self.run_cmd(cmd)

    def create_user(self):
        with settings(warn_only=True):
            cmd = 'id %s >/dev/null 2&> 1 || sudo useradd -s /bin/bash -d %s -m stack' % (
                self._stack_user, self._stack_home)
            self.run_cmd(cmd)

        self.run_cmd('echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack')

    def clone_devstack(self):
        cmd = "test -f %s || git clone -b %s --depth=1 %s %s" % (
            self._stack_root, self._stack_branch, self._stack_origin, self._stack_root)
        self.run_cmd(cmd)

    def update_conf(self):
        sample_conf = os.path.join(self._stack_root, "samples/local.conf")
        local_conf = os.path.join(self._stack_root, "local.conf")
        self.run_cmd("scp %s %s" % (sample_conf, local_conf))

        cmd = dedent("""\
        cat >>/opt/stack/devstack/local.conf<<EOF

        HOST_IP=127.0.0.1
        
        # GIT mirror
        GIT_BASE=http://git.trystack.cn
        NOVNC_REPO=http://git.trystack.cn/kanaka/noVNC.git
        SPICE_REPO=http://git.trystack.cn/git/spice/spice-html5.git
        EOF
        """)
        self.run_cmd(cmd)

        self.run_cmd("scp %s %s" % (os.path.join(self._stack_root, "samples/local.sh"), self._stack_root))

    def deploy(self):
        self.check()
        self.backup_source()
        self.create_user()
        self.clone_devstack()
        self.update_conf()


def deploy():
    d = OpenStackDeploy.get_deploy()
    d.deploy()


if __name__ == '__main__':
    sys.argv = [os.path.abspath(__file__), "deploy"]
    main([os.path.abspath(__file__)])

```

## 感受

OpenStack发展也这么多年了，提供的官方文档还无法傻瓜式的进行部署，可见做的确实是不够好的。

通过阅读部分shell安装脚本也可知，缺少考虑各种异常，也未增加命令行参数等接口。也较难通过日志内容进行修复，导致未安装成功，整体安装体验非常不好。

## 访问Dashboard

[http://IP/dashboard](http://IP/dashboard)

## 参考

* [DevStack](https://docs.openstack.org/devstack/latest/)
