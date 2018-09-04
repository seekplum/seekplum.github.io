---
layout: post
title: 数字字符串解码字符字符串
categories: algorithm
tags: algorithm
thread: algorithm
---
## 题目
假设有小写字母 a-z 分别对应 1-26，比如1->a 12-> ab 或者 l, 那么给定一串数字字符串，求可能的字母字符串组合次数？

## 跑偏的思路
第一次看到这个题目时，想到的便是求可能的字母字符串组合，而不是求次数。导致陷入于对字符串进行分割，按前后能否进行组合进行拆分，拆分后再去统计可以进行前后字符组合的排列情况，进而计算出所有的组合可能。

## 正确的思路
设定状态为：f[i]表示s从0开始，长度为i的子串的解码方式数量，于是我们最终要求的答案便是f[n]。

那么如何求解f[i]呢？这个很简单，枚举最后一个字母对应1位还是2位，将f转化为规模更小的子问题。

* 设f[i] = 0
* 枚举最后一个字母对应1位（要求s[i - 1] != '0')，那么有f[i] += f[i-1]；
* 枚举最后一个字母对应2位（要求i > 1且s[i - 2]和s[i - 1]组成的字符串在"10"~"26"的范围内），那么有f[i] += f[i - 2]；

也就是说，我们可以通过f[i - 1]和f[i - 2]计算出f[i]来，这就是我们的状态和转移方程。

## 代码
```python
# -*- coding: utf-8 -*-


def num_decoding(s):
    """计算数字字符串解码次数

    :param s:  数字字符串
    :type s: str
    :example s: "1234567"

    :rtype int
    :return 解码次数
    :example 3
    """
    if s is None or len(s) == 0 or s[0] == "0":
        return 0

    n = len(s)
    dp = [0 for _ in range(n + 1)]
    dp[0] = 1
    dp[1] = 1
    for i in range(2, n + 1):
        first = int(s[i - 1])
        second = int(s[i - 2: i])
        if first > 0:
            dp[i] += dp[i - 1]
        if 10 <= second <= 26:
            dp[i] += dp[i - 2]
    return dp[n]


def test():
    s = "1234510"
    print num_decoding(s)


if __name__ == '__main__':
    test()

```
