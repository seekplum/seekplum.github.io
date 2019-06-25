---
layout: post
title:  设计模式
tags: python design pattern
thread: design
---

## 创建模式(5个)

提供实例化的方法，为适合的状况提供相应的对象创建方法。

* 工厂方法(Factory Method)
* 抽象工厂(Abstract Factory)
* 建造者(Builder)
* 原型(Prototype)
* 单例(Singleton)

## 结构模式(7个)

通常用来处理实体之间的关系，使这些实体间更好的协同工作。

* 适配器(Adapter Class/Object)
* 桥接(Bridge)
* 组合(Composite)
* 装饰器(Decorator)
* 外观(Facade)
* 享元(Flyweight)
* 代理(Proxy)

## 行为模式(11个)

用于在不同实体间通信，为实体之间的通信提供更容易、更灵活的通信方法。

* 解释器(Interpreter)
* 模板方法(Template Method)
* 责任链(Chain of Responsibility)
* 命令(Command)
* 迭代器(Iterator)
* 中介者(Mediator)
* 备忘录(Memento)
* 观察者(Observer)
* 状态(State)
* 策略(Strategy)
* 访问者(Visitor)

## Factory Method(工厂方法)

### 意图

定义一个用于创建对象的接口，让子类决定实例化哪一个类。Factory Method 使一个类的实例化延迟到其子类。

### 适用性

当一个类不知道它所必须创建的对象的类的时候。

当一个类希望由它的子类来指定它所创建的对象的时候。

当类将创建对象的职责委托给多个帮助子类中的某一个，并且你希望将哪一个帮助子类是代理者这一信息局部化的时候。

### 实现

```python
# -*- coding: utf-8 -*-
from __future__ import print_function, unicode_literals


class ChinaGetter(object):
    def __init__(self):
        self.trans = dict(dog="小狗", cat="小猫")

    def get(self, msgid):
        return self.trans.get(msgid, str(msgid))


class EnglishGetter(object):
    def get(self, msgid):
        return str(msgid)


def get_localizer(language="English"):
    languages = dict(English=EnglishGetter, China=ChinaGetter)
    return languages[language]()


def test():
    e, g = get_localizer("English"), get_localizer("China")
    for msgid in "dog parrot cat bear".split():
        print(e.get(msgid), g.get(msgid))


if __name__ == '__main__':
    test()

```

## AbStract Factory(抽象工厂)

### 意图

提供一个创建一系列相关或相互依赖对象的接口，而无需指定它们具体的类。 

### 适用性

一个系统要独立于它的产品的创建、组合和表示时。

一个系统要由多个产品系列中的一个来配置时。

当你要强调一系列相关的产品对象的设计以便进行联合使用时。

当你提供一个产品类库，而只想显示它们的接口而不是实现时。

### 实现

```python
# -*- coding: utf-8 -*-
from __future__ import print_function, unicode_literals

import random


class PetShop(object):
    def __init__(self, animal_factory=None):
        self.pet_factory = animal_factory

    def show_pet(self):
        pet = self.pet_factory.get_pet()
        print("This is a lovely: ", str(pet))
        print("It says: ", pet.speak())
        print("It eats: ", self.pet_factory.get_food())


class Dog(object):
    def speak(self):
        return "woof"

    def __repr__(self):
        return "Dog"


class Cat(object):
    def speak(self):
        return "meow"

    def __repr__(self):
        return "Cat"


class DogFactory(object):
    def get_pet(self):
        return Dog()

    def get_food(self):
        return "dog food"


class CatFactory(object):
    def get_pet(self):
        return Cat()

    def get_food(self):
        return "cat food"


def get_factory():
    return random.choice([DogFactory, CatFactory])()


def test():
    shop = PetShop()
    for i in range(3):
        shop.pet_factory = get_factory()
        shop.show_pet()
        print("=" * 20)


if __name__ == '__main__':
    test()

```

## Builder(建造者)

### 意图

将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。

### 适用性

当创建复杂对象的算法应该独立于该对象的组成部分以及它们的装配方式时。

当构造过程必须允许被构造的对象有不同的表示时。

### 实现

```python
# -*- coding: utf-8 -*-
from __future__ import print_function, unicode_literals


class Director(object):
    def __init__(self):
        self.builder = None

    def construct_building(self):
        self.builder.new_building()
        self.builder.build_floor()
        self.builder.build_size()

    def get_building(self):
        return self.builder.building


class Builder(object):
    def __init__(self):
        self.building = None

    def new_building(self):
        self.building = Building()


class Building(object):
    def __init__(self):
        self.floor = None
        self.size = None

    def __repr__(self):
        return "Floor: %s, Size: %s" % (self.floor, self.size)


class BuilderHouse(Builder):
    def build_floor(self):
        self.building.floor = "One"

    def build_size(self):
        self.building.size = "Big"


class BuilderFlat(Builder):
    def build_floor(self):
        self.building.floor = "More than One"

    def build_size(self):
        self.building.size = "Small"


def test():
    director = Director()
    director.builder = BuilderHouse()
    director.construct_building()
    building = director.get_building()
    print(building)

    director.builder = BuilderFlat()
    director.construct_building()
    building = director.get_building()
    print(building)


if __name__ == '__main__':
    test()

```

## Prototype(原型)

### 意图

用原型实例指定创建对象的种类，并且通过拷贝这些原型创建新的对象。

### 适用性

当要实例化的类是在运行时刻指定时，例如，通过动态装载；或者为了避免创建一个与产品类层次平行的工厂类层次时；或者当一个类的实例只能有几个不同状态组合中的一种时。建立相应数目的原型并克隆它们可能比每次用合适的状态手工实例化该类更方便一些。

### 实现

```python
# -*- coding: utf-8 -*-
from __future__ import print_function, unicode_literals

import copy


class Prototype(object):
    def __init__(self):
        self._objects = {}

    def register_obj(self, name, obj):
        self._objects[name] = obj

    def unregister_obj(self, name):
        del self._objects[name]

    def clone(self, name, **attr):
        obj = copy.deepcopy(self._objects.get(name))
        obj.__dict__.update(attr)
        return obj


def test():
    class A(object):
        def __repr__(self):
            return "I am A"

    a = A()
    prototype = Prototype()
    prototype.register_obj("a", a)

    b = prototype.clone("a", a=1, b=2, c=3)
    print(a)
    print(b, b.a, b.b, b.c)


if __name__ == '__main__':
    test()

```

## Singleton(单例)

### 意图

保证一个类仅有一个实例，并提供一个访问它的全局访问点。

### 适用性

当类只能有一个实例而且客户可以从一个众所周知的访问点访问它时。

当这个唯一实例应该是通过子类化可扩展的，并且客户应该无需更改代码就能使用一个扩展的实例时。

### 实现

```python
# -*- coding: utf-8 -*-
from __future__ import print_function, unicode_literals


class Singleton(object):
    def __new__(cls, *args, **kwargs):
        if not hasattr(cls, "_instance"):
            org = super(Singleton, cls)
            cls._instance = org.__new__(cls, *args, **kwargs)
        return cls._instance


class SingleSpam(Singleton):
    def __init__(self, s):
        self.s = s

    def __repr__(self):
        return self.s


def test():
    s1 = SingleSpam("spam")
    print(id(s1), s1)

    s2 = SingleSpam("spa")
    print(id(s2), s2)
    print(id(s1), s1)


if __name__ == '__main__':
    test()

```

## 访问者模式

* 缺点
    * 访问者模式一个缺点就是它严重依赖递归(`可以通过栈和生成器避免`)

## 参考

* ![从面向对象的设计模式看软件设计](https://coolshell.cn/articles/8961.html)
