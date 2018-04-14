---
layout: post
title:  交互执行cmd
tags: python interaction cmd
thread: interaction
---
## 本地执行

### 精确输入
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pexpect
import time

print "开始"
child = pexpect.spawn("parted /dev/VolGroup/redo")
# 匹配到 (parted) 
child.expect("\(parted\)")
# 匹配成功后执行 p 命令
child.sendline("p")
time.sleep(1)
child.expect("\(parted\)")
print child.before
child.sendline("q")
print "结束"
```

### 模糊输入

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os

cmd = "python /home/hjd/PycharmProjects/qdeploy/test/test2.py"
print "开始"
f_input = os.popen(cmd, "w")
# 多个输入以 \n 隔开
f_input.write("8\n1")
print "结束"
```

* test2.py

```
#!/usr/bin/env python
# -*- coding: utf-8 -*-

print "before pexpect1"
print "before pexpect2"
print "before pexpect3"
target = raw_input("input the lun number(1-8) of a target:[8]")
print "target", target
lun = raw_input("input the target number(1-8) of a qlink[1]")
print "lun", lun
print "after pexpect1"
print "after pexpect2"
print "after pexpect3"
```

## 远程执行

### 使用三方库
```
from pexpect.pxssh import pxssh
```

### 自己实现
```python
def do_interaction_cmd(self, cmd, ssh, data=None):
    """
    执行需要交互的命令 create_cfile, import -i, format_nmve
    :param data: target数量，lun数量
    :param ssh: ssh对象
    """
    if data is None:
        data = {}
    target = data.get("target", 1)
    lun = data.get("lun", 8)
    except_cmd_lst = [
        "The configuration is already set. Are you sure to overwrite it?[N]",  # import -i 输入yes
        "input the lun number(1-8) of a target:[8]",  # 输入每个target的lun数量
        "input the target number(1-8) of a qlink[1]",  # 每个qlink的target数量
        "Formatting operation will destroy all the data (including partitions) on the device, are you sure you want to continue? (N/Y)"
    ]
    rec_buf = []
    EOF = "QDEPLOY_EOFCMD_WOQUCMD"  # 结束标识
    newline = '\n'
    exit_cmd = ";exit {}".format(newline)
    echo_cmd = ";echo {}".format(EOF)
    full_cmd = "{}{}{}".format(cmd, echo_cmd, exit_cmd)
    logger.info("ip: {}, interaction cmd: {}".format(ssh.ip, full_cmd))
    start_len = len(EOF) + len(exit_cmd)
    end_len = len(exit_cmd)
    # 开启一个终端
    shell = ssh.invoke_shell(width=200)
    # shell = ssh.shell
    timeout = 60  # 超时时间
    shell.settimeout(timeout)
    try:
        shell.send(full_cmd)
    except Exception as e:
        logger.exception(e)
        raise QDataMgrCmdException(message=e.message)
    find_flag = 0
    rl, wl, xl = select.select([shell], [], [], 60)
    if rl:
        while True:
            if not shell.recv_ready() and shell.closed:
                break
            # 每次读取终端输出的一个字符
            # rec_buf是记录的所有终端输出
            buf = shell.recv(1)
            # 终端输出中会多一个 \r 字符
            if buf == "\r":
                continue
            rec_buf.append(buf)
            # 匹配到执行的命令
            if full_cmd == "".join(rec_buf[-len(full_cmd):]):
                while True:
                    buf = shell.recv(1)
                    # 终端输出中会多一个 \r 字符
                    if buf == "\r":
                        continue
                    rec_buf.append(buf)
                    if "".join(rec_buf[-len(except_cmd_lst[0]):]) == except_cmd_lst[0]:
                        shell.send('y\r')
                    elif "".join(rec_buf[-len(except_cmd_lst[1]):]) == except_cmd_lst[1]:
                        shell.send('{}\r'.format(lun))
                    elif "".join(rec_buf[-len(except_cmd_lst[2]):]) == except_cmd_lst[2]:
                        shell.send('{}\r'.format(target))
                    elif "".join(rec_buf[-len(except_cmd_lst[3]):]) == except_cmd_lst[3]:
                        shell.send('y\r')
                    # 在输出中会有结束标识,第一次出现是我们自己输入的
                    elif EOF == "".join(rec_buf[-start_len:-end_len]) and full_cmd == "".join(rec_buf[-len(full_cmd):]):
                        find_flag += 1
                    # 命令输出结束,结束循环
                    elif EOF == "".join(rec_buf[-len(EOF):]) and find_flag > 0:
                        break
                break
    # 所有输出字符
    rec_buf = "".join(rec_buf)
    # 去除输入命令之前的输出
    output = rec_buf.rsplit(full_cmd, 1)[1]
    # 去除结束标识
    output = output.replace(EOF, "")
    try:
        output = re.split('.*?root@', output)[0]
    except Exception as e:
        logger.exception(e)
        raise QDataMgrOutputException(message=e.message)
    raise gen.Return(output)
```




