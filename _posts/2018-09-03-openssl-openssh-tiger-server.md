---
layout: post
title: 源码安装openssl/openssh/tiger-server
categories: linux
tags: openssl openssh tiger-server
thread: linux
---
## openssl

* 1.[下载源码包](https://github.com/openssl/openssl/releases)
* 2.解压tar包
* 3.进入目录

开始配置安装环境、编译并安装

> ./config && make && make install

* 4.设置lib库软链

```
ln -s /usr/local/lib64/libssl.so.1.1 /usr/lib64/libssl.so.1.1
ln -s /usr/local/lib64/libcrypto.so.1.1 /usr/lib64/libcrypto.so.1.1
```

## tiger-server

* 1.[源码包地址](https://github.com/TigerVNC/tigervnc)
* 2.[rpm包地址](https://centos.pkgs.org/6/centos-x86_64/tigervnc-server-1.1.0-24.el6.x86_64.rpm.html)
* 3.[rpm依赖包地址](https://centos.pkgs.org/6/centos-x86_64/libxshmfence-1.2-1.el6.x86_64.rpm.html)
* 4.卸载之前的包

> rpm -qa \| grep -i tigervnc \| xargs rpm -e

* 5.安装依赖包

> rpm -ivh libxshmfence-1.2-1.el6.x86_64.rpm

* 6.安装新的rpm包

> rpm -ivh tigervnc-server-1.1.0-24.el6.x86_64.rpm

## openssh
在升级openssl后，openssh已经跟着升级了，不需要再去下载[openssh源码包](https://github.com/openssh/openssh-portable)升级。

### 自动升级脚本
```bash
#!/bin/bash
clear

set -o nounset                              # Treat unset variables as an error

####### 通用代码 #######

#脚本变量
#编译升级更新版本的源码包，可以根据软件官网版本号修改xx_version；
date=`date "+%Y%m%d"`
zlib_version="zlib-1.2.11"
dropbear_version="dropbear-2018.76"
openssl_version="openssl-1.0.2j"
openssh_version="openssh-7.4p1"
yum_repos_download="http://10.156.242.54:5080/u01/update_ssh/CentOS-Base.repo"
zlib_download="http://10.156.242.54:5080/u01/update_ssh/$zlib_version.tar.gz"
dropbear_download="http://10.156.242.54:5080/u01/update_ssh/$dropbear_version.tar.bz2"
openssl_download="http://10.156.242.54:5080/u01/update_ssh/$openssl_version.tar.gz"
openssh_download="http://10.156.242.54:5080/u01/update_ssh/$openssh_version.tar.gz"
system_version=`cat /etc/redhat-release`
rhel4_version=`cat /etc/redhat-release |grep "release 4"|wc -l`
rhel5_version=`cat /etc/redhat-release |grep "release 5"|wc -l`
rhel6_version=`cat /etc/redhat-release |grep "release 6"|wc -l`
rhel7_version=`cat /etc/redhat-release |grep "release 7"|wc -l`
gcc_intall_status==`rpm -qa | grep gcc | wc -l`
gcc_c_intall_status==`rpm -qa | grep gcc-c++ | wc -l`
pam_devel_intall_status==`rpm -qa | grep pam-devel | wc -l`
openssl_rpm_status=`rpm -qa | grep openssl | wc -l`
openssh_rpm_status=`rpm -qa | grep openssh | wc -l`
telnet_rpm_status=`rpm -qa | grep telnet-server | wc -l`
openssh_running_status=`ps aux | grep sshd | grep -v grep |wc -l`
dropbear_running_status=`netstat -tunlp | egrep "0:6666" | wc -l`
telnet_running_status=`netstat -tunlp | egrep "0:23" | wc -l`

#使用说明
echo -e "\033[33m#############一键升级OpenSSL+OpenSSH说明################\033[0m"
echo ""
echo "A.一键升级脚本仅适用于RHEL/CentOS操作系统，支持4.x、5.x、6.x、7.x各系统版本；"
echo "B.必须切换为Root管理员用户运行脚本，并且确保本地或者网络yum软件源可以正常使用；"
echo "C.RHEL/CentOS4.x-5.x操作系统会临时安装Telnet，通信端口为23，升级结束后会引导卸载；"
echo "D.RHEL/CentOS6.x-7.x操作系统会临时安装DropBear，通信端口为2222，升级结束后会引导卸载；"
echo "E.本机旧版本的OpenSSL、OpenSSH、Lib库文件全部备份在/tmp/backup_$date文件夹。"
echo "F.RHEL/CentOSL4.x-5.x操作系统阿里云yum源已下架需要使用官网源，服务器需要有外网访问权限。由于国外源网络不稳定可能需要多次执行"
echo ""

#判断操作系统
echo "当前本机操作系统版本："$system_version
echo ""

#最新软件版本
echo "本次更新OPENSSH软件版本："$openssl_version、$openssh_version
echo ""

#检查当前用户是否为root
if [ $(id -u) != "0" ]; then
    echo "当前用户为普通用户，必须使用root用户运行脚本，五秒后自动退出。"
    echo ""
    sleep 5
    exit
fi

#禁用SElinux
setenforce 0 > /dev/null 2>&1

#禁用防火墙
service iptables stop > /dev/null 2>&1
service ip6tables stop > /dev/null 2>&1

####### 通用代码 #######


####### 升级软件 #######

#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  centos-repo-update
#   DESCRIPTION:  RHEL/CentOSL4.x-5.x替换yum
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function centos-repo-update() {
    if [ $rhel4_version == 1 ] || [ $rhel5_version == 1 ];then
        mkdir /opt/centos-yum-$date.bak
        mv /etc/yum.repos.d/* /opt/centos-yum-$date.bak
        cd /etc/yum.repos.d/
        wget --no-check-certificate $yum_repos_download > /dev/null 2>&1
        yum clean all
        yum makecache
    fi
}
# ----------  end of function centos-repo-update  ----------

#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  openssh-update-prepare
#   DESCRIPTION:  获取升级需要的源码包并准备好编译所需基础环境
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function openssh-update-prepare() {
    #解压软件源码包
    basepath=$(cd `dirname $0`; pwd)
    echo -e "wget源码包到临时目录"
    /bin/cp  -r -f   $basepath/*  /tmp/
    cd /tmp
    wget --no-check-certificate $zlib_download > /dev/null 2>&1
    wget --no-check-certificate $dropbear_download > /dev/null 2>&1
    wget --no-check-certificate $openssl_download > /dev/null 2>&1
    wget --no-check-certificate $openssh_download > /dev/null 2>&1
    echo -e "开始解压源码包................"
    tar xzf $zlib_version.tar.gz
    tar xjf $dropbear_version.tar.bz2
    tar xzf $openssh_version.tar.gz
    tar xzf $openssl_version.tar.gz
    if [ -e /tmp/$zlib_version ] && [ -e /tmp/$dropbear_version ] && [ -e /tmp/$openssh_version ] && [ -e /tmp/$openssl_version ];then
        echo -e "解压软件源码包成功" "\033[32m Success\033[0m"
    else
        echo -e "解压软件源码包失败，五秒后自动退出脚本" "\033[31m Failure\033[0m"
        echo ""
        sleep 5
        exit
    fi
    echo ""
    
    #安装软件依赖包
    echo -e "安装软件依赖包gcc gcc-c++ pam-devel.........."
    echo ""
    yum -y install gcc gcc-c++ pam-devel > /dev/null 2>&1
    cd /tmp
    tar xzf $zlib_version.tar.gz
    cd /tmp/$zlib_version
    ./configure --shared > /dev/null 2>&1
    make > /dev/null 2>&1
    make install > /dev/null 2>&1
    if [ $gcc_intall_status != 0 ] && [ $gcc_c_intall_status != 0 ] && [ $pam_devel_intall_status != 0 ] && [ -e /usr/local/lib/libz.so ];then
        echo -e "安装软件依赖包成功" "\033[32m Success\033[0m"
    else
        echo -e "安装软件依赖包失败，五秒后自动退出脚本" "\033[31m Failure\033[0m"
        echo ""
        sleep 5
        exit
    fi
    
    #临时安装远程软件
    if [ $rhel4_version == 1 ] || [ $rhel5_version == 1 ];then
        echo -e "为RHEL/CENTOS 4.x、5.x 安装telnet软件.............."
        yum -y install telnet-server xinetd > /dev/null 2>&1
        sed -i '/disable/d' /etc/xinetd.d/telnet
        sed -i '/log_on_failure/a disable  = no' /etc/xinetd.d/telnet
        sed -i '/disable/d' /etc/xinetd.d/telnet
        sed -i '/log_on_failure/a disable  = no' /etc/xinetd.d/krb5-telnet
        mv /etc/securetty /etc/securetty.bak
        service xinetd restart > /dev/null 2>&1
        echo -e "启动Telnet服务成功" "\033[32m Success\033[0m"
        echo ""
    fi
    
    if [ $rhel6_version == 1 ] || [ $rhel7_version == 1 ];then
        echo -e "为RHEL/CENTOS 6.x、7.x 安装dropbear软件.............."
        cd /tmp
        tar xjf $dropbear_version.tar.bz2
        cd $dropbear_version
        ./configure > /dev/null 2>&1
        make > /dev/null 2>&1
        make install > /dev/null 2>&1
        mkdir /etc/dropbear
        /usr/local/bin/dropbearkey -t dss -f /etc/dropbear/dropbear_dss_host_key > /dev/null 2>&1
        /usr/local/bin/dropbearkey -t rsa -s 4096 -f /etc/dropbear/dropbear_rsa_host_key > /dev/null 2>&1
        /usr/local/sbin/dropbear -p 2222 > /dev/null 2>&1
        echo -e "启动DropBear服务成功" "\033[32m Success\033[0m"
        echo ""
    fi
}
# ----------  end of function openssh-update-prepare  ----------

#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  openssh-update-backup
#   DESCRIPTION:  备份旧版本lib。openssh\openssl
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function openssh-update-backup() {
    #备份旧版本lib
    echo -e "开始备份旧版本lib..........."
    service sshd stop > /dev/null 2>&1
    mkdir /tmp/backup_$date
    if [ $(getconf WORD_BIT) = '32' ] && [ $(getconf LONG_BIT) = '64' ] ; then
        ls /lib > /tmp/backup_$date/old_lib_list.txt
        ls /lib64 > /tmp/backup_$date/old_lib64_list.txt
        tar czf /tmp/backup_$date/lib_backup.tar.gz /lib > /dev/null 2>&1
        tar czf /tmp/backup_$date/lib64_backup.tar.gz /lib64 > /dev/null 2>&1
    else
        ls /lib > /tmp/backup_$date/old_lib_list.txt
        tar czf /tmp/backup_$date/lib_backup.tar.gz /lib > /dev/null 2>&1
    fi
    echo ""
    
    #备份旧版本openssl
    echo -e "开始备份旧版本openssl............"
    if  [ $openssl_rpm_status != 0 ];then
        rpm -ql `rpm -qa | egrep openssl` > /tmp/backup_$date/old_openssl_list.txt
        tar czf /tmp/backup_$date/openssl_backup.tar.gz -T /tmp/backup_$date/old_openssl_list.txt > /dev/null 2>&1
    else
        find / -name '*ssl*' > /tmp/backup_$date/old_openssl_list.txt
        tar czf /tmp/backup_$date/openssl_backup.tar.gz -T /tmp/backup_$date/old_openssl_list.txt > /dev/null 2>&1
    fi
    echo ""
    
    #备份旧版本openssh
    echo -e "开始备份旧版本openssh............."
    if [ $openssh_rpm_status != 0 ];then
        rpm -ql `rpm -qa | egrep openssh` > /tmp/backup_$date/old_openssh_list.txt
        tar czf /tmp/backup_$date/openssh_backup.tar.gz -T /tmp/backup_$date/old_openssh_list.txt > /dev/null 2>&1
    else
        find / -name '*ssh*' > /tmp/backup_$date/old_openssh_list.txt
        tar czf /tmp/backup_$date/openssh_backup.tar.gz -T /tmp/backup_$date/old_openssh_list.txt > /dev/null 2>&1
    fi
    echo ""
    
    #检查备份结果
    if [ $(getconf WORD_BIT) = '32' ] && [ $(getconf LONG_BIT) = '64' ] && [ -e /tmp/backup_$date/lib_backup.tar.gz ] && [ -e /tmp/backup_$date/lib64_backup.tar.gz ] && [ -e /tmp/backup_$date/openssl_backup.tar.gz ] && [ -e /tmp/backup_$date/openssh_backup.tar.gz ];then
        echo -e "备份旧版本程序成功" "\033[32m Success\033[0m"
    fi
    if [ $(getconf WORD_BIT) = '32' ] && [ $(getconf LONG_BIT) = '32' ] && [ -e /tmp/backup_$date/lib_backup.tar.gz ] && [ -e /tmp/backup_$date/openssl_backup.tar.gz ] && [ -e /tmp/backup_$date/openssh_backup.tar.gz ];then
        echo -e "备份旧版本程序成功" "\033[32m Success\033[0m"
    fi
    echo ""
}
# ----------  end of function openssh-update-backup  ----------
#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  openssh-backup-recovery
#   DESCRIPTION:  编译安装异常时使用备份回退到原版本
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function openssh-backup-recovery() {
    #恢复旧版本lib
    if [ $(getconf WORD_BIT) = '32' ] && [ $(getconf LONG_BIT) = '64' ] ; then
        cd /
        tar xzf /tmp/backup_$date/lib_backup.tar.gz  > /dev/null 2>&1
        tar xzf /tmp/backup_$date/lib64_backup.tar.gz  > /dev/null 2>&1
    else
        cd /
        tar xzf /tmp/backup_$date/lib_backup.tar.gz /lib > /dev/null 2>&1
    fi
    #恢复旧版本openssl
    if  [ $openssl_rpm_status != 0 ];then
        tar xzf /tmp/backup_$date/openssl_backup.tar.gz  > /dev/null 2>&1
    else
        tar xzf /tmp/backup_$date/openssl_backup.tar.gz  > /dev/null 2>&1
    fi
    
    #恢复旧版本openssh
    if [ $openssh_rpm_status != 0 ];then
        tar xzf /tmp/backup_$date/openssh_backup.tar.gz  > /dev/null 2>&1
    else
        tar xzf /tmp/backup_$date/openssh_backup.tar.gz  > /dev/null 2>&1
    fi
    service sshd start > /dev/null 2>&1
}
# ----------  end of function openssh-backup-recovery  ----------

#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  unload-old-openssh
#   DESCRIPTION:  卸载旧版本openssl,openssh
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function unload-old-openssh() {
    #卸载旧版本openssl
    echo -e "开始卸载旧版本openssl............"
    if [ -e /usr/bin/openssl ];then
        mv /usr/bin/openssl /usr/bin/openssl.bak_$date
    fi
    if [ -e /usr/lib/openssl ];then
        mv /usr/lib/openssl /usr/lib/openssl.bak_$date
    fi
    if [ -e /usr/lib64/openssl ];then
        mv /usr/lib64/openssl /usr/lib64/openssl.bak_$date
    fi
    echo ""
    #卸载旧版本openssh
    echo -e "开始卸载旧版本openssh............"
    if  [ $openssh_rpm_status -ne 0 ];then
        rpm -e `rpm -qa | grep openssh` --nodeps  --allmatches > /dev/null 2>&1
    else
        mv /usr/bin/scp /usr/bin/scp.bak_$date > /dev/null 2>&1
        mv /usr/bin/sftp /usr/bin/sftp.bak_$date > /dev/null 2>&1
        mv /usr/bin/ssh /usr/bin/ssh.bak_$date > /dev/null 2>&1
        mv /usr/bin/ssh-keyscan /usr/bin/ssh-keyscan.bak_$date > /dev/null 2>&1
        mv /usr/bin/ssh-add /usr/bin/ssh-add.bak_$date > /dev/null 2>&1
        mv /usr/bin/ssh-keygen /usr/bin/ssh-keygen.bak_$date > /dev/null 2>&1
        mv /usr/bin/ssh-agent /usr/bin/ssh-agent.bak_$date > /dev/null 2>&1
        mv /usr/libexec/ssh-pkcs11-helper /usr/libexec/ssh-pkcs11-helper.bak_$date > /dev/null 2>&1
        mv /usr/libexec/ssh-keysign /usr/libexec/ssh-keysign.bak_$date > /dev/null 2>&1
        mv /usr/libexec/sftp-server /usr/libexec/sftp-server.bak_$date > /dev/null 2>&1
        mv /usr/sbin/sshd /usr/sbin/sshd.bak_$date > /dev/null 2>&1
        mv /etc/ssh /etc/ssh.bak_$date > /dev/null 2>&1
        mv /etc/init.d/sshd /etc/init.d/sshd.bak_$date > /dev/null 2>&1
    fi
    echo ""
    #检查卸载结果
    if [ $openssh_rpm_status -ne 0 ] && [ -e /usr/bin/openssl.bak ];then
        echo -e "卸载旧版本程序失败" "\033[31m Failure\033[0m"
    else
        echo -e "卸载旧版本程序成功" "\033[32m Success\033[0m"
    fi
    echo ""
}
# ----------  end of function unload-old-openssh  ----------

#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  install-openssh
#   DESCRIPTION:  编译安装openssl和openssh
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function install-openssh() {
    #编译安装OpenSSL
    echo -e "开始编译安装OpenSSL.........."
    cd /tmp
    tar xzf $openssl_version.tar.gz
    cd $openssl_version
    ./config -fPIC --prefix=/usr enable-shared > /dev/null 2>&1
    if [ $? -eq 0 ];then
        make > /dev/null 2>&1
        make install > /dev/null 2>&1
    else
        echo -e "编译安装OpenSSL失败，开始还原并自动退出脚本" "\033[31m Failure\033[0m"
        echo ""
        openssh-backup-recovery
        sleep 5
        exit
    fi
    if [ -e /usr/bin/openssl ];then
        echo -e "编译安装OpenSSL成功" "\033[32m Success\033[0m"
    fi
    echo ""
    
    #编译安装OpenSSH
    echo -e "开始编译安装OpenSSH.........."
    cd /tmp
    tar xzf $openssh_version.tar.gz
    cd $openssh_version
    ./configure --prefix=/usr --sysconfdir=/etc/ssh --with-pam --with-zlib --with-md5-passwords --with-ssl-engine --disable-etc-default-login > /dev/null 2>&1
    if [ $? -eq 0 ];then
        make > /dev/null 2>&1
        make install > /dev/null 2>&1
    else
        echo -e "编译安装OpenSSH失败，开始还原并自动退出脚本" "\033[31m Failure\033[0m"
        echo ""
        openssh-backup-recovery
        sleep 5
        exit
    fi
    if [ -e /usr/sbin/sshd ];then
        echo -e "编译安装OpenSSH成功" "\033[32m Success\033[0m"
    fi
    echo ""
    
    #启动OpenSSH
    echo -e "启动OpenSSH........."
    cp -rf /tmp/$openssh_version/contrib/redhat/sshd.init /etc/init.d/sshd
    cp -rf /tmp/$openssh_version/contrib/redhat/sshd.pam /etc/pam.d/sshd
    chmod +x /etc/init.d/sshd
    chkconfig --add sshd
    #sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
    echo -e "PermitRootLogin yes" >>/etc/ssh/sshd_config
    if [ $rhel7_version == 1 ];then
        chmod 600 /etc/ssh/ssh_host_rsa_key
        chmod 600 /etc/ssh/ssh_host_ecdsa_key
        chmod 600 /etc/ssh/ssh_host_ed25519_key
    fi
    service sshd start > /dev/null 2>&1
    if [ $openssh_running_status -ne 0 ];then
        echo -e "启动OpenSSH服务成功" "\033[32m Success\033[0m"
    else
        echo -e "启动OpenSSH服务失败，开始还原并自动退出脚本" "\033[31m Failure\033[0m"
        sleep 5
        openssh-backup-recovery
        exit
    fi
    echo ""
}
# ----------  end of function install-openssh  ----------


#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  clear-openssh-update-tmpfile
#   DESCRIPTION:  清理升级过程中的临时源码包，并根据操作系统版本卸载备用远程连接工具
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function clear-openssh-update-tmpfile() {
    #删除软件源码包
    echo -e "开始删除源码包..........."
    rm -rf /tmp/$openssh_version
    rm -rf /tmp/$openssl_version
    rm -rf /tmp/$zlib_version
    rm -rf /tmp/$dropbear_version
    rm -rf /tmp/$openssh_version.tar.gz
    rm -rf /tmp/$openssl_version.tar.gz
    rm -rf /tmp/$zlib_version.tar.gz
    rm -rf /tmp/$dropbear_version.tar.bz2
    if [ -e /tmp/$openssh_version ] && [ -e /tmp/$openssl_version ] && [ -e /tmp/$openssl_version ] && [ -e /tmp/$zlib_version ] && [ -e /tmp/$openssh_version.tar.gz ] && [ -e /tmp/$openssl_version.tar.gz ] && [ -e /tmp/$zlib_version.tar.gz ] && [ -e /tmp/$dropbear_version.tar.gz ];then
        echo -e "删除软件源码包失败" "\033[31m Failure\033[0m"
    else
        echo -e "删除软件源码包成功" "\033[32m Success\033[0m"
    fi
    echo ""
    
    #引导卸载telnet
    if [ $rhel4_version == 1 ] || [ $rhel5_version == 1 ];then
        echo -e "\033[33m为防止OpenSSH升级失败导致无法远程登录，脚本已临时安装Telnet\033[0m"
        echo ""
        echo -e "\033[33mOpenSSH升级完成后，建议登录测试，确保没有问题后可卸载Telnet\033[0m"
        echo ""
        echo "1: 卸载Telnet"
        echo ""
        echo "2: 退出脚本"
        echo ""
        read -p  "请输入对应数字后按回车键: " uninstall
        if [ "$uninstall" == "1" ];then
            clear
            echo -e "\033[33m开始卸载Telnet\033[0m"
            echo ""
            yum -y remove telnet-server > /dev/null 2>&1
            service xinetd stop > /dev/null 2>&1
            mv /etc/securetty.bak /etc/securetty
            echo -e "卸载Telnet成功" "\033[32m Success\033[0m"
        else
            exit
        fi
    fi
    
    #引导卸载dropbear
    if [ $rhel6_version == 1 ] || [ $rhel7_version == 1 ];then
        echo -e "\033[33m为防止OpenSSH升级失败导致无法远程登录，脚本已临时安装DropBear\033[0m"
        echo ""
        echo -e "\033[33mOpenSSH升级完成后，建议登录测试，确保没有问题后可卸载DropBear\033[0m"
        echo ""
        echo "1: 卸载DropBear"
        echo ""
        echo "2: 退出脚本"
        echo ""
        read -p  "请输入对应数字后按回车键: " uninstall
        if [ "$uninstall" == "1" ];then
            clear
            echo -e "\033[33m开始卸载DropBear\033[0m"
            echo ""
            ps aux | grep dropbear | grep -v grep | awk '{print $2}' | xargs kill -9
            find /usr/local/ -name dropbear* | xargs rm -rf
            rm -rf /etc/dropbear
            rm -rf /var/run/dropbear.pid
            echo -e "卸载DropBear成功" "\033[32m Success\033[0m"
        fi
    fi
    echo ""
}
# ----------  end of function clear-openssh-update-tmpfile  ----------

#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  update
#   DESCRIPTION:  升级脚本主程序，通过调用其他函数完成OPENSSH的升级
#    PARAMETERS:  Null
#-------------------------------------------------------------------------------
function update() {
    echo -e "\033[33m开始升级OpenSSL、OpenSSH\033[0m"
    echo ""
    if [ $rhel7_version == 1 ] ;then
        yum update openssl -y
        yum update openssh -y
    else
        centos-repo-update
        #安装准备
        openssh-update-prepare
        #安装前备份
        openssh-update-backup
        #卸载旧的openssh
        unload-old-openssh
        #安装并启动新的openssh
        install-openssh
        #清理临时文件
        clear-openssh-update-tmpfile
    fi
    #升级完成
    echo -e "\033[33mOpenSSH、OpenSSL升级成功，软件版本如下：\033[0m"
    echo "openssl version"
    openssl version
    echo ""
    ssh -V
    echo "openssh version"
}
# ----------  end of function update  ----------
####### 升级软件 #######


####### 脚本菜单 #######
echo -e "\033[36m1: 升级软件\033[0m"
echo ""
echo -e "\033[36m2: 退出脚本\033[0m"
echo ""
read -p  "请输入对应数字后按回车开始执行脚本: " install
if [ "$install" == "1" ];then
    clear
    update
else
    echo ""
    exit
fi
####### 脚本菜单 #######

```
