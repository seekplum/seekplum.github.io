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

* 安装

```bash
yum install -y gdb python-debuginfo
```

## objgraph

* 安装

```bash
pip install objgraph
```

graphviz工具
将objgraph库生成的dot文件生成图片

## line_profiler

## tracemalloc

## cProfile

## guppy

## pympler

## memory-profiler

使用[memory_profiler](https://github.com/pythonprofilers/memory_profiler)进行分析

* 官方示例

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

* 通过提供的工具运行

```bash
mprof run example.py
```

* 通过模块运行

```bash
python -m memory_profiler example.py
```

## FlameScope

[火焰图](https://github.com/Netflix/flamescope)

```bash
git clone https://github.com/Netflix/flamescope
cd flamescope
pip install -r requirements.txt
pip install python-magic-bin
python run.py
```
