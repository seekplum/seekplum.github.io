---
layout: post
title:  属性的代理访问
tags: python property
thread: property
---

## 背景
针对不同的操作系统版本，某个软件的安装操作有很大的区别，通过抽象工厂把多个版本的功能实现类分开了，现在需要提供给handler使用，属性比较多，太过繁琐，不适合用普通的代理方式．

## 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


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


class MyClass(object):
    __metaclass__ = Singleton

    def __init__(self):
        self.running = 0
        self.name = self.__class__.__name__
        print "init: {}".format(self.name)


class MyClass1(MyClass):

    def __init__(self):
        super(MyClass1, self).__init__()
        self.name = self.__class__.__name__
        print "init: {}".format(self.name)

    def test_method(self):
        self.running = 1
        print "test1: running: {}, name: {}".format(self.running, self.name)

    @classmethod
    def test_class(cls):
        print "test1 class"

    @staticmethod
    def test_static():
        print "test1 static"


class MyClass2(MyClass):

    def __init__(self):
        super(MyClass2, self).__init__()
        self.name = self.__class__.__name__
        print "init: {}".format(self.name)

    def test_method(self):
        self.running = 2
        print "test2: running: {}, name: {}".format(self.running, self.name)

    @classmethod
    def test_class(cls):
        print "test2 class"

    @staticmethod
    def test_static():
        print "test2 static"


class MyClassType(type):
    def __getattr__(self, item):
        if self.get_version().startswith("6"):
            func = getattr(self.class1, item)
        else:
            func = getattr(self.class2, item)
        return func


class Manager(object):
    __metaclass__ = MyClassType
    class1 = MyClass1
    class2 = MyClass2

    VERSION = "6.7"

    @classmethod
    def get_version(cls):
        """查询版本
        """
        return cls.VERSION

    def __init__(self):
        if self.get_version().startswith("6"):
            self._manager = self.class1()
        else:
            self._manager = self.class2()

    def __getattr__(self, item):
        func = getattr(self._manager, item)
        return func


def test():
    manager1 = Manager()
    Manager.VERSION = "6.7"
    print manager1.running
    manager1.test_method()
    print manager1.running
    Manager.test_class()
    Manager.test_static()

    Manager.VERSION = "7.4"
    manager2 = Manager()
    print manager2.running
    manager2.test_method()
    print manager2.running
    Manager.test_class()
    Manager.test_static()

    manager3 = Manager()
    print manager3.running
    manager3.test_method()
    print manager3.running


if __name__ == '__main__':
    test()

```