---
layout: post
title:  并发编程实战笔记
categories: go
tags: go golang go并发编程实战
thread: golang
---

## 神兽
```
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
#=============================================================================
#  ProjectName: ${PROJECT_NAME}
#     FileName: ${NAME}
#         Desc:
#       Author: ${USER}
#        Email:
#     HomePage:
#      Version:
#   LastChange: ${YEAR}-${MONTH}-${DAY} ${HOUR}:${MINUTE}
#      History:
#=============================================================================

┏┓ ┏┓
┏┛┻━━━┛┻┓
┃ ☃ ┃
┃ ┳┛ ┗┳ ┃
┃ ┻ ┃
┗━┓ ┏━┛
┃ ┗━━━┓
┃ 神兽保佑 ┣┓
┃　永无BUG ┏┛
┗┓┓┏━┳┓┏┛
┃┫┫ ┃┫┫
┗┻┛ ┗┻┛
"""
```

## 第一章

### `Go`目录介绍
```
`api`: 用于存放依照Go版本顺序的API增量列表文件.API包括 公开的变量,常量,函数等.用于Go语言API检查
`bin`: 标准命令文件
`blog`: 官方博客(markdown格式)
`doc`: 标准库的HTML格式文档,通过命令`godoc`启动Web程序来展现这些文档
`lib`: 特殊的库文件
`misc`: 辅助类的说明和工具
`pkg`: 安装Go标准库后的所有归档文件
`src`: Go自身文件,Go标准工具以及标准库的所有源码文件
`test`: 测试和验证Go本身的所有相关文件
```

### 安装go
* [下载](https://golang.org/dl/)安装包
* 解压压缩包

> sudo tar zxvf go1.9.2.linux-amd64.tar.gz -C /usr/local/

* 设置环境变量

> export GOROOT=/usr/local/go

> export GOPATH=$HOME/GolangProjects

> export PATH=\$PATH:\$GOROOT/bin:$GOPATH/bin

> export GOARCH="amd64"

**注意 `GOROOT` 的权限，用 Gogland IDE的时候无法运行程序，需要把权限改成 777**

> sudo chmod -R 777 $GOROOT

### 安装ide
* [下载](https://www.jetbrains.com/go/download/#section=linux)
* 解压压缩包

> tar zxvf goland-2017.3.tar.gz

* 设置快捷方式

> sudo cp GoLand.desktop /usr/share/applications/

```
[Desktop Entry]
Encoding=UTF-8
Name=GoLand
Comment=GoLand
Exec=/home/hjd/Downloads/GoLand-2017.3/bin/goland.sh
Icon=/home/hjd/Downloads/GoLand-2017.3/bin/goland.png
Terminal=false
StartupNotify=true
Type=Application
Categories=Application;Development;
```

### GOROOT
值应该为Go的安装目录,目的就是告知go的安装位置，官方推荐`/usr/local/go`

### Go项目结构(工作区)
```
`src`: 以代码包的形式组织并保存Go源码文件,这里的代码包和src下的子目录一一对应.除非用于测试,还是建议把Go源码文件放入特定的代码包中
`pKg`: 存放`go install`命令安装后的代码包的归档文件.前提是代码包中必须包含Go库源码文件.归档文件是指哪些名称以`.a`结尾的文件
`bin`: 在通过`go install` 命令完成安装后,保存由Go命令源码文件生成的可执行文件
```

### GOPATH
> 我们需要将工作区的目录路径都添加到环境变量 `GOPATH`中，工作区可以有多个，但路径都需要添加到`GOPATH`中，`GOPATH`可以设置一个固定路径，在完成某个项目时，可以临时设置 `GOPATH`

### GOBIN
当环境变量`GOPATH`中只包含一个目录路径时，`go install` 会把命令源码文件安装到当前工作区的`bin`目录下;否则，必须指定系统环境变量`GOBIN`，用于存放所以因安装go命令源码文件而生成的可执行文件。

### 命令源码文件,库源码文件,测试源码文件

* **命令源码文件**:　声明属于`main代码包`并且包含`无参数声明`和`结果声明`的`main函数`的源码文件.这类文件时程序的入口,可以独立运行(`go run 文件名`),也可以通过`go build` 或 `go install`命令得到相应的可执行文件
* **库源码文件**: 存在域某个代码包中的普通源码文件

同一代码包中的所有源码文件,其所属代码包的名称必须一致.如果命令源码文件和库源码文件处于同一个代码包中,那么在该包中就无法正确执行`go build` 和`go install`命令.即这些源码文件将无法通过`常规的方法编译和安装`.

同一代码包中可以有多个命令源码文件,可以通过`go run`分别运行,这会使`go build`,`go install`命令无法编译和安装该代码包.**不应该把多个命令源代码文件放在同一个代码包中**

> **命令源码文件**通常会单独放在一个代码包中.因为通常一个程序模块或软件的启动入口只有一个

* **测试源码文件**:
    1.文件名以 `_test.go`结尾
    2.文件中需要至少包含一个名称以`Test`开头或`Benchmark`开头,且拥有一个类型为`*testing.T`或`*testing.B`的参数的函数.
    testing.T 和 testing.B是两个结构体类型.*testing.T和*testing.B则分别为前两者的指针类型,它们分别时功能测试和基准测试所需要的.

### GOPATH
需要把`工作区的目录路径`添加到`环境变量GOPATH`中,工作区可以有多个,即可以有多个GO项目,这些工作区的目录都需要加到`GOPATH`中.GOPATH的目的是为了告知go，需要代码的时候，去哪里查找。注意这里的代码，包括本项目和引用外部项目的代码。GOPATH可以随着项目的不同而重新设置。

### 编码
Go代码的文本文件需要以`UTF-8编码`存储,如果源文件中出现了`非UTF-8编码`的字符,在编译,运行,安装的时候会报出`illegal UTF-8 sequence`错误

### 代码包
1.包声明
包可以任意命名,但是都`必须`以包声明语句作为文件中`代码的第一行`,其中,对于`命令源码文件`,不管放在什么位置,都是属于`main包`

2.包导入
同一源码文件中导入的多个代码包的`最后一个元素不能重复`

**解决方法**: 为其中一个起别名,如下

```go
import (
  "github/test"
  test1 "github1/test" // 使用 `test1` 作为别名
  . "github1/test"  // 使用 `.` 作为别名
  _ "github1/test"  // 使用 `_` 作为别名,适用于只想初始化某个代码包
)
```

### 程序实体
变量,常量,函数和类型声明可统称为程序实体,它们的名称统称为`标识符`

标识符的首字符的大小写控制着对应程序实体的访问权限
标识符`首字母大写`: 所对应的程序实体就可以被本代码包之外的代码访问
,即是`可导出和可公开的`
标识符`首字母小写`: 对应的程序实体就只能被本包内的代码访问,即`不可导出的或包是私有的`

**可导出程序实体**:

* 程序实体必须时非局部的.局部的程序实体是指:它被定义在了函数或结构体的内部
* 代码包所属目录必须包含在GOPATH中定义的工作目录中

### 基本概念
1.必须在源文件中的`非注释的第一行`指明文件属于`哪个包`

> package main 表示一个可独立执行的程序,每个Go应用都包含一个名为`main`的包

2.每行结尾不需要分行,`多行合并`在一行则使用`分号`隔开,`不建议使用`.

3.单行注释 `//`,多行注释 `/* */`

4.如果有`init`函数,会在`main`之前执行

> 所有的全局变量的初始化都会在代码包的初始化函数执行前完成/这避免了在代码包初始化函数对某个变量进行赋值之后,又被该变量声明中赋予的值覆盖掉的问题.

同一代码包可以存在多个代码包初始化函数,甚至代码包内的每一个源码文件都可以定义多个代码包初始化函数.Go不会保证同一代码包中多个代码包初始化函数的执行顺序.`被导入的代码包`的初始化函数总是`会先执行`.

### 标准命令
```
`build`: 编译指定的代码包或Go语言源码文件.`命令源码文件`会被编译成可执行文件,并放到命令执行的目录或指定目录下.`库源码文件`被编译后,则不会在`非临时目录`留下任何文件.
`clean`: 清除因执行其他go命令遗留下来的`临时目录和文件`
`doc`: 用于显示Go语言代码包即程序文档
`env`: 打印环境变量相关信息
`fix`: 修正指定代码包的源码文件中包含的过时语法和代码调用,用于同步升级程序
`fmt`: 格式化指定代码包中的Go源码文件(实际通过执行 `gofmt` 来实现)
`generate`: 识别指定代码包中源码文件中的go:generate注释,并执行其携带的任意命令.该命令独立于Go语言标准的编译和安装体系.需要解析go:generate注释就单独运行
`get`: 下载,编译并安装指定的代码包及其依赖包
`install`: 编译并安装指定的代码包及其依赖包
           安装命令源码文件后,代码包所在的工作区目录的bin子目录,或者当前环境变量GOBIN指向的目录中会生成相应的可执行文件
           安装库源码文件后,代码包所在的工作区目录的pkg子目录会生成相应的归档文件
`list`: 显示指定代码包的信息
`run`: 编译并运行指定的命令源码文件
`test`: 测试指定的代码包,前提是该代码包目录中必须存在测试源码文件
`tool`: 运行Go语言特殊工具
`vet`: 用于建成指定代码包中的Go语言源码,并报告发现可疑代码问题,除了提供编译以外的又一个程序检查方法.用途找到程序中的潜在错误
`version`: 显示当前安装的Go语言的版本信息以及计算环境

`-a`: 强行重新编译所有涉及的Go语言代码包(包括Go语言标准库中的代码包)
`-n`: 使命令仅打印其执行过程中的用到的所有命令,`而不真正执行`.
`-race`: 用于检测并报告指定Go语言程序中存在的数据竞争问题.常用于`检测并发程序`.
`-v`: 用于打印命令执行过程中涉及的代码包(包括目标代码包,间接,直接引用的代码包)
`-work`: 用于打印命令执行时生成和使用的临时工作目录的名字,且命令执行完不删除它.
`-x`: 使命令打印其执行过程中用到的所有命令,同时执行它们
```

* pprof: 用于以交互的方式访问一些性能概要文件
* trace: 用于读取Go程序踪迹文件,并以图形化的方式展示出来.

## 第二章

### 标识符

1.关键字
|类别|关键字|
|:---|:---|
|程序声明|import、package|
|程序实体声明和定义|chan、const、func、interface、map、struct、type、var|
|程序流程控制|go、select、break、case、continue、default、defer、else、fallthrough、for、goto、if、range、return、switch|

**与并发编程有关的有 go、chan、select**
**任何类型都是空接口类型的**

2.预定义字符
|append	|bool	|byte	|cap	|close	|complex	|complex64	|complex128	|uint16|
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
|copy	|false	|float32	|float64	|imag	|int	|int8	|int16	|uint32|
|int32	|int64	|iota	|len	|make	|new	|nil	|panic	|uint64|
|print	|println	|real	|recover	|string	|true	|uint	|uint8	|uintptr|

### 操作符
```
`&`: 按位与操作，既是一元操作符，也是二元操作符，若作为地址操作符，则表示取址操作
`&^`: 按位清除操作， 5 &^ 11 // 结果是4
`!`: 逻辑非操作
`<-`: 接收操作， `<- ch` 若ch代表了元素类型为byte的通道类型值，则此表达式就表示从ch中接收一个byte类型值的操作
```

### 表达式
```
`索引表达式`:  选取数组、切片、字符串或字典中的`某个元素`
`切片表达式`: 选择数组、数组指针、切片或字符串值中的`某个范围元素`
`类型断言`: 判断一个接口值的实际类型是否为某个类型，或一个非接口值的类型是否实现了某个接口类型 v1.(I1) // v1表示一个接口值，I1表示一个接口类型
`调用表达式`: 调用一个函数或一个值的方法
```

* 类型断言：

1.如果v1是一个非接口值，那么必须在做类型断言之前把它转成接口值。因为Go中的任何类型都是空接口类型的实现类型。一般做法： interface {}(v1).(I1)
2.如果断言结果为否，即该类型断言是失败的。失败的类型断言会引发运行异常。解决方法： var i1, ok = interface{}(v1).(I1)
ok 布尔类型的变量，返回类型断言的成败
i1 成功 是经过类型转换后的I1类型的值
   失败 I1类型的零值(即默认值)

### 基本类型
```
`rune`: rune类型，由Go语言定义的特有的数据类型，专用于存储Unicode字符。它可以看作一个由32位二进制数表示的符号整数类型
```

### 字符串
原生字符串字面量： 由反引号"`"包裹
解释型字符串字面量： 由双引号"""包裹，可以解析转义字符

> `字符串值是不可变的`， 我们不可能改变一个字符串的内容，对字符串的操作只会`返回一个新字符串`，并不会改变原字符串并返回。


### 变量声明
1.指定变量类型，声明后若不赋值，使用默认值。

var v_name v_type
v_name = value

2.根据值自行判定变量类型。

var v_name = value

3.省略var, 注意 :=左侧的变量不应该是已经声明过的，否则会导致编译错误。

v_name := value

> 短变量声明，它只能被用在函数体内，而不可以用于全局变量的声明与赋值
> 只有基本类型即别名类型才可以作为常量的类型

### 高级类型
1.**iota**

iota，特殊常量，可以认为是一个可以被编译器修改的常量,const中变量`每多一行`就加1

2.**数组(array)**

```
package main

import(
"fmt"
)

func main(){
    var arr1 [5]int
    arr2 := [5]int{1, 2, 3, 4, 5}   //指定长度为5，并赋5个初始值
    arr3 := [5]int{1, 2, 3}         //指定长度为5，对前3个元素进行赋值，其他元素为零值
    arr4 := [5]int{4: 1}            //指定长度为5，对第5个元素赋值
    arr5 := [...]int{1, 2, 3, 4, 5} //不指定长度，对数组赋以5个值
    arr6 := [...]int{8: 1}          //不指定长度，对第9个元素（下标为8）赋值1
    arr7 := make([]string, 10)  // 里面都是 “ 空字符串
    fmt.Println(arr1, arr2, arr3, arr4, arr5, arr6, arr7)
}
```

**由若干相同类型的元素组成的系列**

* 只要类型声明中的数组长度不同,即使两个数组类型的元素类型相同,它们也是不同的类型
* 一旦在`声明中`确定了数组类型的长度,就无法再改变
* [...] `...`特殊标记,表示需要由Go编译器计算该值的元素数量并以此获得其长度

3.**切片(slice)**

> 可以看作一种对数组的包装形式,它的包装的数组称为该切片的底层数组(切片时针对其底层数组中的某个连续片段的描述)

* 不携带长度信息
* 长度可变
* 只要元素类型相同,两个切片的类型就是相同的
* 切片类型的零值总是`nil`,此零值的`长度`和`容量`都是`0`

**切片值**: 相当于对某个底层数组的引用.其内部包含了三个元素

* 指向底层数组中某个元素的指针
* 切片的长度
* 切片的容量

4.**字典(map)**
> var data(变量名) = map[string(key类型)]bool(value类型){}

字典类型是`散列表(hash table)`的一个实现,是一个引用类型,因此字典类型的零值是`nil`

5.**函数和方法**
> 函数是一等类型,意味着可以把函数当作一个值来传递和调用

* 参数列表: `必须有名称`
* 结果列表: `名称可有可无`, 要么都有名称,要么都省略.如果有名称,在函数调用时,以参数为名的变量就是隐式声明,函数中就可以直接使用了.且`return` 关键字后也可以不追加内容.
* 函数的零值类型是`nil`,检查外来函数值是否非nil总是很有必要的.
* 通常把`error`类型的结果作为函数结果列表的最后一员

**方法是函数的一种,它实际上就是与某个数据类型关联在一起的函数**

方法只是在关键字`func`和函数名称之间加了一个由`()圆括号`包裹的接收者声明
接收者声明:
* 右边编码这个方法与哪个类型关联
* 左边指定这个累得值在当前方法中的标识符

6.**接口**
接口类型用于定义`一组行为`(类似于python中的抽象方法),其中每个行为都由一个方法声明表示。接口类型中的方法`只有签名而没有方法体`。方法签名包括且仅包括方法的`名称`、`参数`、`返回值`。
Go的数据类型并不存在继承关系，接口类型也是一样的。一个接口类型的声明中可以潜入任意其他接口类型。

```
type 接口名 interface{

}
```

7.**结构体**
> 结构体类型不仅可以关联方法，且可以有内置元素(又称字段)

```
type 结构体名 struct{

}
```

### 流程控制
1.没有do和while循环，只有for循环
2.switch语句灵活多变，还可以用于类型判断
3.if语句和switch语句都可以包含一条初始化子语句
4.break语句和continue语句可以跟一条便签(lable)语句，以标识需要终止或继续的代码块
5.defer语句可以方便地执行异常捕获和资源回收任务
6.select语句多用于分支选择，但只与通道配合使用
7.go语句用于异步启用goroutine并执行指定函数


### switch语句
1.**表达式switch语句**

```
package main

import (
	"strings"
	"fmt"
)

func main()  {
	var content = "Python"
	switch lang := strings.TrimSpace(content); lang{
	default:
		fmt.Println("Unknown language")
	case "Python":
		fmt.Println("Python language")
		fallthrough
	case "Py":
		fmt.Println("Py language")
	case "Go":
		fmt.Println("Go language")
	}
}
```

fallthrough可以向下一个case语句转移流程控制权，即满足其中多个case中任意一个即可。

2.**类型switch语句**
switch 语句还可以被用于 type-switch 来判断某个 `interface` 变量中实际存储的变量类型。

```
func main() {
	var v interface{}
	v = 1234
	switch v.(type) {
	case string:
		fmt.Printf("The string is %s", v.(string))
	case int, uint, int8:
		fmt.Printf("The integer is %d", v)
	default:
		fmt.Printf("Unknown value: type=%T", v)
	}
	fmt.Println()
	switch i := v.(type) {
	case string:
		fmt.Printf("The string is %s", i)
	case int, uint, int8:
		fmt.Printf("The integer is %d", i)
	default:
		fmt.Printf("Unknown value: type=%T", i)
	}
}
```

### **for语句**

**特别注意，永远不要在循环体内修改计数器**

#### for子句
```
func main() {
	var number int
	for i:=0;i<10;i++{
		number ++
	}
	var j = 1
	for ;j%5!=0;j*=5{
		number ++
	}
	for k:=1; k%5!=0;{
		k *= 5
		number ++
	}
	var m = 1
	for m < 5{
		m += 2
	}
	// 无限循环
	for {
	}
}
```

#### range子句

|range表达式类型|第一个产出的值|第二个产出的值|备注|
|:---|:---|:---|:---|:---|
|a: [n]E、*[n]E、[]E|i: int类型的索引值|与索引对应的元素的值a[i],类型为E|a为range表达式的结果值，n为数组类型的长度，E为数据类型或切片类型的元素类型|
|s: string类型|i: int类型的索引值|与索引对应的元素的值s[i],类型为rune|s为range表达式的结果值|
|m: map[k]V|k: 键-元素对中键的值，类型为k|与键对呀的元素值m[k],类型为V|m为range表达式的结果值，k为字典类型的键的类型，V为字典类型的元素类型|
|c: chan E、 <-chan E|e: 元素的值，类型为E||c为range表达式的结果值，E为通道类型的元素的类型|

**注意：**

1.对数组、切片、字符串进行迭代，且`:=`左边只有一个变量时，只会得到其中元素的索引
2.迭代空类型时(数组、切片、字典、字符串)，不会执行`for`语句中的代码
3.迭代为`nil`的通道值会让当前流程永远阻塞在`for`语句上

```
for index, rune := range str2 {
    	fmt.Printf(""))
	}
```

### defer语句

### if 语句
关键字 if 和 else 之后的左大括号 { 必须和关键字在同一行，如果你使用了 else-if 结构，则前段代码块的右大括号 } 必须和 else-if 关键字在同一行。这两条规则都是被编译器强制规定的。

```
value, err := pack1.Function1(param1)
if err != nil {
	fmt.Printf("An error occured in pack1.Function1 with parameter %v", param1)
	return err
}
// 未发生错误，继续执行：
```