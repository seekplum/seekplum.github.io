---
layout: post
title: Python内存/性能分析总结
tags: python
thread: python
---

## 环境信息

```bash
centos1@root➜  ~ uname -a
Linux centos1 3.10.0-862.11.6.el7.x86_64 #1 SMP Tue Aug 14 21:49:04 UTC 2018 x86_64 x86_64 x86_64 GNU/Linux
centos1@root➜  ~ cat /etc/redhat-release
CentOS Linux release 7.5.1804 (Core)
centos1@root➜  ~ python --version
Python 2.7.5
centos1@root➜  ~
```

## gdb

详细信息可以自行查阅[官网](https://wiki.python.org/moin/DebuggingWithGdb)

- 安装

```bash
yum install -y gdb python-debuginfo
```

## objgraph

- 安装

```bash
pip install objgraph
```

graphviz 工具

将 objgraph 库生成的 dot 文件生成图片

## line_profiler

## tracemalloc

## cProfile

## guppy

## pympler

## memory-profiler

使用[memory_profiler](https://github.com/pythonprofilers/memory_profiler)进行分析

- 官方示例

example.py

```python
@profile
def my_func():
    a = [1] * (10 ** 6)
    b = [2] * (2 * 10 ** 7)
    del b
    return a

if __name__ == '__main__':
    my_func()
```

### 运行

- 通过提供的工具运行

```bash
mprof run example.py
```

- 通过模块运行

```bash
python -m memory_profiler example.py
```

## 火焰图

火焰图的生成依赖 `perf` 获取程序运行堆栈，perf 只能在 Linux 下使用。

- 1.安装 perf

```bash
sudo apt-get install bindfs linux-tools-common
```

### FlameGraph

[Github 地址](https://github.com/brendangregg/FlameGraph)，真正生成火焰图的项目。

```bash
#!/usr/bin/env bash

set -xe

# https://github.com/brendangregg/FlameGraph#2-fold-stacks

pid=$1

sudo perf record -F 99 -p ${pid} -g -- sleep 10 > /tmp/flame/perf_${pid}.data
sudo perf script --header > /tmp/flame/out_${pid}.perf

./stackcollapse-perf.pl /tmp/flame/out_${pid}.perf > /tmp/flame/out_${pid}.folded

./flamegraph.pl /tmp/flame/out_${pid}.folded > /tmp/flame/flame_${pid}.svg
```

`/tmp/flame/out.perf` 文件可以通过 `FlameScope` 项目进行解析

### ~~Pyflame 不再维护了~~

[Github 地址](https://github.com/uber/pyflame)获取堆栈后还是需要依赖 FlameGraph 项目才能渲染出火焰图

```bash
pid=$1
sudo pyflame -s 60 -r 0.01 -p ${pid} | ./flamegraph.pl > /tmp/flame/pyflame-${pid}.svg
```

### FlameScope

[Github 地址](https://github.com/Netflix/flamescope)

```bash
git clone https://github.com/Netflix/flamescope
cd flamescope
pip install -r requirements.txt
pip install python-magic-bin
python run.py
```

此项目并不能生成火焰图，用途是用于解析火焰图，本质上市一个可视化分析工具

## 猜想

计算密集型的任务表现在 CPU 的持续高占用

并发量导致负载过重是最常见的瓶颈原因，表现应该是进程会占用极多的磁盘 I/O 读写带宽和 CPU

并发数不断增加，TPS 上不去，CPU 耗用不高
