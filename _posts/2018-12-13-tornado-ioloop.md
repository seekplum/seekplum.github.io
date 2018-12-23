---
layout: post
title: Tornado源码分析<二>
categories: python
tags: python tornado
thread: pyhton
---
## 前言
上一篇我们对Tornado的源码已经有了初版的了解，接下来重点分析和理解下tornado异步的实现。

tornado 优秀的大并发处理能力得益于它的 web server 从底层开始就自己实现了一整套基于 epoll 的单线程异步架构(其他 python web 框架的自带 server 基本是基于 wsgi 写的简单服务器，并没有自己实现底层结构)。那么 tornado.ioloop 就是 tornado web server 最底层的实现。

## 环境
* Python: Python 2.7.14
* 系统: macOS 10.13.4

## 分析依赖
![IO模块依赖](/static/images/tornado/ioloop.jpg)

`platform`模块比较容易引起关注，自身实现了`selete`, `epoll` Io多路复用。

## 准备知识
之前有整理过一篇[IO多路复用机制](/io-multipath/)的笔记，我们可以先不用了解这多，先记住以下几个核心点

* 1.epoll对文件描述符的操作有两种模式：水平触发 LT（level trigger）和边缘触发 ET（edge trigger）,其中LT模式是默认模式。
    - LT: 根据epoll_wait调用会重复通知
    - ET: 不会重复通知，只通知一次，理论上边缘触发的性能要更高一些，但是代码实现相当复杂。
* 2.3种宏定义

|宏定义|含义|
|:---|:---|
|EPOLLIN|缓冲区满，有数据可读|
|EPOLLOUT|缓冲区空，可写数据|
|EPOLLERR|发生错误|

* 3.4种API
    - epoll_create
    - epoll_ctl
    - epoll_wait
    - close

## 官方hello world
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
#=============================================================================
#  ProjectName: seekplum
#     FileName: ioloop_test
#         Desc: 官方示例代码
#       Author: seekplum
#        Email: 1131909224m@sina.cn
#     HomePage: seekplum.github.io
#       Create: 2018-12-13 20:28
#=============================================================================
"""

import tornado.ioloop
import tornado.web

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()

```

### 疑问
前面的代码都好理解，最后的 `tornado.ioloop.IOLoop.current().start()` 为什么要加呢，启动端口监听后不就可以了吗？app和iolopp之间是如何关联的呢？

### 实践
* 1.先不改动代码，直接运行，命令行通过 `curl http://127.0.0.1:8888` 可以看到返回了`Hello, world`
* 2.去除最后一行 `tornado.ioloop.IOLoop.current().start()` ,发现web server直接退出了。

### 小结
可见daemon服务是由最后一行实现的，可是还是无法解释前面的疑问，那我们继续分析。

## 查看源码

### 查看 current 返回值
```python

    @staticmethod
    def current(instance=True):
        """Returns the current thread's `IOLoop`.

        If an `IOLoop` is currently running or has been marked as
        current by `make_current`, returns that instance.  If there is
        no current `IOLoop` and ``instance`` is true, creates one.

        .. versionchanged:: 4.1
           Added ``instance`` argument to control the fallback to
           `IOLoop.instance()`.
        .. versionchanged:: 5.0
           On Python 3, control of the current `IOLoop` is delegated
           to `asyncio`, with this and other methods as pass-through accessors.
           The ``instance`` argument now controls whether an `IOLoop`
           is created automatically when there is none, instead of
           whether we fall back to `IOLoop.instance()` (which is now
           an alias for this method). ``instance=False`` is deprecated,
           since even if we do not create an `IOLoop`, this method
           may initialize the asyncio loop.
        """
        if asyncio is None:
            current = getattr(IOLoop._current, "instance", None)
            if current is None and instance:
                current = IOLoop()
                if IOLoop._current.instance is not current:
                    raise RuntimeError("new IOLoop did not become current")
        else:
            try:
                loop = asyncio.get_event_loop()
            except (RuntimeError, AssertionError):
                if not instance:
                    return None
                raise
            try:
                return IOLoop._ioloop_for_asyncio[loop]
            except KeyError:
                if instance:
                    from tornado.platform.asyncio import AsyncIOMainLoop
                    current = AsyncIOMainLoop(make_current=True)
                else:
                    current = None
        return current
```

使用Pycharm端点调试下，看下current返回的到底是什么

![current返回值](/static/images/tornado/ioloop-current.jpg)

由此可知， `tornado.ioloop.IOLoop.current()`  最终返回的就是 `tornado.platform.kqueue.KQueueIOLoop` 类的实例化对象。

### 查看 KQueueIOLoop
```python

class KQueueIOLoop(PollIOLoop):
    def initialize(self, **kwargs):
        super(KQueueIOLoop, self).initialize(impl=_KQueue(), **kwargs)

```

由代码可知，`KQueueIOLoop` 只实现了父类的 `initialize` 方法，那么 `__init__`, `start` 等方法肯定是由 `PollIOLoop` 实现的。继续看 `PollIOLoop` 代码

![ioloop类图](/static/images/tornado/ioloop-class.png)

由图可知，实例化操作是由基类 `Configurable`中的 `__new__` 方法完成的，初始化是由 `initialize` 方法完成的。

### 查看 Configurable 的 \__new__ 方法
```python
class Configurable(object):
    """Base class for configurable interfaces.

    A configurable interface is an (abstract) class whose constructor
    acts as a factory function for one of its implementation subclasses.
    The implementation subclass as well as optional keyword arguments to
    its initializer can be set globally at runtime with `configure`.

    By using the constructor as the factory method, the interface
    looks like a normal class, `isinstance` works as usual, etc.  This
    pattern is most useful when the choice of implementation is likely
    to be a global decision (e.g. when `~select.epoll` is available,
    always use it instead of `~select.select`), or when a
    previously-monolithic class has been split into specialized
    subclasses.

    Configurable subclasses must define the class methods
    `configurable_base` and `configurable_default`, and use the instance
    method `initialize` instead of ``__init__``.

    .. versionchanged:: 5.0

       It is now possible for configuration to be specified at
       multiple levels of a class hierarchy.

    """
    __impl_class = None  # type: type
    __impl_kwargs = None  # type: Dict[str, Any]

    def __new__(cls, *args, **kwargs):
        base = cls.configurable_base()
        init_kwargs = {}
        if cls is base:
            impl = cls.configured_class()
            if base.__impl_kwargs:
                init_kwargs.update(base.__impl_kwargs)
        else:
            impl = cls
        init_kwargs.update(kwargs)
        if impl.configurable_base() is not base:
            # The impl class is itself configurable, so recurse.
            return impl(*args, **init_kwargs)
        instance = super(Configurable, cls).__new__(impl)
        # initialize vs __init__ chosen for compatibility with AsyncHTTPClient
        # singleton magic.  If we get rid of that we can switch to __init__
        # here too.
        instance.initialize(*args, **init_kwargs)
        return instance

    @classmethod
    def configured_class(cls):
        # type: () -> type
        """Returns the currently configured class."""
        base = cls.configurable_base()
        # Manually mangle the private name to see whether this base
        # has been configured (and not another base higher in the
        # hierarchy).
        if base.__dict__.get('_Configurable__impl_class') is None:
            base.__impl_class = cls.configurable_default()
        return base.__impl_class

```

PollIOLoop类实现

```python
class PollIOLoop(IOLoop):
    """Base class for IOLoops built around a select-like function.

    For concrete implementations, see `tornado.platform.epoll.EPollIOLoop`
    (Linux), `tornado.platform.kqueue.KQueueIOLoop` (BSD and Mac), or
    `tornado.platform.select.SelectIOLoop` (all platforms).
    """
    def initialize(self, impl, time_func=None, **kwargs):
        super(PollIOLoop, self).initialize(**kwargs)
        self._impl = impl
        if hasattr(self._impl, 'fileno'):
            set_close_exec(self._impl.fileno())
        self.time_func = time_func or time.time
        self._handlers = {}
        self._events = {}
        self._callbacks = collections.deque()
        self._timeouts = []
        self._cancellations = 0
        self._running = False
        self._stopped = False
        self._closing = False
        self._thread_ident = None
        self._pid = os.getpid()
        self._blocking_signal_threshold = None
        self._timeout_counter = itertools.count()

        # Create a pipe that we send bogus data to when we want to wake
        # the I/O loop when it is idle
        self._waker = Waker()
        self.add_handler(self._waker.fileno(),
                         lambda fd, events: self._waker.consume(),
                         self.READ)

    @classmethod
    def configurable_base(cls):
        return PollIOLoop

    @classmethod
    def configurable_default(cls):
        if hasattr(select, "epoll"):
            from tornado.platform.epoll import EPollIOLoop
            return EPollIOLoop
        if hasattr(select, "kqueue"):
            # Python 2.6+ on BSD or Mac
            from tornado.platform.kqueue import KQueueIOLoop
            return KQueueIOLoop
        from tornado.platform.select import SelectIOLoop
        return SelectIOLoop

```

到现在可以梳理出 `tornado.ioloop.IOLoop.current()` 做了什么了，且看下图。

![ioloop实例化](/static/images/tornado/ioloop-flow.png)

### 小结
根据上述流程图我们可以梳理出ioloop的实例化流程了。

* 1.tornado.ioloop.IOLoop.current() 方法返回 tornado.platform.kqueue._KQueue类实例化对象
* 2.tornado.platform.kqueue._KQueue的实例化由 tornado.util.COnfigurable().__new__方法完成
* 3.在__new__方法中通过做工厂函数获取了默认的configurable
* 4.tornado.ioloop.IOLoop.initalize() 方法完成了初始化操作

接下来重点看下 `PollIOLoop` 类中 `initialize` ， `start` 两个方法做了什么。

## PollIOLoop initialize方法
首先要看的是关于 epoll 操作的方法，还记得前文说过的 epoll 只需要四个 api 就能完全操作嘛？ 

我们来看 PollIOLoop 的实现：

```python
    def close(self, all_fds=False):
        self._closing = True
        self.remove_handler(self._waker.fileno())
        if all_fds:
            for fd, handler in list(self._handlers.values()):
                self.close_fd(fd)
        self._waker.close()
        self._impl.close()
        self._callbacks = None
        self._timeouts = None
        if hasattr(self, '_executor'):
            self._executor.shutdown()

    def add_handler(self, fd, handler, events):
        fd, obj = self.split_fd(fd)
        self._handlers[fd] = (obj, stack_context.wrap(handler))
        self._impl.register(fd, events | self.ERROR)

    def update_handler(self, fd, events):
        fd, obj = self.split_fd(fd)
        self._impl.modify(fd, events | self.ERROR)

    def remove_handler(self, fd):
        fd, obj = self.split_fd(fd)
        self._handlers.pop(fd, None)
        self._events.pop(fd, None)
        try:
            self._impl.unregister(fd)
        except Exception:
            gen_log.debug("Error deleting fd from IOLoop", exc_info=True)

```

epoll_ctl：这个三个方法分别对应 epoll_ctl 中的 add 、 modify 、 del 参数。 所以这三个方法实现了 epoll 的 epoll_ctl 。

epoll_create：然后 epoll 的生成在前文 EPollIOLoop 的初始化中就已经完成了：super(EPollIOLoop, self).initialize(impl=select.epoll(), **kwargs)。 这个相当于 epoll_create 。

epoll_wait：epoll_wait 操作则在 start() 中：event_pairs = self._impl.poll(poll_timeout)

epoll_close：而 epoll 的 close 则在 PollIOLoop 中的 close 方法内调用： self._impl.close() 完成。

### initialize方法

```python
class PollIOLoop(IOLoop):
    """Base class for IOLoops built around a select-like function.

    For concrete implementations, see `tornado.platform.epoll.EPollIOLoop`
    (Linux), `tornado.platform.kqueue.KQueueIOLoop` (BSD and Mac), or
    `tornado.platform.select.SelectIOLoop` (all platforms).
    """
    def initialize(self, impl, time_func=None, **kwargs):
        super(PollIOLoop, self).initialize(**kwargs)
        self._impl = impl                         # 指定 epoll，即 tornado.platform.kqueue._KQueue
        if hasattr(self._impl, 'fileno'):
            set_close_exec(self._impl.fileno())   # fork 后关闭无用文件描述符
        self.time_func = time_func or time.time   # 指定获取当前时间的函数
        self._handlers = {}                       # handler 的字典，储存被 epoll 监听的 handler，与打开它的文件描述符 ( file descriptor 简称 fd ) 一一对应
        self._events = {}                         # event 的字典，储存 epoll 返回的活跃的 fd event pairs
        self._callbacks = collections.deque()     # deque 是一个双端队列
        self._timeouts = []                       # 将是一个最小堆结构，按照超时时间从小到大排列的 fd 的任务堆（ 通常这个任务都会包含一个 callback ）
        self._cancellations = 0                   # 关于 timeout 的计数器
        self._running = False                     # ioloop 是否在运行
        self._stopped = False                     # ioloop 是否停止
        self._closing = False                     # ioloop 是否关闭
        self._thread_ident = None                 #  当前线程堆标识符 （ thread identify ）
        self._pid = os.getpid()                   # 获取当前进程id
        self._blocking_signal_threshold = None    # 系统信号， 主要用来在 epoll_wait 时判断是否会有 signal alarm 打断 epoll
        self._timeout_counter = itertools.count() # 超时计数器
        self._waker = Waker()                     # 一个 waker 类，主要是对于管道 pipe 的操作，因为 ioloop 属于底层的数据操作，这里 epoll 监听的是 pipe，是否违反了依赖导致原则？
        self.add_handler(self._waker.fileno(),
                         lambda fd, events: self._waker.consume(),
                         self.READ)               # 将管道加入 epoll 监听，对于 web server 初始化时只需要关心 READ 事件
```

**通过`__new__`, `initialize`, `make_current` 等方式初始化目的是为了让 `PollIOLoop` 类是一个单例**

## PollIOLoop start方法
```python
    def start(self):
        # 检查是否已经运行
        if self._running:
            raise RuntimeError("IOLoop is already running")
        # 检查进程id是否发生了改变
        if os.getpid() != self._pid:
            raise RuntimeError("Cannot share PollIOLoops across processes")
        # 设置日志配置
        self._setup_logging()
        # 修改停止状态为假
        if self._stopped:
            self._stopped = False
            return
        # 获取之前运行的ioloop
        old_current = IOLoop.current(instance=False)
        # 清空旧的ioloop，并设置为当前ioloop
        if old_current is not self:
            self.make_current()
        # 获取线程id
        self._thread_ident = thread.get_ident()
        # 设置状态为运行
        self._running = True

        # signal.set_wakeup_fd closes a race condition in event loops:
        # a signal may arrive at the beginning of select/poll/etc
        # before it goes into its interruptible sleep, so the signal
        # will be consumed without waking the select.  The solution is
        # for the (C, synchronous) signal handler to write to a pipe,
        # which will then be seen by select.
        #
        # In python's signal handling semantics, this only matters on the
        # main thread (fortunately, set_wakeup_fd only works on the main
        # thread and will raise a ValueError otherwise).
        #
        # If someone has already set a wakeup fd, we don't want to
        # disturb it.  This is an issue for twisted, which does its
        # SIGCHLD processing in response to its own wakeup fd being
        # written to.  As long as the wakeup fd is registered on the IOLoop,
        # the loop will still wake up and everything should work.
        old_wakeup_fd = None
        # 检查系统类型是否为linux
        if hasattr(signal, 'set_wakeup_fd') and os.name == 'posix':
            # requires python 2.6+, unix.  set_wakeup_fd exists but crashes
            # the python process on windows.
            try:
                old_wakeup_fd = signal.set_wakeup_fd(self._waker.write_fileno())
                if old_wakeup_fd != -1:
                    # Already set, restore previous value.  This is a little racy,
                    # but there's no clean get_wakeup_fd and in real use the
                    # IOLoop is just started once at the beginning.
                    signal.set_wakeup_fd(old_wakeup_fd)
                    old_wakeup_fd = None
            except ValueError:
                # Non-main thread, or the previous value of wakeup_fd
                # is no longer valid.
                old_wakeup_fd = None

        try:
            # 服务正式启动
            while True:
                # 下一次回调事件次数
                ncallbacks = len(self._callbacks)

                # 维护回调事件超时的任务
                due_timeouts = []
                # 判断 _timeouts 里是否有数据
                if self._timeouts:
                    # 获取当前时间，用来判断 _timeouts 里的任务有没有超时
                    now = self.time()
                    # _timeouts 有数据时一直循环, _timeouts 是个最小堆，
                    # 第一个数据永远是最小的， 这里第一个数据永远是最接近超时或已超时的
                    while self._timeouts:
                        # 超时任务被取消了
                        if self._timeouts[0].callback is None:
                            # 直接在队列中删除
                            heapq.heappop(self._timeouts)
                            # 超时计数器 －1
                            self._cancellations -= 1
                        elif self._timeouts[0].deadline <= now:
                            due_timeouts.append(heapq.heappop(self._timeouts))
                        else:
                            break
                    # 队列长度超过 512 ， 且超过一半取消时
                    if (self._cancellations > 512 and
                            self._cancellations > (len(self._timeouts) >> 1)):
                        self._cancellations = 0
                        self._timeouts = [x for x in self._timeouts
                                          if x.callback is not None]
                        # 进行 _timeouts 最小堆化
                        heapq.heapify(self._timeouts)

                # 运行 callbacks 里所有的 calllback
                for i in range(ncallbacks):
                    self._run_callback(self._callbacks.popleft())
                # 运行所有已过期任务的 callback
                for timeout in due_timeouts:
                    if timeout.callback is not None:
                        self._run_callback(timeout.callback)
                # 释放闭包占用的内存
                due_timeouts = timeout = None

                # _callbacks 里有数据时
                if self._callbacks:
                    # 有任何回调或超时调用 add_callback,则运行前不等待
                    poll_timeout = 0.0
                # _timeouts 里有数据时
                elif self._timeouts:
                    # 使用第一个超时回调时间作为超时时间
                    poll_timeout = self._timeouts[0].deadline - self.time()
                    # 如果最小过期时间大于默认等待时间 _POLL_TIMEOUT ＝ 3600，
                    # 则用 3600，如果最小过期时间小于0 就设置为0 立即返回。
                    poll_timeout = max(0, min(poll_timeout, _POLL_TIMEOUT))
                else:
                    # 没有超时和没有回调，所以使用默认值 3600
                    poll_timeout = _POLL_TIMEOUT

                # 检查是否有系统信号中断运行，有则中断，无则继续
                if not self._running:
                    break

                # 开始 epoll_wait 之前确保 signal alarm 都被清空
                # 这样在 epoll_wait 过程中不会被 signal alarm 打断
                if self._blocking_signal_threshold is not None:
                    signal.setitimer(signal.ITIMER_REAL, 0, 0)

                try:
                    # 获取返回的活跃事件队
                    event_pairs = self._impl.poll(poll_timeout)
                except Exception as e:
                    # 不同Python版本和IOLoop实现会抛出不同异常，
                    # 但忽略 EINTR 异常
                    if errno_from_exception(e) == errno.EINTR:
                        continue
                    else:
                        raise

                # epoll_wait 结束， 再设置 signal alarm
                if self._blocking_signal_threshold is not None:
                    signal.setitimer(signal.ITIMER_REAL,
                                     self._blocking_signal_threshold, 0)

                # 将活跃事件加入 _events
                self._events.update(event_pairs)
                while self._events:
                    fd, events = self._events.popitem()
                    try:
                        fd_obj, handler_func = self._handlers[fd]
                        handler_func(fd_obj, events)
                    except (OSError, IOError) as e:
                        if errno_from_exception(e) == errno.EPIPE:
                            # 客户端关闭连接时发生
                            pass
                        else:
                            self.handle_callback_exception(self._handlers.get(fd))
                    except Exception:
                        self.handle_callback_exception(self._handlers.get(fd))
                fd_obj = handler_func = None

        finally:
            # reset the stopped flag so another start/stop pair can be issued
            # 确保发生异常也继续运行
            self._stopped = False
            # 清空 signal alarm
            if self._blocking_signal_threshold is not None:
                signal.setitimer(signal.ITIMER_REAL, 0, 0)
            if old_current is None:
                IOLoop.clear_current()
            elif old_current is not self:
                old_current.make_current()
            if old_wakeup_fd is not None:
                signal.set_wakeup_fd(old_wakeup_fd)
```

除了注释中的解释，还有几点补充：

close_exec 的作用： 子进程在fork出来的时候，使用了写时复制（COW，Copy-On-Write）方式获得父进程的数据空间、 堆和栈副本，这其中也包括文件描述符。刚刚fork成功时，父子进程中相同的文件描述符指向系统文件表中的同一项，接着，一般我们会调用exec执行另一个程序，此时会用全新的程序替换子进程的正文，数据，堆和栈等。此时保存文件描述符的变量当然也不存在了，我们就无法关闭无用的文件描述符了。所以通常我们会fork子进程后在子进程中直接执行close关掉无用的文件描述符，然后再执行exec。 所以 close_exec 执行的其实就是 关闭 ＋ 执行的作用。 详情可以查看: [关于linux进程间的close-on-exec机制](https://blog.csdn.net/ljxfblog/article/details/41680115)  --- (说明: 这一段直接是抄的致谢中的博客)

Waker()： Waker 封装了对于管道 pipe 的操作：

```python
from __future__ import absolute_import, division, print_function

import fcntl
import os

from tornado.platform import common, interface


def set_close_exec(fd):
    flags = fcntl.fcntl(fd, fcntl.F_GETFD)
    fcntl.fcntl(fd, fcntl.F_SETFD, flags | fcntl.FD_CLOEXEC)


def _set_nonblocking(fd):
    flags = fcntl.fcntl(fd, fcntl.F_GETFL)
    fcntl.fcntl(fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)


class Waker(interface.Waker):
    def __init__(self):
        r, w = os.pipe()
        _set_nonblocking(r)
        _set_nonblocking(w)
        set_close_exec(r)
        set_close_exec(w)
        self.reader = os.fdopen(r, "rb", 0)
        self.writer = os.fdopen(w, "wb", 0)

    def fileno(self):
        return self.reader.fileno()

    def write_fileno(self):
        return self.writer.fileno()

    def wake(self):
        try:
            self.writer.write(b"x")
        except (IOError, ValueError):
            pass

    def consume(self):
        try:
            while True:
                result = self.reader.read()
                if not result:
                    break
        except IOError:
            pass

    def close(self):
        self.reader.close()
        common.try_close(self.writer)

```

可以看到 waker 把 pipe 分为读、 写两个管道并都设置了非阻塞和 close_exec。 注意wake(self)方法中：self.writer.write(b"x") 直接向管道中写入随意字符从而释放管道。

## 总结
* 1.`tornado.ioloop.IOLoop.current().start()` 为什么要加呢，启动端口监听后不就可以了吗？
    - Application 主要是实现路由功能，启动监听端口后还需要轮询监听事件
* 2.app和iolopp之间是如何关联的呢？
    - 应用程序监听端口后，通过 `PollIOLoop`类执行`start`方法后，会在 `1048`行 `event_pairs = self._impl.poll(poll_timeout)` 等待请求(self._impl 就是 tornado.platform.kqueue._KQueue类实例化对象)。

```python
    def poll(self, timeout):
        # 去检测已经注册了的文件描述符。会返回一个可能为空的list，
        # list中包含着(fd, event)这样的二元组。 
        # fd是文件描述符， event是文件描述符对应的事件。
        # 如果返回的是一个空的list，则说明超时了且没有文件描述符有事件发生。
        # timeout的单位是milliseconds，如果设置了timeout，系统将会等待对应的时间。
        # 如果timeout缺省或者是None，这个方法将会阻塞直到对应的poll对象有一个事件发生。
        kevents = self._kqueue.control(None, 1000, timeout)
        events = {}
        for kevent in kevents:
            fd = kevent.ident
            if kevent.filter == select.KQ_FILTER_READ:
                events[fd] = events.get(fd, 0) | IOLoop.READ
            if kevent.filter == select.KQ_FILTER_WRITE:
                if kevent.flags & select.KQ_EV_EOF:
                    # If an asynchronous connection is refused, kqueue
                    # returns a write event with the EOF flag set.
                    # Turn this into an error for consistency with the
                    # other IOLoop implementations.
                    # Note that for read events, EOF may be returned before
                    # all data has been consumed from the socket buffer,
                    # so we only check for EOF on write events.
                    events[fd] = IOLoop.ERROR
                else:
                    events[fd] = events.get(fd, 0) | IOLoop.WRITE
            if kevent.flags & select.KQ_EV_ERROR:
                events[fd] = events.get(fd, 0) | IOLoop.ERROR
        return events.items()
```

## 后续
阅读了ioloop的实现源码，有了初步的理解和印象，还需要学习tornado中异步是如何使用ioloop来加深印象和验证理解。

各位看官下篇见！

## 致谢
* [深入理解 tornado 之底层 ioloop 实现](http://python.jobbole.com/85365/)
