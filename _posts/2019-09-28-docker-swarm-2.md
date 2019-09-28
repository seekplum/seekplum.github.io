---
layout: post
title:  Docker Swarm集群《二》
categories: docker
tags: docker swarm
thread: docker
---
## replicated mode vs global mode

Swarm 可以在 service 创建或运行过程中灵活地通过 `--replicas` 调整容器副本的数量，内部调度器则会根据当前集群的资源使用状况在不同 node 上启停容器，这就是 service 默认的 `replicated mode`。在此模式下，node 上运行的副本数有多有少，一般情况下，资源更丰富的 node 运行的副本数更多，反之亦然。

除了 `replicated mode`，service 还提供了一个 `global mode`，其作用是强制在每个 node 上都运行一个且最多一个副本。

**此模式特别适合需要运行 daemon 的集群环境。**

比如要收集所有容器的日志，就可以 global mode 创建 service，在所有 node 上都运行 gliderlabs/logspout 容器，即使之后有新的 node 加入，swarm 也会自动在新 node 上启动一个 gliderlabs/logspout 副本。

```bash
docker service create \
    --mode global \
    --name logspout \
    --mount type=bind,source=/var/run/docker.sock,destination=/var/run/docker.sock \
    gliderlabs/logspout
```

## 用 Label 控制 Service 的位置 

**无论采用 global mode 还是 replicated mode，副本运行在哪些节点都是由 Swarm 决定的，作为用户我们可以使用label精细控制 service 的运行位置。**

* 1.为每个 node 定义 label。
* 2.设置 service 运行在指定 label 的 node 上。

* 使用ubuntu1作为测试环境

```bash
docker node update --label-add env=test ubuntu1

docker node inspect ubuntu1 --pretty
```

* 使用ubuntu3作为生产环境

```bash
docker node update --label-add env=prod ubuntu3
```

* 部署到测试环境

```bash
docker service create \
    --constraint node.labels.env==test \
    --replicas 3 \
    --name my_web \
    --publish 8080:80 \
    httpd
```

* 更新 service，将其迁移到生产环境：

```bash
docker service update --constraint-rm node.labels.env==test my_web

docker service update --constraint-add node.labels.env==prod my_web
```

label 还可以跟 global 模式配合起来使用，比如只收集生产环境中容器的日志。

```bash
docker service create \
    --mode global \
    --constraint node.labels.env==prod \
    --name logspout \
    --mount type=bind,source=/var/run/docker.sock,destination=/var/run/docker.sock \
    gliderlabs/logspout
```

只有 `ubuntu3` 节点上才会运行 logspout。

## Health Check

Docker 支持的 `Health Check` 可以是任何一个单独的命令，Docker 会在容器中执行该命令，如果返回 `0`，容器被认为是 `healthy`，如果返回 `1`，则为 `unhealthy`。

* Http请求检查

对于提供 HTTP 服务接口的应用，常用的 Health Check 是通过 curl 检查 HTTP 状态码，比如：

```bash
curl --fail http://localhost:8080/ || exit 1
```

如果 curl 命令检测到任何一个错误的 HTTP 状态码，则返回 1，Health Check 失败。

* health场景

```bash
docker service create --name my_db \
    --health-cmd "curl --fail http://localhost:8091/pools || exit 1" \
    couchbase
```

`--health-cmd` Health Check 的命令，还有几个相关的参数：

`--timeout`: 命令超时的时间，默认 30s。

`--interval`: 命令执行的间隔时间，默认 30s。

`--retries`: 命令失败重试的次数，默认为 3，如果 3 次都失败了则会将容器标记为 unhealthy。swarm 会销毁并重建 unhealthy 的副本。

* unhealthy场景

```bash
docker service create --name my_db2 \
    --health-cmd "curl --fail http://localhost:8091/non-exist || exit 1" \
    couchbase
```

**Docker 默认只能通过容器进程的返回码判断容器的状态，Health Check 则能够从业务角度判断应用是否发生故障，是否需要重启。**

## Secret(密码、私钥)

docker swarm 提供了 secret 机制，允许将敏感信息加密后保存到 secret 中，用户可以指定哪些容器可以使用此 secret。

### 启动MySQL容器

* 1.创建密码文件

```bash
echo "my-secret-pw" | docker secret create my_secret_data -
```

* 2.启动MySQL service,并制定使用secret

```bash
docker service create \
    --name mysql \
    --secret source=my_secret_data,target=mysql_root_password \
    -e MYSQL_ROOT_PASSWORD_FILE="/run/secrets/mysql_root_password" \
    mysql:latest
```

① source 指定容器使用 secret 后，secret 会被解密并存放到容器的文件系统中，默认位置为 `/run/secrets/<secret_name>`。`--secret source=my_secret_data,target=mysql_root_password` 的作用就是指定使用 secret my_secret_data，然后把器解密后的内容保存到容器 `/run/secrets/mysql_root_password` 文件中，文件名称 `mysql_root_password` 由 `target` 指定。

②环境变量 `MYSQL_ROOT_PASSWORD_FILE` 指定从 `/run/secrets/mysql_root_password` 中读取并设置 MySQL 的管理员密码。

#### 优势

创建 secret 和使用 secret 是分开完成的，将密码和容器解耦合。secret 可以由专人（比如管理员）创建，而运行容器的用户只需使用 secret 而不需要知道 secret 的内容。也就是说，两个步骤可以由不同的人在不同的时间完成。

#### 疑问

secret 是以文件的形式 mount 到容器中，容器怎么知道去哪里读取 secret 呢？

答：这需要 image 的支持。如果 image 希望它部署出来的容器能够从 secret 中读取数据，那么此 image 就应该提供一种方式，让用户能够指定 secret 的位置。最常用的方法就是通过环境变量，Docker 的很多官方 image 都是采用这种方式。

比如 MySQL 镜像同时提供了 `MYSQL_ROOT_PASSWORD` 和 `MYSQL_ROOT_PASSWORD_FILE` 两个环境变量。用户可以用 `MYSQL_ROOT_PASSWORD` 显示地设置管理员密码，也可以通过 `MYSQL_ROOT_PASSWORD_FILE` 指定 secret 路径。

### Secret 的使用场景

我们可以用 secret 管理任何敏感数据。这些敏感数据是容器在运行时需要的，同时我们不又想将这些数据保存到镜像中。

secret 可用于管理：

* 1.用户名和密码。
* 2.TLS 证书。
* 3.SSH 秘钥。
* 3.其他小于 500 KB 的数据。

**secret 只能在 swarm service 中使用。普通容器想使用 secret，可以将其包装成副本数为 1 的 service。**

### Secret 的安全性

当在 swarm 中创建 secret 时，Docker 通过 TLS 连接将加密后的 secret 发送给所以的 manager 节点。

secret 创建后，即使是 swarm manager 也无法查看 secret 的明文数据，只能通过 `docker secret inspect` 查看 secret 的一般信息

## 部署WordPress

我们会部署一个 WordPress 应用，WordPress 是流行的开源博客系统。

我们将创建一个 MySQL service，将密码保存到 secret 中。我们还会创建一个 WordPress service，它将使用 secret 连接 MySQL。这个例子将展示如何用 secret 避免在 image 中存放敏感信息，或者在命令行中直接传递敏感数据。

* 1.创建secret

```bash
openssl rand -base64 20 | docker secret create mysql_root_password -
```

一般情况下，应用不会直接用 root 密码访问 MySQL。我们会创建一个单独的用户 workpress，密码存放到 secret mysql_password中。

```bash
openssl rand -base64 20 > password.txt
docker secret create mysql_password password.txt
```

* 2.创建自定义的 overlay 网络

MySQL 通过 overlay 网络 mysql_private 与 WordPress 通信，不需要将 MySQL service 暴露给外部网络和其他容器。

```bash
docker network create -d overlay mysql_private
```

* 3.创建 MySQL service

```bash
docker service create \
    --name mysql \
    --network mysql_private \
    --secret source=mysql_root_password,target=mysql_root_password \
    --secret source=mysql_password,target=mysql_password \
    -e MYSQL_ROOT_PASSWORD_FILE="/run/secrets/mysql_root_password" \
    -e MYSQL_PASSWORD_FILE="/run/secrets/mysql_password" \
    -e MYSQL_USER="wordpress" \
    -e MYSQL_DATABASE="wordpress" \
    mysql:latest
```

`MYSQL_DATABASE`: 指明创建数据库 wordpress。

`MYSQL_USER` 和 `MYSQL_PASSWORD_FILE` 指明创建数据库用户 workpress，密码从 secret mysql_password 中读取。

* 4.创建 WordPress service

```bash
docker service create \
     --name wordpress \
    --network mysql_private \
    --publish 30000:80 \
    --secret source=mysql_password,target=wp_db_password \
    -e WORDPRESS_DB_HOST="mysql:3306" \
    -e WORDPRESS_DB_NAME="wordpress" \
    -e WORDPRESS_DB_USER="wordpress" \
    -e WORDPRESS_DB_PASSWORD_FILE="/run/secrets/wp_db_password" \
    wordpress:latest
```

`WORDPRESS_DB_HOST`: 指明 MySQL service 地址 mysql:3306，这里用到了 DNS。

`WORDPRESS_DB_NAME`: 指明 WordPress 的数据库为 wordpress，与前面 MYSQL_DATABASE 一致。

`WORDPRESS_DB_USER`: 指明连接 WordPress 数据库的用户为 wordpress，与前面 MYSQL_USER 一致。

`WORDPRESS_DB_PASSWORD_FILE`: 指明数据库的用户 wordpress 的密码，从 secret mysql_password 中获取。

* 5.验证 WordPress

浏览器访问 [http://${swarm_master_ip}:30000/](#)

### 总结

* 1.首先创建 secret。
* 2.然后创建 MySQL service，这是 WordPress 依赖的服务。
* 3.最后创建 WordPress service。

也就是说，这个应用包含了两个 service：MySQL 和 WordPress，它们之间有明确的依赖关系，必须先启动 MySQL。

为了保证这个依赖关系，我们控制了 docker secret 和 docker service 命令的执行顺序，只不过这个过程是手工完成的。

## stack

## 参考

* [如何配置 Health Check？- 每天5分钟玩转 Docker 容器技术（107）](https://www.cnblogs.com/CloudMan6/p/8053323.html)
