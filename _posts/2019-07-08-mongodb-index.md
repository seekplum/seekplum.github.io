---
layout: post
title:  MongoDB索引
categories: index
tags: mongodb index
thread: mongodb
---

## 索引目的

当你往某各个集合插入多个文档后，每个文档在经过底层的存储引擎持久化后，会有一个位置信息，通过这个位置信息，就能从存储引擎里读出该文档。比如mmapv1引擎里，位置信息是『文件id + 文件内offset 』， 在wiredtiger存储引擎（一个KV存储引擎）里，位置信息是wiredtiger在存储文档时生成的一个key，通过这个key能访问到对应的文档；为方便介绍，统一用pos(position的缩写)来代表位置信息。

## 索引原理

索引就是将文档按照某个（或某些）字段顺序组织起来，以便能根据该字段高效的查询。

## 索引操作

* 创建集合

```mongo
db.createCollection("person")
```

* 插入数据

```mongo
db.person.insert({"name": "jack", "age": 18})
db.person.insert({"name": "rose", "age": 20})
db.person.insert({"name": "tony", "age": 21})
```

* 创建索引

```mongo
db.person.createIndex({age: 1})
```

* 查询索引

```mongo
db.person.getIndexes()
```

* 删除索引

```mongo
db.person.dropIndex("age_1")
```

* 查看执行计划

```mongo
db.person.find({age: 18}).explain()
db.person.find({age: 18}).explain("executionStats")
```

## 索引类型

* 默认的 _id 索引

Mongodb在collection创建时会默认建立一个基于 _id 的唯一索引作为 document 的 primary key,这个index无法被删除。

* 单字段索引(Single Field Index)

对于单字段索引，升序/降序效果是一样的。

* 复合索引(Compound Index)

复合索引是Single Field Index的升级版本，它针对多个字段联合创建索引，先按第一个字段排序，第一个字段相同的文档按第二个字段排序，依次类推。

复合索引能满足的查询场景比单字段索引更丰富，不光能满足多个字段组合起来的查询，也能满足所以能匹配符合索引前缀的查询。

* 有序复合索引(Sort on Compound index)

sort的顺序必须要和创建索引的顺序一致，或者和所有key逆序后一致也可以。

* 多key索引(Multikey Index)

当索引的字段为数组时，创建出的索引称为多key索引，多key索引会为数组的每个元素建立一条索引

* 哈希索引(Hashed Index)

指按照某个字段的hash值来建立索引，目前主要用于MongoDB Sharded Cluster的Hash分片，hash索引只能满足字段完全匹配的查询，不能满足范围查询等。

* 地理位置索引(Geospatial Index)

能很好的解决O2O的应用场景，比如『查找附近的美食』、『查找某个区域内的车站』等。

* 文本索引(Text Index)

能解决快速文本查找的需求，比如有一个博客文章集合，需要根据博客的内容来快速查找，则可以针对博客内容建立文本索引。

## 索引额外属性

MongoDB除了支持多种不同类型的索引，还能对索引定制一些特殊的属性。

* 唯一索引 (unique index)：保证索引对应的字段不会出现相同的值，比如_id索引就是唯一索引
* TTL索引：可以针对某个时间字段，指定文档的过期时间（经过指定时间后过期 或 在某个时间点过期）
* 部分索引 (partial index): 只针对符合某个特定条件的文档建立索引，3.2版本才支持该特性
* 稀疏索引(sparse index): 只针对存在索引字段的文档建立索引，可看做是部分索引的一种特殊情况

## 索引优化

### db profiling

MongoDB支持对DB的请求进行profiling，目前支持3种级别的profiling。

* 0： 不开启profiling
* 1： 将处理时间超过某个阈值(默认100ms)的请求都记录到DB下的system.profile集合 （类似于mysql、redis的slowlog）
* 2： 将所有的请求都记录到DB下的system.profile集合（生产环境慎用）

通常，生产环境建议使用1级别的profiling，并根据自身需求配置合理的阈值，用于监测慢请求的情况，并及时的做索引优化。

如果能在集合创建的时候就能『根据业务查询需求决定应该创建哪些索引』，当然是最佳的选择；但由于业务需求多变，要根据实际情况不断的进行优化。索引并不是越多越好，集合的索引太多，会影响写入、更新的性能，每次写入都需要更新所有索引的数据；所以你system.profile里的慢请求可能是索引建立的不够导致，也可能是索引过多导致。

## 查询计划

索引已经建立了，但查询还是很慢怎么破？这时就得深入的分析下索引的使用情况了，可通过查看下详细的查询计划来决定如何优化。通过执行计划可以看出如下问题

* 1.根据某个/些字段查询，但没有建立索引
* 2.根据某个/些字段查询，但建立了多个索引，执行查询时没有使用预期的索引。
