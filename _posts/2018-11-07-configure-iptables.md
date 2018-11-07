---
layout: post
title:  防火墙规则
categories: linux
tags: linux iptables
thread: linux
---

## 禁止指定端口访问
* 禁止某个IP访问22端口

> iptables -I INPUT -s 10.10.100.4 -p tcp \-\-dport 22 -j DROP     

* 禁止某个网段访问22端口
> iptables -I INPUT -s 10.10.100.0/24 -p tcp \-\-dport 22 -j DROP    

* 禁止所有IP访问22端口

> iptables -A INPUT -p tcp \-\-dport 22 -j DROP

## 禁止Ping
* 禁止其他人PING本机

> iptables -A INPUT -p icmp \-\-icmp-type echo-request -j DROP

* 禁止本机PING其他人

> iptables -A OUTPUT -p icmp --icmp-type echo-request -j DROP

## 禁用所有端口 && 开放指定IP段的22端口 && 允许指定网段相互ping
```
iptables -A INPUT -s 10.10.100.0/24  -d 10.10.100.3  -p tcp --dport 22 -j ACCEPT

iptables -A OUTPUT -d 10.10.100.0/24   -s 10.10.100.3 -p tcp --sport 22 -j ACCEPT

iptables -p INPUT DROP

iptables -p OUTPUT DROP

iptables -p FORWARD DROP

如果此时还要允许本机ping其它（其它主机不写，表示全部）:

iptables -A OUTPUT -s 10.10.100.3  -d  10.10.100.0/24   -p icmp --icmp-type 8 -j ACCEPT 允许ping其他了，但只放出了，进不来

iptables -A INPUT     -d 10.10.100.3  -s   10.10.100.0/24   -p icmp --icmp-type 0 -j ACCEPT 所以还要开放进入的

如果此时也要允许其他主机ping本机：

iptables -A   INPUT   -d 10.10.100.3  -s 10.10.100.0/24 -p icmp --icmp-type 8 -j ACCEPT        8是回显请求

iptables -A OUTPUT -s 10.10.100.3  -d 10.10.100..0/24 -p icmp --icmp-type 0 -j ACCEPT        0是回显应答，此时其他主机也可以ping通本机



iptables -A OUTPUT  -s 172.16.128.3   -d  172.16.128.0/24   -p icmp --icmp-type 8 -j ACCEPT 

iptables -A INPUT     -d 172.16.128.3  -s   172.16.128.0/24   -p icmp --icmp-type 0 -j ACCEPT

iptables -A   INPUT   -d  172.16.128.3   -s  172.16.128.0/24 -p icmp --icmp-type 8 -j ACCEPT 
iptables -A OUTPUT -s  172.16.128.3  -d    172.16.128.0/24 -p icmp --icmp-type 0 -j ACCEPT  
```

## 保存配置
> service iptables save 