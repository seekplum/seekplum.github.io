---
layout: post
title:  python常见坑
tags: python pit
thread: pit
---
## 全局变量
```python
import os


def test_local(ok):
    """测试全局变量

    :raise UnboundLocalError: local variable 'os' referenced before assignment
    """
    if ok:
        pwd = os.getcwd()
    else:
        import os
        pwd = os.getcwd()
    return pwd


test_local(True)
```

## 必包
```python
def create_multipliers():
    """测试必包

    python中的属性查找规则,LEGB(local,enclousing,global,bulitin)
    
    i就是在闭包作用域(enclousing),而Python的闭包是 `迟绑定` , 这意味着闭包中用到的变量的值,是在内部函数被调用时查询得到的。
    """

    def multiplier(x):
        return i * x

    # return [lambda x, i=i: i * x for i in range(5)]
    # return [lambda x: i * x for i in range(5)]
    return [multiplier for i in range(5)]


for f in create_multipliers():
    print f(2)

```
