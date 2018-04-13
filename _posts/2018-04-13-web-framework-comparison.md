---
layout: post
title:  Web框架对比
tags: python tornado flask django
thread: comparison
---
## Tornado
* 自带的异步特性，属于异步框架
* 采用非阻塞网络 I / O 模型，可以处理数以千计的网络连接，这意味着对于 long polling 、WebSockets 和其他需要长时间实时连接
* 以字典形式，映射到类中
* 扩展性主要在于性能上

> Tornado 本质上，每一次处理都交由 tornado.web.RequestHandler 来处理。所以在实现大部分功能都是对 RequestHandler 进行定制和修改。找不到一个很好的链式继承方式来对 RequestHandler 进行重构，就注定 Tornado 的代码重构会很差。

## Django
* 同步框架
* 功能全面，轮子多，扩展性若
* ORM与数据库的交互较慢
* 以字典形式，映射到函数
* mvc结构

## Flask
* 同步框架
* 微框架典范
* 以decorator的形式，映射到函数中
* 扩展性强
* 扩展性主要在于功能上




