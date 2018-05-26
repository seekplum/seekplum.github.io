---
layout: post
title:  迭代器/生成器简介
tags: python generator iterator
thread: python
---
## 说明
以下代码示例都是在`python2.7`进行测试的。

## 注意
在`python2`中需要实现的是`next()`方法

在`python3`中需要实现的是`__next__()`方法

## 可迭代对象(iterable)
但凡是可以返回一个迭代器的对象都可称之为可迭代对象.

迭代器内部持有一个状态，该状态用于记录当前迭代所在的位置，以方便下次迭代的时候获取正确的元素。迭代器有一种具体的迭代器类型。可迭代对象实现了`__iter__`方法，该方法返回一个迭代器对象。，比如list_iterator，set_iterator。可迭代对象实现了`__iter__`方法，该方法返回一个迭代器对象。

## 迭代器(iterator)
它是一个带状态的对象，他能在你调用`next()`方法的时候返回容器中的下一个值，任何实现了`__iter__`和`next()`方法的对象都是迭代器，__iter__返回迭代器自身，next返回容器中的下一个值，如果容器中没有更多元素了，则抛出`StopIteration`异常。一个值，如果容器中没有更多元素了，则抛出StopIteration异常，至于它们到底是如何实现的这并不重要。

所以，迭代器就是实现了工厂模式的对象，它在你每次你询问要下一个值的时候给你返回。有很多关于迭代器的例子，比如itertools函数返回的都是迭代器对象。

### 生成无限序列

```python
>>> from itertools import count
>>> counter = count(start=13)
>>> next(counter)
13
>>> next(counter)
14
```

### 从一个有限序列中生成无限序列

```python
>>> from itertools import cycle
>>> colors = cycle(['red', 'white', 'blue'])
>>> next(colors)
'red'
>>> next(colors)
'white'
>>> next(colors)
'blue'
>>> next(colors)
'red'
```


### 从无限的序列中生成有限序列

```python
>>> from itertools import islice
>>> colors = cycle(['red', 'white', 'blue'])  # infinite
>>> limited = islice(colors, 0, 4)            # finite
>>> for x in limited:
...     print x
...
red
white
blue
red
```

### 示例

以斐波那契数列为例

```python
from itertools import islice


class Fib(object):
    def __init__(self):
        self.prev = 0
        self.curr = 1

    def __iter__(self):
        return self

    def next(self):
        """注意实现的是next方法，而不是__next__方法，python3才是__next__方法
        """
        value = self.curr
        self.curr += self.prev
        self.prev = value
        return value


f = Fib()
print list(islice(f, 0, 10))
```

Fib既是一个可迭代对象（因为它实现了__iter__方法），又是一个迭代器（因为实现了next方法）。实例变量prev和curr用户维护迭代器内部的状态。每次调用next()方法的时候做两件事：

* 1.为下一次调用next()方法修改状态
* 2.为当前这次调用生成返回结果

迭代器就像一个懒加载的工厂，等到有人需要的时候才给它生成值返回，没调用的时候就处于休眠状态等待下一次调用。


## 生成器(generator)
生成器其实是一种特殊的迭代器，不过这种迭代器更加优雅。它不需要再像上面的类一样写__iter__()和next()方法了，只需要一个yiled关键字。 生成器一定是迭代器（反之不成立），因此任何生成器也是以一种懒加载的模式生成值。

用生成器来实现斐波那契数列的例子是：

```python
from itertools import islice


def fib():
    prev, curr = 0, 1
    while True:
        yield curr
        prev, curr = curr, curr + prev


f = fib()
print list(islice(f, 0, 10))
```

fib就是一个普通的python函数，它特殊的地方在于函数体中没有return关键字，函数的返回值是一个生成器对象。当执行f=fib()返回的是一个生成器对象，此时函数体中的代码并不会执行，只有显示或隐示地调用next的时候才会真正执行里面的代码。

生成器在Python中是一个非常强大的编程结构，可以用更少地中间变量写流式代码，此外，相比其它容器对象它更能节省内存和CPU，当然它可以用更少的代码来实现相似的功能。现在就可以动手重构你的代码了，但凡看到类似：

```python
def something():
    result = []
    for ... in ...:
        result.append(x)
    return result
```

都可以用生成器函数来替换

```
def iter_something():
    for ... in ...:
        yield x
```

### 生成器表达式(generator expression)
生成器表达式是列表推倒式的生成器版本，看起来像列表推导式，但是它返回的是一个生成器对象而不是列表对象。

```python
>>> a = (x*x for x in range(10))
>>> a
<generator object <genexpr> at 0x401f08>
>>> sum(a)
285
```

## 参考
[完全理解Python迭代对象、迭代器、生成器](https://foofish.net/iterators-vs-generators.html)
