---
layout: post
title:  常用排序算法简介
tags: python sorting
thread: sorting
---

## 概述
目前我们常说的排序算法往往指的是**内部排序算法**，即数据记录在内存中进行排序

排序算法大体有两类：
* 1.`比较排序`,时间复杂度是O(nlogn ~ O(n^2)),主要有**冒泡排序**， **选择排序**， **插入排序**， **归并排序**， **堆排序**， **快速排序**等。
* 2.`非比较排序`，时间复杂度可以达到O(n),主要有 **计数排序**, **基数**, **桶排序**等

## 对比

|排序方法|平均情况|最好情况|最坏情况|辅助空间|稳定性|
|:---|:---|:---|:---|:---|:---|
|冒泡排序|O(n^2)|O(n)|O(n^2)|O(1)|稳定|
|选择排序|O(n^2)|O(n^2)|O(n^2)|O(1)|不稳定|
|插入排序|O(n^2)|O(n)|O(n^2)|O(1)|稳定|
|希尔排序|O(nlogn) ~ O(n^2)|O(n^1.3)|O(n^2)|O(1)|不稳定|
|堆排序|O(nlogn)|O(nlogn)|O(nlogn)|O(1)|不稳定|
|归并排序|O(nlogn)|O(nlogn)|O(nlogn)|O(n)|稳定|
|快速排序|O(nlogn)|O(nlogn)|O(n^2)|O(logn) ~ O(n)|不稳定|

## 稳定性
排序前后两个相等数相对顺序不变，即如果排序前 Ai=Aj, i 小于j,排序前Ai在Aj的前面，排序后Ai还是在Aj的前面，那么这种排序算法是稳定的。

对于不稳定的排序算法，只要举出一个实例，即可说明它的不稳定性；而对于稳定的排序算法，必须对算法进行分析从而得到稳定的特性。**需要注意的是，排序算法是否为稳定的是由具体算法决定的。**

**稳定性好处**: 排序算法如果是稳定的，那么从一个键上排序，然后再从另一个键上排序，前一个键排序的结果可以为后一个键排序所用。

## 冒泡排序

### 原理
重复的遍历数组中的元素，每次比较相邻两个元素，相邻元素数据有问题则进行交换。指导没有元素需要交互。

以从小到大排序为例：

1.比较相邻的两个元素，如果前一个比后一个大，则把位置进行调换

2.重复第 1 步的步骤，直到遍历完一次数组，把最大的元素找

3.去除最后一个元素后再重复 第 1 、 2 步

4.对变小的数组重复做 第 1、第 2、第 3步，直到所有元素排序完毕

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def bubble_sort(data):
    """冒泡排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(n^2)
    最优时间复杂度： O(n^2) 可以进行优化提升
    平均时间复杂度： O(n^2)
    所需辅助空间： O(1)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :rtype data list
    :return data 排序后的数组
    :example data [1, 2, 3, 4]
    """
    # 计算数组长度
    length = len(data)
    for i in range(length):
        # 去掉已经比较过的元素
        for j in range(length - i - 1):
            # 对比相邻元素大小
            if data[j] > data[j + 1]:
                # 交换相邻元素
                data[j + 1], data[j] = data[j], data[j + 1]
    return data


def main():
    """排序
    """
    data = [4, 9, 7, 3, 2, 1, 8, 6]
    print data
    print bubble_sort(data)


if __name__ == '__main__':
    main()
```

## 鸡尾酒排序
鸡尾酒排序，也叫定向冒泡排序，是冒泡排序的一种改进。此算法与冒泡排序的不同处在于从低到高然后从高到低，而冒泡排序则仅从低到高去比较序列里的每个元素。他可以得到比冒泡排序稍微好一点的效能。

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def cocktail_sort(data):
    """鸡尾酒排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(n^2)
    最优时间复杂度： 如果序列在一开始已经大部分排序过的话,会接近O(n)
    平均时间复杂度： O(n^2)
    所需辅助空间： O(1)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :rtype data list
    :return data 排序后的数组
    :example data [1, 2, 3, 4]
    """
    # 计算数组长度
    length = len(data)
    left = 0
    right = length - 1
    while left < right:
        # 把大的元素往后放
        for i in range(left, right):
            # 对比相邻元素大小
            if data[i] > data[i + 1]:
                # 交换相邻元素
                data[i + 1], data[i] = data[i], data[i + 1]
        right -= 1

        # 把小的元素往前放
        for i in range(right, left, -1):
            # 对比相邻元素大小
            if data[i - 1] > data[i]:
                # 交换相邻元素
                data[i - 1], data[i] = data[i], data[i - 1]
        left += 1

    return data


def main():
    """排序
    """
    data = [4, 9, 7, 3, 2, 1, 8, 6]
    print data
    print cocktail_sort(data)


if __name__ == '__main__':
    main()
```

## 选择排序
初始时在序列中找到最小（大）元素，放到序列的起始位置作为已排序序列；然后，再从剩余未排序元素中继续寻找最小（大）元素，放到已排序序列的末尾。以此类推，直到所有元素均排序完毕。

**和冒泡排序的区别**：冒泡排序通过依次交换相邻两个顺序不合法的元素位置，从而将当前最小（大）元素放到合适的位置；而选择排序每遍历一次都记住了当前最小（大）元素的位置，最后仅需一次交换操作即可将其放到合适的位置。

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def selection_sort(data):
    """选择排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(n^2)
    最优时间复杂度： O(n^2)
    平均时间复杂度： O(n^2)
    所需辅助空间： O(1)
    稳定性： 不稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :rtype data list
    :return data 排序后的数组
    :example data [1, 2, 3, 4]
    """
    # 计算数组长度
    length = len(data)
    for i in range(length):
        i_min = i
        # 去掉已经比较过的元素,从第 i 个元素往后找
        for j in range(i + 1, length):
            # 对比当前元素是否比目前的最小值
            if data[j] < data[i_min]:
                i_min = j
        # 和冒泡优势在于交换次数少
        if i_min != i:
            # 和第 i 个元素进行交换
            data[i_min], data[i] = data[i], data[i_min]

    return data


def main():
    """排序
    """
    data = [4, 9, 7, 3, 2, 1, 8, 6]
    print data
    print selection_sort(data)


if __name__ == '__main__':
    main()
```

## 插入排序
插入排序在实现上，通常采用in-place排序（即只需用到O(1)的额外空间的排序），因而在从后向前扫描过程中，需要反复把已排序元素逐步向后挪位，为最新元素提供插入空间。

### 原理
具体算法描述如下：

1.从第一个元素开始，该元素可以认为已经被排序

2.取出下一个元素，在已经排序的元素序列中从后向前扫描

3.如果该元素（已排序）大于新元素，将该元素移到下一位置

4.重复步骤3，直到找到已排序的元素小于或者等于新元素的位置

5.将新元素插入到该位置后

6.重复步骤2~5

**插入排序不适合对于数据量比较大的排序应用。但是，如果需要排序的数据量很小，比如量级小于千，那么插入排序还是一个不错的选择。**

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def insertion_sort(data):
    """插入排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(n^2) 输入的序列是降序排列的，和目标序列相反
    最优时间复杂度： O(n) 输入的序列的升序的，和目标序列一致
    平均时间复杂度： O(n^2)
    所需辅助空间： O(1)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :rtype data list
    :return data 排序后的数组
    :example data [1, 2, 3, 4]
    """
    # 计算数组长度
    length = len(data)
    # 第一个元素默认为是已排好序的
    for i in range(1, length):
        # 记录下当前要插入的元素的值，为什么要记录下来？data[i]中的值会因为元素后移而被替换掉
        value = data[i]
        # 只遍历已排好序部分数组
        j = i - 1
        while j >= 0 and data[j] > value:
            # 插入之后后面所有已排序的元素都要往后移
            data[j + 1] = data[j]
            j -= 1
        # 找到了 插入元素的位置
        data[j + 1] = value
    return data


def main():
    """排序
    """
    data = [4, 9, 7, 3, 2, 1, 8, 6]
    # data = [1, 2, 4, 5, 6, 7, 8, 3]
    print data
    print insertion_sort(data)


if __name__ == '__main__':
    main()
```

## 二分插入排序
插入排序是直接对已排序的序列依次遍历，可以通过**二分查找法**减少对比次数

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def binary_search_insertion_sort(data):
    """二分查找插入排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(n^2)
    最优时间复杂度： O(nlogn)
    平均时间复杂度： O(n^2)
    所需辅助空间： O(1)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :rtype data list
    :return data 排序后的数组
    :example data [1, 2, 3, 4]
    """
    # 计算数组长度
    length = len(data)
    # 第一个元素默认为是已排好序的
    for i in range(1, length):
        # 初始化二分查找的左右边界
        left = 0
        # 只查找已排序的部分
        right = i - 1

        # 记录下当前要插入的元素的值，为什么要记录下来？data[i]中的值会因为元素后移而被替换掉
        value = data[i]

        # 找到元素应该插入的位置
        while left <= right:
            mid = (left + right) / 2
            if data[mid] > data[i]:
                right = mid - 1
            else:
                left = mid + 1

        # 插入之后后面所有已排序的元素都要往后移
        for j in range(i - 1, left - 1, -1):
            data[j + 1] = data[j]

        # 找到了 插入元素的位置
        data[left] = value
    return data


def main():
    """排序
    """
    data = [4, 9, 7, 3, 2, 1, 8, 6]
    print data
    print binary_search_insertion_sort(data)


if __name__ == '__main__':
    main()
```

## 希尔排序
希尔排序，也叫递减增量排序，是插入排序的一种更高效的改进版本。希尔排序是不稳定的排序算法。

希尔排序是基于插入排序的以下两点性质而提出改进方法的：

* 插入排序在对几乎已经排好序的数据操作时，效率高，即可以达到线性排序的效率
* 但插入排序一般来说是低效的，因为插入排序每次只能将数据移动一位

希尔排序是把记录按下标的一定增量分组，对每组使用直接插入排序算法排序；随着增量逐渐减少，每组包含的关键词越来越多，当增量减至1时，整个文件恰被分成一组，算法便终止。

假设有一个很小的数据在一个已按升序排好序的数组的末端。如果用复杂度为O(n^2)的排序（冒泡排序或直接插入排序），可能会进行n次的比较和交换才能将该数据移至正确位置。而希尔排序会用较大的步长移动数据，所以小数据只需进行少数比较和交换即可到正确位置。

### 原理
先取一个小于`length`的整数`h`作为第一个增量，把文件的全部记录分组。所有距离为`h`的倍数的记录放在同一个组中。先在各组内进行直接插入排序；然后，取第二个增量h2<h1重复上述的分组和排序，直至所取的增量 hi=1(hi<ht<......<h2<h1)，即所有记录放在同一组中进行直接插入排序为止。

**该方法实质上是一种分组插入方法**

一般的初次取序列的一半为增量，以后每次减半，直到增量为1。

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def shell_sort(data):
    """希尔排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(n(logn)^2) 和步长序列有关
    最优时间复杂度： O(n)
    平均时间复杂度： 和步长序列有关
    所需辅助空间： O(1)
    稳定性： 不稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :rtype data list
    :return data 排序后的数组
    :example data [1, 2, 3, 4]
    """
    length = len(data)

    # 步长，一般为2，当步长太大会是排序无效
    step = 2

    # 生成初始增量
    h = length / step

    while h >= 1:
        # 按增量对数据进行分组
        for i in range(h, length):
            j = i - h
            value = data[i]
            # 对每个分组进行排序
            while j >= 0 and data[j] > value:
                data[j + h] = data[j]
                j -= h
            data[j + h] = value
        h = (h - 1) / step  # 递减增量
    return data


def main():
    """排序
    """
    data = [4, 9, 7, 3, 2, 1, 8, 6]
    print data
    print shell_sort(data)


if __name__ == '__main__':
    main()
```
