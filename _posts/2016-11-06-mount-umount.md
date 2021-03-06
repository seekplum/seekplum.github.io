---
layout: post
title:  挂载/取消挂载
categories: linux
tags: linux
thread: linux
---

## 挂载

### 命令格式

```bash
mount [-t vfstype] [-o options] device dir
```

vfstype：指定文件系统的类型。通常不必指定，mount会自动选择正确的类型。

-t 文件系统类型, 常用的参数有

* auto: 自动检测文件系统
* iso9660：光盘或者光盘镜像
* msdos：DOS fat16文件系统
* vfat：Windows 9x fat32文件系统
* ntfs：Windows NT ntfs文件系统
* smbfs：Mount Windows文件网络共享
* nnfs：UNIX、LINUX文件网络共享

-o 主要用来描述设备或档案的挂接方式。常用的参数有

* options：主要时用来描述设备或档案的挂载方式
* loop：用来把一个文件当成硬盘分区挂载上系统
* ro：采用只读方式挂载设备
* rw：采用读写方式挂载设备
* iocharset：指定访问文件系统所用字符集

* 设备

device：要挂载的设备

* 挂载点

dir：设备在系统上的挂载点

**注意:目录不存在需要先创建(mkdir -p /mnt/usbhd1).**

### 挂接移动硬盘

对linux系统而言，USB接口的移动硬盘是当作SCSI设备对待的。插入移动硬盘之前，应先用 `fdisk –l` 或 `more /proc/partitions` 查看系统的硬盘和硬盘分区情况。

* 比如:

```bash
mount -t ntfs /dev/sdc1 /mnt/usbhd1
mount -t vfat /dev/sdc5 /mnt/usbhd2
```

**注：对ntfs格式的磁盘分区应使用-t ntfs 参数，对fat32格式的磁盘分区应使用-t vfat参数。若汉字文件名显示为乱码或不显示，可以使用下面的命令格式.**

```bash
mount -t ntfs -o iocharset=cp936 /dev/sdc1 /mnt/usbhd1
mount -t vfat -o iocharset=cp936 /dev/sdc5 /mnt/usbhd2
```

linux系统下使用fdisk分区命令和mkfs文件系统创建命令可以将移动硬盘的分区制作成linux系统所特有的ext2、ext3格式。这样，在linux下使用就更方便了。使用下面的命令直接挂接即可。

```bash
mount /dev/sdc1 /mnt/usbhd1
```

### 挂接U盘

和USB接口的移动硬盘一样对linux系统而言U盘也是当作SCSI设备对待的。使用方法和移动硬盘完全一样。插入U盘之前，应先用 `fdisk –l` 或 `more /proc/partitions` 查看系统的硬盘和硬盘分区情况。

```bash
mount -t vfat /dev/sdd1 /mnt/usb
```

**注：现在可以通过/mnt/usb来访问U盘了, 若汉字文件名显示为乱码或不显示，可以使用下面的命令.**

```bash
mount -t vfat -o iocharset=cp936 /dev/sdd1 /mnt/usb
```

## 取消挂载

/dev/hda5 已经挂载在/mnt/hda5上,用一下三条命令均可卸载挂载的文件系统

```bash
umount /dev/hda5

umount /mnt/hda5

umount /dev/hda5 /mnt/hda5
```

## 操作系统挂载新盘

1.查看现有分区信息

```bash
df -Th
```

2.格式化分区

```bash
mklabel gpt
```

3.格式化成xfs

```bash
mkfs.xfs -f /dev/sdb
```

4.分区

```bash
mkpart primary 0% 100%
```

5.挂载到指定目录

```bash
mount /dev/sdb /virtbox/
```

6.检查是否mount成功

```bash
df -Th
```

7.设置系统重启自动挂载

编辑`/etc/fstab`文件，加入如下内容

```text
/dev/sdb  /virtbox/ xfs     defaults        0 0
```
