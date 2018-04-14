---
layout: post
title:  多继承
tags: multiinheritance
thread: multiinheritance
---
## 经典类
* 没有显示的继承 `object` 这个类,在`python3`中就只有新式类了
* 深度优先搜索
* 对于`@property`属性值可以进行重新修改

## 新式类
* 显示的继承 `object` 这个类
* 广度优先搜索
* \__mro__  
> 新式类才有的属性，显示类方法查找顺序
* 对于`@property`属性值不能进行修改，否则会报`AttributeError: can't set attribute`错误

## 注意
* **多继承时注意类的继续顺序，如果类`B`没有`name`属性，但在多继承时，`A`在`B` 的`前面`，`A` 有 `name` 属性，所有`B`也就有了。**

```
class C(A, B):
    pass
```

## 示例代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


# class A(object):
class A:
    def __init__(self):
        print "init A"

    @property
    def name(self):
        return "A"

    def foo(self):
        print "A Foo"


# class B(object):
class B:
    def __init__(self):
        print "init B"

    @property
    def name1(self):
        # 虽然类 B 没有name 属性，但在多继承时， A在B的前面， A 有 name 属性，所有 B也就有了
        if hasattr(self, "name"):
            print "B 有 name 属性"
        else:
            print "B 没有 name 属性"
        return self.name

    def foo(self):
        print "B Foo"

    def bar(self):
        print "B Bar"


class C1(A, B):
    def __init__(self):
        print "init C1"
        # super(C, self).__init__()
        # A.__init__(self)
        B.__init__(self)

    def get_name(self):
        print self.name1


class C2(A, B):
    def __init__(self):
        print "init C2"
        # super(C, self).__init__()
        # A.__init__(self)
        B.__init__(self)

    def get_name(self):
        print self.name1

    def bar(self):
        print "C2 Bar"


class D(C1, C2):
    pass


if __name__ == '__main__':
    d = D()
    # print D.__mro__
    d.foo()
    d.bar()
```




