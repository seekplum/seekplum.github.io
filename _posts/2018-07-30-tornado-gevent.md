---
layout: post
title:  tornado并发场景下对比多进程、多线程、协程
tags: python
thread: tornado coroutine gevent process thread
---
## 起因
在tornado异步中希望可以使用并发提高访问速度


## 多进程

### 优点
* 稳定性高，子进程不会影响主进程和其他子进程

### 缺点
* 创建进程代价大


## 多线程

### 优点
* 速度快一点，效率比多进程高

### 缺点
* 任一子线程崩溃都会直接影响整个进程崩溃

**python多线程不适合cpu密集型操作的任务，适合IO操作密集型的任务**

## 协程
协程，又称微线程，纤程。英文名Coroutine。一句话说明什么是线程：协程是一种用户态的轻量级线程。

协程拥有自己的寄存器上下文和栈。协程调度切换时，将寄存器上下文和栈保存到其他地方，在切回来的时候，恢复先前保存的寄存器上下文和栈。因此：

协程能保留上一次调用时的状态（即所有局部状态的一个特定组合），每次过程重入时，就相当于进入上一次调用的状态，换种说法：进入上一次离开时所处逻辑流的位置。

### 优点
* 无需线程上下文切换的开销
* 无需原子操作锁定及同步的开销
* 方便切换控制流，简化编程模型
* 高并发+高扩展性+低成本：一个CPU支持上万的协程都不是问题。所以很适合用于高并发处理。

### 缺点

* 无法利用多核资源：协程的本质是个单线程,它不能同时将 单个CPU 的多个核用上,协程需要和进程配合才能运行在多CPU上.当然我们日常所编写的绝大部分应用都没有这个必要，除非是cpu密集型应用。
* 进行阻塞（Blocking）操作（如IO时）会阻塞掉整个程序

## 思路
* 1.在 coroutine 装饰的函数内使用多线程
* 2.在 coroutine 装饰的函数内使用多进程
* 3.在 coroutine 装饰的函数内使用gevent

## 实现

### 多线程实现

查询节点信息和交换机信息是可以再使用多线程，本着测试的目的是在tornado中可以使用协程即可，则没有进一步优化。

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import time
import threading

from functools import wraps

import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.options

from concurrent.futures import ThreadPoolExecutor
from tornado import gen
from tornado.concurrent import run_on_executor
from tornado.options import define
from tornado.options import options
from tornado.web import URLSpec as U
from tornado.web import Finish

define("port", default=11100, help="run on the given port", type=int)
define("debug", default=False, help="start debug mode", type=bool)
SLEEP_TIME = 3
COOKIE_SECRET = "seekplum"


def _get_node_ids(cluster_id):
    """查询集群中节点id列表

    :param cluster_id 集群id
    :type cluster_id int
    :example cluster_id 1

    :return 节点id集合
    :rtype list
    :example [1, 2, 3, 4]
    """
    return [1, 2, 3, 4]


def _get_switch_ids(cluster_id):
    """查询集群中交换机id列表

    :param cluster_id 集群id
    :type cluster_id int
    :example cluster_id 1

    :return 交换机id集合
    :rtype list
    :example [1, 2, 3, 4]
    """
    return [1, 2, 3, 4]


def time_of_use(func):
    """统计函数使用时间
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        use_time = end_time - start_time
        print "=" * 100
        print "%s use time: %fs" % (func.__name__, use_time)
        print "=" * 100
        return result

    return decorator


def _get_node_info1(nodes_id):
    """查询节点信息

    :param nodes_id 集群id集合
    :type nodes_id iter
    :example nodes_id [1, 2, 3, 4]

    :rtype list
    :return 节点详细信息
    """
    data = []
    for node_id in nodes_id:
        time.sleep(SLEEP_TIME)
        node_info = {
            "node_id": node_id
        }
        data.append(node_info)
    return data


def _get_switch_info1(switches_id):
    """查询交换机信息

    :param switches_id id集合
    :type switches_id iter
    :example switches_id [1, 2, 3, 4]

    :rtype list
    :return 交换机详细信息
    """
    data = []
    for switch_id in switches_id:
        time.sleep(SLEEP_TIME)
        switch_info = {
            "switch_id": switch_id
        }
        data.append(switch_info)
    return data


@time_of_use
def get_cluster_info1(clusters_id):
    """查询集群id

    :param clusters_id 集群id集合
    :type clusters_id iter
    :example clusters_id [1, 2, 3, 4]

    :rtype list
    :return 集群详细信息
    """

    def _get_cluster_info1():
        nodes_id = _get_node_ids(cluster_id)
        switches_id = _get_switch_ids(cluster_id)
        node_info = _get_node_info1(nodes_id)
        switch_info = _get_switch_info1(switches_id)

        cluster_info = {
            "cluster_id": cluster_id,
            "nodes": node_info,
            "switches": switch_info
        }
        data.append(cluster_info)

    data = []
    thread_list = []
    for cluster_id in clusters_id:
        thread = threading.Thread(target=_get_cluster_info1)
        thread.start()
        thread_list.append(thread)
    for thread in thread_list:
        thread.join()
    return data


def time_of_use(func):
    """统计函数使用时间
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        use_time = end_time - start_time
        print "=" * 100
        print "%s use time: %fs" % (func.__name__, use_time)
        print "=" * 100
        return result

    return decorator


class BaseRequestHandler(tornado.web.RequestHandler):
    """Base RequestHandler"""

    # thread pool executor
    executor = ThreadPoolExecutor(30)

    def write_json(self, data):
        self.set_header("Content-Type", "application/json")
        if options.debug:
            self.write(json.dumps(data, indent=2))
        else:
            self.write(json.dumps(data))

    def success_response(self, data=None, message="", finish=True):
        response = {
            "error_code": 0,
            "message": message,
            "data": data
        }
        self.write_json(response)
        if finish:
            raise Finish

    def error_response(self, error_code, message="", data=None, status_code=202, finish=True):
        self.set_status(status_code)
        response = {
            "error_code": error_code,
            "data": data,
            "message": message,
        }
        self.write_json(response)
        if finish:
            raise Finish

    def options(self, *args, **kwargs):
        """
        避免前端跨域options请求报错
        """
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods",
                        "POST, GET, PUT, DELETE, OPTIONS")
        self.set_header("Access-Control-Max-Age", 1000)
        self.set_header("Access-Control-Allow-Headers",
                        "CONTENT-TYPE, Access-Control-Allow-Origin, cache-control, Cache-Control, x-access-token")
        self.set_header("Access-Control-Expose-Headers", "X-Resource-Count")

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods",
                        "POST, GET, PUT, DELETE, OPTIONS")
        self.set_header("Access-Control-Max-Age", 1000)
        self.set_header("Access-Control-Allow-Headers",
                        "CONTENT-TYPE, Access-Control-Allow-Origin, cache-control, Cache-Control, x-access-token")
        self.set_header("Access-Control-Expose-Headers", "X-Resource-Count")


class TestHandler(BaseRequestHandler):
    """测试使用的handler
    """

    @run_on_executor
    def _get_cluster_info2(self):
        clusters_id = [1, 2, 3, 4]
        result = get_cluster_info1(clusters_id)
        return result

    @gen.coroutine
    def get(self):
        data = yield self._get_cluster_info2()
        self.success_response(data)


# 相关API
handlers = [

    U(r"/test", TestHandler)
]


class Application(tornado.web.Application):
    def __init__(self):
        app_settings = dict(
            cookie_secret=COOKIE_SECRET,
            debug=options.debug
        )

        super(Application, self).__init__(handlers, **app_settings)


def main():
    """tornado入口函数
    """
    tornado.options.parse_command_line()
    app = Application()

    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    print("Server start on port %s" % options.port)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()

```

### 多进程实现

多进程要注意不同进程间数据的共享

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
import copy
import json
import time
import multiprocessing

from functools import wraps
from multiprocessing import Manager

import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.options

from concurrent.futures import ThreadPoolExecutor
from tornado import gen
from tornado.concurrent import run_on_executor
from tornado.options import define
from tornado.options import options
from tornado.web import URLSpec as U
from tornado.web import Finish

define("port", default=11100, help="run on the given port", type=int)
define("debug", default=False, help="start debug mode", type=bool)
SLEEP_TIME = 3
COOKIE_SECRET = "seekplum"


def _get_node_ids(cluster_id):
    """查询集群中节点id列表

    :param cluster_id 集群id
    :type cluster_id int
    :example cluster_id 1

    :return 节点id集合
    :rtype list
    :example [1, 2, 3, 4]
    """
    return [1, 2, 3, 4]


def _get_switch_ids(cluster_id):
    """查询集群中交换机id列表

    :param cluster_id 集群id
    :type cluster_id int
    :example cluster_id 1

    :return 交换机id集合
    :rtype list
    :example [1, 2, 3, 4]
    """
    return [1, 2, 3, 4]


def time_of_use(func):
    """统计函数使用时间
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        use_time = end_time - start_time
        print "=" * 100
        print "%s use time: %fs" % (func.__name__, use_time)
        print "=" * 100
        return result

    return decorator


def _get_node_info1(nodes_id):
    """查询节点信息

    :param nodes_id 集群id集合
    :type nodes_id iter
    :example nodes_id [1, 2, 3, 4]

    :rtype list
    :return 节点详细信息
    """
    data = []
    for node_id in nodes_id:
        time.sleep(SLEEP_TIME)
        node_info = {
            "node_id": node_id
        }
        data.append(node_info)
    return data


def _get_switch_info1(switches_id):
    """查询交换机信息

    :param switches_id id集合
    :type switches_id iter
    :example switches_id [1, 2, 3, 4]

    :rtype list
    :return 交换机详细信息
    """
    data = []
    for switch_id in switches_id:
        time.sleep(SLEEP_TIME)
        switch_info = {
            "switch_id": switch_id
        }
        data.append(switch_info)
    return data


def _get_cluster_info1(data, cluster_id):
    nodes_id = _get_node_ids(cluster_id)
    switches_id = _get_switch_ids(cluster_id)
    node_info = _get_node_info1(nodes_id)
    switch_info = _get_switch_info1(switches_id)

    cluster_info = {
        "cluster_id": cluster_id,
        "nodes": node_info,
        "switches": switch_info
    }
    data.append(cluster_info)


@time_of_use
def get_cluster_info1(clusters_id):
    """查询集群id

    :param clusters_id 集群id集合
    :type clusters_id iter
    :example clusters_id [1, 2, 3, 4]

    :rtype list
    :return 集群详细信息
    """

    process_list = []
    # 使用队列也可以
    # que = multiprocessing.Queue()
    with Manager() as manager:
        result = manager.list()
        for clu_id in clusters_id:
            process = multiprocessing.Process(target=_get_cluster_info1, args=(result, clu_id,))
            process.start()
            process_list.append(process)
        for process in process_list:
            process.join()
        return copy.deepcopy(result)


def time_of_use(func):
    """统计函数使用时间
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        use_time = end_time - start_time
        print "=" * 100
        print "%s use time: %fs" % (func.__name__, use_time)
        print "=" * 100
        return result

    return decorator


class BaseRequestHandler(tornado.web.RequestHandler):
    """Base RequestHandler"""

    # thread pool executor
    executor = ThreadPoolExecutor(30)

    def write_json(self, data):
        self.set_header("Content-Type", "application/json")
        if options.debug:
            self.write(json.dumps(data, indent=2))
        else:
            self.write(json.dumps(data))

    def success_response(self, data=None, message="", finish=True):
        response = {
            "error_code": 0,
            "message": message,
            "data": data
        }
        self.write_json(response)
        if finish:
            raise Finish

    def error_response(self, error_code, message="", data=None, status_code=202, finish=True):
        self.set_status(status_code)
        response = {
            "error_code": error_code,
            "data": data,
            "message": message,
        }
        self.write_json(response)
        if finish:
            raise Finish

    def options(self, *args, **kwargs):
        """
        避免前端跨域options请求报错
        """
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods",
                        "POST, GET, PUT, DELETE, OPTIONS")
        self.set_header("Access-Control-Max-Age", 1000)
        self.set_header("Access-Control-Allow-Headers",
                        "CONTENT-TYPE, Access-Control-Allow-Origin, cache-control, Cache-Control, x-access-token")
        self.set_header("Access-Control-Expose-Headers", "X-Resource-Count")

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods",
                        "POST, GET, PUT, DELETE, OPTIONS")
        self.set_header("Access-Control-Max-Age", 1000)
        self.set_header("Access-Control-Allow-Headers",
                        "CONTENT-TYPE, Access-Control-Allow-Origin, cache-control, Cache-Control, x-access-token")
        self.set_header("Access-Control-Expose-Headers", "X-Resource-Count")


class TestHandler(BaseRequestHandler):
    """测试使用的handler
    """

    @run_on_executor
    def _get_cluster_info2(self):
        clusters_id = [1, 2, 3, 4]
        result = get_cluster_info1(clusters_id)
        return result

    @gen.coroutine
    def get(self):
        data = yield self._get_cluster_info2()
        self.success_response(data)


# 相关API
handlers = [

    U(r"/test", TestHandler)
]


class Application(tornado.web.Application):
    def __init__(self):
        app_settings = dict(
            cookie_secret=COOKIE_SECRET,
            debug=options.debug
        )

        super(Application, self).__init__(handlers, **app_settings)


def main():
    """tornado入口函数
    """
    tornado.options.parse_command_line()
    app = Application()

    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    print("Server start on port %s" % options.port)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()

```

### gevent实现

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
from gevent import monkey

monkey.patch_all()

import gevent
import json
import time

from functools import wraps

import tornado.web
import tornado.httpserver
import tornado.ioloop
import tornado.options

from concurrent.futures import ThreadPoolExecutor
from tornado import gen
from tornado.concurrent import run_on_executor
from tornado.options import define
from tornado.options import options
from tornado.web import URLSpec as U
from tornado.web import Finish

define("port", default=11100, help="run on the given port", type=int)
define("debug", default=False, help="start debug mode", type=bool)
SLEEP_TIME = 3
COOKIE_SECRET = "seekplum"


def _get_node_ids(cluster_id):
    """查询集群中节点id列表

    :param cluster_id 集群id
    :type cluster_id int
    :example cluster_id 1

    :return 节点id集合
    :rtype list
    :example [1, 2, 3, 4]
    """
    return [1, 2, 3, 4]


def _get_switch_ids(cluster_id):
    """查询集群中交换机id列表

    :param cluster_id 集群id
    :type cluster_id int
    :example cluster_id 1

    :return 交换机id集合
    :rtype list
    :example [1, 2, 3, 4]
    """
    return [1, 2, 3, 4]


def _get_node_info2(node_id):
    """查询节点信息

    :param node_id  id
    :type node_id int
    :example node_id 1

    :rtype dict
    :return 节点详细信息
    """

    time.sleep(SLEEP_TIME)
    node_info = {
        "node_id": node_id
    }
    return node_info


def _get_switch_info2(switch_id):
    """查询交换机信息

    :param switch_id 集群id集合
    :type switch_id int
    :example switch_id 1

    :rtype dict
    :return 交换机详细信息
    """

    time.sleep(SLEEP_TIME)
    switch_info = {
        "switch_id": switch_id
    }
    return switch_info


def _get_cluster_info2(cluster_id):
    """查询集群信息

    :param cluster_id 集群id
    :type cluster_id int
    :example cluster_id 1
    """
    data = {
        "cluster_id": cluster_id
    }

    nodes_id = _get_node_ids(cluster_id)
    threads = [gevent.spawn(_get_node_info2, node_id) for node_id in nodes_id]
    data["nodes"] = [thread.value for thread in gevent.joinall(threads)]

    switches_id = _get_switch_ids(cluster_id)
    threads = [gevent.spawn(_get_switch_info2, switch_id) for switch_id in switches_id]
    data["switches"] = [thread.value for thread in gevent.joinall(threads)]
    return data


def get_cluster_info2(clusters_id):
    """查询集群id

    :param clusters_id 集群id集合
    :type clusters_id iter
    :example clusters_id [1, 2, 3, 4]

    :rtype list
    :return 集群详细信息
    """
    threads = [gevent.spawn(_get_cluster_info2, cluster_id) for cluster_id in clusters_id]
    data = [thread.value for thread in gevent.joinall(threads)]
    return data


def time_of_use(func):
    """统计函数使用时间
    """

    @wraps(func)
    def decorator(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        use_time = end_time - start_time
        print "=" * 100
        print "%s use time: %fs" % (func.__name__, use_time)
        print "=" * 100
        return result

    return decorator


class BaseRequestHandler(tornado.web.RequestHandler):
    """Base RequestHandler"""

    # thread pool executor
    executor = ThreadPoolExecutor(30)

    def write_json(self, data):
        self.set_header("Content-Type", "application/json")
        if options.debug:
            self.write(json.dumps(data, indent=2))
        else:
            self.write(json.dumps(data))

    def success_response(self, data=None, message="", finish=True):
        response = {
            "error_code": 0,
            "message": message,
            "data": data
        }
        self.write_json(response)
        if finish:
            raise Finish

    def error_response(self, error_code, message="", data=None, status_code=202, finish=True):
        self.set_status(status_code)
        response = {
            "error_code": error_code,
            "data": data,
            "message": message,
        }
        self.write_json(response)
        if finish:
            raise Finish

    def options(self, *args, **kwargs):
        """
        避免前端跨域options请求报错
        """
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods",
                        "POST, GET, PUT, DELETE, OPTIONS")
        self.set_header("Access-Control-Max-Age", 1000)
        self.set_header("Access-Control-Allow-Headers",
                        "CONTENT-TYPE, Access-Control-Allow-Origin, cache-control, Cache-Control, x-access-token")
        self.set_header("Access-Control-Expose-Headers", "X-Resource-Count")

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods",
                        "POST, GET, PUT, DELETE, OPTIONS")
        self.set_header("Access-Control-Max-Age", 1000)
        self.set_header("Access-Control-Allow-Headers",
                        "CONTENT-TYPE, Access-Control-Allow-Origin, cache-control, Cache-Control, x-access-token")
        self.set_header("Access-Control-Expose-Headers", "X-Resource-Count")


class TestHandler(BaseRequestHandler):
    """测试使用的handler
    """

    @run_on_executor
    def _get_cluster_info2(self):
        clusters_id = [1, 2, 3, 4]
        result = get_cluster_info2(clusters_id)
        return result

    @gen.coroutine
    def get(self):
        data = yield self._get_cluster_info2()
        self.success_response(data)


# 相关API
handlers = [

    U(r"/test", TestHandler)
]


class Application(tornado.web.Application):
    def __init__(self):
        app_settings = dict(
            cookie_secret=COOKIE_SECRET,
            debug=options.debug
        )

        super(Application, self).__init__(handlers, **app_settings)


def main():
    """tornado入口函数
    """
    tornado.options.parse_command_line()
    app = Application()

    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    print("Server start on port %s" % options.port)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()

```

## 总结
三种方式都可以提高并发，三种方式耗费时间差不多，需要选择适合使用的场景。
