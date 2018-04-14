---
layout: post
title:  多个ssh共同使用
categories: git
tags: key
thread: gitkey
---

## 生成键值对
> 1.ssh-keygen -t rsa -C "youremail@email.com"

> 2.ssh-keygen -t rsa -C "youremail@email.com" -f ~/.ssh/你的密钥对名

## 在~/.ssh/目录下新建config文件，用于配置各个公私钥对应的主机
```
Host xxx.github.com  // 主机名字，不能重名
HostName github.com   // 主机所在域名或IP
User git  // 用户名称
IdentityFile C:/Users/username/.ssh/id_rsa_second  // 私钥路径
```

## 修改项目的远程主机地址
* 查看远程主机地址

> git remote -v

* 修改远程主机地址

> git remote set-url origin git@xxx.github.com:xx/xx.git

## 添加公钥进行使用
* ssh-add -l
* ssh-add 私钥名