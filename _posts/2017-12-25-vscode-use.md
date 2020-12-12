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

Preferences -> Settings -> 点击右上角的 `{}` 按钮，即可编辑 `settings.json` 文件

```json
{
  // Python 开发配置 start
  // "python.jediEnabled": false,
  // "python.autoComplete.extraPaths": ["${workspaceFolder}/scratte"],
  "python.pythonPath": "${HOME}/packages/pythonenv/3.7.5/bin/python", // python解释器路径
  "python.defaultInterpreterPath": "${HOME}/packages/pythonenv/3.7.5/bin/python",
  "python.venvPath": "${HOME}/.virtualenvs",
  "python.languageServer": "Pylance",
  "python.linting.flake8Enabled": true,
  "python.linting.flake8Args": [
    "--max-line-length=119",
    "--ignore=E402,F841,F401,E302,E305"
  ],
  "python.linting.pycodestyleEnabled": true,
  "python.linting.pycodestyleArgs": ["--max-line-length=119"],
  "python.formatting.provider": "yapf",
  "python.formatting.yapfArgs": [
    "--style",
    "{based_on_style: pep8, column_limit: 119}"
  ],
  "python.sortImports.args": ["-rc", "--atomic"],
  "python.testing.unittestEnabled": true,
  "python.analysis.completeFunctionParens": true,
  "python.autoComplete.addBrackets": true, // 自动添加括号
  // Python 开发配置 end

  // Golang 开发配置 start
  // //"go.useLanguageServer": true,
  // "go.docsTool": "gogetdoc",
  // "go.buildOnSave": "workspace",
  // "go.lintOnSave": "workspace",
  // "go.vetOnSave": "workspace",
  // "go.buildTags": "",
  // "go.buildFlags": [],
  // "go.lintFlags": [],
  // "go.vetFlags": [],
  // "go.coverOnSave": false,
  // "go.useCodeSnippetsOnFunctionSuggest": false,
  // "go.formatTool": "goreturns",
  // "go.goroot": "/usr/local/go",
  // "go.gopath": "${HOME}/GolangProjects",
  // "go.gocodeAutoBuild": false,
  // Golang 开发配置 end

  // Java 开发配置 start
  // "java.home": "/Library/Java/JavaVirtualMachines/jdk-12.0.1.jdk/Contents/Home",
  // "java.errors.incompleteClasspath.severity": "ignore",
  // "java.configuration.checkProjectSettingsExclusions": false,
  // Java 开发配置 end

  // Openresty 开发配置 start
  "Lua.diagnostics.globals": ["ngx"],
  // Openresty 开发配置 end

  // plantuml 导出图片位置
  "plantuml.diagramsRoot": "wsd",
  "plantuml.exportOutDir": "images/docs",

  // // 自定义颜色
  // "editor.tokenColorCustomizations": {
  //   "comments": "#808080", // 注释
  //   "keywords": "#CC7832", // 关键字
  //   "variables": "#A9B7C6", // 变量名
  //   "strings": "#A5C261", // 字符串
  //   "functions": "#FFC66D", // 函数名
  //   "numbers": "#6897BB", // 数字
  //   "types": "#6897BB" // 类型
  // },
  // // 未使用变量提示
  // "editor.showUnused": true,
  // "workbench.colorCustomizations": {
  //   "editorUnnecessaryCode.border": "#AEAE80" // 未使用变量
  // },

  "window.openWithoutArgumentsInNewWindow": "on",
  "window.openFilesInNewWindow": "on",
  "window.zoomLevel": 0,
  "window.openFoldersInNewWindow": "default",

  // "powermode.enabled": true,
  // "powermode.enableShake": false,

  "autoDocstring.docstringFormat": "google",
  "terminal.integrated.rendererType": "dom",

  "editor.fontSize": 15,
  "editor.maxTokenizationLineLength": 1000000,
  "editor.minimap.showSlider": "always",
  "editor.minimap.renderCharacters": false,
  "editor.minimap.enabled": false,
  "editor.renderControlCharacters": true,
  "editor.formatOnSave": true,
  "editor.wordWrap": "on",
  "editor.rulers": [119], // 标识行长度
  "editor.tabSize": 4, // tab等于的空格数
  "editor.suggestSelection": "first",
  "editor.suggest.snippetsPreventQuickSuggestions": false,
  // "editor.fontFamily": "Monaco", // 字体

  // "workbench.iconTheme": "vscode-icons",
  "workbench.editor.enablePreview": false,
  "workbench.activityBar.visible": true,
  // "workbench.colorTheme": "Monokai", // 颜色主题
  "workbench.iconTheme": "vscode-great-icons",

  // "eslint.workingDirectories": ["./acorn"],
  // "eslint.validate": [
  //     "javascriptreact"
  // ],

  "files.trimTrailingWhitespace": true,
  "diffEditor.ignoreTrimWhitespace": false,
  "terminal.external.osxExec": "iTerm.app",
  "vsintellicode.modify.editor.suggestSelection": "automaticallyOverrodeDefaultValue",
  // 识别文件类型
  "files.associations": {
    "Dockerfile-*": "dockerfile",
    "*.sjs": "javascript",
    "*.jsx": "javascriptreact",
    "*.py": "python",
    "*.axml": "axml",
    "*.acss": "css",
    "*.md": "markdown",
    "*.lua": "lua"
  },
  "files.autoSave": "afterDelay", // 自动保存
  "files.autoSaveDelay": 500,
  "explorer.confirmDragAndDrop": false, // 拖动文件时取消确认
  // "vsicons.dontShowNewVersionMessage": true,
  // 忽略文件类型
  "files.exclude": {
    "**/__pycache__": true,
    "**/.git": true,
    "**/.svn": true,
    "**/.hg": true,
    "**/CVS": true,
    "**/.DS_Store": true,
    "**/*.pyc": true
  },
  "jshint.exclude": {
    "**/*.js": true,
    "**/*.jsx": true
  },
  "path-intellisense.mappings": {
    "~": "${workspaceRoot}/acorn/js"
  },
  "javascript.format.enable": true,
  "css.fileExtensions": ["scss", "less"],
  "vscode_custom_css.imports": ["file://${HOME}/packages/synthwave84.css"],
  "vscode_custom_css.policy": true,
  "explorer.confirmDelete": false,
  "markdown-pdf.displayHeaderFooter": false,
  "search.followSymlinks": false,
  "tabnine.experimentalAutoImports": true,
  // "C_Cpp.updateChannel": "Insiders",
  // "prettier.configPath": "${workspaceRoot}/.prettierrc",
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[html]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[css]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[scss]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "vscode.json-language-features",
    "editor.tabSize": 2
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.quickSuggestions": true,
    "editor.defaultFormatter": "ms-python.python"
  },
  "[yaml]": {
    "editor.tabSize": 2
  },
  "[markdown]": {
    "editor.tabSize": 2
  },
  "[md]": {
    "editor.tabSize": 2
  },
  "markdownlint.customRules": [
    "{docsmsft.docs-linting}/markdownlint-custom-rules/rules.js"
  ],
  "markdownlint.config": {
    "MD028": false
  }
}

```

### 已安装插件

```text
auto-close-tag v0.5.8
auto-rename-tag v0.1.4
autodocstring v0.5.3
axml-highlight v0.0.6
azure-account v0.9.2
bracket-pair-colorizer v1.0.61
bracket-pair-colorizer-2 v0.2.0
code-beautifier v2.3.3
code-runner v0.11.0
code-settings-sync v3.0.0
code-spell-checker v1.9.0
docs-article-templates v0.2.9
docs-images v0.0.9
docs-linting v0.0.5
docs-markdown v0.2.80
docs-metadata v1.0.5
docs-preview v0.3.55
docs-yaml v0.2.5
dotenv v1.0.1
git-graph v1.25.0
githistory v0.6.9
gitlens v10.2.2
jinja v0.0.8
jslint v1.2.1
LinkCheckMD v0.3.1
LiveServer v5.6.1
lua v0.20.5
Lua-Nginx-Snippets v0.0.4
luacheck v1.0.0
MagicPython v1.1.0
markdown-pdf v1.4.4
markdown-preview-enhanced v0.5.13
path-intellisense v2.2.1
plantuml v2.13.13
plantumlpreviewer v0.6.0
prettier-vscode v5.5.0
python v2020.8.106424
python-extension-pack v1.6.0
swdc-vscode v2.3.6
tabnine-vscode v3.0.0
vscode-axml v0.1.6
vscode-azureappservice v0.18.0
vscode-custom-css v3.0.10
vscode-docker v1.5.0
vscode-eslint v2.1.8
vscode-great-icons v2.1.52
vscode-html-css v0.2.3
vscode-markdownlint v0.36.3
vscode-nginx v0.7.2
vscode-pylance v2020.9.0
vscode-python-test-adapter v0.4.6
vscode-test-explorer v2.19.1
vscode-yaml v0.10.1
vscodeintellicode v1.2.10
vsliveshare v1.0.2740
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
|创建新文件| command + N |
|关闭当前文件所在窗口| command + W |
|恢复刚刚关闭的窗口| shift + command + T |
|打开/关闭左侧边栏| command + B |

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
  // 仅格式化选中代码
  {
      "key": "alt+cmd+l",
      "command": "editor.action.formatSelection",
      "when": "editorTextFocus && editorHasSelection"
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
  {
    "key": "shift+f12",
    "command": "editor.action.referenceSearch.trigger",
    "when": "editorHasReferenceProvider && editorTextFocus && !inReferenceSearchEditor && !isInEmbeddedEditor"
  },
  {
    "key": "shift+f12",
    "command": "-editor.action.referenceSearch.trigger",
    "when": "editorHasReferenceProvider && editorTextFocus && !inReferenceSearchEditor && !isInEmbeddedEditor"
  }
]
```

## 配置终端启动vscode 打开文件

* 1.使用快捷键组合 `shift + command + P`，在搜索框中输入 `Shell Command: Install`，点击安装

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
            "name": "Python: Current File (Integrated Terminal)", // 在下拉列表中显示的名字
            "type": "python", // 调试器类型
            "request": "launch", // 指定开始调试的模式： `launch`：在中指定的文件上启动调试器 program, `attach`：将调试器附加到已经运行的进程。
            "program": "${file}", // 提供python程序入口模块的完全限定路径
            "pythonPath": "${config:python.pythonPath}", // Python解释器路径，指向virtualenv
            "console": "integratedTerminal", // 指定如何显示程序输出。 `none`: VS代码调试控制台, `integratedTerminal` （默认）VS代码集成终端, `externalTerminal`: 独立控制台窗口
            "cwd": "${workspaceFolder}", // 指定调试器的当前工作目录，它是代码中使用的任何相对路径的基础文件夹。如果省略，默认为${workspaceFolder}（在VS代码中打开的文件夹）。
            "args": [], // 传递给程序的参数
            "env": { // 程序环境变量
                "DYLD_LIBRARY_PATH": "/Users/seekplum/packages/oracle:/Users/seekplum/packages/mysql/lib",
                "PYTHONUNBUFFERED": 1,
                "PIP_INDEX_URL": "https://pypi.douban.com/simple/",
                "PIP_TRUSTED_HOST": "x.x.x.x",
                "PIP_EXTRA_INDEX_URL": "http://x.x.x.x:8080",
            }
        },
        {
            "name": "Python: Flask (0.11.x or later)", // flask 0.11之后的版本
            "type": "python",
            "request": "launch",
            "stopOnEntry": false,
            "pythonPath": "${config:python.pythonPath}",
            "program": "${file}",
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "env": {
                // "FLASK_APP": "${workspaceRoot}/wsgi.py", // flask启动入口
                "PYTHONIOENCODING": "UTF-8",
                "FLASK_DEBUG": false
            },
            "args": [
                "run",
                "--no-debugger",
                "--no-reload"
            ],
            "jinja": true,
            "debugOptions": [
                "RedirectOutput"
            ]
        },
        {
            "name": "Python: Flask (0.10.x or earlier)", // flask 0.10以前版本
            "type": "python",
            "request": "launch",
            "stopOnEntry": false,
            "pythonPath": "/Users/seekplum/packages/pythonenv/staff27env/bin/python",
            "program": "${file}",
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "env": {
                "FLASK_DEBUG": false
            },
            "args": [],
            "jinja": true,
            "debugOptions": [
                "RedirectOutput"
            ]
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

### Java

* Java Extension Pack
* Java Test Runner
* Maven for java

#### 测试类

* Test.java

```java
package test;

public class Test{
    public static void main(String[] args){
        System.out.println("Hello test");
    }
}
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
            "type": "java",
            "name": "Debug (Launch)",
            "request": "launch",
            "cwd": "${workspaceFolder}",
            "console": "internalConsole",
            "stopOnEntry": false,
            "mainClass": "test.Test",
            "args": "",
        },
        {
            "type": "java",
            "name": "Debug (Attach)",
            "request": "attach",
            "hostName": "localhost",
            "port": 0
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

### C/C++

* 1.配置c_cpp_properties.json文件

`Command + Shift + P` 打开命令行工具窗口,选择 `C/Cpp: Edit Configurations...`

此时会在配置目录会生成一个`c_cpp_properties.json`文件,修改文件内容如下

```json
{
    "configurations": [
        {
            "name": "Mac",
            "includePath": [
                "${workspaceFolder}/**",
                "/Library/Developer/CommandLineTools/usr/include/c++/v1/",
                "/usr/local/include",
                "/Library/Developer/CommandLineTools/usr/lib/clang/10.0.1/include",
                "/usr/include"
            ],
            "defines": [],
            "macFrameworkPath": [
                "/System/Library/Frameworks",
                "/Library/Frameworks",
                "${workspaceFolder}/**"
            ],
            "compilerPath": "/usr/bin/g++",
            "cStandard": "c11",
            "cppStandard": "c++17",
            "intelliSenseMode": "clang-x64",
            "browse": {
                "path": [
                    "${workspaceFolder}"
                ],
                "limitSymbolsToIncludedHeaders": true,
                "databaseFilename": ""
            }
        }
    ],
    "version": 4
}
```

* 2.配置tasks.json文件

`Command + Shift + P` 打开 `Tasks: Configure Tasks`，选择 `Create tasks.json file from templates`，此时会蹦出一个下拉列表，在下拉列表中选择`Others`，此时会在配置目录生成一个tasks.json文件,修改文件内容如下

```json
{
    // See https://go.microsoft.com/fwlink/?LinkId=733558
    // for the documentation about the tasks.json format
    "version": "2.0.0",
    "tasks": [
        {
            "label": "run-c-c++",
            "type": "shell",
            "command": "g++",
            "args": [
                "${file}",
                "-o",
                "${fileDirname}/${fileBasenameNoExtension}",
                "-g"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "problemMatcher": [
                "$gcc"
            ]
        }
    ]
}
```

* 3.配置launch.json文件

```json
{
    // 使用 IntelliSense 了解相关属性。
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "C/C++ Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "${fileDirname}/${fileBasenameNoExtension}",
            "args": [],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [],
            "externalConsole": true,
            "MIMode": "lldb",
            "preLaunchTask": "run-c-c++"
        }
    ]
}
```

* 4.编写测试文件

```bash
cat > test_main.cpp <<EOF
#include <stdio.h>

int main(int argc, char **argv)
{
    printf("hello vs-code!\n");
    int result;
    int a = 2;
    int b = 3;
    result = a + b;
    printf("%d + %d = %d\n", a, b, result);
    return 0;
}
EOF
```

### Lua

* 安装Lua

```bash
brew install lua

brew install luajit
```

* 安装管理包

```bash
brew install luarocks
```

* 代码检查

```bash
luarocks install luacheck

# 在配置 .luacheckrc 的目录下执行

luacheck [文件名|目录名]
```

* vscode插件

```text
vscode-luacheck
```
