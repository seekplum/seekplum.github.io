---
layout: post
title: go-sqlite3编译报错分析
categories: go
tags: go-sqlite3 build
thread: go
---
## 环境

* OS: Red Hat Enterprise Linux Server release 7.4 (Maipo)
* GO: go version go1.10.3 linux/amd64
* kernel: Linux 10-10-100-38 3.10.0-693.el7.x86_64 #1 SMP Thu Jul 6 19:56:57 EDT 2017 x86_64 x86_64 x86_64 GNU/Linux

## 编译命令

```bash
CGO_ENABLED=0 GOOS=linux go build -a -ldflags '-extldflags "-static"' -o .build/midgard ./cmd/main.go
```

## 报错信息

```text
Binary was compiled with 'CGO_ENABLED=0', go-sqlite3 requires cgo to work. This is a stub
```

## 原因

go-sqlite3必须要启用CGO编译，即需要设置 `CGO_ENABLED=1`，需要安装 `glibc-static`， 可使用下面的脚本 `build.sh` 进行编译。

## 可用的编译脚本

* 使用前安装依赖软件

```bash
yum -y install make gcc wget git glibc-static
```

* vi build.sh

```bash
#/usr/bin/env bash

RETVAL=0
current_path=`pwd`
file_path=$(dirname $0)

PLATFORM=linux
if [ $# -gt 0 ] ; then
    PLATFORM=$1
fi
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD |sed 's/[ ][ ]*/,/g')
COMMIT_ID=$(git rev-parse HEAD |sed 's/[ ][ ]*/,/g')
GO_VERSION=$(go version |sed 's/[ ][ ]*/,/g')
BUILD_TIME=$(date +%FT%T%z |sed 's/[ ][ ]*/,/g')
BUILD_USER=$(whoami)@$(hostname |sed 's/[ ][ ]*/,/g')

export CGO_ENABLED=1
export GOOS=${PLATFORM}
echo "CGO_ENABLED=${CGO_ENABLED}"
echo "PLATFORM=${PLATFORM}"

go build -a -ldflags "-extldflags \"-static\" -X main.BranchName=${BRANCH_NAME} -X main.CommitId=${COMMIT_ID} -X main.GoVersion=${GO_VERSION} -X main.BuildTime=${BUILD_TIME} -X main.BuildUser=${BUILD_USER}" -o ${current_path}/.build/midgard ${current_path}/cmd/main.go

unset CGO_ENABLED
unset PLATFORM
```

* 使用

```bash
bash build.sh linux
```
