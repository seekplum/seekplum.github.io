---
layout: post
title:  编写github博客
tags: github blog
thread: githublog
---
## [hexo](https://hexo.io/zh-cn/docs/index.html)

### 安装
```
npm install hexo-deployer-git --save

npm install hexo --save

npm install hexo-server --save
```

### 安装运行依赖
```
npm install
```

### 生成静态文件
```
hexo generate
```

### 在线预览
```
hexo server
```

### [next主题](http://theme-next.iissnan.com/getting-started.html)

## [jekyll](https://www.jekyll.com.cn/docs/home/)

### 推荐博客样式
```
https://github.com/fzy-Line/fzy-Line.github.io
```

### 安装
* 安装ruby

> 从[官网](https://rubyinstaller.org/downloads/)下载包
> gem install jekyll

### 代码高亮

#### 修改配置文件
> 修改Jekyll的配置文件_config.yml，将markdown选项改为kramdown，highlighter和syntax_highlighter都改为rouge.

```
highlighter: rouge
markdown: kramdown
kramdown:
  input: GFM
  syntax_highlighter: rouge
```

#### 配置高亮样式
* 首先安装rouge，然后生成对应主题的css文件。

```
gem install rouge
rougify style monokai.sublime > static/css/syntax.css
```

* 将这个css文件放到`_layouts.content.html`中即可。

```
<link rel="stylesheet" href="/static/css/syntax.css"/>
```

* 修改背景色

> 如果需要修改代码块的背景颜色的话，修改syntax.css中的背景配色即可。Sublime的背景色为#272822，Atom的背景色为#282C34.

```
pre[class='highlight'] {background-color:#272822;}
```