---
layout: post
title:  adminmongo使用
categories: mongodb
tags: mongodb
thread: mongodb
---

## 环境

* OS: OSX 10.15.1 (19B88)

## 安装MongoDB

* 卸载

mongodb 已经不在 brew 源中了，之前已经安装过则先进行卸载操作

```bash
brew services stop mongodb
brew uninstall mongodb
```

* 重新安装

```bash
brew tap mongodb/brew
brew install mongodb-community
brew sercipce list
brew services start mongodb-community
```

## 安装 adminMongo

详细文档可见 [Github地址](http://github.com/mrvautin/adminmongo)

```bash
docker run -d -e HOST=0.0.0.0 -e PORT=1234 -p 12345:1234 -v ~/data/adminmongo:/app/user/config --name adminmongo mrvautin/adminmongo
```

## 配置

* Connection name: xxx
* Connection string: mongodb://x.x.x.x:27017/test

配置后可以在页面进行修改数据和索引，`Add document` 时填写对象则写入单条数据，填写数组则写入多条数据

## 脚本写入数据

```python
# -*- coding: utf-8 -*-
import json

import requests

url = "http://adminmongo.dev.net/document/meizhedb/meizhedb/function_used/insert_doc"

doc = {"uid": 123456789}
data = {"objectData": json.dumps(doc)}
headers = {
    "Host": "127.0.0.1:12345"
}
proxies = {
    "http": "http://127.0.0.1:12345",
    "https": "http://127.0.0.1:12345",
}
resp = requests.post(url, data=data, headers=headers, proxies=proxies)

print(resp.json())
```
