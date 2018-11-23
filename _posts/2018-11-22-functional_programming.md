---
layout: post
title: 函数式编程
categories: python
tags: python functional programming
thread: python
---
## 三大特性

### 不可变数据(immutable data)
默认上变量是不可变的，如要要修改变量，需要把变量copy出去修改。

### first class functions
让函数像变量一样使用，可以创建、修改，在其它函数中传入

### 尾递归优化
我们知道递归的害处，那就是如果递归很深的话，stack受不了，并会导致性能大幅度下降。所以，我们使用尾递归优化技术——每次递归时都会重用stack，这样一来能够提升性能，当然，**这需要语言或编译器的支持。Python就不支持。**

## 重要技术

### map & reduce
比起过程式的语言来说，在代码上要更容易阅读。（传统过程式的语言需要使用for/while循环，然后在各种变量中把数据倒过来倒过去的）

### pipeline
把函数实例成一个一个的action，然后，把一组action放到一个数组或是列表中，然后把数据传给这个action list，数据就像一个pipeline一样顺序地被各个函数所操作，最终得到我们想要的结果。

### recursing
递归最大的好处就简化代码，他可以把一个复杂的问题用很简单的代码描述出来。**注意：递归的精髓是描述问题，而这正是函数式编程的精髓。**

### currying
把一个函数的多个参数分解成多个函数， 然后把函数多层封装起来，每层函数都返回一个函数去接收下一个参数这样，可以简化函数的多个参数。

### higher order function(高阶函数)
高阶函数就是函数当参数，把传入的函数做一个封装，然后返回这个封装函数。现象上就是函数传进传出，就像面向对象对象满天飞一样。

## 优势

### parallelization 并行
所谓并行的意思就是在并行环境下，各个线程之间不需要同步或互斥。

### lazy evaluation 惰性求值
这个需要编译器的支持。表达式不在它被绑定到变量之后就立即求值，而是在该值被取用的时候求值，也就是说，语句如x:=expression; (把一个表达式的结果赋值给一个变量)明显的调用这个表达式被计算并把结果放置到 x 中，但是先不管实际在 x 中的是什么，直到通过后面的表达式中到 x 的引用而有了对它的值的需求的时候，而后面表达式自身的求值也可以被延迟，最终为了生成让外界看到的某个符号而计算这个快速增长的依赖树。

### determinism 确定性
确定性的意思就是像数学那样 f(x) = y ，这个函数无论在什么场景下，都会得到同样的结果，这个我们称之为函数的确定性。而不是像程序中的很多函数那样，同一个参数，却会在不同的场景下计算出不同的结果。所谓不同的场景的意思就是我们的函数会根据一些运行中的状态信息的不同而发生变化。

## Declarative Programming vs Imperative Programming
函数式编程关注的是：describe what to do, rather than how to do it. 于是，我们把以前的过程式的编程范式叫做 Imperative Programming – 指令式编程，而把函数式的这种范式叫做 Declarative Programming – 声明式编程。

**命令式编程关心解决问题的步骤，函数式编程关心数据的映射。**

### 命令式(或叫指令式)编程-过程式
```python
# -*- coding: utf-8 -*-

from random import random

time = 5
car_positions = [1, 1, 1]
while time:
    # decrease time
    time -= 1
    print ''
    for i in range(len(car_positions)):
        # move car
        if random() > 0.3:
            car_positions[i] += 1
        # draw car
        print '-' * car_positions[i]

```

* 把两层循环修改为函数模块

```python
# -*- coding: utf-8 -*-

from random import random


def move_cars():
    for i, _ in enumerate(car_positions):
        if random() > 0.3:
            car_positions[i] += 1


def draw_car(car_position):
    print '-' * car_position


def run_step_of_race():
    global time
    time -= 1
    move_cars()


def draw():
    print ''
    for car_position in car_positions:
        draw_car(car_position)


time = 5
car_positions = [1, 1, 1]
while time:
    run_step_of_race()
    draw()
```

上面两个程序对比可知，程序1只有完整的阅读代码后才能理解整个程序功能，且在阅读过程中需要一直关心较多的上下文。程序2把代码逻辑封装成了函数后，我们就相当于给每个相对独立的程序逻辑取了个名字，于是代码成了自解释的。可读性和维护性有了明显提升。

问题在于各个函数间依赖共享变量来同步状态，阅读指定函数时还需要关注这个变量的上下文。即**这些函数间必需知道其它函数是怎么修改它们之间的共享变量的，所以，这些函数是有状态的。**

### 声明式编程-函数式
```python
# -*- coding: utf-8 -*-

"""
#=============================================================================
#  ProjectName: plum-tools
#     FileName: car_race
#         Desc: 3辆车比赛
#       Author: seekplum
#        Email: 1131909224m@sina.cn
#     HomePage: seekplum.github.io
#       Create: 2018-11-23 11：31
#=============================================================================
"""

from random import random


def move_cars(car_positions):
    return map(lambda x: x + 1 if random() > 0.3 else x, car_positions)


def output_car(car_position):
    return '-' * car_position


def run_step_of_race(state):
    return {
        'time': state['time'] - 1,
        'car_positions': move_cars(state['car_positions'])
    }


def draw(state):
    """打印每辆车辆位置"""
    print ''
    print '\n'.join(map(output_car, state['car_positions']))


def race(state):
    """车辆比较"""
    draw(state)
    if state['time']:
        race(run_step_of_race(state))


race({'time': 5, 'car_positions': [1, 1, 1]})

```

* 特征:
    - 1.它们之间没有共享的变量。
    - 2.函数间通过参数和返回值来传递数据。
    - 3.在函数里没有临时变量。

## 总结
函数式和面向对象都有自己适合领域，记住**存在即合理**，并没有完美统一的解决方案，针对问题客观的选择。

## 参考
* [函数式编程](https://coolshell.cn/articles/10822.html)
* [什么是函数式编程思维？](https://hcyue.me/2016/05/14/%E4%BB%80%E4%B9%88%E6%98%AF%E5%87%BD%E6%95%B0%E5%BC%8F%E7%BC%96%E7%A8%8B%E6%80%9D%E7%BB%B4/)
