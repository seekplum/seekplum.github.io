---
layout: post
title:  持续学习docker<五>-Network
categories: docker
tags: docker Network
thread: docker
---
## 跨主机网络方案
![网络方案](/static/images/docker/docker-network.jpg)

* 1.docker 原生的 overlay 和 macvlan。
* 2.第三方方案：常用的包括 flannel、weave 和 calico。

**如此众多的方案是如何与 docker 集成在一起的？**

答案是：libnetwork 以及 CNM。
