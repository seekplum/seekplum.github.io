---
layout: post
title: vscode使用记录
categories: plugin
tags: mac vscode
thread: plugin
---
## 安装

根据[帮助文档](https://code.visualstudio.com/docs/setup/mac)提示安装即可

## 字符说明

* ⌘: command键
* ⌥: option/alt
* ⇧: shift按键
* ^: 表示的是control键

## 常用设置

* 在新窗口打开文件

Preferences -> Settings -> Window: Open Files In New Window 设置为 `on` 

## 修改默认快捷键

* 打开默认键盘快捷方式设置

Preferences -> Keyboard Shortcuts

* 修改 keybindings.json

如果需要更高级的自定义快捷键，可以直接点击上面的提示  "keybindings.josn"，在打开的界面右侧输入你所需要修改的键值即可.

## 切换语言

以切换为中文为例

* 1.使用快捷键组合`shift + command + P `，在搜索框中输入`configure display language`，点击确定后
* 2.修改`locale.json`文件下的属性`locale`为`zh-CN`, 即设置为`"locale":"zh-CN"`
* 3.安装`Chinese (Simplified) Language Pack for Visual Studio Code`插件
* 4.重启vscode

## 默认快捷键

|功能|快捷键|
|:---|:---|
|关键字搜索功能快捷键| shift + command + P |
|复制当前行到上一行| shift + option + ↑ |
|复制当前行到下一行| shift + option + ↓ |
|删除当前行整行| shift + command + K |
|删除当前行光标前内容| command + backspace |
|删除当前行光标后内容| control + K |
|在当前行上一行增加空行| command + enter |
|在当前行下一行增加空行| shift + command + enter |
|当前文件查找字符| command + F |
|整个目录查找字符| shift + command + F |
|当前文件替换字符| option + command + F |
|整个目录替换字符| shift + command + H |
|跳转到指定行号| control + G |
|自动化格式代码| option + shift + F |
|关键字搜索文件名| command + P |

## 修改快捷键

根据个人习惯修改快捷键，常用快捷键如下，参考了Pycharm、bash。

```json
//Placeyourkeybindingsinthisfiletooverwritethedefaults[
[
    // 复制当前行到下一行
    {
        "key": "cmd+d",
        "command": "editor.action.copyLinesDownAction",
        "when": "editorTextFocus && !editorReadonly"
    },
    // 复制当前行到上一行
    {
        "key": "cmd+u",
        "command": "editor.action.copyLinesUpAction",
        "when": "editorTextFocus && !editorReadonly"
    },
    // 删除当前行整行
    {
        "key": "cmd+y",
        "command": "editor.action.deleteLines",
        "when": "textInputFocus && !editorReadonly"
    },
    // 删除当前行光标前内容
    {
        "key": "ctrl+u",
        "command": "deleteLeft",
        "when": "textInputFocus && !editorReadonly"
    },
    // 删除当前行光标后内容
    {
        "key": "ctrl+k",
        "command": "deleteRight",
        "when": "textInputFocus && !editorReadonly"
    },
    // 在当前行下一行增加空行
    {
        "key": "shift+enter",
        "command": "editor.action.insertLineAfter",
        "when": "editorTextFocus && !editorReadonly"
    },
    // 在当前行上一行增加空行
    {
        "key": "shift+cmd+enter",
        "command": "editor.action.insertLineBefore",
        "when": "editorTextFocus && !editorReadonly"
    },
    // 整个目录查找字符
    {
        "key": "shift+cmd+f",
        "command": "workbench.action.findInFiles"
    },
    // 当前文件替换字符
    {
        "key": "cmd+r",
        "command": "editor.action.startFindReplaceAction"
    },
    // 整个目录替换字符
    {
        "key": "shift+cmd+r",
        "command": "workbench.action.replaceInFiles"
    },
    // 跳转到指定行号
    {
        "key": "cmd+g",
        "command": "workbench.action.gotoLine"
    },
    // 自动化格式代码
    {
        "key": "alt+cmd+l",
        "command": "editor.action.formatDocument",
        "when": "editorTextFocus && !editorReadonly"
    },
    // 关键字搜索文件名
    {
        "key": "shift+cmd+n",
        "command": "workbench.action.quickOpen"
    }
]
```

## 常用插件

### 通用型

* Jupyter
* Markdown Preview Enhanced
* markdownlint
* Visual Studio IntelliCode - Preview

### Python

* MagicPython
* python
* Python Extension Pack
* Shell launcher
* vscode-icons: 资源管理器图标

#### pip安装

* yapf: 自动化格式代码

> pip install yapf autopep8

### GO

* GO

### Docker

* docker

### gRPC

* Protobuf support
* vscode-proto3

### JS

* Vetur
