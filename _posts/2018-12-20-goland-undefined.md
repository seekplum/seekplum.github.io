---
layout: post
title: 解决Goland run报错 undefined:xxxx
categories: goland
tags: goland go
thread: goland
---
## 环境
* OSX 10.13.4 (17E202)
* Goland 2018.3.3

## 问题现象

### 报错信息
```text
# command-line-arguments
./oracle_exporter.go:81:28: undefined: DBCollection
./oracle_exporter.go:82:28: undefined: DBCollection
./oracle_exporter.go:83:28: undefined: DBCollection
./oracle_exporter.go:84:28: undefined: DBCollection
./oracle_exporter.go:338:17: undefined: decryptAuth
./oracle_exporter.go:453:40: undefined: DBCollection
./oracle_exporter.go:498:30: undefined: encryptHandler
./oracle_exporter.go:499:30: undefined: decryptHandler
```

### 直接原因
多个go文件 `oracle_exporter.go`, `encrypt.go`, `db_collection.go` 都属于`main`包，直接执行 `go run oracle_exporter.go` 则发生了上面的报错。

```text
head -n 1 oracle_exporter.go encrypt.go db_collection.go
==> oracle_exporter.go <==
package main

==> encrypt.go <==
package main

==> db_collection.go <==
package main
```

### 根本原因
因为在 `mian` 包里，使用 `go run oracle_exporter.go`，编译器只会加载`oracle_exporter.go`这个文件，不会加载main包里的其他文件，只有非 `main` 包里的文件才会通过依赖去自动加载。所以你需要输入多个文件作为参数。

## 解决方案

### 命令行

> go run oracle_exporter.go encrypt.go db_collection.go

或

> go run *.go

### Goland
* 设置run

![Goland运行package](/static/images/goland/goland-run-packages.jpg) 

* 设置env

![依赖环境变量](/static/images/goland/oracle-client-env.jpg)
