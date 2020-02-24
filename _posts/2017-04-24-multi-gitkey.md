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
```

## 配置主机

在~/.ssh/目录下新建config文件，用于配置各个公私钥对应的主机

```conf
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
ssh-add 私钥路径
ssh-add -d 私钥路径
```

## 测试登录

```bash
ssh -T git@gitea.seekplum.top
ssh -vT git@gitea.seekplum.top  # 查看详细信息
```
