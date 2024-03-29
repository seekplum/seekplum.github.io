---
layout: post
title:  snakefood分析python依赖
tags: snakefood python
thread: snakefood
---

## [下载](https://bitbucket.org/blais/snakefood/downloads/)

## [文档](http://furius.ca/snakefood/doc/snakefood-doc.html#installation)

## 安装
* pip安装
> pip install snakefood

* 源码安装

## 安装依赖
> sudo apt install graphviz

## 生成pdf
```
sfood project > /tmp/raw.deps
cd project ; ls -1d * > /tmp/clusters
cat /tmp/raw.deps | grep -v test_widget | sfood-cluster -f /tmp/clusters > /tmp/filt.deps
cat /tmp/filt.deps | sfood-graph -p | dot -Tps > /tmp/files.ps
ps2pdf /tmp/files.ps /tmp/project.pdf
```

## 脚本实现
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import argparse


def run_cmd(cmd):
    """执行系统命令
    """
    print cmd
    os.system(cmd)


def generate_pdf(data):
    """生成pdf文件

    :param data: 参数信息
    :type data dict
    """
    # 临时目录
    temp_folder = "/tmp"

    # 临时文件地址
    temp_raw_ps = os.path.join(temp_folder, "raw.ps")
    temp_clusters = os.path.join(temp_folder, "clusters")
    temp_file_ps = os.path.join(temp_folder, "file.ps")
    temp_pdf_ps = os.path.join(temp_folder, "pdf.ps")

    project = data["project"]
    filename = data["filename"]
    output = data["output"]

    # 生成原始依赖
    if project:
        food_file = project
    else:
        food_file = " ".join(filename)
    cmd = "sfood {} > {}".format(food_file, temp_raw_ps)
    run_cmd(cmd)

    # 过滤
    if project:
        cmd = "cd {}; ls -1d * > {}".format(project, temp_clusters)
    else:
        cmd = "echo '{}' > {}".format("\n".join(filename), temp_clusters)
    run_cmd(cmd)

    cmd = "cat {} | grep -v test_widget | sfood-cluster -f {} > {}".format(temp_raw_ps, temp_clusters, temp_file_ps)
    run_cmd(cmd)

    # 生成ps文件
    cmd = "cat {} | sfood-graph -p | dot -Tps > {}".format(temp_file_ps, temp_pdf_ps)
    run_cmd(cmd)

    # 生成pdf图片
    cmd = "ps2pdf {} {}".format(temp_pdf_ps, output)
    run_cmd(cmd)


def parse_args():
    """解析参数
    
    :rtype dict 命令行参数
    :return
    {
        "output": # 输出pdf地址,
        "project": # 项目名,
        "filename": # 文件名,
    }
    """
    parser = argparse.ArgumentParser()

    parser_file = parser.add_mutually_exclusive_group(required=False)
    parser_file.add_argument("-f" "--filename",
                             action="store",
                             nargs="+",
                             required=False,
                             dest="filename",
                             help="")
    parser_file.add_argument("-p" "--project",
                             action="store",
                             required=False,
                             dest="project",
                             help="")
    parser.add_argument("-o" "--output",
                        action="store",
                        required=True,
                        dest="output",
                        help="")

    args = parser.parse_args()
    return {
        "output": args.output,
        "project": args.project,
        "filename": args.filename,
    }


if __name__ == '__main__':
    params = parse_args()
    generate_pdf(params)

```