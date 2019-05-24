---
layout: post
title:  mac相关操作和配置
tags: mac 配置 operation
thread: operation
---

## 安装brew

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

## 安装ftp

brew search --desc ftp

brew install tnftp tnftpd

## 信任任何来源

```bash
sudo spctl --master-disable
```

## bashrc配置

```bash
# .bashrc

if [[ -f /etc/bashrc ]]; then
    . /etc/bashrc
fi

export MYSQL_HOME="${HOME}/packages/mysql"
export ORACLE_HOME="${HOME}/packages/oracle"
export LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${ORACLE_HOME}"
export DYLD_LIBRARY_PATH="${DYLD_LIBRARY_PATH}:${ORACLE_HOME}:${MYSQL_HOME}/lib"

export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk1.8.0_162.jdk/Contents/Home"
export CLASS_PATH="${JAVA_HOME}/lib"

export M2_HOME="${HOME}/packages/apache-maven-3.5.4"

export GOROOT="/usr/local/go"
export GOPATH="${HOME}/GolangProjects"

export PYTHONSTARTUP="${HOME}/.pythonrc"
export PYTHONPROJECTSPATH="${HOME}/PythonProjects"
export WEBPROJECTSPATH="${HOME}/WebProjects"

export LDFLAGS="-L/usr/local/opt/ncurses/lib"
export CPPFLAGS="-I/usr/local/opt/ncurses/include"

export PS1='%M@%n ${ret_status} %{$fg[cyan]%}%c%{$reset_color%}$(__docker_machine_ps1) $(git_prompt_info)'
export PIP_INDEX_URL=https://pypi.douban.com/simple/

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/sbin:/usr/bin:/bin"
export PATH="${PATH}:/usr/local/opt/ncurses/bin"
export PATH="${PATH}:${HOME}/.nvm/versions/node/v10.0.0/bin"
export PATH="${PATH}:${GOPATH}/src/github.com/kardianos/govendor"
export PATH="${PATH}:${GOPATH}/src/github.com/golang/dep/cmd/dep/dep"
export PATH="${PATH}:${GOPATH}/src/github.com/jteeuwen/go-bindata/go-bindata"
export PATH="${PATH}:${GOROOT}/bin:${GOPATH}/bin"
export PATH="${PATH}:${HOME}/pythonenv/python27env/bin"
export PATH="${PATH}:${HOME}/pythonenv/python36env/bin"
export PATH="${PATH}:${MYSQL_HOME}/bin:${JAVA_HOME}/bin"
export PATH="${PATH}:${M2_HOME}/bin"
export PATH="${PATH}:${HOME}/istio-0.8.0/bin"
export PATH="${PATH}:${HOME}/packages/redis/src/"
export PATH="${PATH}:${HOME}/packages/mongodb/bin/"
export PATH="${PATH}:/usr/local/Cellar/rabbitmq/3.7.14/sbin/"
export PATH="${PATH}:${HOME}/packages/apache-maven-3.5.4/bin"

# User specific aliases and functions
alias senv2='source ${HOME}/pythonenv/python27env/bin/activate'
alias senv3='source ${HOME}/pythonenv/python36env/bin/activate'
alias senv="senv2"

alias mystart="${HOME}/pythonenv/python27env/bin/supervisord -c ${HOME}/packages/supervisor/supervisord.conf"
alias mysuper="${HOME}/pythonenv/python27env/bin/supervisorctl -c ${HOME}/packages/supervisor/supervisord.conf"
alias mymysql='${HOME}/packages/mysql/bin/mysql -uroot -proot -S ${HOME}/packages/mysql/data/sock/mysql.sock'
alias myredis='/Users/seekplum/packages/redis/src/redis-cli'

alias ll='ls -l'
alias cp='cp -i'
alias mv='mv -i'
alias rm='echo -e "\033[33mThis is not the command you are looking for.\033[0m"; false'

alias cdg='cd ${GOPATH}/src'
alias cdp="cd ${PYTHONPROJECTSPATH}"
alias cdw="cd ${WEBPROJECTSPATH}"

alias cds="cd ${PYTHONPROJECTSPATH}/github.com/seekplum/seekplum"
alias cdi="cd ${PYTHONPROJECTSPATH}/github.com/seekplum/seekplum.github.io"
alias cdm="cd ${PYTHONPROJECTSPATH}/meideng.net/meizhe2012"

source '/usr/local/etc/bash_completion.d/docker-machine-prompt.bash'

```

## omyzsh 未执行 ~/.bash_profile、~/.bashrc等脚本

这是因为其默认启动执行脚本变为了 ~/.zshrc。

解决办法就是修改~/.zshrc文件，在其中添加：

```bash
source ~/.bash_profile
source ~/.bashrc
```

## 安装JAVA

### 版本

* java -version

```text
java version "1.8.0_162"
Java(TM) SE Runtime Environment (build 1.8.0_162-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.162-b12, mixed mode)
```

小版本需要在1.7以下，在1.7之后禁止了 web start,会导致无法启动 viewer.jnlp

### JAVA 测试

HelloWorld.java

```java
public class HelloWorld{
    public static void main (String []argv){
        System.out.println("JAVA");
        System.out.println("Hello World!");
    }
}
```

```bash
javac HelloWorld.java    //编译.java文件

java HelloWorld //运行java

javaws *.jnlp  //运行.jnlp文件
```

## 安装Maven

* 1.[下载Maven的`bin包`](http://maven.apache.org/download.cgi)
* 2.把包解压到指定目录
* 3.设置环境变量

```bash
export M2_HOME=$HOME/packages/apache-maven-3.5.4
export M2=$M2_HOME/bin
export PATH=$PATH:$M2
```

## 安装配置[zsh](https://github.com/robbyrussell/oh-my-zsh)

### 安装

* 使用 crul 安装：

```bash
sh -c "$(curl -fsSL https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

* 或使用wget

```bash
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
```

### 配置

* 自动提示命令

当我们输入命令时，终端会自动提示你接下来可能要输入的命令，这时按 → 便可输出这些命令，非常方便。

设置如下：

1.克隆仓库到本地 ~/.oh-my-zsh/custom/plugins 路径下

```bash
git clone git://github.com/zsh-users/zsh-autosuggestions $ZSH_CUSTOM/plugins/zsh-autosuggestions
```

2.用 vim 打开 .zshrc 文件，找到插件设置命令，默认是 plugins=(git) ，我们把它修改为

```bash
plugins=(zsh-autosuggestions git)
```

3.重新打开终端窗口。

PS：当你重新打开终端的时候可能看不到变化，可能你的字体颜色太淡了，我们把其改亮一些：

```bash
cd ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions
```

用 vim 打开 zsh-autosuggestions.zsh 文件，修改 ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=10' （ fg=10 在我电脑上显示良好）。

* 语法高亮

1.使用homebrew安装 zsh-syntax-highlighting 插件。

```bash
brew install zsh-syntax-highlighting
```

2.配置.zshrc文件，插入一行。

```bash
source /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
```

3.输入命令。

```bash
source ~/.zshrc
```

## 复制文件路径快捷键

```bash
option + command + C
```

## 安装sshpass

```bash
brew install https://raw.githubusercontent.com/kadwanev/bigboybrew/master/Library/Formula/sshpass.rb
```

## 安装命令行查询工具

```bash
curl https://cht.sh/:cht.sh | tee /usr/local/bin/cht.sh && chmod +x /usr/local/bin/cht.sh
```

## 安装软件列表

* 企业微信
* 微信
* QQ
* 百度网盘
* ShadowsocksX
* Google Chrome
* Postman
* Pycharm
* Goland
* Vscode
* xcode
* SSLVPN Client
* xnip
* vnc viewer
* teamviewer
* oh-my-zsh
* item2
* Java JDK
