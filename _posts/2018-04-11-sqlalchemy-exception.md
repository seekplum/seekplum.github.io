---
layout: post
title:  sqlalchemy异常
tags: python sqlalchemy
thread: sqlalchemy
---

## group_by

### OperationalError
- 错误详情

```
OperationalError: (_mysql_exceptions.OperationalError) (1055, "Expression #1 of SELECT list is not in GROUP BY clause and contains nonaggregated column 'qdata_cloud.drill_base.create_time' which is not functionally dependent on columns in GROUP BY clause; this is incompatible with sql_mode=only_full_group_by") [SQL: xxx]
```

- 原因：

sql_mode使用的是默认值，而之前使用的mysql配置文件中sql_mode="",由于这个特性使在使用group_by时出现报错，默认的sql-mode里的ONLY_FULL_GROUP_BY字段导致不能直接查询group_by包裹的之外的字段，如下使用，只查询group_by的字段可以正常使用，但是同时查询create_time和count字段会出现错误：

```python
# 正确
session.query(Table.count).group_by(Table.count).all()
```

```python
# 报错
session.query(Table.create_time,Table.count).group_by(Table.count).all()
```

- 解决办法：

> 不建议sql_mode为空，因为会有数据丢失的风险，故推荐使用**第二种**解决方法。

    1. 修改sql_mode

        设置： 在mysql的conf文件中加上`sql_mode=""`这一行
        

    2. 程序中改变查询语句的写法，group_by之外的字段使用func函数包围

        为了符合ONLY_FULL_GROUP_BY=True的要求，如下：

    
        那么在程序中正确  的写法应为：

    ```python
    from sqlalchemy import func

    objs = session.query(func.any_value(Table.create_time）,Table.count).group_by(Table.count).all()
    # 注意：这样生成的数据结果为[(),()]，列表中的结果是元组，而不是生成器，如果要对结果进行解析，解析方式也跟原来的方式不一样

    obj = session.query(func.any_value(Table.create_time）,Table.count).group_by(Table.count).first()
    # 但是如果在这样的写法中只需要使用count字段，写成obj.count是可以的
    ```


## order_by

### sqlalchemy.exc.InterfaceError

* 错误详情

```
sqlalchemy.exc.InterfaceError: (_mysql_exceptions.InterfaceError) (-1, 'error totally whack') 
```

```
from sqlalchemy import desc
from sqlalchemy.sql.functions import concat


base_query = session.query(Table).filter(
    Table.cluster_id == 1,
    Table.status.in_([Table.FINISH, Table.RUNNING])).order_by(
    # 正确写法
    getattr(Table, "create_time").desc())
    # 错误写法
    # desc("create_time"))  # 只有first会出错, all/one查询不会出错
data = base_query.first()
print("status: {}".format(data.status))
```





