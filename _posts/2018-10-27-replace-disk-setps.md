---
layout: post
title:  Oracle更换磁盘步骤
categories: oracle
tags: oracle
thread: oracle
---
* 1.[计算节点]确定损坏磁盘在ASM磁盘组中的磁盘名

```bash
su – gird
dba
col name for a20;
col path for a40;
col failgroup for a20;
select b.name,a.name,a.failgroup,a.path from v$asm_disk a,v$asm_diskgroup b where a.group_number = b.group_number order by 2;
```

* 2.[计算节点]从ASM中删除该REDODG盘

> ALTER DISKGROUP \<dgname\> drop DISK \<disk_name\> force;

* 3.[计算节点]重平衡数据

> alter diskgroup \<dgname\>  rebalance power 11;

* 4.[计算节点]确认重平衡进度

exit返回到grid用户视图

> asmcmd lsop
 
该命令返回无结果，则可进行下一步

* 5.[存储节点]更换新盘并初始化
* 6.[计算节点]加载存储节点更换新盘
* 7.[计算节点]ASM中重新加入新盘

```bash
su – grid 
dba
alter diskgroup <dgname> add failgroup <failgroupname> disk '/dev/diskname' force;
```

* 8.[计算节点]重平衡数据

> alter diskgroup \<dgname\> rebalance power 11;

* 9.[计算节点]确认重平衡进度

> asmmcd lsop

该命令返回无结果，则说明重平衡完了