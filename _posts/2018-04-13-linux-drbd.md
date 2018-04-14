---
layout: post
title:  DRBD使用
tags: linux drbd
thread: drbd
---
## 简介
1.是什么?

DRBD （Distributed Replicated Block Device，分布式复制块设备）是由内核模块和相关脚本而构成，用以构建高可用性的集群。其实现方式是通过网络来镜像整个设备。你可以把它看作是一种网络RAID1。

2.DRBD的工作原理

```

        +-----------+
        |  文件系统 |
        +-----------+
              |
              V
       +--------------+
       |   块设备层   |
       | (/dev/drbd1) |
       +--------------+
        |            |
        |            |
        V            V
+-------------+  +------------+
|  本地硬盘   |  |  远程硬盘  |
| (/dev/hdb1) |  | (/dev/hdb1)|
+-------------+  +------------+
    host1             host2
```

host1, host2 会有`主`, `从`状态

3.主要功能

DRBD负责接收数据,把数据写入本地磁盘,然后通过网络将同样的数据发送给另一台主机,另一台主机再将数据存放到自己的磁盘中.

4.配置工具

```
drbdadm: 高级管理工具,管理`/etc/drbd.conf`,向`drbdsetup`和`drbdmeta`发送指令
drbdsetup: 配置装载进kernel的DRBD模块
drbdmeta: 管理META数据结构
```

5.复制模式

```
协议A：异步复制协议。本地写成功后立即返回，数据放在发送buffer中，可能丢失。
协议B：内存同步（半同步）复制协议。本地写成功并将数据发送到对方后立即返回，如果双机掉电，数据可能丢失。
协议C：同步复制协议。本地和对方写成功确认后返回。如果双机掉电或磁盘同时损坏，则数据可能丢失。
一般用协议C，但选择C协议将影响流量，从而影响网络时延。为了数据可靠性，我们在生产环境中还是用C协议
```

### 磁盘状态
```
Diskless: 无盘状态
Inconsistent: 不一致状态
Outdated: 过时状态
DUnknown: 未知状态
Consistent: 一致状态
UpToDate: 最新状态
```

### online 磁盘前检查
1.新建资源

> drbdsetup new-resource r{资源号} # drbdsetup new-resource r0

2.启动资源

> drbdsetup new-minor r{资源号} {资源号} 0 # drbdsetup new-minor r0 0 0

3.查询资源状态

> drbdsetup dstate {资源号} # drbdsetup dstate 0  # Unconfigured(未配置), Diskless(无磁盘)

4.如果资源状态时无盘或者未配置状态,进行attach磁盘操作

> drbdmeta 0 v08 {磁盘名} internal apply-al # drbdmeta 0 v08 /dev/VolGroup/voting internal apply-al
drbdsetup attach {资源号} {磁盘名} {磁盘名} internal --on-io-error=detach --c-max-rate=100M --c-min-rate=40M --resync-rate=100M --fencing=resource-only  # drbdsetup attach 0 /dev/VolGroup/voting /dev/VolGroup/voting internal --on-io-error=detach --c-max-rate=100M --c-min-rate=40M --resync-rate=100M --fencing=resource-only

5.查询device mapper设备的状态

> dmsetup table {设备名} # dmsetup table voting

6.查询连接状态

> drbdsetup cstate {资源号} # drbdsetup cstate 0

7.连接drbd

> drbdsetup connect r{资源号} {本地ip} {对端ip} --discard-my-data=no --protocol C --allow-two-primaries --after-sb-0pri=discard-zero-changes --after-sb-1pri=call-pri-lost-after-sb  --after-sb-2pri=call-pri-lost-after-sb --verify-alg=md5 --timeout=30 --connect-int=2 --ping-int=2 # drbdsetup connect r0 172.16.128.44 172.16.128.57 --discard-my-data=no --protocol C --allow-two-primaries --after-sb-0pri=discard-zero-changes --after-sb-1pri=call-pri-lost-after-sb  --after-sb-2pri=call-pri-lost-after-sb --verify-alg=md5 --timeout=30 --connect-int=2 --ping-int=2



### offline 磁盘
1.等待命令结束
2.删除盘符

```
dmsetup remove {设备名} # dmsetup remove voting
```

3.关闭

```
drbdsetup down r{资源号} # drbdsetup down r0
```

