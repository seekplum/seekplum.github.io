---
layout: post
title: Openresty实践
tags: nginx openresty
thread: openresty
---

## 环境准备

* 1.创建配置文件目录和日志目录

```bash
mkdir conf logs lua
```

* 2.新建Nginx配置

```bash
cat > conf/hello.conf <<EOF
server {
    listen       80;
    server_name  127.0.0.1 localhost 10.0.2.212;

    location /v1/hello {
        add_header Content-Type 'text/html; charset=utf-8';
        return 200 'hello nginx';
    }

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}

EOF
```

* 3.启动Nginx

```bash
docker stop nginx; docker rm nginx

docker run -d -p 8099:80 \
    --name nginx \
    --cpus=1 -m 1024m --memory-swap=1024m \
    -v `pwd`/conf/hello.conf:/etc/nginx/conf.d/hello.conf:ro \
    nginx:alpine
```

* 4.测试Nginx并发

```bash
wrk -t4 -c200 -d20s -T20s --latency http://127.0.0.1:8099/v1/hello
```

## 简单运行

* 1.创建Lua脚本

```bash
cat > lua/hello.lua <<EOF
ngx.say('hello nginx_lua!!!');
EOF

cat > lua/http.lua <<EOF
local http = require("resty.http")
local cjson = require("cjson")
-- 获取get参数
local params = ngx.req.get_uri_args();
-- TODO: HJD body获取失败
local body_data = ngx.req.read_body();
--创建http客户端实例
local httpc = http.new()
--10.0.2.212 为本机IP地址
local resp, err = httpc:request_uri("http://10.0.2.212:8099",{
    method = "GET",
    path = "/v1/hello",
    headers = {
        ["User-Agent"] = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.111 Safari/537.36"
    }
})

if not resp then
    ngx.say({
        ["success"] = 1,
        ["errorMsg"] = err
        })
    return
end

local response = {
    status = resp.status,
    success = 0,
    body = body_data,
    params = params,
    data = resp.body
    };
ngx.say(cjson.encode(response))

httpc:close()
EOF
```

* 2.配置Openresty

```bash
cat > conf/lua.conf <<EOF
log_format main  escape=json '{ "@timestamp": "$time_local", '
                        '"remote_addr": "$remote_addr", '
                        '"upstream_addr": "$upstream_addr",'
                        '"remote_user": "$remote_user", '
                        '"body_bytes_sent": "$body_bytes_sent", '
                        '"request_time": "$request_time", '
                        '"status": "$status", '
                        '"request": "$request", '
                        '"request_method": "$request_method", '
                        '"http_referrer": "$http_referer", '
                        '"body_bytes_sent": "$body_bytes_sent", '
                        '"http_x_forwarded_for": "$http_x_forwarded_for", '
                        '"host": "$host", '
                        '"remote_addr": "$remote_addr", '
                        '"http_user_agent": "$http_user_agent", '
                        '"http_uri": "$uri", '
                        '"req_body": "$resp_body", '
                        '"http_host": "$http_host" }';

server {
    listen 8080;
    access_log  logs/request.log  main;

    location /v1/lua {
        default_type text/html;
        content_by_lua_file lua/hello.lua;
    }
    location /v1/http {
        default_type text/html;
        content_by_lua_file lua/http.lua;
    }
    location /v1/hello {
        default_type text/html;
        content_by_lua '
            ngx.say("<p>hello openresty</p>")
        ';
    }
    location / {
        root   /usr/local/openresty/nginx/html;
        index  index.html index.htm;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/local/openresty/nginx/html;
    }
}

EOF
```

* 3.启动Openresty

```bash
docker stop openresty; docker rm openresty

docker run -d --name=openresty \
    -p 8098:8080 \
    --cpus=1 -m 1024m --memory-swap=1024m \
    -v `pwd`/conf/lua.conf:/etc/nginx/conf.d/lua.conf:ro \
    -v `pwd`/logs:/usr/local/openresty/nginx/logs \
    -v `pwd`/lua:/usr/local/openresty/nginx/lua:ro \
    -v `pwd`/http.lua:/usr/local/openresty/lualib/resty/http.lua:ro \
    -v `pwd`/http_headers.lua:/usr/local/openresty/lualib/resty/http_headers.lua:ro  \
    openresty/openresty:alpine
```

* 4.测试Openresty并发

```bash
wrk -t4 -c200 -d20s -T20s --latency http://127.0.0.1:8098/v1/hello

wrk -t4 -c200 -d20s -T20s --latency http://127.0.0.1:8098/v1/http
```
