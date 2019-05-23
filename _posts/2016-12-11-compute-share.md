---
layout: post
title: windows 共享网络
categories: 软件
tags: 网络 共享 shar
thread: compute-share
---

## 共享网络

1.以管理员身份运行命令提示符。

2.netsh wlan set hostednetwork mode=allow

3.netsh wlan set hostednetwork ssid=帐号(例如asd) key=密码(12345678)

![承载网络](/static/images/compute-share/承载网络.png)

4.点击控制面板选项。再打开网络共享中心--更改适配器设置

![本地网络](/static/images/compute-share/本地网络.png)

5.netsh wlan start hostednetwork

6.打开网络共享中心--更改适配器设置，右击你的本地连接，选择属性，点击共享，勾选“允许其他网络用户通过此计算机的Internet连接还连接”选项，在下拉菜单中选择刚才建立的虚拟网络，确定。

![连接属性](/static/images/compute-share/连接属性.png)