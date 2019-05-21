---
layout: post
title: OpenStack单机环境搭建
tags: python,OpenStack
thread: python
---

## 系统版本信息

```text
cat /etc/redhat-release
Red Hat Enterprise Linux Server release 7.4 (Maipo)
```

## 安装依赖包(root用户下操作)

```bash
yum install -y bridge-utils nss-devel libvirt-devel redhat-lsb
```

## 更新pip到最新(root用户下操作)

```bash
pip install --upgrade pip
pip install setuptools --upgrade
```

## 创建用户(root用户下操作)

```bash
sudo useradd -s /bin/bash -d /opt/stack -m stack
```

## 设置sudo权限(root用户下操作)

```bash
echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack
```

## 进入 `stack` 用户

```bash
sudo su - stack
```

无特殊说明的情况下，后续的相关操作都是在 `stack` 用户下进行的

## 下载DevStack

```bash
git clone -b master --depth=1 https://git.openstack.org/openstack-dev/devstack
```

## 创建 local.conf

```bash
cat >/opt/stack/devstack/local.conf<<EOF
[[local|localrc]]
ADMIN_PASSWORD=secret
DATABASE_PASSWORD=$ADMIN_PASSWORD
RABBIT_PASSWORD=$ADMIN_PASSWORD
SERVICE_PASSWORD=$ADMIN_PASSWORD
EOF
```

## 创建日志目录

```bash
mkdir -p /opt/stack/logs/
```

## 检查系统版本

```bash
lsb_release -i -s
```

**输出结果可能是有问题的，那么就需要手动修改 `functions-common` 脚本，修改第 `354行`， `os_VENDOR=$(lsb_release -i -s)`为`os_VENDOR="Red Hat"`.**

## 执行安装脚本

**脚本运行中会安装pip，而默认安装的pip版本又会很低，导致后续安装包失败，需要把 `tools/install_pip.sh:install_get_pip:92` 安装pip步骤注释掉.**

```bash
export FORCE=yes && /opt/stack/devstack/stack.sh
```

## python包 pyeclib 无法安装

待解决

## 感受

OpenStack发展也这么多年了，提供的官方文档还无法傻瓜式的进行部署，可见做的确实是不够好的。

通过阅读部分shell安装脚本也可知，缺少考虑各种异常，也未增加命令行参数等接口。整体安装体验非常不好。

## 参考

* [DevStack](https://docs.openstack.org/devstack/latest/)