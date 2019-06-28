---
layout: post
title:  Jupyter Notebook基本使用
categories: python
tags: python jupyter
thread: python
---

## 环境

* OS: OSX 10.13.4 (17E202)
* Python: Python 2.7.16
* pip: 19.1.1

## 安装

```bash
brew install jupyter
```

## 格式转换

* ipynb转markdown

```bash
jupyter nbconvert --to markdown test.ipynb --stdout > test.md
```

* markdown转ipynb

使用[notedown](https://github.com/aaren/notedown)进行转换,需要先进行安装

```bash
pip install notedown
notedown test.md > test.ipynb
```

## 启动

```bash
jupyter notebook --port=1234
```

## 配置

* 生成配置

```bash
jupyter notebook --generate-config
```

生成后路径为 `~/.jupyter/jupyter_notebook_config.py`

* 配置文件路径

默认jupyter启动时打开的是当前终端所在的目录,可以通过 `c.NotebookApp.notebook_dir = ''`进行配置

## 参考

* [Jupyter Notebook介绍、安装及使用教程](https://zhuanlan.zhihu.com/p/33105153)
