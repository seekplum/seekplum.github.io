---
layout: post
title:  模拟坏盘
tags: dd lv disk
thread: disk
---

## 创建lv
> lvcreate -L 6G -n test_disk VolGroup

## 删除lv
> lvremove /dev/VolGroup/test_disk

## 阻塞io
> dmsetup suspend /dev/VolGroup/test_disk

## dd读
> dd if=/dev/VolGroup/test_disk bs=8k count=5 of=/dev/null

## 取消阻塞
> dmsetup resume /dev/VolGroup/test_disk
