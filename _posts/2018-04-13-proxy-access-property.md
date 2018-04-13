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


class MyClass1(object):
    def __init__(self):
        self.name = self.__class__.__name__

    def test_method(self):
        print "test1: {}".format(self.name)

    @classmethod
    def test_class(cls):
        print "test1 class"

    @staticmethod
    def test_static():
        print "test1 static"


class MyClass2(object):
    def __init__(self):
        self.name = self.__class__.__name__

    def test_method(self):
        print "test2: {}".format(self.name)

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

    @classmethod
    def get_version(cls):
        """查询版本
        """
        return "7.7"

    def __init__(self):
        if self.get_version().startswith("6"):
            self._manager = self.class1()
        else:
            self._manager = self.class2()

    def __getattr__(self, item):
        func = getattr(self._manager, item)
        return func


def test():
    manager = Manager()
    print manager.name
    manager.test_method()
    Manager.test_class()
    Manager.test_static()


if __name__ == '__main__':
    test()
```