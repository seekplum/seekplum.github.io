---
layout: post
title: pycharm快捷键
categories: accelerators
tags: accelerators pycharm
thread: pycharm-accelerators
---

## 在Pycharm下为你的Python项目配置Python解释器
> Project:当前项目名>Project Interpreter>add Local

## 在Pycharm下创建Python文件、Python模块
> File>New>Python File
> File>New>Python Package

## 使用Pycharm安装Python第三方模块
> Project:当前项目名>Project Interpreter>点击右侧绿色小加号

## Pycharm基本设置，例如不使用tab、tab=4空格、字体、字体颜色、主题、脚本头设置、显示行号等。如何导出和导入自定义设置。

> 不使用tab、tab=4空格：Editor>Code Style>Python
> 字体、字体颜色：Edit>Colors & Fonts>Python
> 关闭自动更新：Appearance & Behavior>System Settings>Updates
> 脚本头设置：Edit>File and Code Templates>Python Script 注：其他类似
> 显示行号：Edit>General>Appearance>Show line numbers 注：2016.2默认显示行号
> 右侧竖线是PEP8的代码规范，提示一行不要超过120个字符
> 导出、导入你自定义的配置： File>Export Settings、Import Settings

## 常用快捷键，例如复制当前行、删除当前行、批量注释、缩进、查找和替换。
> 常用快捷键的查询和配置：Keymap
> Ctrl + D：复制当前行
> Ctrl + E：删除当前行
> Shift + Enter：快速换行
> Ctrl + /：快速注释（选中多行后可以批量注释）
> Tab：缩进当前行（选中多行后可以批量缩进）
> Shift + Tab：取消缩进（选中多行后可以批量取消缩进）
> Ctrl + F：查找
> Ctrl + H：替换
> Ctrl + G：跳到指定行

## Pycharm安装插件，例如Markdown support、数据库支持插件等。
> Plugins>Browse repositories（下方三个按钮中间那个）>搜索‘markdown support’>install
> 右上角View有三个选项可选，一般我们都用中间那个左侧编写，右侧实时预览

## Git配置？
> 需要本地安装好Git
> Version Control>Git
> 配置了Git等版本控制系统之后，可以很方便的diff查看文件的不用

## 常用操作指南。例如复制文件路径、在文件管理器中打开、快速定位、查看模块结构视图、tab批量换space、TODO的使用、Debug的使用。
> 复制文件路径：左侧文件列表右键选中的文件>Copy Path
> 在文件管理器中打开：右键选中的文件>往下找到Show In Explorer
> 快速定位：Ctrl + 某些内建模块之后，点击在源文件中展开
> 查看结构：IDE左侧边栏Structure 查看当前项目的结构
> tab批量换space：Edit>Convert Indents
> TODO的使用：# TODO 要记录的事情
> Debug设置断点，直接点击行号与代码之间的空白处即可设置断点
> Tab页上右键>Move Right（Down），把当前Tab页移到窗口右边（下边），方便对比
> 文件中右键>Local History能够查看文件修改前后的对比
> IDE右下角能看到一些有用的信息，光标当前在第几行的第几个字符、当前回车换行、当前编码类型、当前Git分支
> IDE右侧边栏>Database

## 如何去掉烦人的波浪线？PEP8又是什么？
> 单独一行的注释：#+1空格+注释内容
> 代码后跟着的注释：2空格+#+1空格+注释内容

## SSH Terminal： Default encoding:UTF-8
> Settings>Tools>SSH Terminal>最后一行Default encoding:选择UTF-8

[搜狗英文搜索](http://english.sogou.com/)