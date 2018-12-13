---
layout: post
title:  IO多路复用机制
tags: system
thread: io select poll epoll multipath
---
## 基本概念

### 同步/非同步

同步和异步针对应用程序来，关注的是消息通信机制，程序中间的协作关系。

* 同步

执行一个操作之后，等待结果，然后才继续执行后续的操作。同步需要主动读写数据，在读写数据过程中还是会阻塞。

* 异步

执行一个操作后，可以去执行其他的操作，然后等待通知再回来执行刚才没执行完的操作。由**操作系统**内核完成数据的读写。

### 阻塞/非阻塞

阻塞与非阻塞更关注的是单个进程的执行状态。进程/线程访问的数据是否就绪，进程/线程是否需要等待。

* 阻塞

进程给CPU传达一个任务之后，一直等待CPU处理完成，然后才执行后面的操作。

* 非阻塞

进程给CPU传达任我后，继续处理后续的操作，隔断时间再来询问之前的操作是否完成。这样的过程其实也叫轮询。

### 用户空间和内核空间
操作系统都是采用虚拟存储器，对于32位操作系统，它的寻址空间（虚拟存储空间）为4G。操作系统的核心是内核，独立于普通的应用程序，可以访问受保护内存空间，也有访问底层硬件设备的所有权限，为了保证用户进程不能直接操作内核，保证内核的安全，操作系统将虚拟空间分为两部分：一部分为内核空间，一部分是用户空间，针对linux系统而言，将最高的1G字节给内核使用，称为内核空间，将3G字节的供各个进程使用，称为用户空间。

### 文件描述符fd

文件描述符是一个用于表述指向文件的引用的抽象化概念

文件描述符在形式上是一个非负整数，实际上，它是一个索引值，指内核为每一个进程所维护的进程打开文件的记录的记录表，当程序打开一个现有文件或者创建一个新文件时，内核向进程返回一个文件描述符。

### 缓存IO

缓存IO，也被称为标准IO，大多数文件系统默认IO操作都是缓存IO，在Linux的缓存IO机制中，操作系统会将IO的数据缓存在文件系统的页缓存（page cache）中，也就是说，数据会先被拷贝到操作系统内核的缓冲区中，然后才会从操作系统内核的缓冲区拷贝到应用程序的地址空间

**缓存IO的缺点：**

数据在传输过程中需要在应用程序地址空间和内核进行多次数据拷贝操作，这些数据拷贝操作所带来的CPU以及内存开销是非常大的

### 阻塞式IO
耗时型任务一般分为两类：CPU耗时型任务和IO耗时型任务。CPU指一般的代码运算执行过程，IO一般分为两大类，计算型IO和阻塞式IO。如果仅有一个线程，那么同一时刻只能有一个任务在计算，但如果是阻塞式IO，它可以让它先阻塞掉，然后去计算其他的任务，等到内核告诉程序那边没有被阻塞了就、再回到之前的地方进行之后的运算。

## 事件驱动

通常，我们写服务器处理模型的程序时，有以下几种模型：

* 1.每收到一个请求，创建一个新的进程，来处理该请求；
* 2.每收到一个请求，创建一个新的线程，来处理该请求；
* 3.每收到一个请求，放入一个事件列表，让主进程通过非阻塞I/O方式来处理请求

上面的几种方式，各有千秋，

第 (1) 种方法，由于创建新的进程的开销比较大，所以，会导致服务器性能比较差,但实现比较简单。

第（2) 种方式，由于要涉及到线程的同步，有可能会面临死锁等问题。

第（3）种方式，在写应用程序代码时，逻辑比前面两种都复杂。

综合考虑各方面因素，一般普遍认为第（3）种方式是大多数网络服务器采用的方式

当我们面对如下的环境时，事件驱动模型通常是一个好的选择：

### 适用场景
* 1.程序中有许多任务
* 2.任务之间高度独立（因此它们不需要互相通信，或者等待彼此）
* 3.在等待事件到来时，某些任务会阻塞。

当应用程序需要在任务间共享可变的数据时，这也是一个不错的选择，因为这里不需要采用同步处理。


## IO模式
对于一次IO访问（以read为例子），数据会先拷贝到操作系统内核的缓冲区中，然后会从操作系统内核的缓冲区拷贝到应用程序的地址空间，也就是说当一个read操作发生时，它会经历两个阶段：

* 1.等待数据准备
* 2.经数据从内核拷贝到进程

正是因为这两个阶段，linux系统产生了五种网络模式的方案

* 1.阻塞I/O（blocking IO）
* 2.非阻塞I/O（nonblocking IO）
* 3.I/O多路复用（IO multiplexing）
* 4.信号驱动I/O（signal driven IO）
* 5.异步I/O（asynchromous IO）

**注意：信号驱动I/O（signal driven IO）在实际中不常用**

### 阻塞I/O（blocking IO）
在linux中，默认情况下所有的socket都是blocking。blocking IO的特点就是在IO执行的两个阶段都被block了。


### 非阻塞I/O
linux下，可以通过设置socket使其变为non-blocking。nonblocking IO的特点是用户进程需要不断的主动询问kernel数据好了没有。

### I/O多路复用（IO multiplexing）
IO multiplexing就是我们说的select，poll，epoll，有些地方也称这种IO方式为event driven IO。select/epoll的好处就在于单个process就可以同时处理多个网络连接的IO。I/O 多路复用的特点是通过一种机制一个进程能同时等待多个文件描述符，而这些文件描述符（套接字描述符）其中的任意一个进入读就绪状态，select()函数就可以返回。

用select的优势在于它可以同时处理多个connection。所以，如果处理的连接数不是很高的话，使用select/epoll的web server不一定比使用multi-threading + blocking IO的web server性能更好，可能延迟还更大。select/epoll的优势并不是对于单个连接能处理得更快，而是在于能处理更多的连接。

**进程是被select这个函数block，而不是被socket IO给block。**


### 异步I/O（asynchronous IO）
kernel不会对用户进程产生任何block,结束后kernel会给用户进程发送一个signal。

## select

### 概念

IO多路复用是指内核一旦发现进程指定的一个或者多个IO条件准备读取，它就通知该进程。IO多路复用适用如下场合：

1.当客户处理多个描述字时（一般是交互式输入和网络套接口），必须使用I/O复用。

2.当一个客户同时处理多个套接口时，而这种情况是可能的，但很少出现。

3.如果一个TCP服务器既要处理监听套接口，又要处理已连接套接口，一般也要用到I/O复用。

4.如果一个服务器即要处理TCP，又要处理UDP，一般要使用I/O复用。

5.如果一个服务器要处理多个服务或多个协议，一般要使用I/O复用。

**与多进程和多线程技术相比，I/O多路复用技术的最大优势是系统开销小，系统不必创建进程/线程，也不必维护这些进程/线程，从而大大减小了系统的开销。**

### 实现原理
sekect是通过一个select（）系统调用来监视多个文件描述符，当select()返回后，该数组中就绪的文件描述符便会被该内核修改标志位，使得进程可以获得这些文件描述符从而进行后续的读写操作。拆解如下

* 1.使用copy_from_user从用户空间拷贝fd_set到内核空间
* 2.注册回调函数__pollwait
* 3.遍历所有fd，调用其对应的poll方法（对于socket，这个poll方法是sock_poll，sock_poll根据情况会调用到tcp_poll,udp_poll或者datagram_poll）
* 4.以tcp_poll为例，其核心实现就是__pollwait，也就是上面注册的回调函数。
* 5.__pollwait的主要工作就是把current（当前进程）挂到设备的等待队列中，不同的设备有不同的等待队列，对于tcp_poll来说，其等待队列是sk->sk_sleep（注意把进程挂到等待队列中并不代表进程已经睡眠了）。在设备收到一条消息（网络设备）或填写完文件数据（磁盘设备）后，会唤醒设备等待队列上睡眠的进程，这时current便被唤醒了。
* 6.poll方法返回时会返回一个描述读写操作是否就绪的mask掩码，根据这个mask掩码给fd_set赋值。
* 7.如果遍历完所有的fd，还没有返回一个可读写的mask掩码，则会调用schedule_timeout是调用select的进程（也就是current）进入睡眠。当设备驱动发生自身资源可读写后，会唤醒其等待队列上睡眠的进程。如果超过一定的超时时间（schedule_timeout指定），还是没人唤醒，则调用select的进程会重新被唤醒获得CPU，进而重新遍历fd，判断有没有就绪的fd。
* 8.把fd_set从内核空间拷贝到用户空间。

### 优点
* 支持跨平台

### 缺点
* 1.每次调用select，都需要把fd集合从用户态拷贝到内核态，这个开销在fd很多时会很大
* 2.同时每次调用select都需要在内核遍历传递进来的所有fd，这个开销在fd很多时也很大
* 3.select支持的文件描述符数量太小了，默认是1024
* 4.对socket进行扫描时是线性扫描


## poll

### 概念
poll的机制与select类似，与select在本质上没有多大差别，管理多个描述符也是进行轮询，根据描述符的状态进行处理，但是poll没有最大文件描述符数量的限制。poll和select同样存在一个缺点就是，包含大量文件描述符的数组被整体复制于用户态和内核的地址空间之间，而不论这些文件描述符是否就绪，它的开销随着文件描述符数量的增加而线性增大。

### 实现
poll的实现和select非常相似，只是描述fd集合的方式不同，poll使用pollfd结构而不是select的fd_set结构，其他的都差不多。

### 优点
* 没有最大文件描述符数量的限制,原因是它是基于链表来存储的


### 缺点
* 开销随着文件描述符数量的增加而线性增大

**select、poll都是水平触发**

## epoll

### 概念
epoll是在2.6内核中提出的，是之前的select和poll的增强版本。相对于select和poll来说，epoll更加灵活，没有描述符限制。epoll使用一个文件描述符管理多个描述符，将用户关系的文件描述符的事件存放到内核的一个事件表中，这样在用户空间和内核空间的copy只需一次。

### 工作模式
epoll对文件描述符的操作有两种模式：水平触发 LT（level trigger）和边缘触发 ET（edge trigger）。LT模式是默认模式，LT模式与ET模式的区别如下：

* 水平触发 LT模式

当epoll_wait检测到描述符事件发生并将此事件通知应用程序，应用程序可以不立即处理该事件。下次调用epoll_wait时，会再次响应应用程序并通知此事件。**即会重复通知。**

* 边缘触发 ET模式

当epoll_wait检测到描述符事件发生并将此事件通知应用程序，应用程序必须立即处理该事件。如果不处理，下次调用epoll_wait时，不会再次响应应用程序并通知此事件。**即不会重复通知，只通知一次，理论上边缘触发的性能要更高一些，但是代码实现相当复杂。**

ET模式在很大程度上减少了epoll事件被重复触发的次数，因此效率要比LT模式高。epoll工作在ET模式的时候，必须使用非阻塞套接口，以避免由于一个文件句柄的阻塞读/阻塞写操作把处理多个文件描述符的任务饿死。

* mmap(共享内存)

只是把要传递的fd通过mmap来传递的，而需要读fd里面的数据的话，还是要程序通过read fd来读的.

**无论是select,poll还是epoll都需要内核把FD消息通知给用户空间**

### 避免select三个缺点
在此之前，我们先看一下epoll和select和poll的调用接口上的不同，select和poll都只提供了一个函数——select或者poll函数。而epoll提供了三个函数，epoll_create,epoll_ctl和epoll_wait，epoll_create是创建一个epoll句柄；epoll_ctl是注册要监听的事件类型；epoll_wait则是等待事件的产生。

对于第一个缺点，epoll的解决方案在epoll_ctl函数中。每次注册新的事件到epoll句柄中时（在epoll_ctl中指定EPOLL_CTL_ADD），会把所有的fd拷贝进内核，而不是在epoll_wait的时候重复拷贝。epoll保证了每个fd在整个过程中只会拷贝一次。

对于第二个缺点，epoll的解决方案不像select或poll一样每次都把current轮流加入fd对应的设备等待队列中，而只在epoll_ctl时把current挂一遍（这一遍必不可少）并为每个fd指定一个回调函数，当设备就绪，唤醒等待队列上的等待者时，就会调用这个回调函数，而这个回调函数会把就绪的fd加入一个就绪链表）。epoll_wait的工作实际上就是在这个就绪链表中查看有没有就绪的fd（利用schedule_timeout()实现睡一会，判断一会的效果，和select实现中的第7步是类似的）。

对于第三个缺点，epoll没有这个限制，它所支持的FD上限是最大可以打开文件的数目，这个数字一般远大于2048,举个例子,在1GB内存的机器上大约是10万左右，具体数目可以cat /proc/sys/fs/file-max察看,一般来说这个数目和系统内存关系很大。

## IO多路复用机制
select、poll、epoll都是IO多路复用机制。I/O多路复用就通过一种机制，可以监视多个描述符，一旦某个描述符就绪（一般是读就绪或者写就绪），能够通知程序进行相应的读写操作。但select，poll，epoll本质上都是同步I/O，因为他们都需要在读写事件就绪后自己负责进行读写，也就是说这个读写过程是阻塞的，而异步I/O则无需自己负责进行读写，异步I/O的实现会负责把数据从内核拷贝到用户空间。
g
select，poll实现需要自己不断轮询所有fd集合，直到设备就绪，期间可能要睡眠和唤醒多次交替。而epoll其实也需要调用epoll_wait不断轮询就绪链表，期间也可能多次睡眠和唤醒交替，但是它是设备就绪时，调用回调函数，把就绪fd放入就绪链表中，并唤醒在epoll_wait中进入睡眠的进程。虽然都要睡眠和交替，但是select和poll在“醒着”的时候要遍历整个fd集合，而epoll在“醒着”的时候只要判断一下就绪链表是否为空就行了，这节省了大量的CPU时间。这就是回调机制带来的性能提升。

select，poll每次调用都要把fd集合从用户态往内核态拷贝一次，并且要把current往设备等待队列中挂一次，而epoll只要一次拷贝，而且把current往等待队列上挂也只挂一次（在epoll_wait的开始，注意这里的等待队列并不是设备等待队列，只是一个epoll内部定义的等待队列）。这也能节省不少的开销。

## 示例
以select方法为例子进行理解，Python的select()方法直接调用操作系统的IO接口，它监控sockets,open files, and pipes(所有带fileno()方法的文件句柄)何时变成readable 和writeable, 或者通信错误，select()使得同时监控多个连接变的简单，并且这比写一个长循环来等待和监控多客户端连接要高效，因为select直接通过操作系统提供的C的网络接口进行操作，而不是通过Python的解释器。

### 服务端 select 实现 server.py
```python
# -*- coding: utf-8 -*-

import select
import socket
import queue


def print_text(text):
    """打印普通信息

    :param text 要打印的信息
    :type text basestring
    :example text "ok"
    """
    print(text)


def server(host, port, listen):
    """socket服务端

    :param host 主机ip
    :type host basestring
    :example host 127.0.0.1

    :param port 端口号
    :type port int
    :example port 12345

    :param listen 监听数量
    :type listen int
    :example listen 5
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((host, port))
    s.listen(listen)
    print_text("The service run at %s:%d" % (host, port))
    s.setblocking(False)  # 不阻塞
    msg_dict = {}
    inputs = [s, ]
    outputs = []

    while True:
        # 开始 select 监听,对input_list中的服务端server进行监听
        readable, writeable, exceptional = select.select(inputs, outputs, inputs)
        # print(readable, writeable, exceptional)
        for r in readable:
            # 判断当前触发的是不是服务端对象, 当触发的对象是服务端对象时,说明有新客户端连接进来了
            if r is s:  # 代表来了一个新连接
                # 接收客户端的连接, 获取客户端对象和客户端地址信息
                conn, addr = s.accept()
                print_text("来了一个新连接: %s %s" % addr) # addr信息是个元祖
                inputs.append(conn)  # 是因为这个新建立的连接还没发数据过来，现在就接收的话程序就报错了
                # 所以要想要实现这个客户端发数据来时server端能知道，就需要让select再监测这个conn
                msg_dict[conn] = queue.Queue()  # 初始化一个队列，后面需要返回给这个客户端的数据
            else:
                # 由于客户端连接进来时服务端接收客户端连接请求，将客户端加入到了监听列表中(inputs)，客户端发送消息将触发
                # 所以判断是否是客户端对象触发
                data = r.recv(1024)
                # 客户端断开
                if not data:
                    print_text("收到数据为空，结束服务")
                    return
                print_text("收到数据: %s" % data)
                # 将收到的消息放入到各客户端的消息队列中
                msg_dict[r].put(data)
                # 将回复操作放到output列表中，让select监听
                outputs.append(r)

        for w in writeable:  # 要返回给客户端的连接列表
            data_to_client = msg_dict[w].get()
            w.send(data_to_client)  # 返回给客户端源数据
            outputs.remove(w)  # 确保下次循环的时候writeable，不能返回这个已经处理完的连接了
        for e in exceptional:
            if e in outputs:
                outputs.remove(e)
            inputs.remove(e)
            del msg_dict[e]


if __name__ == '__main__':
    server("127.0.0.1", 12345, 5)

```

### 客户端 client.py
```python
# -*- coding: utf-8 -*-

import socket
import sys


def print_text(text):
    """打印普通信息

    :param text 要打印的信息
    :type text basestring
    :example text "ok"
    """
    print(text)


def client(host, port):
    """client客户端

    :param host 主机ip
    :type host basestring
    :example host 127.0.0.1

    :param port 端口号
    :type port int
    :example port 12345
    """
    messages = [
        'This is the message. ',
        'It will be sent ',
        '最后一条消息'
    ]
    server_address = (host, port)

    socks = [socket.socket(socket.AF_INET, socket.SOCK_STREAM) for _ in range(10)]

    print_text('connecting to %s port %s' % server_address)

    for s in socks:
        s.connect(server_address)

    for message in messages:
        for s in socks:
            print_text('%s: sending "%s"' % (s.getsockname(), message))
            s.send(message)

        for s in socks:
            data = s.recv(1024)
            print_text('%s: received "%s"' % (s.getsockname(), data))
            if not data:
                print_text("%s %s %s" % (sys.stderr, 'closing socket', s.getsockname()))


if __name__ == '__main__':
    client("127.0.0.1", 12345)

```

## 参考
* [IO多路复用之select总结](http://www.cnblogs.com/Anker/archive/2013/08/14/3258674.html)
* [IO多路复用之poll总结](http://www.cnblogs.com/Anker/archive/2013/08/15/3261006.html)
* [IO多路复用之epoll总结](http://www.cnblogs.com/Anker/archive/2013/08/17/3263780.html)
* [select、poll、epoll之间的区别总结[整理]](http://www.cnblogs.com/Anker/p/3265058.html)
* [多进程、协程、事件驱动及select poll epoll](https://www.cnblogs.com/zhaof/p/5932461.html)