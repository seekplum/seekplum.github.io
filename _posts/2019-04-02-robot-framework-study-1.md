---
layout: post
title:  Robot Framework 入门学习<一>
categories: python
tags: python robot framework
thread: python
---

## 前言

由于项目中需要对接口做黑盒测试，在查找相关测试框架过程中发现了业内较为流行的 [Robot Framework](http://robotframework.org)框架，于是进行了简单的试用。本篇主要记录 `Robot Framework` 的使用情况 。

## 测试需求

我们的需求暂时很简单，主要有以下几点

* 1.支持对API发送HTTP(GET/POST/PUT/DELETE)请求进行测试
* 2.支持对参数的任意组装和对返回的数据进行检查
* 3.支持 `setup` 和 `teardown` 机制
* 4.支持对接口完成的功能在系统真实环境进行检查
* 5.生成测试报告

## 安装

```bash
pip install robotframework
pip install robotframework-requests
```

## 完成一个登陆测试

### 目录结构

```bash
➜  robot tree -L 1
.
├── login.py
└── login.robot

0 directories, 2 files
```

### 文件内容

* `login.py` 文件内容(负责实现密码base64加密)

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import base64


def base64_encode(s):
    """对字符串进行base64加密

    :param s: str 要加密的字符串

    :rtype str
    :return 加密后的字符串
    """
    encode_base64_string = base64.b64encode(s)
    return encode_base64_string

```

* `login.robot` 文件内容

```robot
*** Settings ***
Documentation    登陆接口测试示例
Library  login
Library  Collections
Library  RequestsLibrary

*** Variables ***
${host}    http://localhost:11101

*** Test Cases ***
Post 登陆请求
    [Tags]            Post    login
    ${password}  base64_encode  admin3
    ${data}           Create Dictionary    name=admin    password=${password}
    create session    seekplum    ${host}
    ${response}       post request   seekplum   /users/auth      json=${data}
    should be equal as integers    ${response.status_code}     200
    ${resp}           to json   ${response.content}
    should not be empty    ${resp["data"]}
    dictionary should contain key  ${resp["data"]}     name
    dictionary should contain value  ${resp["data"]}     admin
    dictionary should contain key  ${resp["data"]}     id
    dictionary should contain key  ${resp["data"]}     token
    should be equal as integers    ${resp["error_code"]}     0

```

### 运行

```bash
robot login.robot
```

## 总结

通过对 `Robot Framework` 的简单试用，从需求角度上，确定可以基本满足我们的需求。但是在试用过程中也发现虽然其提供了IDE(软件名为: RIDE)可以可视化的对测试用例进行管理。但`Robot Framework` 语法较为复杂，除基础语法外，还需要了解其支持的测试库语法，**整体的学习成本较高**。同时在调试过程中发现报错信息较为简单，没有基本的堆栈信息，增加了排错成本。

我们的初衷是希望可以寻找一个可以满足我们需求，同时学习成本和维护成本都较低的测试框架。显然 `Robot Framework` 无法满足我们的需求。革命尚未成功，同志还需努力。
