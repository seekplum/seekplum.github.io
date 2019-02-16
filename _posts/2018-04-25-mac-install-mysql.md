---
layout: post
title:  mac二进制安装mysql
tags: mac mysql
thread: mysql
---

## 下载
从mysql官网下载相应版本的二进制包即可。本文以mysql-5.7.22为例，在[官网下载页](https://dev.mysql.com/downloads/file/?id=476955)确认版本后下载即可。

## 非默认路径安装

* 修改mysql.server

mysql默认的安装路径都会`/usr/local/mysql`下,若想安装到其他路径，则需要对 support-files/mysql.server 文件进行修改,总共有 4 处需要修改。

修改参考 [制作python虚拟环境包](/virtualenv)

* 修改后内容

```bash
#!/bin/sh
# Copyright Abandoned 1996 TCX DataKonsult AB & Monty Program KB & Detron HB
# This file is public domain and comes with NO WARRANTY of any kind

# MySQL daemon start/stop script.

# Usually this is put in /etc/init.d (at least on machines SYSV R4 based
# systems) and linked to /etc/rc3.d/S99mysql and /etc/rc0.d/K01mysql.
# When this is done the mysql server will be started when the machine is
# started and shut down when the systems goes down.

# Comments to support chkconfig on RedHat Linux
# chkconfig: 2345 64 36
# description: A very fast and reliable SQL database engine.

# Comments to support LSB init script conventions
### BEGIN INIT INFO
# Provides: mysql
# Required-Start: $local_fs $network $remote_fs
# Should-Start: ypbind nscd ldap ntpd xntpd
# Required-Stop: $local_fs $network $remote_fs
# Default-Start:  2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: start and stop MySQL
# Description: MySQL is a very fast and reliable SQL database engine.
### END INIT INFO

# If you install MySQL on some other places than /usr/local/mysql, then you
# have to do one of the following things for this script to work:
#
# - Run this script from within the MySQL installation directory
# - Create a /etc/my.cnf file with the following information:
#   [mysqld]
#   basedir=<path-to-mysql-installation-directory>
# - Add the above to any other configuration file (for example ~/.my.ini)
#   and copy my_print_defaults to /usr/bin
# - Add the path to the mysql-installation-directory to the basedir variable
#   below.
#
# If you want to affect other MySQL variables, you should make your changes
# in the /etc/my.cnf, ~/.my.cnf or other MySQL configuration files.

# If you change base dir, you must also change datadir. These may get
# overwritten by settings in the MySQL configuration files.

basedir=/Users/seekplum/packages/mysql
datadir=${basedir}/data

# Default value, in seconds, afterwhich the script should timeout waiting
# for server start.
# Value here is overriden by value in my.cnf.
# 0 means don't wait at all
# Negative numbers mean to wait indefinitely
service_startup_timeout=900

# Lock directory for RedHat / SuSE.
lockdir=${basedir}/lock
lock_file_path="$lockdir/mysql"

# The following variables are only set for letting mysql.server find things.

# Set some defaults
mysqld_pid_file_path=$datadir/mydata/mysql.pid
if test -z "$basedir"
then
  basedir=$basedir
  bindir=$basedir/bin
  if test -z "$datadir"
  then
    datadir=$basedir/data
  fi
  sbindir=$basedir/bin
  libexecdir=$basedir/bin
else
  bindir="$basedir/bin"
  if test -z "$datadir"
  then
    datadir="$basedir/data"
  fi
  sbindir="$basedir/sbin"
  libexecdir="$basedir/libexec"
fi

# datadir_set is used to determine if datadir was set (and so should be
# *not* set inside of the --basedir= handler.)
datadir_set=

#
# Use LSB init script functions for printing messages, if possible
#
lsb_functions="/lib/lsb/init-functions"
if test -f $lsb_functions ; then
  . $lsb_functions
else
  log_success_msg()
  {
    echo " SUCCESS! $@"
  }
  log_failure_msg()
  {
    echo " ERROR! $@"
  }
fi

PATH="/sbin:/usr/sbin:/bin:/usr/bin:$basedir/bin"
export PATH

mode=$1    # start or stop

[ $# -ge 1 ] && shift


other_args="$*"   # uncommon, but needed when called from an RPM upgrade action
           # Expected: "--skip-networking --skip-grant-tables"
           # They are not checked here, intentionally, as it is the resposibility
           # of the "spec" file author to give correct arguments only.

case `echo "testing\c"`,`echo -n testing` in
    *c*,-n*) echo_n=   echo_c=     ;;
    *c*,*)   echo_n=-n echo_c=     ;;
    *)       echo_n=   echo_c='\c' ;;
esac

parse_server_arguments() {
  for arg do
    case "$arg" in
      --basedir=*)  basedir=`echo "$arg" | sed -e 's/^[^=]*=//'`
                    bindir="$basedir/bin"
		    if test -z "$datadir_set"; then
		      datadir="$basedir/data"
		    fi
		    sbindir="$basedir/sbin"
		    libexecdir="$basedir/libexec"
        ;;
      --datadir=*)  datadir=`echo "$arg" | sed -e 's/^[^=]*=//'`
		    datadir_set=1
    ;;
      --pid-file=*) mysqld_pid_file_path=`echo "$arg" | sed -e 's/^[^=]*=//'` ;;
      --service-startup-timeout=*) service_startup_timeout=`echo "$arg" | sed -e 's/^[^=]*=//'` ;;
    esac
  done
}

wait_for_pid () {
  verb="$1"           # created | removed
  pid="$2"            # process ID of the program operating on the pid-file
  pid_file_path="$3" # path to the PID file.

  i=0
  avoid_race_condition="by checking again"

  while test $i -ne $service_startup_timeout ; do

    case "$verb" in
      'created')
        # wait for a PID-file to pop into existence.
        test -s "$pid_file_path" && i='' && break
        ;;
      'removed')
        # wait for this PID-file to disappear
        test ! -s "$pid_file_path" && i='' && break
        ;;
      *)
        echo "wait_for_pid () usage: wait_for_pid created|removed pid pid_file_path"
        exit 1
        ;;
    esac

    # if server isn't running, then pid-file will never be updated
    if test -n "$pid"; then
      if kill -0 "$pid" 2>/dev/null; then
        :  # the server still runs
      else
        # The server may have exited between the last pid-file check and now.
        if test -n "$avoid_race_condition"; then
          avoid_race_condition=""
          continue  # Check again.
        fi

        # there's nothing that will affect the file.
        log_failure_msg "The server quit without updating PID file ($pid_file_path)."
        return 1  # not waiting any more.
      fi
    fi

    echo $echo_n ".$echo_c"
    i=`expr $i + 1`
    sleep 1

  done

  if test -z "$i" ; then
    log_success_msg
    return 0
  else
    log_failure_msg
    return 1
  fi
}

# Get arguments from the my.cnf file,
# the only group, which is read from now on is [mysqld]
if test -x "$bindir/my_print_defaults";  then
  print_defaults="$bindir/my_print_defaults"
else
  # Try to find basedir in /etc/my.cnf
  conf=$datadir/conf/my.cnf
  print_defaults=
  if test -r $conf
  then
    subpat='^[^=]*basedir[^=]*=\(.*\)$'
    dirs=`sed -e "/$subpat/!d" -e 's//\1/' $conf`
    for d in $dirs
    do
      d=`echo $d | sed -e 's/[    ]//g'`
      if test -x "$d/bin/my_print_defaults"
      then
        print_defaults="$d/bin/my_print_defaults"
        break
      fi
    done
  fi

  # Hope it's in the PATH ... but I doubt it
  test -z "$print_defaults" && print_defaults="my_print_defaults"
fi

#
# Read defaults file from 'basedir'.   If there is no defaults file there
# check if it's in the old (depricated) place (datadir) and read it from there
#

extra_args=""
if test -r "$basedir/my.cnf"
then
  extra_args="-e $basedir/my.cnf"
fi

parse_server_arguments `$print_defaults $extra_args mysqld server mysql_server mysql.server`

#
# Set pid file if not given
#
if test -z "$mysqld_pid_file_path"
then
  mysqld_pid_file_path=$datadir/`hostname`.pid
else
  case "$mysqld_pid_file_path" in
    /* ) ;;
    * )  mysqld_pid_file_path="$datadir/$mysqld_pid_file_path" ;;
  esac
fi

case "$mode" in
  'start')
    # Start daemon

    # Safeguard (relative paths, core dumps..)
    cd $basedir

    echo $echo_n "Starting MySQL"
    if test -x $bindir/mysqld_safe
    then
      # Give extra arguments to mysqld with the my.cnf file. This script
      # may be overwritten at next upgrade.
      # $bindir/mysqld_safe --datadir="$datadir" --pid-file="$mysqld_pid_file_path" $other_args >/dev/null &
      $bindir/mysqld_safe --defaults-file=$datadir/conf/my.cnf --user=mysql >/dev/null &
      wait_for_pid created "$!" "$mysqld_pid_file_path"; return_value=$?

      # Make lock for RedHat / SuSE
      if test -w "$lockdir"
      then
        touch "$lock_file_path"
      fi

      exit $return_value
    else
      log_failure_msg "Couldn't find MySQL server ($bindir/mysqld_safe)"
    fi
    ;;

  'stop')
    # Stop daemon. We use a signal here to avoid having to know the
    # root password.

    if test -s "$mysqld_pid_file_path"
    then
      # signal mysqld_safe that it needs to stop
      touch "$mysqld_pid_file_path.shutdown"

      mysqld_pid=`cat "$mysqld_pid_file_path"`

      if (kill -0 $mysqld_pid 2>/dev/null)
      then
        echo $echo_n "Shutting down MySQL"
        kill $mysqld_pid
        # mysqld should remove the pid file when it exits, so wait for it.
        wait_for_pid removed "$mysqld_pid" "$mysqld_pid_file_path"; return_value=$?
      else
        log_failure_msg "MySQL server process #$mysqld_pid is not running!"
        rm "$mysqld_pid_file_path"
      fi

      # Delete lock for RedHat / SuSE
      if test -f "$lock_file_path"
      then
        rm -f "$lock_file_path"
      fi
      exit $return_value
    else
      log_failure_msg "MySQL server PID file could not be found!"
    fi
    ;;

  'restart')
    # Stop the service and regardless of whether it was
    # running or not, start it again.
    if $0 stop  $other_args; then
      $0 start $other_args
    else
      log_failure_msg "Failed to stop running server, so refusing to try to start."
      exit 1
    fi
    ;;

  'reload'|'force-reload')
    if test -s "$mysqld_pid_file_path" ; then
      read mysqld_pid <  "$mysqld_pid_file_path"
      kill -HUP $mysqld_pid && log_success_msg "Reloading service MySQL"
      touch "$mysqld_pid_file_path"
    else
      log_failure_msg "MySQL PID file could not be found!"
      exit 1
    fi
    ;;
  'status')
    # First, check to see if pid file exists
    if test -s "$mysqld_pid_file_path" ; then
      read mysqld_pid < "$mysqld_pid_file_path"
      if kill -0 $mysqld_pid 2>/dev/null ; then
        log_success_msg "MySQL running ($mysqld_pid)"
        exit 0
      else
        log_failure_msg "MySQL is not running, but PID file exists"
        exit 1
      fi
    else
      # Try to find appropriate mysqld process
      mysqld_pid=`pgrep -d' ' -f $libexecdir/mysqld`

      # test if multiple pids exist
      pid_count=`echo $mysqld_pid | wc -w`
      if test $pid_count -gt 1 ; then
        log_failure_msg "Multiple MySQL running but PID file could not be found ($mysqld_pid)"
        exit 5
      elif test -z $mysqld_pid ; then
        if test -f "$lock_file_path" ; then
          log_failure_msg "MySQL is not running, but lock file ($lock_file_path) exists"
          exit 2
        fi
        log_failure_msg "MySQL is not running"
        exit 3
      else
        log_failure_msg "MySQL is running but PID file could not be found"
        exit 4
      fi
    fi
    ;;
    *)
      # usage
      basename=`basename "$0"`
      echo "Usage: $basename  {start|stop|restart|reload|force-reload|status}  [ MySQL server options ]"
      exit 1
    ;;
esac

exit 0
```


## 自动化安装脚本

* install_mysql.sh 脚本内容

```bash
#!/bin/bash
user_name=seekplum
user_group=staff

packages_name=mysql-5.7.22-macos10.13-x86_64
packages_dir=/Users/$user_name/packages
source_mysql_dir=$packages_dir/$packages_name
link_mysql_dir=$packages_dir/mysql
mysql_data=$packages_dir/mysql/data
new_mysql_server=$packages_dir/mysql.server

logs=/tmp/summary.log

# ulimit -SHn 300000
rm -f $logs
touch $logs

# 检查安装包是否存在
# if [ ! -f "${source_mysql_dir}.tar.gz" -a ! -f "${source_mysql_dir}.tar" ];then
#    echo "未发现二进制安装包${source_mysql_dir}.tar.gz 或 ${source_mysql_dir}.tar,脚本退出！！" |tee -a $logs
#    exit 1
# fi

# 检查安装目录是否存在
if [ ! -d "$source_mysql_dir" ];then
    echo "未发现安装包${source_mysql_dir}，脚本退出！！" |tee -a $logs
    exit 1
fi

# 检查mysql.server是否存在
if [ ! -f "$new_mysql_server" ];then
    echo "未发现二进制${new_mysql_server}，脚本退出！！" |tee -a $logs
    exit 1
fi

# 安装MySQL
install_mysql() {
    # kill mysql进程
    pkill -9 mysql
    pkill -9 mysqld
    pkill -9 mysqld_safe

    # 对之前的mysql进行解链
    if [ -L $link_mysql_dir ];then
        unlink $link_mysql_dir
    fi

    # echo 如果mysql目录不是一个链接,而是一个目录,则先进行备份,然后再删除
    # [ -d $link_mysql_dir ] && cp -ar $link_mysql_dir $link_mysql_dir.bak_`date +%F_%H_%M_%S`

    # 删除旧的mysql
    rm -rf $link_mysql_dir
    ln -s $source_mysql_dir $link_mysql_dir

    # 创建相关目录
    rm -rf $mysql_data/*
    mkdir -p $mysql_data/{innodb_log,innodb_ts,log,mydata,relaylog,slowlog,sock,tmpdir,undo,conf}
    touch $mysql_data/log/error.log
    echo -e "create mysql error.log"

    # mysql.server 会和conf配置有关，需要手动修改
    scp $new_mysql_server $source_mysql_dir/support-files/

    # 设置开机自启动
    # rm -f /etc/init.d/mysql
    # cp $link_mysql_dir/support-files/mysql.server /etc/init.d/mysql
    # chmod +x /etc/init.d/mysql
    # chkconfig --add mysql
    # chkconfig --level 2345 mysql on
    # echo -e "set mysql autostart"

    # 设置mysql动态连接 |tee -a $logs
    # echo $link_mysql_dir/lib > /etc/ld.so.conf.d/mysql.conf
    # ldconfig

    # 生成配置文件 |tee -a $logs
    # 查询内存大小
    # let "_buffer_pool_size=$(free -g |grep Mem |awk '{print $2}') * 1000 / 100 * 40"
    let "_buffer_pool_size=16 * 1000 / 100 * 40"
    let "_buffer_pool_size=($_buffer_pool_size / 128 + 1)*128"
    # echo -e "set mysql _buffer_pool_size" |tee -a $logs

    # 截取ip的最后一位
    last=`ifconfig | grep -v "127.0.0.1" | awk '/inet /{print $2}'| head -1 | awk -F. '{print $NF}'`  # 注意端口号
    let "serverid=${last}+3306"

    cat > $mysql_data/conf/my.cnf  << EOF
[client]
loose_default-character-set = utf8
port = 3306
socket = $mysql_data/sock/mysql.sock
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
socket = $mysql_data/sock/mysql.sock
pid-file = $mysql_data/mydata/mysql.pid
datadir = $mysql_data/mydata
basedir = $packages_dir/mysql
tmpdir = $mysql_data/tmpdir
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
log-error = $mysql_data/log/error.log
log-bin = mysql-bin
long_query_time = 1
slow_query_log
slow_query_log_file = $mysql_data/slowlog/slow-query.log
log_warnings
log_slow_slave_statements
server_id = ${serverid}
binlog-checksum = CRC32
binlog-rows-query-log-events = 1
binlog_max_flush_queue_time = 1000
max_binlog_size = 512M
sync_binlog = 1
master-verify-checksum = 1
master-info-repository = TABLE
auto_increment_increment = 2
relay-log = $mysql_data/relaylog/relay_bin
relay-log-info-repository = TABLE
relay-log-recovery = 1
slave-sql-verify-checksum = 1
log_slave_updates = 1
slave-net-timeout = 10
key_buffer_size = 8M
bulk_insert_buffer_size = 8M
myisam_sort_buffer_size = 64M
myisam_max_sort_file_size = 10G
myisam_repair_threads = 1
myisam_recover_options = force
innodb_data_home_dir = $mysql_data/innodb_ts
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
innodb_log_group_home_dir = $mysql_data/innodb_log
innodb_log_buffer_size = 128M
innodb_log_file_size = 2G
innodb_log_files_in_group = 2
innodb_flush_log_at_trx_commit = 1
innodb_fast_shutdown = 1
innodb_support_xa = ON
innodb_thread_concurrency = 64
innodb_lock_wait_timeout = 120
innodb_rollback_on_timeout = 1
performance_schema = on
innodb_read_io_threads = 8
innodb_write_io_threads = 16
innodb_io_capacity = 20000
innodb_use_native_aio = 1
innodb_undo_directory = $mysql_data/undo
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
slave_preserve_commit_order = ON
slave_parallel_workers = 8
slave_parallel_type = LOGICAL_CLOCK
transaction_isolation = READ-COMMITTED
binlog-format = ROW
log_bin_trust_function_creators = 1
expire_logs_days = 15
innodb_page_cleaners = 4
auto_increment_offset=1
EOF


    # echo 对配置文件做软链 |tee -a $logs
    # unlink /etc/my.cnf &> /dev/null
    # [ $? -ne 0 ] && rm -f /etc/my.cnf
    # ln -s $mysql_data/conf/my.cnf  /etc/my.cnf

    # 修改文件夹权限为我们创建的MySQL用户 |tee -a $logs
    # chown -R ${user_name}:$user_group $link_mysql_dir
    chmod -R 755 $link_mysql_dir

    # 创建用户
    # $link_mysql_dir/bin/mysql_install_db --defaults-file=$mysql_data/conf/my.cnf --basedir=$link_mysql_dir --datadir=$mysql_data/mydata --user=mysql

    echo ======  init mysql...
    # $link_mysql_dir/bin/mysqld  --defaults-file=$mysql_data/conf/my.cnf --initialize-insecure --basedir=$link_mysql_dir --datadir=$mysql_data/mydata --user=mysql
    $link_mysql_dir/bin/mysqld --defaults-file=$mysql_data/conf/my.cnf  --initialize --user=mysql
    $link_mysql_dir/bin/mysql_ssl_rsa_setup --defaults-file=$mysql_data/conf/my.cnf
    # $link_mysql_dir/bin/mysqld_safe --defaults-file=$mysql_data/conf/my.cnf --user=mysql

    # 拷贝二进制文件
    # cp $packages_dir/mysql/bin/mysql /usr/local/bin/
}

install_mysql
echo | tee -a $logs

if [ "$SECONDS" -ge 60 ];then
    let "runtimes=${SECONDS}/60"
    echo -e "install_time consuming:${runtimes}min" |tee -a $logs
    echo "==============================================================`date`" |tee -a $logs

else
    runtimes=${SECONDS}
    echo -e "install_time consuming:${runtimes}s" |tee -a $logs
    echo "==============================================================`date`" |tee -a $logs
fi
```

## 安装

* 安装前准备目录如下

```text
.
├── install_mysql.sh
├── mysql-5.7.22-macos10.13-x86_64
├── mysql.server
```

* 执行安装操作

> bash install_mysql.sh

## 解决连接报错
> ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: NO)

1.首先在设置中关闭mysql服务

> /Users/seekplum/packages/mysql/support-files/mysql.server stop

> ps axu \| grep mysql \| grep -v \"grep\" \| awk \'{print $2}\' \| xargs kill -9

2.进入安全模式

> /Users/seekplum/packages/mysql/bin/mysqld_safe \-\-defaults-file=/Users/seekplum/packages/mysql/data/conf/my.cnf \-\-skip-grant-tables &

3.进入mysql,执行以下命令

root连接时无密码

> /Users/seekplum/packages/mysql/bin/mysql -uroot -S /Users/seekplum/packages/mysql/data/sock/mysql.sock

设置新密码

> update mysql.user set authentication_string=PASSWORD(\'root\') where user=\'root\';

> flush privileges;

> quit

4.关闭第二步起的mysql

> ps axu \| grep mysql \| grep -v grep \| awk \'{print $2}\' \| xargs kill -9

5.重启服务后重置密码

> /Users/seekplum/packages/mysql/support-files/mysql.server start

> /Users/seekplum/packages/mysql/bin/mysql -uroot -proot -S /Users/seekplum/packages/mysql/data/sock/mysql.sock

重置密码

> set password = password(\'root\');
