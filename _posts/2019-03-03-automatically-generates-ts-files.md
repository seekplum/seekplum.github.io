---
layout: post
title:  python自动生成前端SDK(typescript)
categories: python
tags: python marshmallow ts typescript
thread: python
---

## 前言

在介绍如何生成前端ts文件前，先和大家回顾下前后端分离时常见的API文档对接方式，及各种方式存在的问题，以及一个好的对接方式需要满足哪些条件。

## 对接方式

### 第一种

通过QQ、微信、企业微信等聊天工具，直接进行发送

* 缺点:
    - 1.后续很难追踪和维护
    - 2.查找极不方便
    - 3.当文档写错时，很难去排查和修改
    - 4.还需要前端或后端同学一个字段一个字段对应代码
    - 5.代码和文档脱离，很容易导致更新不同步

### 第二种

维护在github、gitlab wiki上，以markdown格式维护

* 缺点:
    - 1.查找极不方便
    - 2.当文档写错时，很难去排查和修改
    - 3.还需要前端或后端同学一个字段一个字段对应代码
    - 4.代码和文档脱离，很容易导致更新不同步

### 第三种

通过相关工具apidoc、sphinx、raml、Swagger、API Blueprint等工具自动生成可读性、查找性都较高的api文档，具体实现方式参考[编写API 文档](/apidoc)。

* 缺点:
    - 1.当文档写错时，很难去排查和修改
    - 2.还需要前端或后端同学一个字段一个字段对应代码
    - 3.代码和文档脱离，很容易导致更新不同步

## 小结

通过以上的几种方式梳理，我们可知一个较好的API文档要求如下:

* 1.可长期维护
* 2.查找方便
* 3.可以自动排错
* 4.文档和代码一致
* 5.减少前后端的工作量
* 6.对代码侵入性小

基于以上几点，笔者在项目中预研了自动生成前端SDK(typescript)文件操作。

## 接口设计

### 需求

在开始前，我们先看下一个完整的API文档需要哪些数据

* 1.url路径
* 2.请求类型(GET/POST/PUT/DELETE等)
* 3.API描述
* 4.请求参数中每个字段的类型及示例
* 5.返回结果中每个字段的类型及示例

### 说明

一般前后端分离的开发模式中，后端都会对前端传入的数据进行检查。在python中有两个三方库用的较多。[schema](https://github.com/keleshev/schema)和[marshmallow](https://github.com/marshmallow-code/marshmallow)。schema的优势和足够简单和灵活，缺点是无法扩展一些属性，导致无法生成一个完整的API文档。

所以本文中通过定义 `marshmallow` schema，利用 `fields` 中的 `required`， `metadata` 等属性，清晰描述某个字段，提供给程序解析，然后自动生成前端需要的SDK。

### 定义相关接口

```python

class BaseLocalSchema(LocalSchema):

    def __description__(self):
        """描述信息
        """
        raise NotImplementedError(
            "{}: The __description__ method must be implemented".format(self.__class__.__name__)
        )

    def __example__(self):
        """示例"""
        raise NotImplementedError(
            "{}: The __example__ method must be implemented".format(self.__class__.__name__)
        )


class BaseResponse(BaseLocalSchema):
    code = fields.Integer(required=True, description="请求状态码", example=200)
    message = fields.String(required=True, description="错误信息", example="请求正常!")

    def __description__(self):
        """描述信息
        """
        raise NotImplementedError(
            "{}: The __description__ method must be implemented".format(self.__class__.__name__)
        )

    def __example__(self):
        """示例"""
        raise NotImplementedError(
            "{}: The __example__ method must be implemented".format(self.__class__.__name__)
        )


class BaseApiSchema(six.with_metaclass(abc.ABCMeta)):
    def __init__(self):
        pass

    @abc.abstractmethod
    def __description__(self):
        """api描述信息
        """

    @abc.abstractmethod
    def __url__(self):
        """API的url路径"""

    @abc.abstractmethod
    def __method__(self):
        """API请求类型"""

    @abc.abstractmethod
    def request(self):
        """请求参数schema"""

    @abc.abstractmethod
    def response(self):
        """返回参数schema"""

```

### 定义schema

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
#=============================================================================
#  ProjectName: seekplum
#     FileName: user
#         Desc: 用户相关schema
#       Author: seekplum
#        Email: 1131909224m@sina.cn
#     HomePage: seekplum.github.io
#       Create: 2019-02-26 18:17
#=============================================================================
"""

from marshmallow import fields, validate

from schemas import BaseApiSchema
from schemas import BaseResponse
from schemas import BaseLocalSchema
from schemas import Nested


class ApiRequestUserSchema(BaseLocalSchema):
    name = fields.Str(required=True, description="用户名", example="teste")
    email = fields.String(required=True, description="邮箱名", example="1@qq.com")
    type = fields.String(required=False, validate=validate.OneOf(("admin", "normal")), description="用户类型",
                         example="admin", default="normal")

    def __description__(self):
        return "查询用户信息参数"

    def __example__(self):
        return {
            "name": "test",
            "email": "1@qq.com",
            "type": "admin"
        }


class UserSchema(BaseLocalSchema):
    id = fields.Integer(required=True, description="用户id", example="1")
    name = fields.Str(required=True, description="用户名", example="test")
    email = fields.String(required=True, description="邮箱名", example="1@qq.com")
    created_at = fields.String(required=True, description="创建时间", example="2019-02-25 22:24:00")
    type = fields.String(validate=validate.OneOf(("admin", "normal")), required=True, description="用户类型",
                         example="admin")

    def __description__(self):
        return "返回用户信息"

    def __example__(self):
        return {
            "id": 1,
            "name": "test",
            "email": "1@qq.com",
            "created_at": "2019-02-25 22:24:00",
            "type": "admin"
        }


class ApiResponseUserSchema(BaseResponse):
    data = Nested(UserSchema, required=True)

    def __description__(self):
        return "返回用户信息查询结果"

    def __example__(self):
        return {
            "error_code": 0,
            "message": "",
            "data": UserSchema().__example__()
        }


class UserHandlerSchema(BaseApiSchema):
    def __description__(self):
        """api描述信息
        """
        return "查询用户信息"

    def __url__(self):
        """API的url路径"""
        return "/qdata/user"

    def __method__(self):
        """API请求类型"""
        return "GET"

    def request(self):
        """请求参数schema"""
        return ApiRequestUserSchema()

    def response(self):
        """返回参数schema"""
        return ApiResponseUserSchema()

```

### 原理

* 1.找出抽象类 `BaseApiSchema` 的所有子类
* 2.解析schema中每个字段类型，拼接ts类内容
* 3.根据类名和模块名对ts文件进行划分
* 4.把ts类写入文件

### 使用方式

* 需要为每个请求定义一个 `HandlerSchema`，必须继承 `BaseApiSchema`类。
* `HandlerSchema`中的 `request` 对应的schema类名必须以 `ApiRequest` 开头
* `HandlerSchema`中的 `response` 对应的schema类名必须以 `ApiResponse` 开头
* `HandlerSchema`中的 `response` 对应的schema必须继承 `BaseResponse`
* 其他schema必须是继承 `BaseLocalSchema`

### 最终效果

![生成中报错](/static/images/python/ts-error.jpg)

![生成的ts文件](/static/images/python/ts.jpg)

## 总结

定义schema进行自动生成前端SDK，可以配合CI自动生成和提交，进而保证了我们的SDK和代码是同步且实时更新的，同时减少了前后端对APIDOC的维护工作，提高了开发效率。
