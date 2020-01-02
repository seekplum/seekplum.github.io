---
layout: post
title:  开发环境搭建
tags: development environment setup
thread: development
---

## LDAP

```bash
docker run -d  \
    -p 389:389  \
    -p 636:636  \
    --network bridge  \
    --hostname openldap-host  \
    -v /tmp/data/slapd/database:/var/lib/ldap  \
    -v /tmp/data/slapd/config:/etc/ldap/slapd.d  \
    -e LDAP_ORGANISATION="seekplum.io"  \
    -e LDAP_DOMAIN="seekplum.io"  \
    -e LDAP_ADMIN_PASSWORD="seekplum"  \
    --name ldap  \
    osixia/openldap
```

### LDAP配置

```bash
docker run -d  \
    --privileged  \
    -p 8089:80  \
    --link ldap:ldap  \
    -e PHPLDAPADMIN_LDAP_HOSTS=ldap  \
    -e PHPLDAPADMIN_HTTPS=false  \
    --name ldapadmin  \
    osixia/phpldapadmin
```

浏览器访问: [http://127.0.0.1:8089](http://127.0.0.1:8089)
用户名: `cn=admin,dc=seekplum,dc=io`
密码: `seekplum`

### 新建一个用户组

参考：[phpldapadmin操作指导](https://www.cnblogs.com/xiaomifeng0510/p/9564688.html)

1.点击展示左侧 `dc=seekplum,dc=io (1)` 节点，点击 `Create new entry here`
2.选择 `Generic: Posix Group`
3.输入 `Group`，比如 `gerrit`
4.点击 `Create Object`
5.点击 `Commit`

### 新建一个用户

1.左侧点击刚刚创建的组 `cn=gerrit`
2.右侧点击 `Create a child entry`
3.右侧选择 `Generic: User Account`
4.只需要输入 `Last name` 和 `Password`，比如 `test` 和 `123456`
5.选择 `GID Number` 为 `gerrit`
6.点击 `Create Object`
7.点击 `Commit`

这样我们就得到了一个dn为 `cn=test,cn=gerrit,dc=seekplum,dc=io` ，密码为 `123456` 的用户，各种系统接入ldap登录时用户名就是 `test`

### 验证

```bash
docker exec ldap ldapsearch -x -H ldap://127.0.0.1 -b dc=seekplum,dc=io -D "cn=admin,dc=seekplum,dc=io" -w seekplum

docker exec ldap ldapsearch -x -H ldap://127.0.0.1 -b dc=seekplum,dc=io -D "cn=test,cn=gerrit,dc=seekplum,dc=io" -w 123456
```

### Python验证

```python
# -*- coding: utf-8 -*-

# pip install ldap3

from ldap3 import Server, Connection

# 基本认证
server = Server(host='127.0.0.1', port=389)
conn = Connection(server, 'cn=test, cn=gerrit,dc=seekplum,dc=io', '123456', auto_bind=True)
print("current user:", conn.extend.standard.who_am_i())  # 输出当前账号信息

# admin账号绑定search
conn = Connection(server, 'cn=admin,dc=seekplum,dc=io', 'seekplum', auto_bind=True)
conn.bind()
print("conn:", conn)

r = conn.search(search_base='cn=gerrit,dc=seekplum,dc=io', search_filter='(cn=test)', attributes=['mail'])
print("result:", r)  # search是否成功（True，False）
if not r:
    print("error msg:", conn.result)  # 查询失败的原因

print("entries:", conn.entries)  # 查询到的数据
for index, entry in enumerate(conn.entries):
    print("entry:", index + 1, entry.entry_to_json())

```

## Gerrit

```bash
docker run -d -v /tmp/dev-data/gerrit:/var/gerrit/review_site -p 8088:8080 -p 29418:29418 --name gerrit openfrontier/gerrit

docker run -d \
    --name gerrit \
    -p 8088:8080 \
    --link ldap \
    -v /tmp/dev-data/gerrit:/var/gerrit/review_site \
    -e WEBURL=http://127.0.0.1:8088 \
    -e AUTH_TYPE=LDAP \
    -e LDAP_SERVER=ldap://ldap \
    -e LDAP_ACCOUNTBASE='cn=gerrit,dc=seekplum,dc=io' \
    -e LDAP_USERNAME='cn=admin,dc=seekplum,dc=io' \
    -e LDAP_PASSWORD='seekplum' \
    -e LDAP_ACCOUNTPATTERN='(&(objectClass=person)(uid=${username}))' \
    -e GERRIT_INIT_ARGS='--install-plugin=download-commands' \
    openfrontier/gerrit
```

浏览器访问 [http://127.0.0.1:8088](http://127.0.0.1:8088)

## Sentry

详见[Docker部署Sentry](/docker-sentry-deploy)

## Jenkins

```bash
docker run --name devops-jenkins --user=root -p 8080:8080 -p 50000:50000 -v /tmp/opt/data/jenkins_home:/var/jenkins_home -d jenkins/jenkins:lts
```
