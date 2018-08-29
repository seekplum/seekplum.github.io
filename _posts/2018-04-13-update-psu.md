---
layout: post
title:  更新PSU
tags: linux psu
thread: psu
---
### 适用范围
```
本文档基于PSU 11.2.0.4.8编写，理论上11.2.0.4版本之后都可参照此文档
11.2.0.4以后，GI的PSU除了包含自GI自身的PSU外，还包含了DB的PSU，通过opatch auto方式可以自动给GI和DB打PSU，极大的提供了安装PSU的便捷性。本文档除了提供opatch auto安装方式，还提供了手工安装PSU的方式。有些时候DB端可能存在重大BUG，DBA想暂时只打DB的PSU，本文也提供了只对DB进行安装PSU的过程。

```

### 补丁下载

```
Quick Reference to Patch Numbers for Database PSU, SPU(CPU), Bundle Patches and Patchsets (文档 ID 1454618.1)
```

安装前准备

```
2.2获取最新PSU信息
参照MOS文档1454618.1来了解最新的PSU信息。一名专业的DBA应该及时跟进ORACLE官方发布的PSU信息，了解各版本PSU 所fix的数据库BUG。
Note 1454618.1 Quick Reference to Patch Numbers for Database PSU, SPU(CPU), Bundle Patches and Patchsets

2.3阅读PSU的README文件
每一个PSU的安装包都会包含一个 README的文档，它是DBA打补丁之前需要仔细阅读的重要参考文档，里面包含了详细的此PSU的安装信息以及需要注意的安装事项。
2.4Opatch工具安装
Opatch工具现在都已经集成在了ORACLE安装软件的home路径下，但是自带的OPATCH版本可能不够高，DBA在安装PSU之前需要查看PSU安装包中README.html的OPatch Utility Information部分，获取此版本PSU对opatch工具的最小版本要求。如果自带的opatch工具不满足最小版本要求，需要下载相应版本的opatch工具。对于11.2.0.4.8的PSU，需要的OPATCH最小版本为11.2.0.3.6，ORACLE推荐使用11.2最新的OPATCH版本。（不能使用12.X的OPATCH版本）。 
Opatch工具下载地址：
https://updates.oracle.com/download/6880880.html
安装opatch参考命令：
对GI_HOME ORACLE_HOME目录下的OPatch进行重命名（略）
# unzip <OPATCH-ZIP> -d <ORACLE_HOME>
# unzip <OPATCH-ZIP> -d <GI_HOME>
#chown –R grid.oinstall $GI_HOME/OPatch
#chown –R oracle.oinstall $ORACLE_HOME/OPatch
# <GI_HOME>/OPatch/opatch version
# <ORACLE_HOME>/OPatch/opatch version

2.5下载解压patch
可以从MOS文档1454618.1中下载到各版本的PSU。这里下载了11.2.0.4.8的GI的PSU，此PSU包含了DB的PSU。
unzip p21523375_112040_Linux-x86-64.zip -d /opt/grid
chown -R grid.oinstall /opt/grid/21523375
chmod -R 777 /opt/grid/21523375
查看解压目录下的文件目录
ls -l
total 140
drwxrwxrwx 10 grid oinstall  4096 Sep  1 15:51 21352635
drwxrwxrwx  5 grid oinstall  4096 Sep  3 15:03 21352642
drwxrwxrwx  5 grid oinstall  4096 Sep  3 14:43 21352649
-rwxrwxrwx  1 grid oinstall   549 Sep  3 15:12 bundle.xml
-rwxrwxrwx  1 grid oinstall 65034 Sep  1 15:55 PatchSearch.xml
-rwxrwxrwx  1 grid oinstall 60991 Oct 20 19:32 README.html
-rwxrwxrwx  1 grid oinstall     0 Sep  3 15:13 README.txt
前三个文件夹是此PSU的sub-patch，可以通过README文件知道这三个sub-patch需要打个哪个ORACLE_HOME下。
 
可以看到三个补丁都要应用到GI HOME下，前两个补丁也要应用到DB HOME下。
2.6冲突检测
查看已经安装的补丁信息：
$ <ORACLE_HOME>/OPatch/opatch lsinventory -detail -oh <ORACLE_HOME>
如果当前版本没有任何one-off补丁，那么安装PSU一般不会存在补丁的冲突。如果当前版本安装了one-off补丁，那么需要检查是否存在补丁冲突：
$opatch prereq CheckConflictAmongPatchesWithDetail -phBaseDir /opt/grid/21523375/21352635
如果确定存在补丁冲突，一般需要先卸载掉one-off的补丁，然后安装PSU，然后再安装对应PSU版本下的one-off patch。
例如:DB上的16776922 one-off patch跟现在要打的PSU冲突了，需要先回退掉该one-off patch。
opatch prereq CheckConflictAgainstOHWithDetail -ph ./

oracle@qdata-rac1:/tmp/21352635>opatch prereq CheckConflictAgainstOHWithDetail -ph ./

Oracle Interim Patch Installer version 11.2.0.3.12
Copyright (c) 2015, Oracle Corporation.  All rights reserved.

PREREQ session

Oracle Home       : /opt/oracle/products/11.2.0
Central Inventory : /opt/grid/oraInventory
   from           : /opt/oracle/products/11.2.0/oraInst.loc
OPatch version    : 11.2.0.3.12
OUI version       : 11.2.0.4.0
Log file location : /opt/oracle/products/11.2.0/cfgtoollogs/opatch/opatch2015-11-03_16-17-47PM_1.log

Invoking prereq "checkconflictagainstohwithdetail"

ZOP-40: The patch(es) has conflicts with other patches installed in the Oracle Home (or) among themselves.

Prereq "checkConflictAgainstOHWithDetail" failed.

Summary of Conflict Analysis:

There are no patches that can be applied now.

Following patches have conflicts. Please contact Oracle Support and get the merged patch of the patches : 
16776922, 21352635

Whole composite patch Conflicts/Supersets are:

Composite Patch : 21352635

        Conflict with 16776922

Detail Conflicts/Supersets for each patch are:

Sub-Patch : 19769489

        Conflict with 16776922
        Conflict details:
        /opt/oracle/products/11.2.0/lib/libserver11.a:qesl.o
        /opt/oracle/products/11.2.0/lib/libserver11.a:kokl.o

OPatch succeeded.
  $ opatch rollback -id 16776922
2.7停止dbconsole
SELECT name, db_unique_name FROM v$database;

NAME               DB_UNIQUE_NAME
------------------ ------------------------
WXH                wxh
export ORACLE_UNQNAME=wxh
emctl stop dbconsole  

```

安装PSU（两种模式）

```
2.8Opatch auto方式
Opatch auto安装PSU方式以滚动方式进行安装，每次只能安装一个节点，opatch auto安装过程中，运行opatch auto命令的节点会临时不可用。
OCM配置
Opatch auto方式安装PSU的整个过程会以静默方式进行，需要创建OCM配置文件来达到此目的，创建OCM参考文档：
Doc ID 966023.1
How to Create an OCM Response file to Apply a Patch in Silent Mode - opatch silent
syntax : 
export ORACLE_HOME=<my_oracle_home_path>
$ORACLE_HOME/OPatch/ocm/bin/emocmrsp  -no_banner -output <specify_the_location>/file.rsp

* creates the response in location specified by the parameter "-output"
* running without "-output <specify_the_location>/file.rsp"  creates the file in current directory with default name

GI和ORACLE用户必须要对OCM文件有读写权限，检查OCM文件的权限：
#su - oracle -c 'ls -l /opt/grid/file.rsp'      
#su - grid -c 'ls -l /opt/grid/file.rsp'   


lsof | grep libclntsh
如果以上命令输出不为空，会导致升级失败，需要将其中的进程kill掉。


以下为操作记录：
Grid用户：
$ORACLE_HOME/OPatch/ocm/bin/emocmrsp  -no_banner -output /opt/grid/file.rsp
Provide your email address to be informed of security issues, install and
initiate Oracle Configuration Manager. Easier for you if you use your My
Oracle Support Email address/User Name.
Visit http://www.oracle.com/support/policies.html for details.
Email address/User Name: 

You have not provided an email address for notification of security issues.
Do you wish to remain uninformed of security issues ([Y]es, [N]o) [N]:  y
The OCM configuration response file (/tmp/file.rsp) was successfully created.

安装PSU
在安装之前如果集群存在ACFS 文件系统的话要先umount掉。首先要关闭非Oracle使用acfs的进程，然后umount ACFS
1 如果ACFS 文件系统被Oracle 数据库软件所使用，则执行下面
 找到crs管理acfs系统资源的名字
    # crsctl stat res -w "TYPE = ora.acfs.type" -p | grep VOLUME
    停止crs管理的acfs文件系统资源
    # srvctl stop filesystem -d <volume device path> -n <node to stop file system on>
 2  如果ACFS 文件系统没有被oracle 数据库软件使用，而且是被注册到ACFS 注册表中，则按照以下这行
  找到ACFS挂载点
   # /sbin/acfsutil registry
   卸载挂载点
   # /bin/umount <mount-point>
root用户：
#opatch auto /opt/grid/21523375 -ocmrf /opt/grid/file.rsp 
会自动安装GI和DB的PSU，这一步如果出现问题，检查对应的安装日志，解决问题后可重新运行该命令。安装过程中会停止该节点上的GI资源和DB资源。安装期间，本节点数据库不可用。
在GI和DB的操作系统用户下，检查PSU安装结果
Grid:
opatch lsinventory
Oracle:
opatch lsinventory
opatch auto命令只会对命令运行节点安装PSU。该节点安装完成后，再另一（一些）节点执行相同的命令。
安装数据字典
待所有RAC节点都安装完PSU后，开始进行升级数据字典的操作，只需要在一个RAC节点执行：
cd $ORACLE_HOME/rdbms/admin
sqlplus /nolog
SQL> CONNECT / AS SYSDBA
SQL> STARTUP
SQL> @catbundle.sql psu apply
SQL> QUIT

编译失效对象
cd $ORACLE_HOME/rdbms/admin
sqlplus /nolog
SQL> CONNECT / AS SYSDBA
SQL> @utlrp.sql

检查$ORACLE_BASE/cfgtoollogs/catbundle 目录下这两个文件是否有任何错误：
catbundle_PSU_<database SID>_APPLY_<TIMESTAMP>.log
catbundle_PSU_<database SID>_GENERATE_<TIMESTAMP>.log
检查安装结果
检查数据字典升级情况，Oracle用户（单节点）：
select * from  dba_registry_history;
```

## Attention

```
Readme中提示：GI PSU 中包括DB PSU,opatch会同时自动打GI PSU和DB PSU。但自动打DB PSU会有一个局限性，即OCR中必须包含database的注册信息，否则会忽略DB PSU的安装
检查ocr中是否有database的注册信息：
Grid用户：

$ORACLE_HOME/bin/crsctl stat res -p -w "TYPE = ora.database.type" | egrep '^NAME|^ORACLE_HOME' 

如果无返回表明ocr中不包含database的注册信息，此时使用opatch auto方式，程序输出最直观的表现是没有应用到oracle用户成功或者失败的任何提示，且日志中也无任何相关信息记录。

如果ocr中不包含database的注册信息，且执意要DB PSU,有两种解决方式：
第一种：Grid用户的PSU成功后，指定oracle用户目录，再次打PSU，参考命令：
root用户：

# opatch auto <UNZIPPED_PATCH_LOCATION> -oh <RAC_HOME> -ocmrf <ocm response file> 

实际参考用例：
/opt/grid/products/11.2.0/OPatch/opatch auto /opt/grid/21523375 -oh  /opt/oracle/products/11.2.0 -ocmrf /opt/grid/products/11.2.0/OPatch/ocm/bin/ocm.rsp


第二种：创建database，利用dbca或者dbca.rsp。数据库创建成功后，检查ocr中包含database的注册信息无误后，从头执行opatch auto命令
```

```
2.9手工安装
本文档提供的手工安装方式也是以滚动方式安装PSU，手工安装的方式也可以一个命令对多个节点打PATCH，主要是依靠opatch 命令不带local参数来实现的。
停止DB homes上的资源，以oracle用户执行
oracle用户执行：
/opt/oracle/products/11.2.0/bin/srvctl stop home -o /opt/oracle/products/11.2.0 -s /opt/oracle/products/11.2.0/srvm/admin/stophome.txt -n rac1 -f

打GI patch
root用户：
/opt/grid/products/11.2.0/crs/install/rootcrs.pl -unlock 

grid用户：
/opt/grid/products/11.2.0/OPatch/opatch napply /opt/grid/21523375/21352635 -local -silent -ocmrf /opt/grid/file.rsp -oh /opt/grid/products/11.2.0 -invPtrLoc /opt/grid/products/11.2.0/oraInst.loc

/opt/grid/products/11.2.0/OPatch/opatch napply /opt/grid/21523375/21352649 -local -silent -ocmrf /opt/grid/file.rsp -oh /opt/grid/products/11.2.0 -invPtrLoc /opt/grid/products/11.2.0/oraInst.loc

/opt/grid/products/11.2.0/OPatch/opatch napply /opt/grid/21523375/21352642 -local -silent -ocmrf /opt/grid/file.rsp -oh /opt/grid/products/11.2.0 -invPtrLoc /opt/grid/products/11.2.0/oraInst.loc

打DB patch
Oracle用户执行：
/opt/grid/21523375/21352649/custom/server/21352649/custom/scripts/prepatch.sh -dbhome /opt/oracle/products/11.2.0

/opt/oracle/products/11.2.0/OPatch/opatch napply /opt/grid/21523375/21352635 -local -silent -ocmrf /opt/grid/file.rsp -oh /opt/oracle/products/11.2.0 -invPtrLoc /opt/oracle/products/11.2.0/oraInst.loc

/opt/oracle/products/11.2.0/OPatch/opatch napply /opt/grid/21523375/21352649/custom/server/21352649 -local -silent -ocmrf /opt/grid/file.rsp -oh /opt/oracle/products/11.2.0 -invPtrLoc /opt/oracle/products/11.2.0/oraInst.loc

/opt/grid/21523375/21352649/custom/server/21352649/custom/scripts/postpatch.sh -dbhome /opt/oracle/products/11.2.0
启动CRS
Root用户执行：
/opt/grid/products/11.2.0/rdbms/install/rootadd_rdbms.sh
/opt/grid/products/11.2.0/crs/install/rootcrs.pl -patch
启动ORACLE
Oracle用户执行：
/opt/oracle/products/11.2.0/bin/srvctl start home -o /opt/oracle/products/11.2.0 -s /opt/oracle/products/11.2.0/srvm/admin/stophome.txt -n rac1
安装数据字典
每个RAC节点重复以上操作，然后进行数据字典的更新和安装，参考opatch auto方式的安装数据字典部分
检查安装结果
参考opatch auto方式检查安装结果部分

```

回滚卸载PSU

```
2.10Opatch auto回退
软件回退
opatch auto /opt/grid/21523375 -rollback -ocmrf /home/grid/file.rsp
此命令只会回退本节点的PSU，另外节点如果有需要执行相同如上操作。
数据字典回退
在一个节点的RAC上执行如下操作：
cd $ORACLE_HOME/rdbms/admin
sqlplus /nolog
SQL> CONNECT / AS SYSDBA
SQL> STARTUP
SQL> @catbundle_PSU_<database SID PREFIX>_ROLLBACK.sql
SQL> QUIT

2.11手工安装PSU的回退
每个节点都要执行
停止DB资源
/opt/oracle/products/11.2.0/bin/srvctl stop home -o /opt/oracle/products/11.2.0 -s /opt/oracle/products/11.2.0/srvm/admin/stophome.txt -n rac1 -f

运行root脚本 
/opt/grid/products/11.2.0/crs/install/rootcrs.pl -unlock
/sbin/fuser -k /opt/grid/products/11.2.0/bin/crsctl.bin

回退GI psu
Grid用户执行： 
/opt/grid/products/11.2.0/OPatch/opatch rollback -id 21352635 -local -silent -oh /opt/grid/products/11.2.0 -invPtrLoc /opt/grid/products/11.2.0/oraInst.loc

/opt/grid/products/11.2.0/OPatch/opatch rollback -id 21352649 -local -silent -oh /opt/grid/products/11.2.0 -invPtrLoc /opt/grid/products/11.2.0/oraInst.loc 

/opt/grid/products/11.2.0/OPatch/opatch rollback -id 21352642 -local -silent -oh /opt/grid/products/11.2.0 -invPtrLoc /opt/grid/products/11.2.0/oraInst.loc

回退DB PSU
Oracle用户执行：
/opt/grid/21523375/21352649/custom/server/21352649/custom/scripts/prepatch.sh -dbhome /opt/oracle/products/11.2.0
/opt/oracle/products/11.2.0/OPatch/opatch rollback -id 21352635 -local -silent -oh /opt/oracle/products/11.2.0 -invPtrLoc /opt/oracle/products/11.2.0/oraInst.loc

/opt/oracle/products/11.2.0/OPatch/opatch rollback -id 21352649 -local -silent -oh /opt/oracle/products/11.2.0 -invPtrLoc /opt/oracle/products/11.2.0/oraInst.loc

/opt/grid/21523375/21352649/custom/server/21352649/custom/scripts/postpatch.sh -dbhome /opt/oracle/products/11.2.0

运行post脚本 
root用户执行：
/opt/grid/products/11.2.0/rdbms/install/rootadd_rdbms.sh
/opt/grid/products/11.2.0/crs/install/rootcrs.pl -patch

启动DB资源
oracle用户执行：
/opt/oracle/products/11.2.0/bin/srvctl start home -o /opt/oracle/products/11.2.0 -s /opt/oracle/products/11.2.0/srvm/admin/stop.txt -n rac1

```

只打DB的PSU

```
2.12安装前准备
参考本章开始章节
2.13下载解压PATCH
需要的软件
补丁程序21352635: DATABASE PATCH SET UPDATE 11.2.0.4.8 (INCLUDES CPUOCT2015)
2.14安装部署。
安装PSU 21352635
>>> 停止1号机数据库的ORACLE_HOME下所有的数据库实例，包括asm
$srvctl stop instance -d <dbname> -i <instance_name>
$srvctl stop asm -n <nodename>
>>> 在1号机上打补丁
$su - oracle
$cd /tmp/21352635
$opatch apply
>>> 当opatch会问您是否要打下一个节点。这时候执行下面的操作。
启动1号机的ASM 实例和数据库实例：
    $srvctl start asm -n <nodename>
    $srvctl start instance -d <dbname> -i <instance_name>
停止2号机的ASM实例和数据库实例：
    $srvctl stop instance -d <dbname> -i <instance_name>
    $srvctl stop asm -n <nodename>
>>> 在之前打补丁的那个提示符中，确认继续打下一个节点。
    Is the node ready for patching? [y|n] 
    y <====输入y
>>> 启动2号机的ASM实例和数据库实例，3号节点类似操作：
    $srvctl start asm -n <nodename>
    $srvctl start instance -d <dbname> -i <instance_name>
>>> 在三个节点分别执行下面的命令来确认补丁已经安装成功。
    $ORACLE_HOME/OPatch/opatch lsinventory


2.15安装数据字典
参照上面章节安装数据字典部分
2.16检查安装结果
按照上面章节安装数据字典部分

2.17回退DB PSU
>>> 停止1号机数据库ORACLE_HOME下所有的数据库实例（如果有ASM，也要停止）：
$srvctl stop instance -d <dbname> -i <instance_name>
$srvctl stop asm -n <nodename>
>>> 在1号机回滚补丁：
$su - oracle
$cd $ORACLE_HOME/OPatch/8575528
$opatch rollback -id 8575528
Are all the nodes ready for patching? [y|n]
y <=========输入y
User Responded with: Y
The node 'nascds15' will be patched next.


Please shutdown Oracle instances running out of this ORACLE_HOME on 'nascds15'.
(Oracle Home = '/u01/app/oracle')

Is the node ready for patching? [y|n]
>>> 然后opatch会问您是否要在另外一个节点上回滚。这时候执行下面的操作。

启动1号机ASM 实例和数据库实例：
$srvctl start asm -n <nodename>
$srvctl start instance -d <dbname> -i <instance_name>

比如：
$srvctl start asm -n nascds14
$srvctl start instance -d ONEPIECE -i ONEPIECE1

$crs_stat -t
ora....E1.inst application    ONLINE    ONLINE    nascds14    
ora....SM1.asm application    ONLINE    ONLINE    nascds14
停止2号机的ASM实例和数据库实例：
$srvctl stop instance -d <dbname> -i <instance_name>
$srvctl stop asm -n <nodename>

$srvctl stop instance -d ONEPIECE -i ONEPIECE2
$srvctl stop asm -n nascds15
$crs_stat -t
ora....E2.inst application    OFFLINE   OFFLINE              
ora....SM2.asm application    OFFLINE   OFFLINE  

>>> 在之前回滚补丁的那个提示符中，确认继续下一个节点。
The node 'nascds15' will be patched next.
Please shutdown Oracle instances running out of this ORACLE_HOME on 'nascds15'.
(Oracle Home = '/u01/app/oracle')

Is the node ready for patching? [y|n]
y <=========输入y
User Responded with: Y
OPatch succeeded.

>>> 启动2号机的ASM实例和数据库实例：
$srvctl start asm -n <nodename>
$srvctl start instance -d <dbname> -i <instance_name>

比如：
$srvctl start asm -n nascds15
$srvctl start instance -d ONEPIECE -i ONEPIECE2

>>> 在两个节点分别执行下面的命令来确认补丁已经回滚成功。
$ $ORACLE_HOME/OPatch/opatch lsinventory
附录1:
 
opatch auto /opt/grid/21523375  -ocmrf /opt/grid/file.rsp

opatch auto /opt/grid/21523375 -rollback -ocmrf /home/grid/file.rsp
```
