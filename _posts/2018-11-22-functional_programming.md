---
layout: post
title: 函数式编程
categories: python
tags: python functional programming
thread: python
---
## 前言
讲函数式编程前，先讲下过去流行的N种编程风格。

## 流行的编程风格

### 散弹枪编程
这种编程风格是一种开发者使用非常随意的方式对待代码。“嗯，这个方法调用出错了……那么我会试着把传出的参数从 false 变成 true!”，当然依然出错，于是我们的程序员会这样：“好吧，那我就注释掉整个方法吧”，或是其它更为随意的处理方式，直到最后让这个调用成功。或是被旁边的某个程序员指出一个正确的方法。

### 撞大运编程
这是一种比散弹枪编程要温和一些的编程方式，我相信这种方式可能会是大多数程序员都会使用的方式。这种编程方式经常出现于程序员并不确切知道他们在干什么，也不知道所写的程序的本质和实际，但是可以让程序工作起来。他们以一种撞大运的方式在写程序，某些时候，他们根本就不知道某个错误的原因，就开始稀里糊涂地修改代码。一旦出现问题，他们会用两条路：1）停下来，理解一下程序，找到出错的原因。2）使用散弹枪编程方式开始解决问题。

测试驱动开发（Test Driven Development）是一种可以用来拯救上百万的撞大运编程的程序员。于是，他们有了一个更为NB的借口：只要我的程序通过测试了，你还有什么话好说？别骂我，测试驱动开发是一个不错的事物，其主要是用来控制撞大运开发所带来的问题。

### Cargo-Cult 编程
关于Cargo Cults 这个词儿来自二战期间的某些太平洋上小岛里的土著人。在战争期间，美国利用这些小岛作为太平洋战场上的补给站。他们在这些小岛上修建自己的飞机跑道以用来运输战争物资。而那些小岛上的土著人从来没有见过飞机，当他们看到飞机的时候，觉得相当的牛，可以为那些白人带来各种各样的物品和食物。当二战结束后，那些土著人仿照着修建了飞机跑道，并用竹子修建了塔台。然后就在那期望着有飞机为他们送来物品和食物。

Cargo Cult 编程是一种非常流行的编程方法，使用这种方法的程序员会学习其它编程高手的编程方法，虽然他们并不知道为什么高手们要那样做，但是他们觉得那样做可以让程序工作起来。

### 刻舟求剑编程
刻舟求剑是一个很流行的寓言了。这种风格的编程在程序员的圈子里是非常常见的。比如，有一天，你发现了一个空指会的异常，于是你到了产生空指针异常的地方，简单地放上一个判断： if (p != NULL)。

是的，这样的fix可以让你的程序工作起来，但你并没有真正地解决问题。你只不过是在你的船边记下了剑掉下去的位置，这样做只不过把问题隐藏起来，最终只会让你的程序的行为变得神出鬼没。你应该找到为什么指针会为空的原因，然后再解决这个问题。

### 设计模式驱动型编程
正如这种编程的名字所说的，这种编程风格使用大量的设计模式，在你的程序中，四处都是设计模式，你的代码到处都是Facade，Observer ，Strategy，Adapter，等等等等。于是，你的程序要处理的业务逻辑被这些设计模式打乱得无法阅读，最后，也不知道是业务需求重来，还是设计模式重要，总之，实际业务需求的程序逻辑被各种设计模式混乱得不堪入目。

### 侦探型编程
在解决一个Bug的时候，侦探型程序员会调查这个Bug的原因。然后，则调查引发这个BUG的原因的原因。再然后，其会分析修正代码后是否会导致其它代码失败的因果关系。再然后然后，他会使用文本搜索查找所有使用这个改动的代码，并继续查找更上一级的调用代码。最后，这个程序员会写下30个不同的情形的测试案例，就算这些测试案例和那个Bug没有什么关系，最最后，这个程序员有了足够多的信心，并且精确地修正了一个拼写错误。

与此同时，其它一个正常的程序修正了其它5个Bug。

### 屠宰式编程
使用这种风格的程序员，对重构代码有着一种难以控制的极端冲动。他们几乎会重构所有经手的代码。就算是在产品在Release的前夜，当他在修正几个拼写错误的bug同时，其会修改10个类，以及重构与这10个类有联系的另20个类，并且修改了代码的build脚本，以及5个部署描述符。

## 三大特性

### 不可变数据(immutable data)
默认上变量是不可变的，如要要修改变量，需要把变量copy出去修改。

### 第一等公民(first class functions)
让函数像变量一样使用，可以创建、修改，在其它函数中传入。

### 尾递归优化
我们知道递归的害处，那就是如果递归很深的话，stack受不了，并会导致性能大幅度下降。所以，我们使用尾递归优化技术——每次递归时都会重用stack，这样一来能够提升性能，当然，**这需要语言或编译器的支持。Python就不支持。**

## 重要技术

### 映射 & 累积(map & reduce)
比起过程式的语言来说，在代码上要更容易阅读。（传统过程式的语言需要使用for/while循环，然后在各种变量中把数据倒过来倒过去的）

### 管道(pipeline)
把函数实例成一个一个的action，然后，把一组action放到一个数组或是列表中，然后把数据传给这个action list，数据就像一个pipeline一样顺序地被各个函数所操作，最终得到我们想要的结果。

### 递归(recursing)
递归最大的好处就简化代码，他可以把一个复杂的问题用很简单的代码描述出来。**注意：递归的精髓是描述问题，而这正是函数式编程的精髓。**

### 局部套用(currying)
把一个函数的多个参数分解成多个函数， 然后把函数多层封装起来，每层函数都返回一个函数去接收下一个参数这样，可以简化函数的多个参数。

### 高阶函数(higher order function)
高阶函数就是函数当参数，把传入的函数做一个封装，然后返回这个封装函数。现象上就是函数传进传出，就像面向对象对象满天飞一样。

## 柯里化（局部调用（partial application））
把接受多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）的函数，并且返回接受余下的参数而且返回结果的新函数的技术。

## 优势

### parallelization 并行
所谓并行的意思就是在并行环境下，各个线程之间不需要同步或互斥。

### lazy evaluation 惰性求值
这个需要编译器的支持。表达式不在它被绑定到变量之后就立即求值，而是在该值被取用的时候求值，也就是说，语句如x:=expression; (把一个表达式的结果赋值给一个变量)明显的调用这个表达式被计算并把结果放置到 x 中，但是先不管实际在 x 中的是什么，直到通过后面的表达式中到 x 的引用而有了对它的值的需求的时候，而后面表达式自身的求值也可以被延迟，最终为了生成让外界看到的某个符号而计算这个快速增长的依赖树。

### determinism 确定性
确定性的意思就是像数学那样 f(x) = y ，这个函数无论在什么场景下，都会得到同样的结果，这个我们称之为函数的确定性。而不是像程序中的很多函数那样，同一个参数，却会在不同的场景下计算出不同的结果。所谓不同的场景的意思就是我们的函数会根据一些运行中的状态信息的不同而发生变化。

## Declarative Programming vs Imperative Programming
函数式编程关注的是：describe what to do, rather than how to do it. 于是，我们把以前的过程式的编程范式叫做 Imperative Programming – 指令式编程，而把函数式的这种范式叫做 Declarative Programming – 声明式编程。

**代码是在描述要干什么，而不是怎么干。**

**把函数当成变量来用，关注于描述问题而不是怎么实现，这样可以让代码更易读。**

**不依赖于外部的数据，而且也不改变外部数据的值，而是返回一个新的值给你。**

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
* [各种流行的编程风格](https://coolshell.cn/articles/2058.html)
* [函数式编程](https://coolshell.cn/articles/10822.html)
* [什么是函数式编程思维？](https://hcyue.me/2016/05/14/%E4%BB%80%E4%B9%88%E6%98%AF%E5%87%BD%E6%95%B0%E5%BC%8F%E7%BC%96%E7%A8%8B%E6%80%9D%E7%BB%B4/)