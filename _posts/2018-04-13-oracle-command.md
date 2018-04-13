---
layout: post
title:  Oracle相关命令
tags: oracle user asm grid
thread: oraclecommand
---
## 用户赋权限
* 数据库dbsnmp用户创建
```
su - oracle
export ORACLE_SID=qdeploy1
sqlplus / as sysdba
alter user dbsnmp identified by oracle;
alter user dbsnmp account unlock;
```

* 创建视图
```
CREATE VIEW x$_ksppcv AS SELECT * FROM x$ksppcv;
GRANT SELECT ON x$_ksppcv TO dbsnmp;
CREATE VIEW x$_ksppi AS SELECT * FROM x$ksppi;
GRANT SELECT ON x$_ksppi TO dbsnmp;
```

* 给用户赋权限
> grant sysdba to dbsnmp;

* 删除用户
> drop user dbsnmp;

### ASM asmsnmp用户创建
* 创建密码文件(所有节点执行)：
```
su - grid
orapwd file=$ORACLE_HOME/dbs/orapw$ORACLE_SID password=oracle
```

* 查询已有的用户
> select * from v$pwfile_users;

* 设置asmsnmp用户的密码
```
su - grid
export ORACLE_SID=+ASM1
sqlplus / as sysasm
create user asmsnmp identified by asmsnmp; // 没有asmsnmp用户
alter user asmsnmp identified by asmsnmp; // 已有asmsnmp用户
grant sysdba to asmsnmp;  // 增加sysdba权限
grant sysasm to asmsnmp; // 增加 asm 权限
```

* 检查用户是否创建成功
> sqlplus asmsnmp/asmsnmp as sysasm

## 环境变量

> su - grid -c 'echo DBPOOLCMDBEGIN; export ORACLE_HOME=/opt/grid/products/11.2.0&&export PATH=\$PATH:\$ORACLE_HOME/bin:\$ORACLE_HOME/oracm/bin:\$ORACLE_HOME/OPatch:\$ORACLE_HOME/jdbc&&export LD_LIBRARY_PATH=\$ORACLE_HOME/lib:\$ORACLE_HOME/ctx/lib:\$ORACLE_HOME/oracm/lib&&export CLASSPATH=\$ORACLE_HOME/JRE:\$ORACLE_HOME/jlib:\$ORACLE_HOME/rdbms/jlib:\$ORACLE_HOME/network/jlib:$ORACLE_HOME/jdbc/lib; "CMD 命令"; echo DBPOOLCMDEND'

## Grid相关查询

* 获取集群中所有的节点
> olsnodes

* 获取集群名字
> olsnodes -c

* 获取节点对应的 ip
> cat /etc/hosts

* 节点对应的 vip
> olsnodes -i

* 查询crs状态
> crsctl check cluster -all

## DB相关查询

* 查询cpu,sga,pga大小
> select b.INSTANCE_NAME,name,value from gv\$parameter a,gv\$instance b where a.INST_ID=b.INSTANCE_NUMBER and a.name in ('sga_target','pga_aggregate_target','cpu_count')

* 查询instance状态
> srvctl status database -d test -v

* 启动/停止实例
> srvctl stop instance -d test -i test1

* 查询所有的db
> srvctl config database

* 查询DB的信息
> crsctl stat res ora.test.db -v | grep com

* 启动/停止db
> srvctl stop database -d test


* 在线迁移
> 只针对RAC One Node类型

* 查看磁盘状态
> crsctl status res -t
> crsctl status res -t -init

* 查看监听状态
> lsnrctl status

* 启动监听
> srvctl start scan_listener

* 查询scan信息
> srvctl config scan

* 注册监听
> alter system register;

* 查询监听端口
> srvctl config listener

* crs启动日志
> clog

* 启动crs
> crsctl start crs
> crsctl stop crs -f

* 查看crs状态
> crsctl stat res -t
> crsctl stat res -t -init

## 磁盘组操作
* 查询磁盘组路径
```
set linesize 200
set pagesize 400
col name format a10
col group_number format 99
col DG_NAME format a15
col failgroup format a15
col DISK_NAME format a15
col DISK_PATH format a40
col mount_status format a15
col header_status format a15
col mode_status format a15
col state format a15

select dg.group_number,
    dg.name AS DG_NAME,
    d.failgroup,
    d.name as DISK_NAME,
    nvl(d.path, 'NONE') as DISK_PATH,
    d.mount_status,
    d.header_status,
    d.mode_status,
    d.state
from v$asm_diskgroup dg, v$asm_disk d
where dg.group_number = d.group_number and
       dg.group_number <> 0
order by dg.name, d.FAILGROUP, d.name;
```
* 查询磁盘组状态
```
set linesize 9999
set pagesize 9999
col name format a10
col group_number format 99
col AU_SIZE_MB format 99
col NAME format a10
col TYPE format a15
col TOTAL_MB format 999999999
col FREE_MB format 999999999
col OFFLINE_DISKS format 99999
col VOTING_FILES format a15
col IS_REBAL format 99
col TIME_LEFT format 99

select dg.group_number,
   dg.NAME,
   dg.ALLOCATION_UNIT_SIZE/1024/1024 as "AU_SIZE_MB",
   dg.STATE,
   NVL(dg.TYPE, 'NONE') as "TYPE",
    dg.TOTAL_MB,
    dg.FREE_MB,
    dg.OFFLINE_DISKS,
     dg.VOTING_FILES,
      NVL(op.OPERATION, 'NONE') as "IS_REBAL",
      NVL(op.EST_MINUTES, 0) as "TIME_LEFT"
   from v$asm_diskgroup dg left outer join v$asm_operation op on dg.group_number = op.group_number;
```
* 查询磁盘属性
```
set linesize 200
set pagesize 400
col name format a10
col disk_repair_time format a15
col offline_disks format 99
select dg.name,
       dg.offline_disks,
       (select value
          from V$ASM_ATTRIBUTE attr
         where attr.group_number = dg.group_number
           and name = 'disk_repair_time') "disk_repair_time"
  from v$asm_diskgroup dg;
```

* 查询用到的磁盘路径
> set pagesize 9999
> set linesize 9999
> select dg.name AS DG_NAME,
                    nvl(d.path, 'NONE') as DISK_PATH
                from v\$asm_diskgroup dg, v$asm_disk d
                where dg.group_number = d.group_number and
                       dg.group_number <> 0
                order by dg.name, d.FAILGROUP, d.name;

* 创建磁盘组
> CREATE DISKGROUP DATADG normal REDUNDANCY 
failgroup DATAFG1 disk '/dev/qdata/mpath-s02.3264.01.P0B00S16'   
failgroup DATAFG2 disk '/dev/qdata/mpath-s03.3262.01.S0P2IX3B6'   
failgroup DATAFG3 disk '/dev/qdata/mpath-s01.3261.01.P0B00S00p1'   
attribute 'au_size'='2M';
> alter diskgroup DATADG set attribute 'compatible.asm'='11.2.0.4';
> alter diskgroup DATADG set attribute 'compatible.rdbms'='11.2.0.4';
> alter diskgroup DATADG set attribute 'disk_repair_time'='36h';

* 删除asm磁盘
> drop diskgroup testdg;

* 强制删除asm磁盘组
> drop diskgroup testdg force including contents;

* online 磁盘
> select name from v$asm_diskgroup;
> asmcmd online -a -G TESTDG;

* offline磁盘
> select name from v$asm_disk; 
> asmcmd offline -G TESTDG -D TESTDG_0001

## 查询磁盘组
* 查询所有磁盘组
> lsdg

* 查询磁盘组用的磁盘
> lsdsk -k

## DB操作
* 创建DB
> dbca -silent -createDatabase -templateName General_Purpose.dbc -gdbName qdeploy -nodelist qdata-com41-dev,qdata-com42-dev -sid qdeploy -sysPassword oracle -systemPassword oracle -storageType ASM -diskGroupName DATADG -characterSet AL32UTF8 -nationalCharacterSet AL16UTF16 -databaseType OLTP -redoLogFileSize 1024 -initparams  sga_target=1945,pga_aggregate_target=307,db_create_online_log_dest_1=+DATADG,resource_manager_plan=default_plan

* 删除db
> dbca -silent -deleteDatabase -sourceDB test -sysDBAUserName sys -sysDBAPassword oracle
