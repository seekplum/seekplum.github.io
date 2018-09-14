---
layout: post
title:  管理项目依赖
tags: pipenv pybuilder virtualenv
thread: pipenv
---

## pipenv

**注意: pipenv本质还是依赖virtualenv,所以在指定目录下生成`.venv`后,进行拷贝是无效的**

> requests 库的作者 Kenneth Reitz 编写的一个工具，目标是合并 Pipfile、pip、virtualenv 到同一个命令行工具中，实际使用中类似nodejs的依赖包管理工具npm。

### 使用

* 普通安装

作者推荐在python3下边安装，会提高与virtualenv的兼容性。

> pip install pipenv

* 用户模式安装

**为防止和系统python库产生影响，可使用此种方案安装。**

pip 默认安装包路径为`/usr/local/lib/python2.7/site-packages`。此模式下，pip安装包保存路径为用户库路径,一般为`/home/hjd/.local/lib/python2.7/site-packages/`, 可使用命令`python -m site --user-site` 具体查看。如果在安装后你的shell中pipenv不可用，你需要把用户库的二进制目录`/home/hjd/.local/bin/`添加到你的PATH中。

> pip install --user pipenv

* 添加shell补齐

如果使用的是bash, 可添加下面语句到.bashrc或.bash_profile

> eval "$(pipenv --completion)"

* 初始化虚拟环境

通过Pipflie.lock把包都装好

> mkdir /tmp/test-env

> cd /tmp/test-env && pipenv install

* 安装指定包

> pipenv install requests

* 查看已安装模块

> pipenv graph

* 只安装开发环境

可通过以下命令，仅安装在开发环境

> pipenv install --dev requests --three

* 通过 requirements.txt 安装

> pipenv install -r requirements.txt

* 生成requirements 文件

> pipenv lock -r  > requirements.txt

> pipenv lock -r --dev > requirements.txt   # 针对开发环境的包

* 生成lockfile

> pipenv lock

> pipenv lock -v \-\-keep-outdated

* 运行虚拟环境

可使用以下命令来运行项目：

> pipenv run python xxx.py

* 进入虚拟环境

> pipenv shell

> pipenv shell --anyway

* 退出虚拟环境

> deactivate

* 删除虚拟环境

> pipenv --rm

### 制作env
* 1.virtualenv创建env

> virtualenv \-\-always-copy \-\-python=/Users/seekplum/pythonenv/python27env/bin/python /tmp/env

* 2.进入env环境安装相应包

> pipenv install \-\-deploy \-\-system

`--system`: 参数表示使用 pip 直接安装相应依赖
`--deploy`: 如果Pipfile.lock已过期，或者Python版本错误，则中止

### 运行pyb异常

* pkg_resources.DistributionNotFound: The 'pipenv==11.0.2' distribution was not found and is required by the application

> 在pip2 中安装出现, pip3重新安装后正常

* pkg_resources.DistributionNotFound: The 'pew>=0.1.26' distribution was not found and is required by pipenv

> 需要安装下面几个模块,才能正常使用

**注意: 以下几个包直接通过pip进行安装都无法成功,需要在下载源码进行安装**

```
pew
shutilwhich
pathlib
virtualenv-clone
```

###  构建运行环境

* 前提

> 在此之前需要通过 pipenv install -r requiresments.txt 把依赖的包装好,会生成Pipfile, Pipfile.lock两个文件

* 需要安装[pybuilder](http://pybuilder.github.io/)

```shell
pip install pybuilder
```

* 克隆样本代码

```shell
git clone git@gitlab.woqutech.com:qdata/qdata-pipenv.git
```

* 进行构建

> 依赖 Pipfile, Pipfile.lock两个版本控制文件和 build.py 脚本

```shell
cd qdata-pipenv && pyb
```

* 激活虚拟环境，激活有2种方式

```shell
# 直接激活
. .venv/bin/activate
# 通过pipenv生成一个激活虚拟环境的shell
pipenv shell
```

* 运行我们的应用

```shell
cd src && python server.py
```

### 发生了什么

> 相比较构建之前，多了一个`.venv`虚拟环境目录。

* 构建具体做了以下2件事情：
    - 安装Python依赖管理工具[pipenv](https://pipenv.readthedocs.io/en/latest/)
    - 初始化我们项目的虚拟环境(路径在项目根目录底下的`.venv`目录底下)

### 管理项目依赖

* 安装包

```shell
pipenv install tornado
```

* 卸载包

```shell
pipenv uninstall tornado
```

* 更新包

```shell
pipenv update tornado
```

### 参考
[Stop everything! Start using Pipenv!](https://bryson3gps.wordpress.com/2017/11/08/stop-everything-start-using-pipenv/)

## virtualenv 
> 是一个非常流行的用于创建独立的python libraries环境的工具。我强烈推荐你学习并了解它，因为他非常实用，并且应用广泛，很多人用它来搭建python开发环境。后面其他工具来主要与virtualenv来进行比较以说明差异。

> virtualenv 通过安装一些列的可执行和库文件到某个目录（例如：env/)，然后通过修改环境变量PATH中可执行文件(bin目录)目录的先后顺序来实现其功能，比如将 env/bin/ 放到环境变量PATH的前面。然后将一个 python或python3的可执行文件放到 env/bin/目录下，由于python运行时，会优先搜索与其路径接近的相对目录位置，这样就可达成优先使用virtualenv创建的libraries目录的目的，运行activated进入virtualenv环境后，就可以通过pip安装libraries到env/环境下

## pyenv 
> virtualenvwrapper pyenv作者为pyenv写的另外一个插件，可方便集成virtualenvwrapper到pyenv。用于创建独立的python版本环境。例如，有可能你想要分别测试你的代码在 python2.6、2.7、3.3、3.4、3.5版本下的运行情况，那么你就需要类似pyenv这样的工具来快速切换python版本。一旦激活pyenv环境，它就将 ~/.pyenv/shims中的值放到环境变量PATH的前面，用于覆盖默认的python、pip可执行文件目录。它不会copy可执行文件，它仅仅是通过一些脚本代码基于 PYENV_VERSION或.python-version文件 来决定使用哪个python可执行文件运行python程序。另外，也可以通过 pyenv install 来安装多个python版本。

## pyenv-virtualenv
> pyenv作者为pyenv写的一个插件，通过该插件可以让你方便的同时使用pyenv和virtualenv。另外，如果你使用的是python3.3及以上的版本，它会尝试使用venv而不是virtualenv。当然，其实你也可以自己配置同时使用pyenv和virtualenv，而不直接使用pyenv-virtualenv。

## virtualenvwrapper 
> 是virtualenv的一些列扩展，它提供了诸如 mkvirtualenv, lssitepackages 等命令行工具，特别是 workon 命令行工具，当你需要使用多个virtualenv目录时使用该工具特别方便。

## pyvenv 
> python3自带的的一个标准工具，但是在python3.6中已经弃用，取而代之的是 venv (python3 -m venv)。

## venv
> python3自带的命令行工具，可以通过运行 python3 -m venv 启动。另外在某些发行版中，venv需要额外安装，比如Ubuntu需要安装 python3-venv。venv和virtualenv很接近，主要差别是不需要单独copy python可执行文件到相应目录。如果你不需要支持python2，那么你可以直接使用venv。不过到目前为止，python社区仍然更偏向于使用virtuanenv。


