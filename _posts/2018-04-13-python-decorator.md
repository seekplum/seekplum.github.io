---
layout: post
title:  装饰器基本使用使用
tags: python decorator
thread: decorator
---

## 实例方法使用装饰器

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
import time

from threading import Thread


class Singleton(type):
    """通过类名设置单例模式
    """
    _instances = {}

    def __call__(cls, *args, **kwargs):
        key = cls.__name__
        if key not in cls._instances:
            cls._instances[key] = super(Singleton, cls).__call__(*args, **kwargs)
        if hasattr(cls._instances[key], "init_attr"):
            cls._instances[key].init_attr()
        return cls._instances[key]


def check_server_running(func):
    def _wrap(self, *args, **kwargs):
        if not self.running:
            print "程序停止了"
            return
        else:
            result = func(self, *args, **kwargs)
            return result

    return _wrap


class MyClass(object):
    __metaclass__ = Singleton

    def __init__(self):
        self._start = False

    @check_server_running
    def _test1(self, name):
        number = 0
        while self._start:
            number += 1
            print "name: {} {}".format(name, number)
            time.sleep(1)

    @check_server_running
    def _test2(self):
        while self._start:
            print "test2"
            time.sleep(1)

    @check_server_running
    def _test3(self):
        while self._start:
            print "test3"
            time.sleep(1)

    def start(self):
        self._start = True
        print "start ..."

    def stop(self):
        self._start = False
        print "stop ..."
        # raise Exception("stop server")

    @property
    def running(self):
        return self._start

    def run(self):
        self.start()
        self._test1("test1")
        self._test2()
        print "等待3秒"
        time.sleep(3)
        self._test3()


def main():
    manger = MyClass()
    thread = Thread(target=manger.run)
    thread.setDaemon(True)
    thread.start()

    time.sleep(5)

    manger = MyClass()
    manger.stop()
    time.sleep(2)
    manger.start()
    count = 0
    while count < 5:
        count += 1
        print "count: {}".format(count)
        time.sleep(1)


if __name__ == '__main__':
    main()

```

## 带参数的多层装饰器

```python
# -*- coding: utf-8 -*-

from functools import wraps


def decorator1(name):
    print("decorator1: %s" % name)

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            print("1 func name: %s" % func.__name__)
            return func(*args, **kwargs)

        return wrapper

    return decorator


def decorator2(name):
    print("decorator2: %s" % name)

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            print("2 func name: %s" % func.__name__)
            return func(*args, **kwargs)

        return wrapper

    return decorator


@decorator1("11111")
@decorator2("22222")
def test(x, y):
    return _test(x, y)


def _test(x, y):
    r = x + y
    print("%s + %s = %s" % (x, y, r))
    return r


print(test(1, 2))

# 下面的表达式和 test(1, 2) 等价
# decorator1共返回了两层函数，第一次返回的是 decorator 函数，第二次返回的是 wrapper 函数
r2 = decorator1("11111")(decorator2("22222")(_test))(1, 2)
print(r2)

```
