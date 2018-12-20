---
layout: post
title:  mac 安装 oracle 客户端
tags: mac oracle oracle_exporter
thread: oracle
---
## 环境
* OS: macOS 10.13.4 (17E202)
* 内核: Darwin xxx 17.5.0 Darwin Kernel Version 17.5.0: Fri Apr 13 19:32:32 PDT 2018; root:xnu-4570.51.2~1/RELEASE_X86_64 x86_64

## 下载
[官方下载地址](https://www.oracle.com/technetwork/topics/intel-macsoft-096467.html)，需要下载两个包

* instantclient-basic-macos.x64-12.2.0.1.0-2.zip
* instantclient-sdk-macos.x64-12.2.0.1.0-2.zip

## 自动化安装
**使用前请确认下zip包路径和oracle_home目录是否符合要求**

```bash
#!/usr/bin/env bash

export prefix=${HOME}
export basic_path=${prefix}/Downloads/instantclient-basic-macos.x64-12.2.0.1.0-2.zip
export sdk_path=${prefix}/Downloads/instantclient-sdk-macos.x64-12.2.0.1.0-2.zip
export oracle_home=${prefix}/packages/oracle
export lib_path=${oracle_home}/lib

# 备份原oracle_home
if [ -d "${oracle_home}" ];then
    mv ${oracle_home} ${oracle_home}.bak.`date +"%Y_%m_%d_%H_%M_%S"`
fi
mkdir -p ${prefix}/packages/

# 解压 basic
unzip ${basic_path} -d ${prefix}/packages/
mv ${prefix}/packages/instantclient_12_2 ${oracle_home}

# 解压sdk
unzip ${sdk_path} -d ${oracle_home}
mv ${oracle_home}/instantclient_12_2/sdk ${oracle_home}
rm -rf ${oracle_home}/instantclient_12_2
chmod ga-w ${oracle_home}/sdk  ${oracle_home}/sdk/admin  ${oracle_home}/sdk/demo  ${oracle_home}/sdk/include

cat>oci8.pc<<EOF
prefix=${prefix}/packages
includedir=\${prefix}/oracle/sdk/include
libdir=\${prefix}/oracle

Name: oci8.pc
Description: Oracle Instant Client
Version: 12.1
Cflags: -I\${includedir}
Libs: -L\${libdir} -lclntsh
EOF

cat>.env<<EOF
export DYLD_LIBRARY_PATH=${prefix}/packages/oracle
export CGO_CFLAGS="-I${prefix}/packages/oracle"
export PKG_CONFIG_PATH=\${PWD}
EOF
```

## 注意事项
若在使用过程中发现目录写错等情况，需要修改 `oci8.pc` 文件中的 `Name` 进行覆盖动态链接库地址。

可安装执行以下命令安装 `pkg-config` 对libs进行管理

> brew install pkg-config

> pkg-config --help
