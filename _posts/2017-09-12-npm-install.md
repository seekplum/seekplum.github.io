---
layout: post
title:  nodejs安装
categories: 插件
tags: nodejs
thread: nodejs
---

## 使用 nvm 安装 NodeJs

[nvm](https://github.com/creationix/nvm)

使用 `nvm` 安装 `NodeJs` 的好处是可以切换 `NodeJs` 的版本，在多个版本共处的时候以及测试的时候很有用

```bash
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
# or Wget
# $ wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
```
在 ~/.bash_profile中增加如下代码
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
```
执行
```bash
source ~/.bash_profile
```

安装完成后，使用 `nvm ls-remote` 命令获取版本列表

```bash
# 获取版本列表
$ nvm ls-remote
# ...
# ...
# 这里以 4.3.2 版本为例
$ nvm install 4.3.2
$ nvm use 4.3.2
$ nvm alias default 4.3.2

$ node -v
# 4.3.2 即表示NodeJs安装完成
```

## 安装 cnpm

[npm](https://www.npmjs.com/) 是 `NodeJs` 的包管理器，但是这个源是国外的，`cnpm`使用的时taobao的镜像源，国内速度很快

**注意:** `npm` 不需要安装，NodeJs安装完成后会自带 `npm` 包

```bash
$ npm install -g cnpm --registry=https://registry.npm.taobao.org
```

[cnpm](http://npm.taobao.org/)

### 安装各种依赖包

```bash
# 进入 ui 目录
$ cnpm install
```

`install` 命令会安装 `package.json` 文件中写好的各种依赖包，会被安装到 `node_modules` 目录下。

## 启动开发环境

```bash
$ cnpm run server-dev
```

浏览器打开 `http://localhost:3000/` 预览页面

## 编译代码

执行构建命令程序会自动压缩、打包代码到 `dist` 目录下

```bash
$ cnpm run client-build
```

## 目录结构

```javascript
ui                         # 应用根目录
  + bin                    # 命令目录
    - www                  # 命令执行文件，启动环境
  + config                 # 配置目录
    - _base.js             # 基础配置文件
    - _development.js      # 开发配置文件
    - _production.js       # 生产配置文件
    - index.js             # config 配置输出文件
  + dist                   # 应用打包目录，该目录下的所有文件通过命令打包而来
  + node_modules           # NodeJs 包目录，通过 cnpm 命令进行包的 install remove 等操作(--save, --save-dev 参数会在包安装与删除时同步更新 package.json 文件相关字段)
  + server                 # 服务器端代码(NodeJs)
  + src                    # 前端源码目录
    + assets               # 资源文件夹(images等资源)
    + components           # 组件目录
    + containers           # 容器组件
    + layouts              # 布局组件
    + libs                 # 第三方非模块化资源(需要在页面通过 link 或者 script 标签加载)
    + locales              # 国际化配置文件目录
      - en-US.json         # 英文
      - zh-CN.json         # 简体中文
    + redux                # redux 模块目录
      + modules            # 各种 redux 模块(包含 reducer, action 等)
      - configureStore.js  # store 配置生成模块
    + routes
      - index.js           # 前端页面路由配置模块
    + styles               # css 源码目录(sass 格式)
    + utils                # 工具函数模块
    + views                # 具体页面模块
    - apple-touch-icon.png # favicon
    - favicon.ico          # favicon
    - index.html           # html 页面
    - index.js             # html 对应的 js 入口文件
  + test                   # 单元测试以及mock数据目录
```
