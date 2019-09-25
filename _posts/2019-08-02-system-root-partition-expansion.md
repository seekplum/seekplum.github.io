---
layout: post
title:  VirtualBox虚拟机根目录扩容
categories: virtualbox
tags: virtualbox lvm
thread: virtualbox
---

## 系统环境

* Centos7.5

## 查看现有磁盘信息

```bash
centos1@root ➜  ~ df -Th
文件系统                类型      容量  已用  可用 已用% 挂载点
/dev/mapper/centos-root xfs       6.2G  5.8G  491M   93% /
devtmpfs                devtmpfs  485M     0  485M    0% /dev
tmpfs                   tmpfs     496M     0  496M    0% /dev/shm
tmpfs                   tmpfs     496M  6.7M  490M    2% /run
tmpfs                   tmpfs     496M     0  496M    0% /sys/fs/cgroup
/dev/sda1               xfs      1014M  158M  857M   16% /boot
tmpfs                   tmpfs     100M     0  100M    0% /run/user/0
centos1@root ➜  ~ fdisk -l /dev/sda

磁盘 /dev/sda：21.0 GB, 20971520000 字节，40960000 个扇区
Units = 扇区 of 1 * 512 = 512 bytes
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0x000bdbdc

   设备 Boot      Start         End      Blocks   Id  System
/dev/sda1   *        2048     2099199     1048576   83  Linux
/dev/sda2         2099200    16777215     7339008   8e  Linux LVM
```

## 修改虚拟机磁盘VDI的大小

在宿主机上先修改vdi存储大小

* 查询uuid

```bash
VBoxManage list hdds
```

* 修改大小

```bash
VBoxManage modifyhd <UUID> --resize 20000
```

## 查看新增加的磁盘信息

```bash
centos1@root ➜  ~ fdisk -l /dev/sda

磁盘 /dev/sda：21.0 GB, 20971520000 字节，40960000 个扇区
Units = 扇区 of 1 * 512 = 512 bytes
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0x000bdbdc

   设备 Boot      Start         End      Blocks   Id  System
/dev/sda1   *        2048     2099199     1048576   83  Linux
/dev/sda2         2099200    16777215     7339008   8e  Linux LVM
/dev/sda3        16777216    40959999    12091392   8e  Linux LVM
```

## Enable新增加的空间

```bash
centos1@root ➜  ~ fdisk /dev/sda
欢迎使用 fdisk (util-linux 2.23.2)。

更改将停留在内存中，直到您决定将更改写入磁盘。
使用写入命令前请三思。


命令(输入 m 获取帮助)：n
Partition type:
   p   primary (2 primary, 0 extended, 2 free)
   e   extended
Select (default p): p
分区号 (3,4，默认 3)：3
起始 扇区 (16777216-40959999，默认为 16777216)：
将使用默认值 16777216
Last 扇区, +扇区 or +size{K,M,G} (16777216-40959999，默认为 40959999)：
将使用默认值 40959999
分区 3 已设置为 Linux 类型，大小设为 11.5 GiB

命令(输入 m 获取帮助)：t
分区号 (1-3，默认 3)：3
Hex 代码(输入 L 列出所有代码)：8e
已将分区“Linux”的类型更改为“Linux LVM”

命令(输入 m 获取帮助)：w
The partition table has been altered!

Calling ioctl() to re-read partition table.

WARNING: Re-reading the partition table failed with error 16: 设备或资源忙.
The kernel still uses the old table. The new table will be used at
the next reboot or after you run partprobe(8) or kpartx(8)
正在同步磁盘。
```

## 查看结果

```bash
centos1@root ➜  ~ fdisk -l /dev/sda

磁盘 /dev/sda：21.0 GB, 20971520000 字节，40960000 个扇区
Units = 扇区 of 1 * 512 = 512 bytes
扇区大小(逻辑/物理)：512 字节 / 512 字节
I/O 大小(最小/最佳)：512 字节 / 512 字节
磁盘标签类型：dos
磁盘标识符：0x000bdbdc

   设备 Boot      Start         End      Blocks   Id  System
/dev/sda1   *        2048     2099199     1048576   83  Linux
/dev/sda2         2099200    16777215     7339008   8e  Linux LVM
/dev/sda3        16777216    40959999    12091392   8e  Linux LVM
centos1@root ➜  ~ lvs
  LV   VG     Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  root centos -wi-ao----  <6.20g
  swap centos -wi-ao---- 820.00m
centos1@root ➜  ~ pvs
  PV         VG     Fmt  Attr PSize  PFree
  /dev/sda2  centos lvm2 a--  <7.00g    0
```

## 检查新增空间是否存在

不存在则对机器进行重启，存在则不用做任何操作

```bash
centos1@root ➜  ~ ls -l /dev/sda3
ls: 无法访问/dev/sda3: 没有那个文件或目录
centos1@root ➜  ~ shutdown -r now
Connection to x.x.x.x closed by remote host.
Connection to x.x.x.x closed.
seekplum ➜  ~ ssh centos1
Last login: Fri Aug  2 08:31:47 2019 from x.x.x.x
centos1@root ➜  ~ ls -l /dev/sda3
brw-rw----. 1 root disk 8, 3 8月   2 08:36 /dev/sda3
centos1@root ➜  ~
```

## 创建物理卷

```bash
centos1@root ➜  ~ pvcreate /dev/sda3
  Physical volume "/dev/sda3" successfully created.
```

## 查看物理卷信息

```bash
centos1@root ➜  ~ pvdisplay
  --- Physical volume ---
  PV Name               /dev/sda2
  VG Name               centos
  PV Size               <7.00 GiB / not usable 3.00 MiB
  Allocatable           yes (but full)
  PE Size               4.00 MiB
  Total PE              1791
  Free PE               0
  Allocated PE          1791
  PV UUID               2fdldQ-kw3f-1i2U-rpXP-m7R0-TyoK-3zOhlu

  "/dev/sda3" is a new physical volume of "11.53 GiB"
  --- NEW Physical volume ---
  PV Name               /dev/sda3
  VG Name
  PV Size               11.53 GiB
  Allocatable           NO
  PE Size               0
  Total PE              0
  Free PE               0
  Allocated PE          0
  PV UUID               MLV9qE-wrF6-U3Qd-dd82-QBNP-pMsn-J9PJCk

centos1@root ➜  ~ vgdisplay
  --- Volume group ---
  VG Name               centos
  System ID
  Format                lvm2
  Metadata Areas        1
  Metadata Sequence No  3
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                2
  Open LV               2
  Max PV                0
  Cur PV                1
  Act PV                1
  VG Size               <7.00 GiB
  PE Size               4.00 MiB
  Total PE              1791
  Alloc PE / Size       1791 / <7.00 GiB
  Free  PE / Size       0 / 0
  VG UUID               uE6r1H-Y744-tNjN-9X0K-A8jk-EmwL-vIRLKU
```

## 将新增加的空间/dev/sda3加入到根目录分区centos中

```bash
centos1@root ➜  ~ vgextend centos /dev/sda3
  Volume group "centos" successfully extended
```

## 重新查看卷组信息

```bash
centos1@root ➜  ~ vgdisplay
  --- Volume group ---
  VG Name               centos
  System ID
  Format                lvm2
  Metadata Areas        2
  Metadata Sequence No  4
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                2
  Open LV               2
  Max PV                0
  Cur PV                2
  Act PV                2
  VG Size               18.52 GiB
  PE Size               4.00 MiB
  Total PE              4742
  Alloc PE / Size       1791 / <7.00 GiB
  Free  PE / Size       2951 / <11.53 GiB
  VG UUID               uE6r1H-Y744-tNjN-9X0K-A8jk-EmwL-vIRLKU
```

## 进行卷扩容

```bash
centos1@root ➜  ~ lvextend -l +100%FREE /dev/mapper/centos-root
  Size of logical volume centos/root changed from <6.59 GiB (1686 extents) to 17.72 GiB (4537 extents).
  Logical volume centos/root successfully resized.
```

## 调整卷分区大小

### CentOS

```bash
centos1@root ➜  ~ xfs_growfs /dev/mapper/centos-root
meta-data=/dev/mapper/centos-root isize=512    agcount=5, agsize=406016 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=0 spinodes=0
data     =                       bsize=4096   blocks=1726464, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0 ftype=1
log      =internal               bsize=4096   blocks=2560, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
data blocks changed from 1726464 to 4645888
```

### Ubuntu

```bash
ubuntu2@root ➜  ~ resize2fs /dev/mapper/ubuntu1--vg-root
resize2fs 1.42.13 (17-May-2015)
Filesystem at /dev/mapper/ubuntu1--vg-root is mounted on /; on-line resizing required
old_desc_blocks = 1, new_desc_blocks = 2
The filesystem on /dev/mapper/ubuntu1--vg-root is now 4680704 (4k) blocks long.

ubuntu2@root ➜  ~ df -hl
Filesystem                    Size  Used Avail Use% Mounted on
udev                          3.0G     0  3.0G   0% /dev
tmpfs                         602M  8.2M  594M   2% /run
/dev/mapper/ubuntu1--vg-root   18G  5.1G   12G  31% /
tmpfs                         3.0G     0  3.0G   0% /dev/shm
tmpfs                         5.0M     0  5.0M   0% /run/lock
tmpfs                         3.0G     0  3.0G   0% /sys/fs/cgroup
/dev/sda1                     720M   58M  625M   9% /boot
tmpfs                         602M     0  602M   0% /run/user/0
```

## 查看磁盘信息

```bash
centos1@root ➜  ~ df -Th
文件系统                类型      容量  已用  可用 已用% 挂载点
/dev/mapper/centos-root xfs        18G  5.8G   13G   33% /
devtmpfs                devtmpfs  485M     0  485M    0% /dev
tmpfs                   tmpfs     496M     0  496M    0% /dev/shm
tmpfs                   tmpfs     496M  6.7M  490M    2% /run
tmpfs                   tmpfs     496M     0  496M    0% /sys/fs/cgroup
/dev/sda1               xfs      1014M  158M  857M   16% /boot
tmpfs                   tmpfs     100M     0  100M    0% /run/user/0
```
