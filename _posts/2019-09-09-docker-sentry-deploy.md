---
layout: post
title: Docker部署Sentry
categories: sentry
tags: docker
thread: sentry
---

## 部署Sentry实例

* 1.启动Redis容器

```bash
docker run -d --name sentry-redis redis
```

* 2.启动Postgres容器

```bash
docker run -d --name sentry-postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_USER=sentry postgres
```

* 3.生成所有sentry容器共享的密钥

**该值将用作 `SENTRY_SECRET_KEY` 环境变量**

```bash
export SECRET_KEY=$(docker run --rm sentry config generate-secret-key|tail -n 1)
```

* 4.如果这是一个新数据库，则需要运行 upgrade

```bash
docker run -it --rm -e SENTRY_SECRET_KEY=${SECRET_KEY} --link sentry-postgres:postgres --link sentry-redis:redis sentry upgrade
```

注意：这 `-it` 很重要，因为初始升级会提示创建初始用户，如果没有它则会失败

* 5.现在启动Sentry服务器

```bash
docker run -d -p 8080:9000 --name my-sentry -e SENTRY_SECRET_KEY=${SECRET_KEY} --link sentry-redis:redis --link sentry-postgres:postgres sentry
```

**端口映射:**如果希望能够在没有容器IP的情况下从主机访问实例，则可以使用标准端口映射。只需添加 `-p 8080:9000` 到docker run参数，然后在浏览器中访问或者 `http://localhost:8080` 或`http://host-ip:8080`。

* 6.启动调度器和worker（每个worker都有一个唯一的名称）

```bash
docker run -d --name sentry-cron -e SENTRY_SECRET_KEY=${SECRET_KEY} --link sentry-postgres:postgres --link sentry-redis:redis sentry run cron

docker run -d --name sentry-worker-1 -e SENTRY_SECRET_KEY=${SECRET_KEY} --link sentry-postgres:postgres --link sentry-redis:redis sentry run worker
```

## 配置初始用户

如果您在此期间未创建超级用户upgrade，请使用以下命令创建一个：

```bash
docker run -it --rm -e SENTRY_SECRET_KEY=${SECRET_KEY} --link sentry-redis:redis --link sentry-postgres:postgres sentry createuser
```

## 环境变量

启动sentry映像时，可以通过在 `docker run` 命令行上传递一个或多个环境变量来调整Sentry实例的配置。请注意，这些环境变量是作为快速入门提供的，强烈建议您在自己的配置文件中安装或使用 `sentry:onbuild` 变体。

* 1.`SENTRY_SECRET_KEY`

用于Sentry中的加密功能的密钥。此密钥在所有正在运行的实例中应该是唯一且一致的。您可以生成一个新的密钥，例如：

```bash
docker run --rm sentry config generate-secret-key
```

* 2.`SENTRY_POSTGRES_HOST`，`SENTRY_POSTGRES_PORT`，`SENTRY_DB_NAME`，`SENTRY_DB_USER`，`SENTRY_DB_PASSWORD`

Postgres服务器的数据库连接信息。如果postgres存在链接容器，则不需要这些值。

* 3.`SENTRY_REDIS_HOST`，`SENTRY_REDIS_PORT`，`SENTRY_REDIS_DB`

Redis服务器的连接信息。如果redis存在链接容器，则不需要这些值。

* 4.`SENTRY_MEMCACHED_HOST`， `SENTRY_MEMCACHED_PORT`

Memcache服务器的连接信息。如果memcached存在链接容器，则不需要这些值。

* 5.`SENTRY_FILESTORE_DIR`

存储Sentry文件的目录。默认为 `/var/lib/sentry/files`, 是一个 `VOLUME` 可以持久化数据。

* 6.`SENTRY_SERVER_EMAIL`

`From`: 发送电子邮件中使用的电子邮件地址。默认：`root@localhost`

* 7.`SENTRY_EMAIL_HOST`，`SENTRY_EMAIL_PORT`，`SENTRY_EMAIL_USER`，`SENTRY_EMAIL_PASSWORD`，`SENTRY_EMAIL_USE_TLS`

发送smtp服务器的连接信息。如果smtp存在链接容器，则不需要这些值。

* 8.`SENTRY_MAILGUN_API_KEY`

如果您使用Mailgun作为入站邮件，请设置API密钥并配置转发到的路由 `/api/hooks/mailgun/inbound/`。

## 自定义镜像

该sentry镜像有许多种，每一个设计用于特定的使用情况。

* 1.sentry:\<version>

这是事实上的镜像。如果您不确定您的需求是什么，您可能想要使用这个。它被设计为既可以用作丢弃容器（安装源代码并启动容器来启动应用程序），也可以用作构建其他镜像的基础。

* 2.sentry:onbuild

通过复制自定义 `config.yml` 或 `sentry.conf.py` 文件并安装插件，可以轻松自定义构建自己的Sentry实例 `requirements.txt`。

也可以在 `onbuild` 包中开发自定义扩展。如果构建目录包含 `setup.py` 文件，则也会安装该文件。

有关更多信息，请参阅[Sentry官方文档](https://docs.getsentry.com/on-premise/server/installation/)。

要创建自定义sentry:onbuild程序包，只需执行以下操作：

1.创建一个包含的Dockerfile，基础镜像为 `FROM sentry:onbuild`

2.在同一目录中，添加自定义配置文件。

3.可以从docker-sentry [GitHub repo](https://github.com/getsentry/docker-sentry/)获取这些文件的副本以用作模板。

4.构建你的镜像： `docker build -t mysentry .`

5.使用 `mysentry` 而不是运行自定义镜像sentry。
