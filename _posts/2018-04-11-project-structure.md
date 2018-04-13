---
layout: post
title:  python项目结构
tags: python structure
thread: structure
---

## 模块类型
根据**接口调用**方式的不同，将模块划分为两种类型
1. http api
2. 直接调用(python import语句)

这两种类型的模块相关联的目录结构是不一样的，因此需要显示的区分，为了方便引用，我们将第一种称为`application`,第二种叫做`library`.

## Library的目录结构
- **project_name**
- **bin**
- **tests**
- **docs**
- setup.py
- setup.cfg
- MANIFEST.in
- README.md
- [Pipfile]
- [Pipfile.lock]

## Application的目录结构
- **project_name**
- **bin**
- **conf**
    - **nginx**
    - **supervisor**
    - app.conf
- **tests**
- **docs**
- README.md
- Pipfile
- Pipfile.lock
- build
- run
- tasks.py

## Build之后的Application的目录结构
- **project_name**
- **.venv**
- **bin**
- **logs**
- **conf**
    - **nginx**
    - **supervisor**
    - app.conf
- run
