---
layout: post
title:  python描述符(描述器)
tags: python,descriptor
thread: python
---
## 前言

笔者在项目开发中经常会使用 `@classmethod`, `@property` 装饰器，在使用过程中也会有疑问，既然都是装饰器，那么这两个装饰器是如何实现的呢？本文主要是揭露这两个官方自带装饰器的实现。

## 描述符(描述器)

Python2.2 引入了 `描述符`，是一种创建托管属性的方法。描述符有诸多优点

* 1.保护属性不受修改
* 2.属性类型检查
* 3.自动更新某个依赖属性的值

从表现形式来看，一个类如果实现了 `__get__`, `__set__`, `__del__` 方法的其中一个，并且该类的实例对象通常是另一个类的类属性，那么这个类就是一个描述符。

* 只实现 `__get__` 方法的对象是非数据描述符，意味着在初始化后之后只能被读取，而同时实现 `__get__` 和 `__set__` 的对象是数据描述符，意味着这种属性式可读写的。

## 实现代码

```python
class Property(object):
    """属性方法装饰器， @property 的实现
    """

    def __init__(self, func):
        self._func = func

    def __get__(self, instance, owner):
        return self._func(instance)


class StaticMethod(object):
    """静态方法装饰器， @staticmethod 的实现
    """

    def __init__(self, func):
        self._func = func

    def __get__(self, instance, owner):
        return self._func


class ClassMethod(object):
    """类方法装饰器， @classmethod 的实现
    """

    def __init__(self, func):
        self._func = func

    def __get__(self, instance, owner):
        def wrapper(*args, **kwargs):
            return self._func(owner, *args, **kwargs)

        return wrapper
```

## 总结

有代码可知 `classmethod`, `staticmethod` 的实现都是依赖描述符的 `__get__`方法。

## 参考

* [python描述符(descriptor)、属性(property)、函数（类）装饰器(decorator )原理实例详解](https://www.cnblogs.com/chenyangyao/p/python_descriptor.html)
* [解密 Python 的描述符（descriptor）](http://python.jobbole.com/81899/)
* [8.9 创建新的类或实例属性](https://python3-cookbook.readthedocs.io/zh_CN/latest/c08/p09_create_new_kind_of_class_or_instance_attribute.html?highlight=__get__)
* [8.10 使用延迟计算属性](https://python3-cookbook.readthedocs.io/zh_CN/latest/c08/p10_using_lazily_computed_properties.html?highlight=__get__)
