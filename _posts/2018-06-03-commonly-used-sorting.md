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

## 归并排序

**递归实现**: 递归实现的归并排序是算法设计中分治策略的典型应用，我们将一个大问题分割成小问题分别解决，然后用所有小问题的答案来解决整个大问题。

**非递归(迭代)实现**: 非递归(迭代)实现的归并排序首先进行是两两归并，然后四四归并，然后是八八归并，一直下去直到归并了整个数组。

### 原理
归并排序算法主要依赖归并(Merge)操作。归并操作指的是将两个已经排序的序列合并成一个序列的操作，归并操作步骤如下：

1.申请空间，使其大小为两个已经排序序列之和，该空间用来存放合并后的序列

2.设定两个指针，最初位置分别为两个已经排序序列的起始位置

3.比较两个指针所指向的元素，选择相对小的元素放入到合并空间，并移动指针到下一位置

4.重复步骤3直到某一指针到达序列尾

5.将另一序列剩下的所有元素直接复制到合并序列尾

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def merge(data, left, mid, right):
    """合并两个已经排序的数组

    :param data 被排序的数组
    :type data list
    :example data [2, 3, 1, 4]

    :param left 数组起始位置下标
    :type left int
    :example left 0

    :param mid 数组中间位置下标,即分割两个数组的位置
    :type mid int
    :example mid 2

    :param right 数组截止位置下标
    :type right int
    :example right 3
    """
    length = right - left + 1

    temp = [0] * length
    index = 0

    i = left  # 前一数组的起始元素
    j = mid + 1  # 后一数组的起始元素
    while i <= mid and j <= right:
        if data[i] <= data[j]:
            temp[index] = data[i]
            i += 1
        else:
            temp[index] = data[j]
            j += 1
        index += 1

    while i <= mid:
        temp[index] = data[i]
        index += 1
        i += 1
    while j <= right:
        temp[index] = data[j]
        index += 1
        j += 1
    data[left:left + length] = temp


def merge_sort_recursion(data, left, right):
    """递归实现归并排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(nlogn)
    最优时间复杂度： O(nlogn)
    平均时间复杂度： O(nlogn)
    所需辅助空间： O(n)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :param left 数组起始位置下标
    :type left int
    :example left 0

    :param right 数组截止位置下标
    :type right int
    :example right 3
    """
    if left == right:
        return
    mid = (left + right) / 2
    merge_sort_recursion(data, left, mid)
    merge_sort_recursion(data, mid + 1, right)
    merge(data, left, mid, right)


def merge_sort_iteration(data, length):
    """递归实现归并排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(nlogn)
    最优时间复杂度： O(nlogn)
    平均时间复杂度： O(nlogn)
    所需辅助空间： O(n)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :param length 数组长度
    :type length int
    :example left 4
    """
    i = 1
    while i < length:
        left = 0
        while (left + i) < length:
            mid = left + i - 1
            right = mid + i if (mid + i) < length else length - 1
            merge(data, left, mid, right)
            left = right + 1
        i *= 2


def main():
    """排序
    """
    data = [4, 9, 7, 3, 2, 1, 8, 6]
    print data
    merge_sort_recursion(data, 0, len(data) - 1)
    print data

    data1 = [4, 9, 7, 3, 2, 1, 8, 6]
    print data1
    merge_sort_iteration(data1, len(data1))
    print data1


if __name__ == '__main__':
    main()
```

## 堆排序
堆排序是指利用堆这种数据结构所设计的一种选择排序算法。堆是一种近似完全二叉树的结构（通常堆是通过一维数组来实现的），并满足性质：以最大堆（也叫大根堆、大顶堆）为例，其中父结点的值总是大于它的孩子节点。

### 原理

1.由输入的无序数组构造一个最大堆，作为初始的无序区

2.把堆顶元素（最大值）和堆尾元素互换

3.把堆（无序区）的尺寸缩小1，并调用heapify(A, 0)从新的堆顶元素开始进行堆调整

4.重复步骤2，直到堆的尺寸为1


### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def heap_ify(data, i, size):
    """调整堆结构

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :param i 当前值下标
    :type i int
    :example i 1

    :param size 堆大小
    :type size int
    :example 4
    """
    left_child = 2 * i + 1  # 左孩子索引
    right_child = 2 * i + 2  # 右孩子索引
    max_i = i  # 选出当前节点与其左右孩子之中的最大值
    if left_child < size and data[left_child] > data[max_i]:
        max_i = left_child
    if right_child < size and data[right_child] > data[max_i]:
        max_i = right_child
    if max_i != i:
        # 把当前结点和它的最大(直接)子节点进行交换
        data[i], data[max_i] = data[max_i], data[i]

        # 递归调用，继续从当前结点向下进行堆调整
        heap_ify(data, max_i, size)


def build_heap(data, length):
    """构建一个堆

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :param length 数组长度
    :type length int
    :example length 4
    """
    heap_size = length
    for i in range(heap_size / 2 - 1, -1, -1):
        heap_ify(data, i, heap_size)
    return heap_size


def heap_sort(data):
    """堆排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(nlogn)
    最优时间复杂度： O(nlogn)
    平均时间复杂度： O(nlogn)
    所需辅助空间： O(1)
    稳定性： 不稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]
    """
    length = len(data)

    # 建立一个最大堆
    heap_size = build_heap(data, length)

    # 堆（无序区）元素个数大于1，未完成排序
    while heap_size > 1:
        # 将堆顶元素与堆的最后一个元素互换，并从堆中去掉最后一个元素
        # 此处交换操作很有可能把后面元素的稳定性打乱，所以堆排序是不稳定的排序算法
        heap_size -= 1
        data[0], data[heap_size] = data[heap_size], data[0]
        heap_ify(data, 0, heap_size)  # 从新的堆顶元素开始向下进行堆调整，时间复杂度O(logn)


def main():
    """排序
    """
    data = [4, 3, 2, 1]
    print data
    heap_sort(data)
    print data


if __name__ == '__main__':
    main()

```

## 快速排序
在平均状况下，排序n个元素要O(nlogn)次比较。在最坏状况下则需要O(n^2)次比较，但这种状况并不常见。事实上，快速排序通常明显比其他O(nlogn)算法更快，因为它的内部循环可以在大部分的架构上很有效率地被实现出来。

### 原理
快速排序使用分治策略(Divide and Conquer)来把一个序列分为两个子序列。步骤为：

1.从序列中挑出一个元素，作为"基准"(pivot).

2.把所有比基准值小的元素放在基准前面，所有比基准值大的元素放在基准的后面（相同的数可以到任一边），这个称为分区(partition)操作。

3.对每个分区递归地进行步骤1~2，递归的结束条件是序列的大小是0或1，这时整体已经被排好序了。

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def partition(data, left, right):
    """划分函数

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :param left 数组起始位置下标
    :type left int
    :example left 0

    :param right 数组截止位置下标
    :type right int
    :example right 3

    :rtype pivot_index int
    :return pivot_index 分割左右两边的下标值
    :example pivot_index 0
    """
    pivot = data[right]  # 每次都选择最后一个元素作为基准
    tail = left - 1  # 小于基准的子数组最后一个元素的索引
    for i in range(left, right):
        if data[i] <= pivot:
            tail += 1
            data[i], data[tail] = data[tail], data[i]
    pivot_index = tail + 1
    data[right], data[pivot_index] = data[pivot_index], data[right]
    return pivot_index


def quick_sort(data, left, right):
    """快速排序

    分类： 内部比较排序
    数据结构： 数组
    最差时间复杂度： O(n^2)每次选取的基准都是最大（或最小）的元素，导致每次只划分出了一个分区，需要进行n-1次划分才能结束递归
    最优时间复杂度： O(nlogn)每次选取的基准都是中位数，这样每次都均匀的划分出两个分区，只需要logn次划分就能结束递归
    平均时间复杂度： O(nlogn)
    所需辅助空间： 主要是递归造成的栈空间的使用(用来保存left和right等局部变量)，取决于递归树的深度，一般为O(logn)，最差为O(n)
    稳定性： 不稳定

    :param data 被排序的数组
    :type data list
    :example data [4, 3, 2, 1]

    :param left 数组起始位置下标
    :type left int
    :example left 0

    :param right 数组截止位置下标
    :type right int
    :example right 3
    """
    if left >= right:
        return

    pivot_index = partition(data, left, right)
    quick_sort(data, left, pivot_index - 1)
    quick_sort(data, pivot_index + 1, right)


def main():
    """排序
    """
    data = [4, 3, 2, 1]
    print data
    quick_sort(data, 0, len(data) - 1)
    print data


if __name__ == '__main__':
    main()
```

## 计数排序
计数排序用到一个额外的计数数组C，根据数组C来将原数组A中的元素排到正确的位置。

计数排序的时间复杂度和空间复杂度与数组A的数据范围（A中元素的最大值与最小值的差加上1）有关，**因此对于数据范围很大的数组，计数排序需要大量时间和内存。**

### 原理
计数排序的步骤如下：

1.统计数组A中每个值A[i]出现的次数，存入C[A[i]]

2.从前向后，使数组C中的每个值等于其与前一项相加，这样数组C[A[i]]就变成了代表数组A中小于等于A[i]的元素个数

3.反向填充目标数组B：将数组元素A[i]放在数组B的第C[A[i]]个位置（下标为C[A[i]] - 1），每放一个元素就将C[A[i]]递减

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def counting_sort(data, k):
    """计数排序

    分类： 内部非比较排序
    数据结构： 数组
    最差时间复杂度： O(n + k)
    最优时间复杂度： O(n + k)
    平均时间复杂度： O(n + k)
    所需辅助空间：  O(n + k)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [2, 4, 3, 6]

    :param k 基数,必须大于数组中最大数，在当例中 k 允许的最小值为 7
    :type k int
    :example k 7

    :rtype data list
    :return data 排序后的数组
    :example data [2, 3, 4, 6]
    """
    length = len(data)
    cnt = [0] * k  # 计数数组

    # 使 cnt[i] 保存着 i 元素的个数
    for i in range(length):
        cnt[(data[i])] += 1

    # 使cnt[i]保存着小于等于i的元素个数，排序后元素i就放在第cnt[i]个输出位置上
    for i in range(1, k):
        cnt[i] = cnt[i] + cnt[i - 1]

    # 分配临时空间
    temp = [0] * length

    # 从后向前扫描保证计数排序的稳定性(重复元素相对次序不变)
    for i in range(length - 1, -1, -1):
        cnt[data[i]] -= 1
        # 把每个元素data[i]放到它在输出数组B中的正确位置上
        # 当再遇到重复元素时会被放在当前元素的前一个位置上保证计数排序的稳定性
        temp[cnt[data[i]]] = data[i]
    data[:] = temp[:]


def main():
    """排序
    """
    data = [2, 4, 3, 6]
    print data
    counting_sort(data, 7)
    print data


if __name__ == '__main__':
    main()
```

## 基数排序
将所有待比较正整数统一为同样的数位长度，数位较短的数前面补零。然后，从最低位开始进行基数为10的计数排序，一直到最高位计数排序完后，数列就变成一个有序序列（利用了计数排序的稳定性）。

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def get_digit(x, d):
    """获取元素 x 的第 d 位数字

    :param x 被排序的数组中的某个数字
    :type x int
    :example x 123

    :param d 要获取x中的第几位数
    :type d int
    :example d 2
    """
    return x / 10 ** (d - 1) % 10


def counting_sort(data, length, d, k):
    """依据元素的第d位数字，对 data 数组进行计数排序


    :param data 被排序的数组
    :type data list
    :example data [20, 90, 64, 289, 998, 365, 852, 123, 789, 456]

    :param length 被排序的数组长度
    :type length int
    :example length 3

    :param d 待排序元素的位数
    :type d int
    :example d 3

    :param k 基数，每个元素单个数字的值范围
    :type k int
    :example k 10

    :rtype temp list
    :return temp 计数排序后的数组
    :example temp [20, 90, 852, 123, 64, 365, 456, 998, 289, 789]
    """
    cnt = [0] * k
    for i in range(length):
        cnt[get_digit(data[i], d)] += 1

    for i in range(1, k):
        cnt[i] = cnt[i] + cnt[i - 1]

    temp = [0] * length
    for i in range(length - 1, -1, -1):
        # 元素A[i]当前位数字为digit
        digit = get_digit(data[i], d)
        cnt[digit] -= 1

        #  根据当前位数字，把每个元素data[i]放到它在输出数组B中的正确位置上
        # 当再遇到当前位数字同为digit的元素时，会将其放在当前元素的前一个位置上保证计数排序的稳定性
        temp[cnt[digit]] = data[i]
    return temp


def radix_sort(data, k, d):
    """基数排序

    分类： 内部非比较排序
    数据结构： 数组
    最差时间复杂度： O(n * dn)
    最优时间复杂度： O(n * dn)
    平均时间复杂度： O(n * dn)
    所需辅助空间：  O(n * dn)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [20, 90, 64, 289, 998, 365, 852, 123, 789, 456]

    :param k 基数，每个元素单个数字的值范围
    :type k int
    :example k 10

    :param d 待排序元素的位数
    :type d int
    :example d 3

    :rtype temp list
    :return temp 排序后的数组
    :example temp [20, 64, 90, 123, 289, 365, 456, 789, 852, 998]
    """
    length = len(data)
    for d in range(1, d + 1):
        data = counting_sort(data, length, d, k)
    return data


def main():
    """排序
    """
    data = [20, 90, 64, 289, 998, 365, 852, 123, 789, 456]
    print data
    print radix_sort(data, 10, 3)


if __name__ == '__main__':
    main()
```

## 桶排序

### 原理
桶排序也叫箱排序。工作的原理是将数组元素映射到有限数量个桶里，利用计数排序可以定位桶的边界，每个桶再各自进行桶内排序（使用其它排序算法或以递归方式继续使用桶排序）。

### 代码
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-


def insert_on_sort(data, left, right):
    """在有序的数据中插入

    :param data 被排序的数组
    :type data list
    :example data

    :param left 数组起始位置下标
    :type left int
    :example left 0

    :param right 数组截止位置下标
    :type right int
    :example right 3
    """
    for i in range(left + 1, right + 1):
        value = data[i]
        j = i - 1
        while j >= left and data[j] > value:
            data[j + 1] = data[j]
            j -= 1
        data[j + 1] = value


def map_to_bucket(x):
    """把数据分到桶中

    :param x 数组中的某个元素
    :type x int
    :example x 21

    :return x元素所在的桶号
    :rtype int
    :example 2
    """
    return x / 10


def counting_sort(data, length, bn):
    """计数排序

    :param data 被排序的数组
    :type data list
    :example data [29, 25, 3, 49, 9, 37, 21, 43]

    :param length 数组长度
    :type length int
    :example 4

    :param bn 桶的数量
    :type bn int
    :example bn 5

    :rtype cnt list
    :return cnt 计数数组，存放桶边界信息
    :example cnt [0, 2, 2, 5, 6]
    """
    cnt = [0] * bn  # 计数数组，存放桶边界信息
    # 使 cnt[i] 保存着 i 号桶中元素的个数
    for i in range(length):
        cnt[map_to_bucket(data[i])] += 1

    # 定位桶边界：初始时，cnt[i]-1为i号桶最后一个元素的位置
    for i in range(1, bn):
        cnt[i] = cnt[i] + cnt[i - 1]

    temp = [0] * length
    # 从后向前扫描保证计数排序的稳定性(重复元素相对次序不变)
    for i in range(length - 1, -1, -1):
        b = map_to_bucket(data[i])  # 元素data[i]位于b号桶
        cnt[b] -= 1
        # 把每个元素data[i]放到它在输出数组B中的正确位置上
        # 桶的边界被更新：C[b]为b号桶第一个元素的位置
        temp[cnt[b]] = data[i]
    data[:] = temp[:]
    return cnt


def bucket_sort(data, bn):
    """桶排序

    分类： 内部非比较排序
    数据结构： 数组
    最差时间复杂度： O(nlogn)或O(n^2)，只有一个桶，取决于桶内排序方式
    最优时间复杂度： O(n)，每个元素占一个桶
    平均时间复杂度： O(n)，保证各个桶内元素个数均匀即可
    所需辅助空间：  O(n + bn)
    稳定性： 稳定

    :param data 被排序的数组
    :type data list
    :example data [29, 25, 3, 49, 9, 37, 21, 43]

    :param bn 桶的数量
    :type bn int
    :example bn 5

    :rtype data list
    :return data 排序后的数组
    :example data [3, 9, 21, 25, 29, 37, 43, 49]
    """
    length = len(data)
    # 利用计数排序确定各个桶的边界
    cnt = counting_sort(data, length, bn)

    # 对每个桶中的元素进行插入排序
    for i in range(bn):
        left = cnt[i]  # cnt[i]为i号桶第一个元素的位置

        # cnt[i+1]-1为i号桶最后一个元素的位置
        right = length - 1 if (i == (bn - 1)) else cnt[i + 1] - 1
        if left < right:
            insert_on_sort(data, left, right)
    return data


def main():
    """排序
    """
    data = [29, 25, 3, 49, 9, 37, 21, 43]
    print data
    print bucket_sort(data, 5)


if __name__ == '__main__':
    main()
```

## 参考
[常用排序算法总结(一)](http://www.cnblogs.com/eniac12/p/5329396.html)

[常用排序算法总结(二)](http://www.cnblogs.com/eniac12/p/5332117.html)