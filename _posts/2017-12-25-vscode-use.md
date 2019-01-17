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

## 修改配置

```json
{
    "editor.fontSize": 15,
    "python.jediEnabled": false,
    "diffEditor.ignoreTrimWhitespace": false,
    "workbench.iconTheme": "vscode-icons",
    "editor.minimap.enabled": false,
    "window.openWithoutArgumentsInNewWindow": "on",
    "window.openFilesInNewWindow": "on",
    "workbench.editor.enablePreview": false,
    "workbench.activityBar.visible": true,
    "editor.formatOnSave": true,
    "editor.wordWrap": "on",
    "editor.minimap.renderCharacters": false,
    "terminal.external.osxExec": "iTerm.app",
    //"go.useLanguageServer": true,
    "go.docsTool": "gogetdoc",
    "go.buildOnSave": "workspace",
    "go.lintOnSave": "workspace",
    "go.vetOnSave": "workspace",
    "go.buildTags": "",
    "go.buildFlags": [],
    "go.lintFlags": [],
    "go.vetFlags": [],
    "go.coverOnSave": false,
    "go.useCodeSnippetsOnFunctionSuggest": false,
    "go.formatTool": "goreturns",
    "go.goroot": "/usr/local/go",
    "go.gopath": "/Users/seekplum/GolangProjects",
    "go.gocodeAutoBuild": false,
    "window.zoomLevel": 0,
    // 标识行长度
    "editor.rulers": [
        79,
        119
    ],
    // tab等于的空格数
    "editor.tabSize": 4
}
```

## 修改默认快捷键

* 打开默认键盘快捷方式设置

Preferences -> Keyboard Shortcuts

* 修改 keybindings.json

如果需要更高级的自定义快捷键，可以直接点击上面的提示  "keybindings.josn"，在打开的界面右侧输入你所需要修改的键值即可.

## 切换语言

以切换为中文为例

* 1.使用快捷键组合 `shift + command + P`，在搜索框中输入 `configure display language`，点击确定后
* 2.修改 `locale.json` 文件下的属性 `locale` 为 `zh-CN`, 即设置为`"locale":"zh-CN"`
* 3.安装 `Chinese (Simplified) Language Pack for Visual Studio Code` 插件
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
    },
    // 打开终端
    {
        "key": "cmd+t",
        "command": "workbench.action.terminal.toggleTerminal"
    },
    // 全部折叠
    {
        "key": "cmd+-",
        "command": "editor.foldAll",
        "when": "editorTextFocus"
    },
    // 全部展开
    {
        "key": "cmd+=",
        "command": "editor.unfoldAll",
        "when": "editorTextFocus"
    },
    // 折叠当前所在代码块
    {
        "key": "cmd+[",
        "command": "editor.fold",
        "when": "editorTextFocus"
    },
    // 打开当前所在代码块
    {
        "key": "cmd+]",
        "command": "editor.unfold",
        "when": "editorTextFocus"
    },
]
```

## 常用插件

### 通用型

* Jupyter
* Markdown Preview Enhanced
* markdownlint
* Visual Studio IntelliCode - Preview
* Git History
* Git Project Manager
* GitLens — Git supercharged
* vscode-icons: 资源管理器图标
* Shell launcher

### Python

* MagicPython
* python
* Python Extension Pack

#### pip安装

* yapf: 自动化格式代码

> pip install yapf autopep8

#### debug配置

```json
{
    // 使用 IntelliSense 了解相关属性。
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: Current File (Integrated Terminal)",
            "type": "python",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal",
            "env": {
                "DYLD_LIBRARY_PATH": "/Users/seekplum/packages/oracle:/Users/seekplum/packages/mysql/lib",
                "PYTHONUNBUFFERED": 1,
                "PIP_INDEX_URL": "https://pypi.douban.com/simple/",
                "PIP_TRUSTED_HOST": "x.x.x.x",
                "PIP_EXTRA_INDEX_URL": "http://x.x.x.x:8080",
                "QDATA_MYSQL_HOST": "127.0.0.1",
                "QDATA_MYSQL_PORT": "9307",
                "QDATA_MYSQL_USERNAME": "xxx",
                "QDATA_MYSQL_PASSWORD": "xxx",
                "QDATA_MYSQL_DATABASE_NAME": "qdata_cloud",
                "QDATA_REDIS_HOST": "127.0.0.1",
                "QDATA_REDIS_PORT": "6379",
                "QDATA_PROMETHEUS_HOST": "127.0.0.1",
                "QDATA_PROMETHEUS_PORT": "10011",
                "QDATA_ALERTMANAGER_PORT": "10012",
                "QDATA_LOGGING_PATH": "/tmp/logs/ci/",
            }
        },
        {
            "name": "Python: Attach",
            "type": "python",
            "request": "attach",
            "port": 5678,
            "host": "localhost"
        },
        {
            "name": "Python: Module",
            "type": "python",
            "request": "launch",
            "module": "enter-your-module-name-here",
            "console": "integratedTerminal"
        },
        {
            "name": "Python: Django",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/manage.py",
            "console": "integratedTerminal",
            "args": [
                "runserver",
                "--noreload",
                "--nothreading"
            ],
            "django": true
        },
        {
            "name": "Python: Flask",
            "type": "python",
            "request": "launch",
            "module": "flask",
            "env": {
                "FLASK_APP": "app.py"
            },
            "args": [
                "run",
                "--no-debugger",
                "--no-reload"
            ],
            "jinja": true
        },
        {
            "name": "Python: Current File (External Terminal)",
            "type": "python",
            "request": "launch",
            "program": "${file}",
            "console": "externalTerminal"
        }
    ]
}
```

### GO

* Go
* Go to Spec

#### go get 安装

```bash
go get -u -v github.com/nsf/gocode
go get -u -v github.com/rogpeppe/godef
go get -u -v github.com/lukehoban/go-outline
go get -u -v github.com/tpng/gopkgs
go get -u -v github.com/golang/tools

mkdir -p $GOPATH/src/golang.org/x/
test -d $GOPATH/src/golang.org/x/tools || ln -s $GOPATH/src/github.com/golang/tools $GOPATH/src/golang.org/x

go get -u -v github.com/golang/lint
test -d $GOPATH/src/golang.org/x/lint || ln -s $GOPATH/src/github.com/golang/lint $GOPATH/src/golang.org/x

go get -u -v github.com/sqs/goreturns
go get -u -v github.com/newhook/go-symbols
```

#### debug 配置

```json
{
    // 使用 IntelliSense 了解相关属性。
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch",
            "type": "go",
            "request": "launch",
            "mode": "debug",
            "remotePath": "",
            "port": 2345,
            "host": "127.0.0.1",
            // "program": "${fileDirname}",
            "program": "${workspaceRoot}",
            "env": {
                "DYLD_LIBRARY_PATH": "/Users/seekplum/packages/oracle",
                "CGO_CFLAGS": "-I/Users/seekplum/packages/oracle",
                "PKG_CONFIG_PATH": "/Users/seekplum/GolangProjects/pkg"
            },
            "args": [],
            "showLog": true
        }
    ]
}
```

### Docker

* docker

### gRPC

* Protobuf support
* vscode-proto3

### JS

* Vetur
