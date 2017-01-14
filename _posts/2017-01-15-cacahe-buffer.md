---
layout: post
title:  cache,buffer查看
categories: linux
tags: cache buffer
thread: cache-buffer
---
![](/static/images/cache-buffer/free-m.png)
> 使用`total1`、`used1`、`free1`、`used2`、`free2` 等名称来代表上面统计数据的各值，1、2 分别代表第一行和第二行的数据。

* `total1`:表示物理内存总量
* `used1`：总计分配给缓存（包括buffers,cached）使用的数量，但其中部分缓存可能并未实际使用
* `free1`：未被分配的内存
* `shared1`：共享内存，一般不会用到
* `buffers1`：系统分配但未使用的buffres数量
* `cached1`：系统分配但未使用的cache数量
* `used2`：实际使用的buffers，cache数量，也就是实际使用的内存总量
* `free2`：未被使用的buffers，cache，未被分配的内存之和，也就是实际可用内存总量

> * cache：高速缓存，是位于CPU与主内存间的一种容量较小但速度很高的存储器。
> * buffer：缓冲区，一个用于存储速度不同步的设备或优先级不同的设备之间传输数据的区域。

**Free中的buffer和cache：（它们都是占用内存）**
**buffer : 作为buffer cache的内存，是块设备的读写缓冲区**
**cache: 作为page cache的内存, 文件系统的cache**