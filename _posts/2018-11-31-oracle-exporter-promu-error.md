---
layout: post
title: oracle采集端使用promu build报错分析
categories: oracle
tags: oracle promu oracle_exporter
thread: oracle
---

## 错误信息
```text
/usr/local/go/pkg/tool/linux_amd64/link: running gcc failed: exit status 1
/usr/bin/ld: cannot find -lclntsh
/usr/bin/ld: cannot find -lpthread
/usr/bin/ld: cannot find -lc
collect2: error: ld returned 1 exit status

!! command failed: build -o oracle_exporter -ldflags -X woqutech.com/qflame/oracle_exporter/vendor/github.com/prometheus/common/version.Version=1.0.0 -X woqutech.com/qflame/oracle_exporter/vendor/github.com/prometheus/common/version.Revision=f0d716bed22386a346321e4d20b204ff87421c9e -X woqutech.com/qflame/oracle_exporter/vendor/github.com/prometheus/common/version.Branch=release-1.5.0 -X woqutech.com/qflame/oracle_exporter/vendor/github.com/prometheus/common/version.BuildUser=root@f2a2d6982ef1 -X woqutech.com/qflame/oracle_exporter/vendor/github.com/prometheus/common/version.BuildDate=20181121-04:01:54  -extldflags '-static' -a -tags 'netgo static_build' woqutech.com/qflame/oracle_exporter: exit status 2
make: *** [oracle] Error 1
```


## 调试
* 1.进入容器

> docker run -ti -v `pwd`:/root/go/src/woqutech.com/qflame/oracle_exporter -w /root/go/src/woqutech.com/qflame/oracle_exporter exporter-builder  bash

* 2.设置符号链接

```bash
ln -s /usr/lib/oracle/12.1/client64/lib/libclntsh.so /usr/lib/libclntsh.so
ln -s /usr/lib/oracle/12.1/client64/lib/libclntsh.so.12.1 /usr/lib/libclntsh.so.12.1
ln -s /usr/lib/oracle/12.1/client64/lib/libclntshcore.so /usr/lib/libclntshcore.so
ln -s /usr/lib/oracle/12.1/client64/lib/libclntshcore.so.12.1 /usr/lib/libclntshcore.so.12.1

ln -s /usr/lib/oracle/12.1/client64/lib/libclntsh.so /usr/lib64/libclntsh.so
ln -s /usr/lib/oracle/12.1/client64/lib/libclntsh.so.12.1 /usr/lib64/libclntsh.so.12.1
ln -s /usr/lib/oracle/12.1/client64/lib/libclntshcore.so /usr/lib64/libclntshcore.so
ln -s /usr/lib/oracle/12.1/client64/lib/libclntshcore.so.12.1 /usr/lib64/libclntshcore.so.12.1
```

## 解决方法

### 问题1
* 报错

```text
/usr/bin/ld: cannot find -lpthread
/usr/bin/ld: cannot find -lc
```

* 解决方法

> yum install -y glibc-static

### 问题2
* 报错

```text
/usr/bin/ld: cannot find -lclntsh
```

* 解决方法

未知😭
