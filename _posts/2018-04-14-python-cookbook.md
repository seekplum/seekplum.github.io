---
layout: post
title:  python cookbook笔记
tags: python－cookbook
thread: pythoncookbook
---
## pip换源

* windows

C:\Users\Administrator\AppData\Roaming\pip\pip.ini

```
[global]
timeout = 6000
index-url = http://pypi.douban.com/simple
trusted-host = pypi.douban.com
```

## 指定大小队列
```
from collections import deque
```

## 查找少量元素
```
import heapq
nums = [] # 无序列表
# 同时可以接收key参数
heapq.nlargest(2, nums)  # 查找`最大`的两个元素， 返回值是`逆序`排列的列表
heapq.nsmallest(2, nums)  # 查找`最小`的两个元素， 返回值是`正序`排列的列表
# 底层实现的排序算法是 `堆排序`
```

## 有序字典
```
from collections import OrdereDict

# 排序后可以 json.dumps(),这样返回给前端就是有序的了
# 缺点是维护着双向链表，大小是普通字典两倍
```

## 命名切片
```
SHARES =slice(1, 3)
record[SHARES] # 等价于 record[1:3] 
indices(size) # 方法将它映射到一个确定大小的序列上， 这个方法返回一个三元组 (start, stop, step) 
```

## 字典列表排序
```
from operator import itemgettr

rows = [{}]
sorted(rows, key=itemgetter("xx")) # 等价于 sorted(rows, key=lambda x: x["xx"])
```

## 字段分组
```
from operator import itemgetter
from itertools import groupby
rows = [{}]
groupby(rows, key=itemgetter("xxx"))  # 需要注意的是只有排序之后，才生效。groupby() 函数扫描整个序列并且查找连续相同值（或者根据指定 key 函数返回值相同）的元素序列
```

## 过滤元素
```
from itertools import compress
addresses = [
    '5412 N CLARK',
    '5148 N CLARK',
    '5800 E 58TH',
    '2122 N CLARK',
    '5645 N RAVENSWOOD',
    '1060 W ADDISON',
    '4801 N BROADWAY',
    '1039 W GRANVILLE',
]
counts = [ 0, 3, 10, 4, 1, 7, 6, 1]
more5 = [n > 5 for n in counts]
list(compress(addresses, more5))
```

## 命名元祖
```
from collections import namedtuple
Stock = namedtuple('Stock', ['name', 'shares', 'price'])
stock_prototype = Stock("test", 1, 2)

# 或者使用 含有`__slot__` 属性的类 
```

## 合并字典
```
from collections import ChainMap
a = {}
b = {}
c = ChainMap(a, b) # 把两个字典的值合在一起，a, b 中都有的key, value 取a的
# 只是逻辑概念的合在一起，合并后，修改 a,b 的值，c的值也会跟着 
```

## shell通配符
```
from fnmatch import fnmatch, fnmatchcase
fnmatch('foo.txt', '*.txt')
# fnmatch() 函数匹配能力介于简单的字符串方法和强大的正则表达式之间
# 文件名匹配最好用 glob
```

## 字符串替换
```
text = 'Today is 11/27/2012. PyCon starts 3/13/2013.'
import re
re.sub(r'(\d+)/(\d+)/(\d+)', r'\3-\1-\2', text)
'Today is 2012-11-27. PyCon starts 2013-3-13.'
```

> sub() 函数中的第一个参数是被匹配的模式，第二个参数是替换模式。反斜杠数字比如 \3 指向前面模式的捕获组号。对于复杂的模式，第二个参数可以由函数替换

```
def matchcase(word):
    def replace(m):
        text = m.group()
        if text.isupper():
            return word.upper()
        elif text.islower():
            return word.lower()
        elif text[0].isupper():
            return word.capitalize()
        else:
            return word
    return replace
    
text = 'UPPER PYTHON, lower python, Mixed Python'
re.sub('python', matchcase('snake'), text, flags=re.IGNORECASE)
```

## 字符串匹配
```
comment = re.compile(r'/\*(.*?)\*/', re.DOTALL) # re.DOTALL 匹配包括换行符在内的任意字符
```

## Unicode文本标准化
```
import unicodedata
s1 = 'Spicy Jalape\u00f1o'
s2 = 'Spicy Jalapen\u0303o'

t1 = unicodedata.normalize('NFC', s1)
t2 = unicodedata.normalize('NFC', s2)


t3 = unicodedata.normalize('NFD', s1)
t4 = unicodedata.normalize('NFD', s2)
```
> normalize() 第一个参数指定字符串标准化的方式。 NFC表示字符应该是整体组成(比如可能的话就使用单一编码)，而NFD表示字符应该分解为多个组合字符表示。

## 审查清理文本字符串
```
s = 'pýtĥöñ\fis\tawesome\r\n'
import unicodedata
import sys
cmb_chrs = dict.fromkeys(c for c in range(sys.maxunicode)
                        if unicodedata.combining(chr(c)))

b = unicodedata.normalize('NFD', a)

b.translate(cmb_chrs)
```

## 字符串对齐
```
text = "xx"
text.ljust(20, "=") # 左对齐
text.rjust(20, "=") # 左对齐
text.center(20, "=") # 左对齐

a = "x"
{a:*>10}'.format(a=10)  # 右对齐
{:*<10}'.format(10)  # 左对齐
{0:*^10}'.format(10)  # 居中对齐

a.zfill(8)  # 只能补 0 

'%-20s' % a
'%20s' % a
```

## 字符串插入变量
```
s = '{name} has {n} messages.'
name = 'Guido'
n = 37
s.format_map(vars())

class Info:
    def __init__(self, name, n):
        self.name = name
        self.n = n

a = Info('Guido',37)
s.format_map(vars(a))
```

## 指定列宽格式化字符串
```
import os
import textwrap

os.get_terminal_size().columns # 获取终端大小
s = "abcdefg"
print textwrap.fill(s , 3)
```

## 字符串中处理html/xml
```
import html
s = 'Elements are written as "<tag>text</tag>".'
html.escape(s, quote=False)

s = 'Spicy &quot;Jalape&#241;o&quot.'
from html.parser import HTMLParser
p = HTMLParser()
p.unescape(s)

t = 'The prompt is &gt;&gt;&gt;'
from xml.sax.saxutils import unescape
unescape(t)
```

## 字符串令牌解析
```
import re
from collections import namedtuple

text = 'foo = 23 + 42 * 10'
# 希望得到下面结果
# tokens = [('NAME', 'foo'), ('EQ','='), ('NUM', '23'), ('PLUS','+'),
#           ('NUM', '42'), ('TIMES', '*'), ('NUM', '10')]

NAME = r'(?P<NAME>[a-zA-Z_][a-zA-Z_0-9]*)'
NUM = r'(?P<NUM>\d+)'
PLUS = r'(?P<PLUS>\+)'
TIMES = r'(?P<TIMES>\*)'
EQ = r'(?P<EQ>=)'
WS = r'(?P<WS>\s+)'

master_pat = re.compile('|'.join([NAME, NUM, PLUS, TIMES, EQ, WS]))


def generate_tokens(pat, text):
    Token = namedtuple('Token', ['type', 'value'])
    scanner = pat.scanner(text)
    for m in iter(scanner.match, None):
        yield Token(m.lastgroup, m.group())


for tok in generate_tokens(master_pat, text):
    #  如果有任何不可匹配的文本出现了，扫描就会直接停止。这也是为什么上面例子中必须指定空白字符令牌的原因。
    # 模块会按照指定好的顺序去做匹配。 因此，如果一个模式恰好是另一个更长模式的子字符串，那么你需要确定长模式写在前面。
    print tok
```

## 精确浮点数计算
```
from decimal import Decimal
a = Decimal('4.2')
b = Decimal('2.1')
print(a + b)

nums = [1.23e+18, 1, -1.23e+18]
sum(nums)

import math
math.fsum(nums)
```

## 复数运算
```
a = complex(2, 4)
b = 3 - 5j

import cmath
cmath.sin(a)
```

## 无穷大和nan
```
a = float('inf')
b = float('-inf')
c = float('nan')

import math
math.isinf(a)
math.isnan(c)
```
* fpectl 触发异常(非线程安全，不建议使用)
```
import fpectl
import fpetest
fpectl.turnon_sigfpe()
fpetest.test()


import math
math.exp(1000)
```

## 分数运算
```
from fractions import Fraction
a = Fraction(5, 4)
b = Fraction(7, 16)
print(a + b)
```

## 大型数组运算
```
x = [1, 2, 3, 4]
y = [5, 6, 7, 8]
x * 2 
import numpy as np
ax = np.array([1, 2, 3, 4])
ay = np.array([5, 6, 7, 8])
ax * 2
array([2, 4, 6, 8])
ax + 10
array([11, 12, 13, 14])
ax + ay
array([ 6, 8, 10, 12])
ax * ay
```

## 生成随机数
```
import random
values = [1, 2, 3, 4, 5, 6]

# 为了提取出N个不同元素的样本用来做进一步的操作，可以使用random.sample()
random.sample(values, 2)  # 输出结果 [6, 2]
random.shuffle(values)  # 打乱元素顺序
random.randint(0,10) # 生成随机整数
random.random()  # 生成0到1范围内均匀分布的浮点数
random.getrandbits(200) # 获取N位随机位(二进制)的整数
```
> 在 random 模块中的函数不应该用在和密码学相关的程序中。 如果你确实需要类似的功能，可以使用ssl模块中相应的函数。 比如， ssl.RAND_bytes() 可以用来生成一个安全的随机字节序列。

## 字符串转日期
> strptime() 的性能要比你想象中的差很多， 因为它是使用纯Python实现，并且必须处理所有的系统本地设置。 如果你要在代码中需要解析大量的日期并且已经知道了日期字符串的确切格式，可以自己实现一套解析方案来获取更好的性能。

```
from datetime import datetime
def parse_ymd(s):
    year_s, mon_s, day_s = s.split('-')
    return datetime(int(year_s), int(mon_s), int(day_s))
# 实际测试中，这个函数比 datetime.strptime() 快7倍多。如果你要处理大量的涉及到日期的数据的话，那么最好考虑下这个方案！
```

## 时区处理
```
from datetime import datetime
from pytz import timezone
d = datetime(2012, 12, 21, 9, 30, 0)
# Localize the date for Chicago
central = timezone('US/Central')
loc_d = central.localize(d)
```

## 迭代器切片
```
def count(n):
    while True:
        yield n
        n += 1
c = count(0)

import itertools
for i in itertools.islice(c, 10, 20):
    print(i)
```

## 跳过可迭代对象的开始部分
```
from itertools import dropwhile

with open('/etc/passwd') as f:
    for line in dropwhile(lambda line: line.startswith('#'), f):
        print(line, end="")
```

**注意： itertools.dropwhile() 只是会丢弃原有序列中直到函数返回`False`之前的所有元素，`返回后面所有的元素`**

## 排列组合迭代

### 排列(考虑排序)
> $$A_n^m=\frac{n!}{(n-m)!}$$
> $$A_3^3=\frac{3!}{0!}=\frac{3 * 2 * 1}{1}$$
> `a`, `b`, `c` 的排列可能有 6  种

```
from itertools import permutations
items = ["a", "b", "c"]

for p in permutations(items):
    print(p)  # 等到的结果是 abc 三个元素的拍列组合 ('a', 'b', 'c')...

```

### 组合(不考虑排序)

* 组合(元素不允许重复)

> $$C_n^m = \frac{A_n^m}{A_m^m}=\frac{A_n^m}{m!}$$
> $$C_3^2 = \frac{A_3^2}{A_2^2} = \frac{3 * 2}{2 * 1} = 3 $$

* 重复组合(元素允许重复)

**注：** x = n+r-1

> $$H_n^r = C_x^r=\frac{A_x^r}{A_r^r}=\frac{A_x^r}{r!}$$
> $$H_3^3 = C_5^3=\frac{A_5^3}{A_3^3}=\frac{5 * 4 *3 }{3 * 2 * 1}=10$$

```
from iteritools import combinations, combinations_with_replacement
items = ["a", "b", "c"]
for c in combinations(items, 3):  # 选择过的不再考虑
    print(c)
    
for c in combinations_with_replacement(items, 3):
    print(c)
```

## 同时迭代多个序列

### 按最短序列作为结束标识
```
xpts = [1, 2, 3]
ypts = [4, 5, 6]
for x, y in zip(xpts, ypts):
    print(x, y)
```

### 按最长序列作为结束标识
```python
from itertools import zip_longest
xpts = [1, 2, 3]
ypts = [4, 5, 6]
for x, y in zip_longest(xpts, ypts):
    print(x, y)
```

## 不同集合上元素的迭代
```
from itertools import chain
a = [1, 2, 3]
b = ['a', 'b', 'c']
for x in chain(a, b):
    print(x)
```

## 合并后顺序迭代
> 注意：heapq.merge() 需要所有输入序列必须是排过序的。 特别的，它并不会预先读取所有数据到堆栈中或者预先排序，也不会对输入做任何的排序检测。 它仅仅是检查所有序列的开始部分并返回最小的那个，这个过程一直会持续直到所有输入序列中的元素都被遍历完。

```python
import heapq

a = [1, 4, 7, 10]
b = [2, 5, 6, 11]
for c in heapq.merge(a, b):
    print(c)
```

## 迭代器替换while 
> iter 函数一个鲜为人知的特性是它接受一个可选的 callable 对象和一个标记(结尾)值作为输入参数。 当以这种方式使用的时候，它会创建一个迭代器， 这个迭代器会不断调用 callable 对象直到返回值和标记值相等为止。

```
CHUNKSIZE = 8192

def reader1(s):
    while True:
        data = s.recv(CHUNKSIZE)
        if data == b'':
            break
        # 处理数据 data
        

def reader2(s):
    for chunk in iter(lambda: s.recv(CHUNKSIZE), b''):
        # 处理数据 data
```

## 字符串io操作
> 使用 io.StringIO() 和 io.BytesIO() 类来创建类文件对象操作字符串数据

```python
import io
# 文本操作
s = io.StringIO()
s.write('Hello Word\n')
print('This is a test', file=s)
s.getvalue()
s.read(4)

# 二进制数据
s = io.BytesIO()
s.write(b'binary data')
s.getvalue()
```

## 读写压缩文件
> 当写入压缩数据时，可以使用 compresslevel 这个可选的关键字参数来指定一个压缩级别。默认的等级是9，也是最高的压缩等级。等级越低性能越好，但是数据压缩程度也越低。

```
import gzip

with gzip.open('/tmp/test.gz', 'rt', compresslevel=9) as f:
    text = f.read()
    f.write("test")

# 作用在一个已存在并以二进制模式打开的文件上
f = open('somefile.gz', 'rb')
with gzip.open(f, 'rt') as g:
    text = g.read()
```

## 固定大小记录文件迭代
> 如果是读取固定大小的记录，使用partial这通常是最普遍的情况。而对于文本文件，一行一行的读取(默认的迭代行为)更普遍点。

```
from functools import partial

RECORD_SIZE = 32
with open('/tmp/test.data', 'rb') as f:
    records = iter(partial(f.read, RECORD_SIZE), b'')
    for r in records:
        print(r)
```

## 读取二进制数据到可变缓冲区
> 文件对象的 readinto() 方法能被用来为预先分配内存的数组填充数据，甚至包括由 array 模块或 numpy 库创建的数组。 和普通 read() 方法不同的是， readinto() 填充已存在的缓冲区而不是为新对象重新分配内存再返回它们。 因此，你可以使用它来避免大量的内存分配操作。

```
import os.path

def read_info_buffer(filename):
    buf = bytearray(os.path.getsize(filename))
    with open(filename, 'rb') as f:
        f.readinto(buf)
    return buf
    
def reader(filename):
    record_size = 32
    buf = bytearray(record_size)
    with open(filename, 'rb') as f:
        n = f.readinto(buf)
        if n < record_size:
            break
        # 使用buf
```

> 另外有一个有趣特性就是 memoryview ， 它可以通过零复制的方式对已存在的缓冲区执行切片操作，甚至还能修改它的内容。

```
buf = read_info_buffer('/tmp/test.data')
m1 = memoryview(buf)
m2 = m1[-5:] # 零复制
m2[:] = b'WORLD'  # 修改 buf 内容
```

## 内存映射二进制文件
> 内存映射一个文件并不会导致整个文件被读取到内存中。 也就是说，文件并没有被复制到内存缓存或数组中。相反，操作系统仅仅为文件内容保留了一段虚拟内存。 当你访问文件的不同区域时，这些区域的内容才根据需要被读取并映射到内存区域中。 而那些从没被访问到的部分还是留在磁盘上。所有这些过程是透明的，在幕后完成！

> 如果多个Python解释器内存映射同一个文件，得到的 mmap 对象能够被用来在解释器直接交换数据。 也就是说，所有解释器都能同时读写数据，并且其中一个解释器所做的修改会自动呈现在其他解释器中。 很明显，这里需要考虑同步的问题。但是这种方法有时候可以用来在管道或套接字间传递数据。

```
import os
import mmap

def memory_map(filename, access=mmap.ACCESS_WRITE):
    size = os.path.getsize(filanme)
    fd = os.open(filename, os.O_RDWR)
    return mmap.mmap(fd, size, access=access)

def generat_data():
    size = 100
    with open('/tmp/test.data', 'wb') as f:
        f.seek(size-1)  # 移动文件读取指针到指定位置
        f.write(b'\x00')
        
m = memory_map('/tmp/test.data')
print(m[0:10]) # 打印值
m[0:11] = b'Hello World'  # 修改值
m.close()


with memory_map('/tmp/test.data') as m:
    print(m[0:10]) # 打印值
    m[0:11] = b'Hello World'  # 修改值
```

## 处理不合法的字符串
```
import os
import sys

files = os.listdir('.')
for name in files:
    try:
        print(name)
    except UnicodeEncodeError:
        print(bad_failename(name))
        
def bad_filename(filename):
    return repr(filename)[1:-1]
    
def bad_filename1(filename):
    temp = filename.encode(sys.getfilesystemencoding(), errors='surrogateescape')
```

> surrogateescape:
这种是Python在绝大部分面向OS的API中所使用的错误处理器，
它能以一种优雅的方式处理由操作系统提供的数据的编码问题。
在解码出错时会将出错字节存储到一个很少被使用到的Unicode编码范围内。
在编码时将那些隐藏值又还原回原先解码失败的字节序列。
它不仅对于OS API非常有用，也能很容易的处理其他情况下的编码错误。


## 增加或改变已打开文件的编码
```
import urllib.request
import io

u = urllib.request.urlopen('http://www.python.org')
f = io.TextIOWrapper(u, encoding='utf-8')
text = f.read()
```

> 如果你想修改一个已经打开的文本模式的文件的编码方式，可以先使用 detach() 方法移除掉已存在的文本编码层， 并使用新的编码方式代替。

```
import sys

print(sys.stdout.encoding)
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding='latin-1')
print(sys.stdout.encoding)

f = open('/tmp/test.txt', 'w')
b = f.detach()

f = io.TextIOWrapper(b, encoding='latin-1d')
```

## 将字节写入文本文件
```
import sys
sys.stdout.buffer.write(b"Hello\n")
```

## 将文件描述付包装成文件对象
> 在Unix系统中，这种包装文件描述符的技术可以很方便的将一个类文件接口作用于一个以不同方式打开的I/O通道上， 如管道、套接字等

```
import os
fd = os.open('somefile.txt', os.O_WRONLY | os.O_CREAT)

# Turn into a proper file
f = open(fd, 'wt')
f.write('hello world\n')
f.close()
```

## 创建临时文件和目录
```
from tempfile import TemporaryFile

with TemporaryFile('w+t') as f:
    # Read/write to the file
    f.write('Hello World\n')
    f.write('Testing\n')
    # Seek back to beginning and read the data
    f.seek(0)
    data = f.read()
```

## 与串行端口的数据通信
> 安装[pySerial](http://pyserial.sourceforge.net/)

## 序列化Python对象
```
import pickle

data = {"a": 1} # Some Python object
f = open('/tmp/test.data', 'wb')
pickle.dump(data, f)
```

> 千万不要对不信任的数据使用pickle.load()。
pickle在加载时有一个副作用就是它会自动加载相应模块并构造实例对象。
但是某个坏人如果知道pickle的工作原理，
他就可以创建一个恶意的数据导致Python执行随意指定的系统命令。
因此，一定要保证pickle只在相互之间可以认证对方的解析器的内部使用。

## 读写CSV数据
> 最好借用三方库 `pandas.read_csv()`

* 数据格式

```
Symbol,Price,Date,Time,Change,Volume
"AA",39.48,"6/11/2007","9:36am",-0.18,181800
"AIG",71.38,"6/11/2007","9:36am",-0.15,195500
"AXP",62.58,"6/11/2007","9:36am",-0.46,935000
"BA",98.31,"6/11/2007","9:36am",+0.12,104800
"C",53.08,"6/11/2007","9:36am",-0.25,360900
"CAT",78.29,"6/11/2007","9:36am",-0.23,225400
```

* 读取数据

```
import csv
with open('stocks.csv') as f:
    f_csv = csv.reader(f)
    f_csv = csv.DictReader(f)
    headers = next(f_csv)
    for row in f_csv:
        print(row)
    Row = namedtuple('Row', headings)
    for r in f_csv:
        row = Row(*r)
        print(row)
```

## json保留字典顺序
```
s = '{"name": "ACME", "shares": 50, "price": 490.1}'
from collections import OrderedDict
data = json.loads(s, object_pairs_hook=OrderedDict)
print(data)
```

## 解析xml数据
> 对于更高级的应用程序，你需要考虑使用 lxml

```
from urllib.request import urlopen
from xml.etree.ElementTree import parse
from lxml.etree import parse

# Download the RSS feed and parse it
u = urlopen('http://planet.python.org/rss20.xml')
doc = parse(u)

# Extract and output tags of interest
for item in doc.iterfind('channel/item'):
    title = item.findtext('title')
    date = item.findtext('pubDate')
    link = item.findtext('link')

    print(title)
    print(date)
    print(link)
    print()
```

## 增量式解析大型XML文件
**使用迭代器和生成器**

* 测试数据

```
<response>
    <row>
        <row ...>
            <creation_date>2012-11-18T00:00:00</creation_date>
            <status>Completed</status>
            <completion_date>2012-11-18T00:00:00</completion_date>
            <service_request_number>12-01906549</service_request_number>
            <type_of_service_request>Pot Hole in Street</type_of_service_request>
            <current_activity>Final Outcome</current_activity>
            <most_recent_action>CDOT Street Cut ... Outcome</most_recent_action>
            <street_address>4714 S TALMAN AVE</street_address>
            <zip>60632</zip>
            <x_coordinate>1159494.68618856</x_coordinate>
            <y_coordinate>1873313.83503384</y_coordinate>
            <ward>14</ward>
            <police_district>9</police_district>
            <community_area>58</community_area>
            <latitude>41.808090232127896</latitude>
            <longitude>-87.69053684711305</longitude>
            <location latitude="41.808090232127896"
            longitude="-87.69053684711305" />
        </row>
        <row ...>
            <creation_date>2012-11-18T00:00:00</creation_date>
            <status>Completed</status>
            <completion_date>2012-11-18T00:00:00</completion_date>
            <service_request_number>12-01906695</service_request_number>
            <type_of_service_request>Pot Hole in Street</type_of_service_request>
            <current_activity>Final Outcome</current_activity>
            <most_recent_action>CDOT Street Cut ... Outcome</most_recent_action>
            <street_address>3510 W NORTH AVE</street_address>
            <zip>60647</zip>
            <x_coordinate>1152732.14127696</x_coordinate>
            <y_coordinate>1910409.38979075</y_coordinate>
            <ward>26</ward>
            <police_district>14</police_district>
            <community_area>23</community_area>
            <latitude>41.91002084292946</latitude>
            <longitude>-87.71435952353961</longitude>
            <location latitude="41.91002084292946"
            longitude="-87.71435952353961" />
        </row>
    </row>
</response>
```

* 代码

```
from xml.etree.ElementTree import iterparse

def parse_and_remove(filename, path):
    path_parts = path.split('/')
    doc = iterparse(filename, ('start', 'end'))
    # Skip the root element
    next(doc)

    tag_stack = []
    elem_stack = []
    for event, elem in doc:
        if event == 'start':
            tag_stack.append(elem.tag)
            elem_stack.append(elem)
        elif event == 'end':
            if tag_stack == path_parts:
                yield elem
                elem_stack[-2].remove(elem)
            try:
                tag_stack.pop()
                elem_stack.pop()
            except IndexError:
                pass
                
from collections import Counter

potholes_by_zip = Counter()

data = parse_and_remove('potholes.xml', 'row/row')
for pothole in data:
    potholes_by_zip[pothole.findtext('zip')] += 1
for zipcode, num in potholes_by_zip.most_common():
    print(zipcode, num)
```

> iterparse() 方法允许对XML文档进行增量操作。 使用时，你需要提供文件名和一个包含下面一种或多种类型的事件列表： start , end, start-ns 和 end-ns 。 由 iterparse() 创建的迭代器会产生形如 (event, elem) 的元组， 其中 event 是上述事件列表中的某一个，而 elem 是相应的XML元素.
> start 事件在某个元素第一次被创建并且还没有被插入其他数据(如子元素)时被创建。 而 end 事件在某个元素已经完成时被创建。 start-ns 和 end-ns 事件被用来处理XML文档命名空间的声明。


## 将字典转换成xml
```
from xml.etree.ElementTree import Element

def dict_to_xml(tag, d):
    '''
    Turn a simple dict of key/value pairs into XML
    '''
    elem = Element(tag)
    for key, val in d.items():
        child = Element(key)
        child.text = str(val)
        elem.append(child)
    return elem
    
s = { 'name': 'GOOG', 'shares': 100, 'price':490.1 }
e = dict_to_xml('stock', s)

from xml.etree.ElementTree import tostring
t = tostring(e)
```

## 编码和解码16进制数
```
import binascii
s = b'hello'
h = binascii.b2a_hex(s)
s = binascii.a2b_hex(h)

import base64
h = base64.b16encode(s)
base64.b16decode(h)
```

## 匿名函数捕获变量值
> lambda表达式中的x是一个自由变量， 在运行时绑定值，而不是定义时就绑定，这跟函数的默认值参数定义是不同的。

```
x = 10
a = lambda y: x + y  # x的默认值会随着 x 的变化而变化
x = 20
b = lambda y, x=x: x + y  # x的默认值就不会变化了，就是20
```

## 通过字符串调用对象
```
import operator
import math

class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return 'Point({!r:},{!r:})'.format(self.x, self.y)

    def distance(self, x, y):
        return math.hypot(self.x - x, self.y - y)


p = Point(2, 3)
d = getattr(p, 'distance')(0, 0)  # Calls p.distance(0, 0)
operator.methodcaller('distance', 0, 0)(p)
```

## 类方法
* 类方法的一个主要用途就是定义多个构造器

## \__get__描述器类
**python2和python3有明显的区别**

## 混入类
* 不能直接实例化
* 没有自己的状态信息，也就是说它们并没有定义 \__init__() 方法，并且没有实例属性。
*  设置一个简单的类型属性的值，装饰器方式要比之前的混入类的方式几乎快100%。

## 读取嵌套和可变长二进制数据
