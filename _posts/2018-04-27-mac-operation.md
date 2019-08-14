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

## 检查端口占用

```bash
lsof -i tcp:8000 | awk '{if(NR>1)print}'  | awk '{print $2}' | uniq | xargs kill -9
```

## SSH

### 配置

保证各个目录的权限对的

```bash
chmod 755 /Users/seekplum
chmod 755 /Users/seekplum/.ssh
chmod 600 /Users/seekplum/.ssh/authorized_keys
```

### 服务重启

* 页面重启

系统偏好设置 -> 共享 -> 远程登录

## 自定义锁屏键

Mac的默认锁屏键为 `control + command + Q`，我们可以进行修改

* 1.定义锁屏程序

打开 `自动操作` -> 选择 `应用程序` -> 选择 `实用工具` -> 双击 `允许Shell脚本` -> 在右侧编写如下内容 -> `command + S` 进行保存

Lock My Screen

```bash
/System/Library/CoreServices/"Menu Extras"/User.menu/Contents/Resources/CGSession -suspend
echo $(date +"%F %T" >> ${HOME}/lock-my-screen.log)
```

* 2.定义锁屏服务

打开 `自动操作` -> 选择 `服务` 或者叫 `快速操作` -> 选择 `实用工具` -> 双击 `开启应用程序` -> 在右侧选择第一步保存的程序 `Lock My Screen` -> `command + S` 进行保存

* 3.定义快捷键

打开 `系统偏好设置` -> 选择 `键盘` -> 选择 `快捷键` -> 选择 `服务` -> 找到 `Lock My Screen` 为其定义快捷键即可。

其它应用程序的快捷键也是类似的，只不过第一步定义应用程序是可以省略的。

## item2按单词跳转

Preferences -> Profiles -> Keys -> Load Preset.. -> Natural Text Editing

## 安装软件列表

* 企业微信
* 微信
* QQ
* 百度网盘
* [ShadowsocksX](https://github.com/shadowsocks/ShadowsocksX-NG/releases)
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
* [Robo 3T](https://download-test.robomongo.org/mac/robo3t-1.3.1-darwin-x86_64-7419c40.dmg)
* [AnotherRedisDesktopManager](https://github.com/qishibo/AnotherRedisDesktopManager/releases)
* [BeyondCompare](https://www.scootersoftware.com/download.php)文本对比工具
* [Gifox](https://gifox.io/)GIF录制
