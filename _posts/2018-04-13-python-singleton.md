---
layout: post
title:  Python单例模式
tags: python singleton
thread: pythonsingleton
---
### 使用装饰器

```python
from functools import wraps


def singleton(cls):
    instances = {}

    @wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance


@singleton
class MyClass(object):
    def __init__(self, *args, **kwargs):
        pass
```

* 原理: 通过装饰器判断`某个类`是否在字典instaces中,如果不存在,则将`cls`作为key,cls(*args, **kwargs)作为value存到instances中,否则直接返回instances[cls]


### 使用`metaclass`元类
```
class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class MyClass(object):
    __metaclass__ = Singleton

    def __init__(self, *args, **kwargs):
        pass
```

* 原理: 元类控制类的创建过程
    * 拦截类的创建
    * 修改类的定义
    * 放回修改后的类

### 使用 `__new__`
```
class Singleton(object):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(Singleton, cls).__new__(cls, *args, **kwargs)
        return cls._instance


class MyClass(Singleton):
    def __init__(self, *args, **kwargs):
        pass
```

* 原理: 通过将`类的实例`和一个`类变量`_instance关联起来,如果类变量为None,则创建实例,否则直接返回类变量


### 使用模块
```
# my_singleton.py
class My_Singleton(object):
    def __init__(self, *args, **kwargs):
        pass


MyClass = My_Singleton

# test.py
from my_singleton import MyClass

a = MyClass()
b = MyClass()
```

* 原理: `Python的模块`就是`天然的单例模式`,因为模块在第一次导入时，会生成 .pyc 文件，当第二次导入时，就会`直接加载 .pyc` 文件，而不会再次执行模块代码。因此，我们只需把相关的函数和数据定义在一个模块中，就可以获得一个单例对象了。
* 缺点:
    * 类实例化时无法传递参数
    * 无法对类进一步升级处理,比如按参数组成指定key进行实例化

### 通过共享属性
```
class Singleton(object):
    _state = {}
    _running = False

    def __new__(cls, *args, **kwargs):
        obj = super(Singleton, cls).__new__(cls, *args, **kwargs)
        obj.__dict__ = cls._state
        obj.running = cls._running
        return obj


class MyClass(Singleton):
    def __init__(self, *args, **kwargs):
        pass

a = MyClass()
b = MyClass()
# a,b是两个不同的对象,但a,b有想得的属性(__dict__, running)
print id(a.__dict__), id(b.__dict__)
print id(a.running), id(b.running)
```

* 原理: 单例就是所有的引用(实例,对象)拥有相同的状态(属性)和行为(方法),同一个类的所有实例天然有相同的行为(方法),只需要保证同一个类的所有实例具有相同的状态(属性)即可.
