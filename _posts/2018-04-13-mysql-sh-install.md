---
layout: post
title:  自动安装与更新MySQL
tags: mysql install update
thread: mysqlinstallupdate
---
## 脚本内容
* mysql_maintain.sh
```bash
#!/bin/bash

# 各产品线产品名称
product_name=seekplum

# 各产品线用于启动MySQL 的用户名
user_name=hjd

# 待安装或维护的MySQL 二进制包前缀名称
packages_name=mysql-5.7.20-linux-glibc2.12-x86_64

# 操作类型，只支持install和update
operat_type=update

# MySQL 超级管理员账号
admin_user=pig

# MySQL 超级管理员账号密码
admin_pass='xx'

# 汇总日志路径
logs=/tmp/summary.log




read -p "请确认待操作的MySQL 二进制包已上传到/tmp路径下？确认执行脚本？(y|n)：" is_exec                                                                                                                                            
if [ "$is_exec" != "y" -a "$is_exec" != "Y" ];then                                                                                                                                                          
    exit 1                                                                                                                                                                                                  
fi                                                                                                                                                                                                          
                                                                                                                                                                                                            
ulimit -SHn 300000                                                                                                                                                                                          
rm -f $logs                                                                                                                                                                                
touch $logs


if [ ! -f "/tmp/${packages_name}.tar.gz" -a ! -f "/tmp/${packages_name}.tar" ];then
    echo "未发现二进制安装包/tmp/${packages_name}.tar.gz 或 /tmp/${packages_name}.tar,脚本退出！！" |tee -a $logs
    exit 1
fi


# 安装MySQL
install_mysql() {
    # 创建用户
    userdel -r $user_name 2> /dev/null
    useradd $user_name 2> /dev/null

    killall -9 mysqld mysqld_safe
    
    # 创建基本的包目录
    mkdir -p /home/${user_name}/${product_name}/packages/

    # 解压压缩包
    tar xf /tmp/${packages_name}.tar.gz -C /home/${user_name}/${product_name}/packages/ 2> /dev/null || tar xf /tmp/${packages_name}.tar -C /home/${user_name}/${product_name}/packages/
    
    # 对basedir路径做软链
    unlink /home/${user_name}/${product_name}/packages/mysql
    ## 如果mysql目录不是一个链接，而是一个目录，则先进行备份，然后再删除
    [ -d /home/${user_name}/${product_name}/packages/mysql ] && cp -ar /home/${user_name}/${product_name}/packages/mysql /home/${user_name}/${product_name}/packages/mysql.bak_`date +%F_%H_%M_%S`
    rm -rf /home/${user_name}/${product_name}/packages/mysql
    ln -s /home/${user_name}/${product_name}/packages/${packages_name} /home/${user_name}/${product_name}/packages/mysql
    
    # 创建datadir等目录，创建错误日志文件
    rm -rf /home/${user_name}/${product_name}/packages/data/*
    mkdir -p /home/${user_name}/${product_name}/packages/data/{innodb_log,binlog,innodb_ts,log,mydata,relaylog,slowlog,sock,tmpdir,undo,conf}
    touch /home/${user_name}/${product_name}/packages/data/log/error.log
    
    # 修改文件夹权限为我们创建的MySQL用户
    chown -R ${user_name}:${user_name} /home/${user_name}/${product_name}/packages/{mysql,data}
    
    # 把mysql做成服务,并设置自启动
    rm -f /etc/init.d/mysql
    cp /home/${user_name}/${product_name}/packages/mysql/support-files/mysql.server /etc/init.d/mysql
    chmod +x /etc/init.d/mysql
    chkconfig --add mysql
    chkconfig --level 2345 mysql on
    
    # 设置mysql动态连接
    echo /home/${user_name}/${product_name}/packages/mysql/lib > /etc/ld.so.conf.d/mysql-qdata.conf
    ldconfig
    
    # 生成配置文件
    ## 预设为物理内存的40%，计算结果值单位为MB
    let "_buffer_pool_size=$(free -g |grep Mem |awk '{print $2}') * 1000 / 100 * 40"
    let "_buffer_pool_size=($_buffer_pool_size / 128 + 1)*128"
    
    ## 配置文件模板
    cat > /home/${user_name}/${product_name}/packages/data/conf/my.cnf  << EOF
[client]
loose_default-character-set = utf8
port = 3306
socket = /home/${user_name}/${product_name}/packages/data/sock/mysql.sock
user = admin

[mysqldump]
quick
max_allowed_packet = 2G
default-character-set = utf8

[mysql]
no-auto-rehash
show-warnings
prompt = "\\u@\\h : \\d \\r:\\m:\\s> "
default-character-set = utf8

[myisamchk]
key_buffer = 512M
sort_buffer_size = 512M
read_buffer = 8M
write_buffer = 8M

[mysqlhotcopy]
interactive-timeout

[mysqld_safe]
user = mysql
open-files-limit = 65535

[mysqld]
default-storage-engine = INNODB
character-set-server = utf8
collation_server = utf8_bin
log_timestamps = SYSTEM
user = ${user_name}
port = 3306
server_id = 3306102
log-bin=/home/${user_name}/${product_name}/packages/data/binlog/mysql-bin
socket = /home/${user_name}/${product_name}/packages/data/sock/mysql.sock
pid-file = /home/${user_name}/${product_name}/packages/data/mydata/mysql.pid
datadir = /home/${user_name}/${product_name}/packages/data/mydata
basedir = /home/${user_name}/${product_name}/packages/mysql
tmpdir = /home/${user_name}/${product_name}/packages/data/tmpdir
skip-name-resolve
skip_external_locking
lower_case_table_names = 1
event_scheduler = 0
back_log = 512
default-time-zone = '+8:00'
max_connections = 1000
max_connect_errors = 99999
max_allowed_packet = 64M
slave_pending_jobs_size_max = 128M
max_heap_table_size = 8M
max_length_for_sort_data = 16k
wait_timeout = 172800
interactive_timeout = 172800
net_buffer_length = 8K
read_buffer_size = 2M
read_rnd_buffer_size = 2M
sort_buffer_size = 2M
join_buffer_size = 4M
binlog_cache_size = 2M
table_open_cache = 4096
table_open_cache_instances = 2
table_definition_cache = 4096
thread_cache_size = 512
tmp_table_size = 8M
query_cache_size = 0
query_cache_type = OFF
max_prepared_stmt_count = 163820
secure_file_priv = null
innodb_open_files = 65535
log-error = /home/${user_name}/${product_name}/packages/data/log/error.log
long_query_time = 1
slow_query_log
slow_query_log_file = /home/${user_name}/${product_name}/packages/data/slowlog/slow-query.log
log_warnings
log_slow_slave_statements
server_id = 295
binlog-format = ROW
binlog-checksum = CRC32
binlog-rows-query-log-events = 1
binlog_max_flush_queue_time = 1000
max_binlog_size = 512M
expire_logs_days = 15
sync_binlog = 1
master-verify-checksum = 1
master-info-repository = TABLE
auto_increment_increment = 2
auto_increment_offset = 1
slave_parallel_workers = 8
relay-log = /home/${user_name}/${product_name}/packages/data/relaylog/relay_bin
relay-log-info-repository = TABLE
relay-log-recovery = 1
slave-sql-verify-checksum = 1
log_bin_trust_function_creators = 1
log_slave_updates = 1
slave-net-timeout = 10
key_buffer_size = 8M
bulk_insert_buffer_size = 8M
myisam_sort_buffer_size = 64M
myisam_max_sort_file_size = 10G
myisam_repair_threads = 1
myisam_recover_options = force
innodb_data_home_dir = /home/${user_name}/${product_name}/packages/data/innodb_ts
innodb_data_file_path = ibdata1:2G:autoextend
innodb_file_per_table
innodb_file_format = barracuda
innodb_file_format_max = barracuda
innodb_file_format_check = ON
innodb_strict_mode = 1
innodb_flush_method = O_DIRECT
innodb_checksum_algorithm = crc32
innodb_autoinc_lock_mode = 2
innodb_buffer_pool_size = ${_buffer_pool_size}M
innodb_buffer_pool_instances = 8
innodb_max_dirty_pages_pct = 50
innodb_adaptive_flushing = ON
innodb_flush_neighbors = 0
innodb_lru_scan_depth = 4096
innodb_change_buffering = all
innodb_old_blocks_time = 1000
innodb_buffer_pool_dump_pct = 50
innodb_buffer_pool_dump_at_shutdown = ON
innodb_buffer_pool_load_at_startup = ON
innodb_adaptive_hash_index_parts = 32
innodb_log_group_home_dir = /home/${user_name}/${product_name}/packages/data/innodb_log
innodb_log_buffer_size = 128M
innodb_log_file_size = 2G
innodb_log_files_in_group = 2
innodb_flush_log_at_trx_commit = 1
innodb_fast_shutdown = 1
innodb_support_xa = ON
innodb_thread_concurrency = 64
innodb_lock_wait_timeout = 120
innodb_rollback_on_timeout = 1
transaction_isolation = READ-COMMITTED
performance_schema = on
innodb_read_io_threads = 8
innodb_write_io_threads = 16
innodb_io_capacity = 20000
innodb_use_native_aio = 1
innodb_undo_directory = /home/${user_name}/${product_name}/packages/data/undo
innodb_purge_threads = 4
innodb_purge_batch_size = 512
innodb_max_purge_lag = 65536
innodb_undo_tablespaces = 8 # cannot modify
innodb_undo_log_truncate = ON # 5.7 only
innodb_max_undo_log_size = 2G  # 5.7 only
gtid-mode = on # GTID only
enforce-gtid-consistency = true # GTID only
optimizer_switch = 'mrr=on,mrr_cost_based=off,batched_key_access=on'
explicit_defaults_for_timestamp = ON
slave_parallel_type = LOGICAL_CLOCK
innodb_page_cleaners = 4
EOF


    # 对配置文件做软链
    unlink /etc/my.cnf &> /dev/null
    [ $? -ne 0 ] && rm -f /etc/my.cnf
    ln -s /home/${user_name}/${product_name}/packages/data/conf/my.cnf  /etc/my.cnf
    
    # 执行初始化
    /home/${user_name}/${product_name}/packages/mysql/bin/mysqld  --defaults-file=/home/${user_name}/${product_name}/packages/data/conf/my.cnf --initialize-insecure
    
    # 启动MySQL
    service mysql start
    service mysql status
    
    # 初始化超级管理员账号
    echo |/home/${user_name}/${product_name}/packages/mysql/bin/mysql -uroot -S /home/${user_name}/${product_name}/packages/data/sock/mysql.sock -e "
delete from mysql.user; 
delete from mysql.db;
grant all on *.* to root@'localhost' identified by 'letsg0' with grant option; 
GRANT ALL PRIVILEGES ON *.* TO '${admin_user}'@'%' IDENTIFIED BY '${admin_pass}';flush privileges;
flush privileges;"
    
    # 创建程序账号
    /home/${user_name}/${product_name}/packages/mysql/bin/mysql -uroot -p'letsg0' -S /home/${user_name}/${product_name}/packages/data/sock/mysql.sock -e "grant create,drop,replication slave,delete,select,update,insert on *.* to program@'%' identified by 'letsg0';"

}



# 更新MySQL
update_mysql() {
    # 检查上一版本的sql_mode参数，并保存为一个变量，后续需要使用
    sql_mode=`/home/${user_name}/${product_name}/packages/mysql/bin/mysql  --defaults-file=/home/${user_name}/${product_name}/packages/data/conf/my.cnf -u${admin_user} -p${admin_pass} -e "show variables like 'sql_mode'" |tail -1 |awk '{print $2}'`
    
    # 动态修改innodb_fast_shutdown=0，以执行full purge和插入缓冲合并等操作，以干净的方式关闭MySQL
    /home/${user_name}/${product_name}/packages/mysql/bin/mysql  --defaults-file=/home/${user_name}/${product_name}/packages/data/conf/my.cnf -u${admin_user} -p${admin_pass} -e "set global innodb_fast_shutdown=0;"
    
    # 正常关闭mysql
    service mysql stop
    
    # my.cnf中添加skip_grant_tables参数
    if ! grep -i '^skip_grant_tables$' /home/${user_name}/${product_name}/packages/data/conf/my.cnf > /dev/null ;then
        echo 'skip_grant_tables' >> /home/${user_name}/${product_name}/packages/data/conf/my.cnf
    fi
    
    # 解压新版本的二进制包
    tar xf /tmp/${packages_name}.tar.gz -C /home/${user_name}/${product_name}/packages/ 2> /dev/null || tar xf /tmp/${packages_name}.tar -C /home/${user_name}/${product_name}/packages/
    
    # 替换旧版basedir软链
    ## 对之前的软链进行解链
    unlink /home/${user_name}/${product_name}/packages/mysql
    ## 重新使用新版本做软链
    ln -s /home/${user_name}/${product_name}/packages/${packages_name} /home/${user_name}/${product_name}/packages/mysql
    
    # 备份数据目录
    cp -ar /home/${user_name}/${product_name}/packages/data /home/${user_name}/${product_name}/packages/data.bak_`date +%F_%H_%M_%S`
    
    # 启动并升级MySQL
    service mysql start
    /home/${user_name}/${product_name}/packages/mysql/bin/mysql_upgrade --defaults-file=/home/${user_name}/${product_name}/packages/data/conf/my.cnf -u${admin_user} -p${admin_pass}
    
    # 注释掉skip_grant_tables选项，增加sql_mode选项
    ## 注释掉skip_grant_tables选项
    sed -i 's/^\(skip_grant_tables\)/#\1/g' /home/${user_name}/${product_name}/packages/data/conf/my.cnf
    ## 添加sql_mode选项
    echo "sql_mode=${sql_mode}" >> /home/${user_name}/${product_name}/packages/data/conf/my.cnf
    
    # 重启mysql
    service mysql restart
    service mysql status

}


if [ "$operat_type" == "install" ];then
    install_mysql
elif [ "$operat_type" == "update" ];then
    update_mysql
else
    echo "未知的operat_type,脚本退出！！" | tee -a $logs
    exit 1
fi

  
echo | tee -a $logs

if [ "$SECONDS" -ge 60 ];then
    let "runtimes=${SECONDS}/60"
    echo "==============================================================`date`" |tee -a $logs
    echo 总共耗时:${runtimes}分钟  |tee -a $logs
else
    runtimes=${SECONDS}
    echo "==============================================================`date`" |tee -a $logs
    echo 总共耗时:${runtimes}秒钟  |tee -a $logs
fi
```


