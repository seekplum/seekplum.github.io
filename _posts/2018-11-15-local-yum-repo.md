---
layout: post
title:  搭建本地yum源
categories: yum
tags: yum repo
thread: yum
---
## 下载rpm插件

```bash
yum install -y yum-plugin-downloadonly
```

## 安装createrepo包

```bash
yum install -y createrepo
```

## 下载rpm包

**注意:此种方式需要要求未安装过改软件才能下载，比如之前未安装过wget.**

* 指定要安装的包,比如 `wget`

```bash
mkdir -p /root/rpms/data/admin/files/repo/rhel74-x86_64
yum -y install --downloadonly --downloaddir=/root/rpms/data/admin/files/repo/rhel74-x86_64 wget
```

* 其中安装`td-agent`需要指定yum源，所以需要执行以下脚本内容

```bash
#/usr/bin/env bash

echo "=============================="
echo " td-agent Installation Script "
echo "=============================="
echo "This script requires superuser access to install rpm packages."
echo "You will be prompted for your password by sudo."

# clear any previous sudo permission
sudo -k

# run inside sudo
sudo sh <<SCRIPT

  # add GPG key
  rpm --import https://packages.treasuredata.com/GPG-KEY-td-agent

  # add treasure data repository to yum
  cat >/etc/yum.repos.d/td.repo <<'EOF';
[treasuredata]
name=TreasureData
baseurl=http://packages.treasuredata.com/2/redhat/7/\$basearch
gpgcheck=1
gpgkey=https://packages.treasuredata.com/GPG-KEY-td-agent
EOF

  # update your sources
  yum check-update

  # install the toolbelt
    mkdir -p /root/rpms/data/admin/files/repo/rhel74-x86_64
	yes | yum install --downloadonly --downloaddir=/root/rpms/data/admin/files/repo/rhel74-x86_64/ td-agent
SCRIPT

# message
echo ""
echo "Installation completed. Happy Logging!"
echo ""
```

## 初始化repodata索引文件

```bash
createrepo -pdo /root/rpms/data/admin/files/repo/rhel74-x86_64 /root/rpms/data/admin/files/repo/rhel74-x86_64
```

* 若rpm包有更新，则执行以下命令更新yum仓库

```bash
createrepo --update /root/rpms/data/admin/files/repo/rhel74-x86_64
```

## 提供yum服务

以 `http server` 的方式提供服务

```bash
cd /root/rpms/data/admin/files/repo/rhel74-x86_64

python -m SimpleHTTPServer 8080 &>/dev/null &
```

## 客户端配置

```bash
cat >/etc/yum.repos.d/td.repo <<EOF
[td-agent]
name=Server
baseurl=http://127.0.0.1:8080
enable=1
gpgcheck=0
EOF
```

## 客户端安装

```bash
yum install td-agent
```
