---
layout: post
title:  多个ssh共同使用
categories: git
tags: key
thread: gitkey
---

## 生成键值对

```bash
ssh-keygen -t rsa -C "youremail@email.com"
ssh-keygen -t rsa -C "youremail@email.com" -f ~/.ssh/<密钥对名>
ssh-keygen -t rsa -b 4096 -C "email@email.com" -m PEM # paramiko 2.4.2 以上版本需要以此方式生成
ssh-keygen -t ecdsa -m PEM -f test -C "email@email.com" # jenkins登录almalinux操作系统的key需要以此方式生成
```

## 配置主机

在~/.ssh/目录下新建config文件，用于配置各个公私钥对应的主机

```conf
Host *
    ForwardAgent yes
    ServerAliveInterval 3
    ServerAliveCountMax 20
    TCPKeepAlive no
    ControlMaster auto
    ControlPath ~/.ssh/connection-%r@%h:%p
    ControlPersist 4h
    Compression yes

Host seekplum.github.com # 主机名字，不能重名
    HostName github.com # 主机所在域名或IP
    User seekplum # 用户名称
    Port 22
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/id_rsa  # 私钥路径
```

## 修改项目的远程主机地址

* 查看远程主机地址

```bash
git remote -v
```

* 修改远程主机地址

```bash
git remote set-url origin git@seekplum.github.com:seekplum/seekplum.github.io.git
```

## 添加公钥进行使用

```bash
ssh-add -l
ssh-add ~/.ssh/id_rsa
ssh-add -d ~/.ssh/id_rsa
ssh-add -K ~/.ssh/id_rsa # 添加私钥，避免每次输入私钥密码
```

## 测试登录

```bash
ssh -T git@gitea.seekplum.top
ssh -vT git@gitea.seekplum.top  # 查看详细信息
```
