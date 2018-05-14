---
layout: post
title:  mac相关操作和配置
tags: mac 配置 operation
thread: operation
---

## 信任任何来源

> sudo spctl --master-disable

## bashrc配置

```bash
alias senv='source $HOME/pythonenv/python27env/bin/activate'
alias mymysql='$HOME/packages/mysql/bin/mysql -uroot -proot -S $HOME/packages/mysql/data/sock/mysql.sock'
alias clouddoc="apidoc -i $HOME/PythonProjects/qdata-cloud -o /tmp/doc/ -e $HOME/PythonProjects/qdata-cloud/qflame && scp -r /tmp/doc/ qdata:/root/ && ssh qdata /home/sendoh/sendoh-web-env/bin/supervisorctl -c /home/sendoh/sendoh-web-env/packages/conf/supervisor/supervisord.conf restart nginx"
alias deploydoc="rm -rf /tmp/doc/ && apidoc -i $HOME/PythonProjects/qdeploy -o /tmp/doc/ && scp -r /tmp/doc/ deploy:/root/ && ssh deploy /home/sendoh/sendoh-web-env/bin/supervisorctl -c /home/sendoh/sendoh-web-env/packages/conf/supervisor/supervisord.conf restart nginx"

alias ll='ls -l'
alias cdp='cd $HOME/PythonProjects/'
alias cds='cd $HOME/PythonProjects/seekplum'
alias cdc='cd $HOME/PythonProjects/qdata-cloud'
alias cdm='cd $HOME/PythonProjects/qdata-mgr/src'


export MYSQL_HOME=$HOME/packages/mysql

export ORACLE_HOME=$HOME/packages/oracle
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ORACLE_HOME
export DYLD_LIBRARY_PATH=$DYLD_LIBRARY_PATH:$ORACLE_HOME:$MYSQL_HOME/lib

export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk1.8.0_162.jdk/Contents/Home
export CLASS_PATH=$JAVA_HOME/lib

export PATH=$PATH:$HOME/bin:$MYSQL_HOME/bin:$JAVA_HOME/bin

source $HOME/pythonenv/python27env/bin/activate
```

## omyzsh 未执行 ~/.bash_profile、~/.bashrc等脚本

这是因为其默认启动执行脚本变为了 ~/.zshrc。

解决办法就是修改~/.zshrc文件，在其中添加：

```
source ~/.bash_profile
source ~/.bashrc
```

## 安装JAVA

### 版本
* java -version

```
java version "1.8.0_162"
Java(TM) SE Runtime Environment (build 1.8.0_162-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.162-b12, mixed mode)
```

小版本需要在1.7以下，在1.7之后禁止了 web start,会导致无法启动 viewer.jnlp

### JAVA 测试

HelloWorld.java

```
public class HelloWorld{
    public static void main (String []argv){
        System.out.println("JAVA");
        System.out.println("Hello World!");
    }
}
```

> javac HelloWorld.java    //编译.java文件

> java HelloWorld //运行java

> javaws *.jnlp  //运行.jnlp文件

## 安装配置[zsh](https://github.com/robbyrussell/oh-my-zsh)

### 安装

* 使用 crul 安装：

> sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"

* 或使用wget：

> sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"

### 配置

* 自动提示命令

当我们输入命令时，终端会自动提示你接下来可能要输入的命令，这时按 → 便可输出这些命令，非常方便。

设置如下：

1.克隆仓库到本地 ~/.oh-my-zsh/custom/plugins 路径下

> git clone git://github.com/zsh-users/zsh-autosuggestions $ZSH_CUSTOM/plugins/zsh-autosuggestions

2.用 vim 打开 .zshrc 文件，找到插件设置命令，默认是 plugins=(git) ，我们把它修改为

> plugins=(zsh-autosuggestions git)


3.重新打开终端窗口。

PS：当你重新打开终端的时候可能看不到变化，可能你的字体颜色太淡了，我们把其改亮一些：

> cd ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

用 vim 打开 zsh-autosuggestions.zsh 文件，修改 ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=10' （ fg=10 在我电脑上显示良好）。

* 语法高亮

1.使用homebrew安装 zsh-syntax-highlighting 插件。

> brew install zsh-syntax-highlighting


2.配置.zshrc文件，插入一行。

> source /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh


3.输入命令。

> source ~/.zshrc


## 安装软件列表
* 企业微信
* 微信
* QQ
* 百度网盘
* ShadowsocksX
* Google Chrome
* Postman
* Pycharm
* xcode
* SSLVPN Client
* xnip
* vnc viewer
* teamviewer
* oh-my-zsh
* item2
* Java JDK