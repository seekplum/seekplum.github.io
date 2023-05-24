---
layout: post
title:  开发环境反向代理
categories: proxy
tags: nginx proxy
thread: nginx
---

## 背景

1. 我有两台机器，local、dev，没有公网IP
2. 其中 local 无法直接访问 https://xxx.yyy.com
3. dev 可以访问 https://www.baidu.com，访问必须走 https 协议

需要满足以下要求

1. 反向代理服务在 dev 机器上，以Docker容器方式启动，对外提供服务能力的端口设置为 8083
2. local 访问 dev 只支持 http 协议，不支持走 https 协议
3. 使用场景是开发环境，可以忽略 SSL 证书验证，可以使用系统内置的 CA 证书验证服务器证书的合法性

## 实现逻辑

1. 下载CA文件

```bash
curl  https://curl.se/ca/cacert.pem -o /data/reverse-proxy/cacert.pem
```

2. 配置Ningx

```plantext
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    server {
        listen 80;
        server_name xxx.yyy.com;

        location / {
            proxy_pass https://xxx.yyy.com;
            proxy_set_header Authorization "Basic base64-string";
            proxy_set_header Host xxx.yyy.com;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_ssl_verify on;
            proxy_ssl_trusted_certificate /etc/nginx/cacert.pem;
            proxy_ssl_server_name on;
            proxy_ssl_name xxx.yyy.com;
        }
    }
}
```

3. 启动代理服务

```bash
docker run -d --name reverse-proxy -v /data/reverse-proxy:/etc/nginx -p 8083:80 nginx
```

4. 在local机器访问

```bash
curl -x http://<dev IP>:8083 http://xxx.yyy.com
```
