---
layout: post
title: Jupyter Notebook基本使用
categories: python
tags: python jupyter
thread: python
---

## 环境

- OS: OSX 10.13.4 (17E202)
- Python: Python 2.7.16
- pip: 19.1.1

## 安装

```bash
# 直接安装在系统中，使用系统的依赖环境
brew install jupyter

# 或者 可以安装在虚拟环境中，在 notebook 中则可以使用虚拟环境了
pip install jupyter
```

## 浏览器中无法运行代码

检查 `ipykernel` 库是否安装，未安装则执行 `pip install ipykernel`

## 快捷键

命令模式快捷键（按 Esc 键开启）:

| 快捷键      | 作用                         | 说明                                                                                             |
| :---------- | :--------------------------- | :----------------------------------------------------------------------------------------------- |
| Enter       | 转入编辑模式                 |                                                                                                  |
| Shift-Enter | 运行本单元，选中下个单元     | 新单元默认为命令模式                                                                             |
| Ctrl-Enter  | 运行本单元                   |                                                                                                  |
| Alt-Enter   | 运行本单元，在其下插入新单元 | 新单元默认为编辑模式                                                                             |
| Y           | 单元转入代码状态             |                                                                                                  |
| M           | 单元转入 markdown 状态       |                                                                                                  |
| R           | 单元转入 raw 状态            |                                                                                                  |
| 1           | 设定 1 级标题                | 仅在 markdown 状态下时建议使用标题相关快捷键，如果单元处于其他状态，则会强制切换到 markdown 状态 |
| A           | 在上方插入新单元             |                                                                                                  |
| B           | 在下方插入新单元             |                                                                                                  |
| X           | 剪切选中的单元               |                                                                                                  |
| C           | 复制选中的单元               |                                                                                                  |
| Shift-V     | 粘贴到上方单元               |                                                                                                  |
| V           | 粘贴到下方单元               |                                                                                                  |
| Z           | 恢复删除的最后一个单元       |                                                                                                  |
| D,D         | 删除选中的单元               | 连续按两个 D 键                                                                                  |
| S           | 保存当前 NoteBook            |                                                                                                  |
| L           | 开关行号                     | 编辑框的行号是可以开启和关闭的                                                                   |
| Ctrl-Z      | 撤销                         |                                                                                                  |
| H           | 显示快捷键帮助               |                                                                                                  |

编辑模式快捷键（ 按 Enter 键启动）:

| 快捷键                   | 作用                         | 说明                                                                                          |
| :----------------------- | :--------------------------- | :-------------------------------------------------------------------------------------------- |
| Tab                      | 代码补全或缩进               |
| Shift-Tab                | 提示                         | 输出帮助信息，部分函数、类、方法等会显示其定义原型，如果在其后加 ? 再运行会显示更加详细的帮助 |
| Esc                      | 切换到命令模式               |                                                                                               |
| Ctrl-M                   | 切换到命令模式               |                                                                                               |
| Shift-Enter              | 运行本单元，选中下一单元     | 新单元默认为命令模式                                                                          |
| Ctrl-Enter               | 运行本单元                   |                                                                                               |
| Alt-Enter                | 运行本单元，在下面插入一单元 | 新单元默认为编辑模式                                                                          |
| Ctrl-/ 注释整行/撤销注释 | 仅代码状态有效               |

## 格式转换

- ipynb 转 markdown

```bash
jupyter nbconvert --to markdown test.ipynb --stdout > test.md
```

- markdown 转 ipynb

使用[notedown](https://github.com/aaren/notedown)进行转换,需要先进行安装

```bash
pip install notedown
notedown test.md > test.ipynb
```

## 启动

```bash
jupyter notebook --port=1234

jupyter notebook --port=1234 test.ipynb
```

## 配置

- 生成配置

```bash
jupyter notebook --generate-config
```

生成后路径为 `~/.jupyter/jupyter_notebook_config.py`

- 配置文件路径

默认 jupyter 启动时打开的是当前终端所在的目录,可以通过 `c.NotebookApp.notebook_dir = ''`进行配置

## 参考

- [Jupyter Notebook 介绍、安装及使用教程](https://zhuanlan.zhihu.com/p/33105153)
- [Jupyter NoteBook 的快捷键使用指南](https://opus.konghy.cn/ipynb/jupyter-notebook-keyboard-shortcut.html)
