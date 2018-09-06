---
layout: post
title:  python测试框架
tags: python pytest
thread: pythonpytest
---
## Pytest[官方文档地址](https://docs.pytest.org/en/latest/)

### 安装
* pip安装

> pip install pytest 

* [源码包地址](https://pypi.python.org/pypi/pytest)

### 编写测试用例规则
* 测试`文件`以test_开头（以_test结尾也可以）
* 测试`类`以Test开头，并且不能带有 `__init__` 方法
* 测试`函数`以`test_`开头
* `断言`使用基本的`assert`即可

### 测试函数
* setup_module/teardown_module

> 在所有测试用例执行之前和之后执行。

* setup_function/teardown_function

> 在每个测试用例之前和之后执行。

### 测试类
* setup_class/teardown_class

> 在当前测试类的开始与结束执行。

* setup/treadown

> 在每个测试方法开始与结束执行。

* setup_method/teardown_method

> 在每个测试方法开始与结束执行，与setup/treadown级别相同。

### 测试函数执行顺序
> 按照函数声明顺序,依次执行

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def test_22():
    print("22222 22")
    assert True


def test_11():
    print("11111 11")
    assert True


def test_two():
    print("222 two")
    assert True


def test_one():
    print("1111 one")
    assert True

```

### 在命令行调用pytest
> pytest -q test_restore_prepare_media.py
> pytest -v -s test_restore_prepare_media.py
> pytest  test_restore_prepare_media.py

### 在python代码中调用pytest

```
test/
├── __init__.py
├── test_restore_prepare_media.py
└── test_main.py
```

```python
import pytest

def test_main():
    assert 5 != 5

if __name__ == '__main__':
    pytest.main()
    pytest.main("-q test_main.py")   # 指定测试文件
    pytest.main("~/pyse/pytest/")  # 指定测试目录
```

### 断言

#### 断言异常抛出

```python
import pytest

def test_zero_division():
    with pytest.raises(ZeroDivisionError):
        1 / 0
# 1/0的时候应该抛出ZeroDivisionError，否则用例失败，断言不通过
```

#### 访问异常的具体信息
```python
def test_recursion_depth():
    with pytest.raises(RuntimeError) as excinfo:
        def f():
            f()
        f()
    assert 'maximum recursion' in str(excinfo.value)
```

#### 定制断言异常的错误信息
```
with raises(ZeroDivisionError, message="Expecting ZeroDivisionError"):
    pass
Failed: Expecting ZeroDivisionError
```

### pytest.fixture
> 通过@pytest.fixture() 注释会在执行测试用例之前初始化操作.然后直接在测试用例的方法中就可以拿到初始化返回的参数(参数名要和初始化的方法名一样)

为可靠的和可重复执行的测试提供固定的基线。（可以理解为测试的固定配置，使不同范围的测试都能够获得统一的配置。）

fixture提供了区别于传统单元测试（setup/teardown）风格的令人惊喜的功能：

* 1.有独立的命名，可以按照测试的用途来激活，比如用于functions/modules/classes甚至整个project。
* 2.按模块单元的方式实现，每个fixture name可以出发一个fixture function，每个fixture function本身也能调用其他的fixture function。（相互调用，不只是用于test_func()）。
* 3.fixture的范围覆盖简单的单元测试到复杂的功能测试，可用于参数传入或者class、module及test session范围内的复用。

#### 参数含义
* scope: 
    * function: 每次调用都会重新生成
    * class: 在类中只生成一次
    * module: 在这个模块中都不会重新生成
    * session: 在运行pytest生成一次
* params: 参数值
* autouse:
    * True: 每个测试函数调用时会自动调用
    * False: 有程序显示调用,不会自动触发

#### 具体测试用例
场景： 我们需要判断用户的密码中包含简单密码，规则是这样的，密码必须至少6位，满足6位的话判断用户的密码不是password123或者password之类的弱密码。

* 用户的信息文件`users.dev.json`

```json
[
  {"name":"jack","password":"Iloverose"},
  {"name":"rose","password":"Ilovejack"},
  {"name":"tom","password":"password123"}
]
```

* 测试文件`test_user_password.py`

```python
import pytest
import json

class TestUserPassword(object):
    @pytest.fixture
    def users(self):
        return json.loads(open('./users.dev.json', 'r').read()) # 读取当前路径下的users.dev.json文件，返回的结果是dict

    def test_user_password(self, users):
        # 遍历每条user数据
        for user in users:
            passwd = user['password']
            assert len(passwd) >= 6
            msg = "user %s has a weak password" %(user['name'])
            assert passwd != 'password', msg
            assert passwd != 'password123', msg
```

> * 使用@pytest.fixture装饰器可以定义feature
> * 在用例的参数中传递fixture的名称以便直接调用fixture，拿到fixture的返回值
> * 3个assert是递进关系，前1个assert断言失败后，后面的assert是不会运行的，因此重要的assert放到前面
> * E AssertionError: user tom has a weak password可以很容易的判断出是哪条数据出了问题，所以定制可读性好的错误信息是很必要的
> * 任何1个断言失败以后，for循环就会退出，所以上面的用例1次只能发现1条错误数据，换句话说任何1个assert失败后，用例就终止运行了

* 查看用例文件中可用的fixtures

> pytest --fixtures test_user_password.py

* 数据清洗

> 有时候我们需要在用例结束的时候去清理一些测试数据，或清除测试过程中创建的对象，我们可以使用下面的方式

```python
import smtplib
import pytest

@pytest.fixture(scope="module")
def smtp1():
    smtp = smtplib.SMTP("smtp.gmail.com", 587, timeout=5)
    yield smtp  # provide the fixture value
    print("teardown smtp")
    smtp.close()


@pytest.fixture(scope="module")
def smtp2(request):
    smtp = smtplib.SMTP("smtp.gmail.com", 587, timeout=5)
    def fin():
        print ("teardown smtp")
        smtp.close()
    request.addfinalizer(fin)
    return smtp  # provide the fixture value
```

* yield 关键字返回了fixture中实例化的对象smtp
* module中的用例执行完成后smtp.close()方法会执行，无论用例的运行状态是怎么样的,都会执行

#### 参数化fixture
> 允许我们向fixture提供参数，参数可以是list，该list中有几条数据，fixture就会运行几次，相应的测试用例也会运行几次。

**其中len(params)的值就是用例执行的次数**

```python
@pytest.fixture(scope="module",
                params=["smtp.gmail.com", "mail.python.org"])
def smtp(request):
    smtp = smtplib.SMTP(request.param, 587, timeout=5)
    yield smtp
    print ("finalizing %s" % smtp)
    smtp.close()
    # 第1次request.param == 'smtp.gmail.com'
    # 第2次request.param == 'mail.python.org'

import pytest
import json
users = json.loads(open('./users.test.json', 'r').read())

class TestUserPasswordWithParam(object):
    @pytest.fixture(params=users)
    def user(self, request):
        return request.param

    def test_user_password(self, user):
        passwd = user['password']
        assert len(passwd) >= 6
        msg = "user %s has a weak password" %(user['name'])
        assert passwd != 'password', msg
        assert passwd != 'password123', msg
```

### pytest.mark.parametrize
> 可以让我们每次参数化fixture的时候传入多个参数。因此简单理解，我们可以把parametrize装饰器想象成是数据表格，有表头(test_input,expected)以及具体的数据。

```python
import pytest
@pytest.mark.parametrize("test_input,expected", [
    ("3+5", 8),
    ("2+4", 6),
    ("6*9", 42),
])
def test_eval(test_input, expected):
    assert eval(test_input) == expected
```

### 在classes，modules或者projects中使用fixtures
有时，测试函数是不直接访问一个fixture对象的。比如，测试需要用一个空的路径当作当前工作路径，但是并不关心当前的具体路径。下面的例子是用标准的tempfile库和pytest fixtures来实现的。我们将创建fixture的部分单独放到conftest.py中。

#### class

* conftest.py

```python
import pytest
import tempfile
import os

@pytest.fixture()
def cleandir():
    newpath = tempfile.mkdtemp()
    os.chdir(newpath)

```

* test_setenv.py

```python
import os
import pytest

@pytest.mark.usefixtures("cleandir")
class TestDirectoryInit(object):
    def test_cwd_starts_empty(self):
        assert os.listdir(os.getcwd()) == []
        with open("myfile", "w") as f:
            f.write("hello")

    def test_cwd_again_starts_empty(self):
        assert os.listdir(os.getcwd()) == []
```

* 指定多个fixtures

> @pytest.mark.usefixtures("cleandir", "anotherfixture") 

#### modules
* 在test module的层级指定fixture的用途，通过使用标记机制的通用功能： 

> pytestmark = pytest.mark.usefixtures("cleandir")  

**被指定的变量必须命名为`pytestmark`，比如像foomark这样的是不能激活fixtures的。**

#### project
* pytest.ini

```python
[pytest]
usefixtures = cleandir
```

#### Auto use fixtures (xUnit setup on steroids)
偶尔地，我们可能希望在不明确声明一个函数参数或一个usefixtures装饰器的情况下，让fixtures被调用。以一个实际情况为例，假设我们有一个database fixture有begin/rollback/commit的结构，我们想要让每个测试方法都自动地跟随一个事务和回滚。下面是这个概念的一个虚拟的独立实现：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pytest


class DB(object):
    def __init__(self):
        self.intransaction = []

    def begin(self, name):
        self.intransaction.append(name)

    def rollback(self):
        self.intransaction.pop()


@pytest.fixture(scope="module")
def db():
    return DB()


class TestClass(object):
    @pytest.fixture(autouse=True)
    def transact(self, request, db):
        db.begin(request.function.__name__)
        yield
        db.rollback()

    def test_method1(self, db):
        assert db.intransaction == ["test_method1"]

    def test_method2(self, db):
        assert db.intransaction == ["test_method2"]

```

在class层级transactfixture被autouse=True标记，这个标记是为了实现，让这个class里面的所有测试方法，不需要在测试函数标记或class层级使用usefixtures装饰器的前提下就能使用这个fixture。


下面是autouse fixtures怎么在其他scope下工作的：

* autouse fixtures遵从`scope=关键字参数`：如果一个autouse fixture有`scope="session"`，不管它在哪里定义都只会运行一次。`scope='class'`表示将会在每个class运行一次等等。
* 如果一个autouse fixture在test module中定义，这个module中所有的测试函数将会自动使用它。
* 如果一个autouse fixture定义在conftest.py中，该路径下的所有测试module下的所有测试函数都会调用这个fixture。
* 最后，请小心的使用：如果你在插件中定义了一个autouse fixture，它将会在被安装的所有project的所有测试中调用。如果这个fixture无论如何都会在当前确定的settings下运行，比如在ini-file中，这样的设定非常有用。像这样一个全局的fixture应该快速确定它是否需要做任何工作，并避免不必要的imports或计算。

#### fixture functions查找顺序
如果你在实现测试的过程中发现一个fixture会用于多个测试，则可以将其移动到conftest.py中，或者甚至在不改变代码的情况下单独安装插件。fixture functions的查找顺序是`test classes`，`test modules`，`conftest.py`文件，最后是`builtin`和`三方插件`。

### 常用技巧

#### 基础用法

* [把命令行参数传入到用例](https://docs.pytest.org/en/latest/example/simple.html#pass-different-values-to-a-test-function-depending-on-command-line-options)
* [动态添加命令行参数](https://docs.pytest.org/en/latest/example/simple.html#dynamically-adding-command-line-options)
* [根据命令行参数来忽略用例执行](https://docs.pytest.org/en/latest/example/simple.html#control-skipping-of-tests-according-to-command-line-option)
* [编写集成度更好的辅助断言](https://docs.pytest.org/en/latest/example/simple.html#writing-well-integrated-assertion-helpers)
* [判断是否由pytest执行](https://docs.pytest.org/en/latest/example/simple.html#detect-if-running-from-within-a-pytest-run)
* [在测试报告的头部添加内容](https://docs.pytest.org/en/latest/example/simple.html#adding-info-to-test-report-header)
* [统计用例运行时间](https://docs.pytest.org/en/latest/example/simple.html#profiling-test-duration)
* [定义测试步骤，也就是让用例按照一定的顺序执行](https://docs.pytest.org/en/latest/example/simple.html#profiling-test-duration)
* [Package/Directory-level fixtures (setups)](https://docs.pytest.org/en/latest/example/simple.html#package-directory-level-fixtures-setups)
* [在报告和用例失败之前添加钩子](https://docs.pytest.org/en/latest/example/simple.html#post-process-test-reports-failures)
* [在fixtures中访问测试结果](https://docs.pytest.org/en/latest/example/simple.html#making-test-result-information-available-in-fixtures)
* [PYTEST_CURRENT_TEST环境变量](https://docs.pytest.org/en/latest/example/simple.html#pytest-current-test-environment-variable)
* [冻结pytest](https://docs.pytest.org/en/latest/example/simple.html#freezing-pytest)

#### 参数化

* [根据命令行参数来组合测试参数](https://docs.pytest.org/en/latest/example/parametrize.html#generating-parameters-combinations-depending-on-command-line)
* [配置testID](https://docs.pytest.org/en/latest/example/parametrize.html#generating-parameters-combinations-depending-on-command-line)
* [快速创建测试场景的功能](https://docs.pytest.org/en/latest/example/parametrize.html#a-quick-port-of-testscenarios)
* [延迟参数资源加载](https://docs.pytest.org/en/latest/example/parametrize.html#deferring-the-setup-of-parametrized-resources)
* [间接参数](https://docs.pytest.org/en/latest/example/parametrize.html#apply-indirect-on-particular-arguments)
* [为不同的方法设置不同的参数](https://docs.pytest.org/en/latest/example/parametrize.html#parametrizing-test-methods-through-per-class-configuration)
* [在多个fixture中使用间接参数](https://docs.pytest.org/en/latest/example/parametrize.html#indirect-parametrization-with-multiple-fixtures)
* [Indirect parametrization of optional implementations/imports](https://docs.pytest.org/en/latest/example/parametrize.html#indirect-parametrization-of-optional-implementations-imports)
* [单独的为每个参数化用例设置标记和ID](https://docs.pytest.org/en/latest/example/parametrize.html#set-marks-or-test-id-for-individual-parametrized-test)


### 接口测试

#### 需求分析

```
根据[3A](http://www.testclass.net/interface/3a/)原则，我们可以设计如下的用例
测试数据: 节点的名称:python/java/go/nodejs
接口地址: https://www.v2ex.com/api/nodes/show.json
断言: 返回的结果里，name字段的值必须等于传入的节点名称
```

* 实现代码

```python
import requests
import pytest

class TestV2exApiWithParams(object):
    domain = 'https://www.v2ex.com/'

    @pytest.fixture(params=['python', 'java', 'go', 'nodejs'])
    def lang(self, request):
        return request.param

    def test_node(self, lang):
        path = 'api/nodes/show.json?name=%s' %(lang)
        url = self.domain + path
        res = requests.get(url).json()
        assert res['name'] == lang
        assert 0

class TestV2exApiWithExpectation(object):
    domain = 'https://www.v2ex.com/'

    @pytest.mark.parametrize('name,node_id', [('python', 90), ('java', 63), ('go', 375), ('nodejs', 436)])

    def test_node(self, name, node_id):
        path = 'api/nodes/show.json?name=%s' %(name)
        url = self.domain + path
        res = requests.get(url).json()
        assert res['name'] == name
        assert res['id'] == node_id
        assert 0
```


### 生成xml格式的测试报告
> pytest test_quick_start.py --junit-xml=report.xml

## Selenium

### 安装[驱动](http://npm.taobao.org/mirrors/chromedriver/2.32/)

#### Linux

> 解压压缩包
> sudo cp ~/Share/chromedriver /usr/local/bin/  # 拷贝到 $PATH 中

## avocado

## Unittest

## Doctest

## Nose

## tox