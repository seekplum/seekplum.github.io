---
layout: post
title: Mitmproxy基本使用
categories: mitmproxy
tags: mitmproxy
thread: mitmproxy
---

## 安装

```bash
brew install mitmproxy

# 或者
pip install mitmproxy
```

## 脚本

```python
# -*- coding: utf-8 -*-

"""
# 安装第三依赖
pip install pycryptodome
"""
import abc
import base64
import json
import os
import socket
from typing import Tuple
from urllib.parse import ParseResult, urlparse

# from Crypto.Cipher import AES
from mitmproxy import http
from mitmproxy.net.http import Request, Response
from mitmproxy.net.http.response import ResponseData
from mitmproxy.script import concurrent


def ensure_binary(val: str) -> bytes:
    return val.encode(encoding="utf-8")


def ensure_text(val: bytes) -> str:
    return str(val, encoding="utf8")


def ensure_str(val: bytes) -> str:
    return val.decode(encoding="utf-8")


class MetaConst(type):
    def __getattr__(cls, key):
        return cls[key]

    def __setattr__(cls, key, value):
        raise TypeError


class Const(metaclass=MetaConst):
    def __getattr__(self, name):
        return self[name]

    def __setattr__(self, name, value):
        raise TypeError


# class Cipher(object):
#     def __init__(self, key: str) -> None:
#         self.key = ensure_binary(key)
#         self.block_size = AES.block_size
#         self.cipher = AES.new(self.key, AES.MODE_ECB)

#     def encrypt(self, raw: str) -> str:
#         raw = ensure_binary(self._pad(raw))
#         return ensure_text(base64.b64encode(self.cipher.encrypt(raw)))

#     def decrypt(self, enc: str) -> str:
#         enc = base64.b64decode(ensure_binary(enc))
#         return self._unpad(ensure_str(self.cipher.decrypt(enc)))

#     def _pad(self, s: str) -> str:
#         add = self.block_size - len(ensure_binary(s)) % self.block_size
#         return s + add * chr(add)

#     @staticmethod
#     def _unpad(s: str) -> str:
#         return s[: -ord(s[-1])]


class HostConst(Const):
    BAIDU = "www.baidu.com"
    BING = "cn.bing.com"
    TOWER = "tower.seekplum.top"
    HX = ""
    TARGET = "127.0.0.1"


class PortConst(Const):
    TOWER = 8043
    BAIDU = 80
    BING = 80


def check_address_alive(address: Tuple[str, int]) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.connect(address)
    except ConnectionRefusedError:
        return False
    else:
        return True


class IProxy(metaclass=abc.ABCMeta):
    def __init__(self, flow: http.HTTPFlow, *, debug: bool = False) -> None:
        self.flow = flow
        self.r: Request = flow.request
        # 必须先设置 host 再改写 header, 不然会被覆盖
        self.host = self.r.headers.get("Host", "") or self.r.pretty_host
        self.authority = self.r.headers.get(":authority", "")
        self.http_scheme = "http"
        self.https_scheme = "https"
        if debug:
            self.debug()

    def debug(self) -> None:
        # ctx.log.info 会报 RuntimeError: There is no current event loop in thread 'ScriptThread'.
        print(f'{"=" * 50} host: {self.host}, authority: {self.authority} {"=" * 50}')

    @abc.abstractmethod
    def request(self) -> None:
        raise NotImplementedError

    def response(self) -> None:
        pass

    def update(
        self,
        host: str,
        port: int,
        *,
        scheme: str = None,
        update_host: bool = True,
        update_authority: bool = False,
    ) -> None:
        scheme = scheme or self.http_scheme
        self.r.scheme, self.r.host, self.r.port = scheme, host, port
        if update_host:
            self._update_host()
        if update_authority:
            self._update_authority()

    def _update_host(self) -> None:
        self.r.headers["Host"] = self.host

    def _update_authority(self) -> None:
        self.r.headers[":authority"] = self.authority


class BingProxy(IProxy):
    def request(self) -> None:
        self.update(HostConst.BING, PortConst.BING, scheme=self.https_scheme)


# class HXProxy(IProxy):
#     key = ""
#     cipher = Cipher(key)

#     def request(self) -> None:
#         pass

#     def dumps(self, obj):
#         return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))

#     def parse_endata(self, content: bytes) -> tuple:
#         endata = json.loads(content)
#         soure_endata = endata["endata"]
#         dedata = self.cipher.decrypt(soure_endata)
#         return endata, json.loads(dedata)

#     def gen_endata(self, endata: dict, data: dict) -> bytes:
#         dump_data = self.dumps(data)
#         changed_endata = self.cipher.encrypt(dump_data)
#         endata["endata"] = changed_endata
#         return ensure_binary(self.dumps(endata))

#     def change_hot_key(self, content: bytes) -> bytes:
#         endata = json.loads(content)
#         endata["message"] = endata["message"][::-1]
#         soure_endata = endata["endata"]
#         dedata = self.cipher.decrypt(soure_endata)
#         core_data = json.loads(dedata)
#         # # 只保留 1个 tag
#         # core_data["data"]["list"] = core_data["data"]["list"][:1]
#         # 反转 key
#         for tag in core_data["data"]["list"]:
#             tag["key"] = tag["key"][::-1]
#         dump_data = self.dumps(core_data)
#         identifier = "]}"
#         fill_num = len(dedata) - len(dump_data) + len(identifier)
#         # 需要保证修改内容后长度一致
#         dump_data = dump_data.replace(identifier, f"{identifier: >{fill_num}}")
#         changed_endata = self.cipher.encrypt(dump_data)
#         endata["endata"] = changed_endata
#         changed_content = ensure_binary(self.dumps(endata))
#         print("=" * 100)
#         print(len(dedata), len(dump_data))
#         print(dedata)
#         print(dump_data)
#         print(len(soure_endata), len(changed_endata))
#         print(len(content), len(changed_content))
#         print("=" * 100)
#         return changed_content

#     def change_album(self, content: bytes) -> bytes:
#         endata, core_data = self.parse_endata(content)
#         # 反转 name
#         for info in core_data["data"]["list"]:
#             info["name"] = info["name"][::-1]
#         changed_content = self.gen_endata(endata, core_data)
#         return changed_content

#     def change_url(self, content: bytes) -> bytes:
#         endata, core_data = self.parse_endata(content)
#         # core_data["code"] = "0001"
#         # _, req_data = self.parse_endata(self.r.data.content)
#         changed_content = self.gen_endata(endata, core_data)
#         return changed_content

#     def change_user_detail(self, content: bytes) -> bytes:
#         endata, core_data = self.parse_endata(content)
#         core_data["data"]["isVip"] = 1
#         core_data["data"]["phone"] = 13612341234
#         changed_content = self.gen_endata(endata, core_data)
#         return changed_content

#     def show_endata(self, content: bytes) -> None:
#         endata = json.loads(content)
#         soure_endata = endata["endata"]
#         dedata = self.cipher.decrypt(soure_endata)
#         print("#" * 100)
#         print(self.r.path, dedata)
#         print("#" * 100)

#     def response(self) -> None:
#         response: Response = self.flow.response
#         result: ParseResult = urlparse(self.r.path)
#         path_map = {
#             "/common/getHotKeyList": self.change_hot_key,
#             "/album/getAlbumList": self.change_album,
#             "/video/getUrl": self.change_url,
#             "/user/getDetail": self.change_user_detail,
#         }
#         need_changed = (
#             response.status_code == 200
#             and response.headers.get("content-type", "")
#             == "application/json; charset=utf-8"
#         )
#         if not need_changed:
#             return
#         resp_data: ResponseData = response.data
#         # 原始内容
#         origin_content = resp_data.content
#         if result.path not in path_map:
#             self.show_endata(origin_content)
#             return
#         # 修改 headers
#         response.headers["test_header"] = "test-123456"
#         # 修改后内容
#         changed_content = path_map[result.path](origin_content)
#         # 修改内容
#         resp_data.content = changed_content



class TowerProxy(IProxy):
    def request(self) -> None:
        self.update(HostConst.TARGET, PortConst.TOWER, scheme=self.https_scheme)


class Proxy(IProxy):
    PROXY_MAP = {
        HostConst.BAIDU: BingProxy,
        HostConst.TOWER: TowerProxy,
        # HostConst.HX: HXProxy,
    }

    def _get_instance(self) -> IProxy:
        p_cls: IProxy = self.PROXY_MAP.get(self.host) or self.PROXY_MAP.get(
            self.authority
        )
        if p_cls is None:
            return
        instance: IProxy = p_cls(self.flow)
        return instance

    def request(self) -> None:
        instance = self._get_instance()
        instance.request()

    def response(self) -> None:
        instance = self._get_instance()
        instance.response()


@concurrent
def request(flow: http.HTTPFlow) -> None:
    proxy_instance = Proxy(flow, debug=False)
    proxy_instance.request()


@concurrent
def response(flow: http.HTTPFlow) -> None:
    proxy_instance = Proxy(flow, debug=False)
    proxy_instance.response()
```

## 启动

```bash
mitmdump -p 8123 -s proxy_rewrite.py --set upstream_cert=false --ssl-insecure
```
