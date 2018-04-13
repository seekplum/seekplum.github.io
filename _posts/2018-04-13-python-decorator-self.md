---
layout: post
title:  在类中函数使用装饰器
tags: python decorator
thread: decorator
---

## 代码
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