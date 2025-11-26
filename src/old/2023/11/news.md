---
prev: Mountain.md
date: 2023-11-01
category:
  - 存档
  - 小奶奶二创作品
  - 视频
---
<!--
<style>
.aplayer .aplayer-info .aplayer-music .aplayer-title {
    font-size: 14px;
    color: #3c3c43 !important;
    }
span.aplayer-list-title {
    color: #3c3c43 !important;
}
</style>-->

# 小奶奶新闻

你说得对，但这里是小奶奶新闻，记录学校中一些十分女性的事情。

:::important

1. 下列内容由于发布时间较久，不能代表真实情况或声明作者立场
2. 视频源由境外cdn提供，可能无法正常播放。

:::

## 2023.11.1 赤道联赛第N届暨ABN联赛相关奖项颁奖仪式于今日举行

今日，桐乡市现代实验学校举行了桐乡市现代实验学校第N届赤道联赛和第三届ABN联赛相关颁奖仪式。比赛采用车轮战的形式，分成了以下三组：

|项目/队伍|超级谢玄度|超级陶通明|蓝紫镭射|
|:---|----|----|----|
|得分|1|1|2|
|胜负|负|负|胜|

因此，蓝紫镭射最终获得了第N届赤道联赛的冠军。

### ABN联赛

此次ABN联赛中，风力发电选手以一击三分球拿下了比赛的冠军。

此外，我们还颁发了亚洲首届孤独摇滚奖——

***PS：建议在查看新闻内容的同时播放下方音乐：***

:::details 网易云Playlist：https://music.163.com/#/playlist?id=7721557249

<Meting mid="7721557249" type="playlist" api="https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r"/>

上方歌曲自动更新，部分歌曲需VIP无法完整播放
:::

获奖者是：王浩宇。他在场外一直跳着女性舞蹈，表现十分优异，便获得了此次亚洲孤独摇滚奖。

## 2023.11.3 ABN，又

让人难以置信的是，我们的ABN联赛已经举行了四届，不可否认的是，各位选手的表现都十分的抽象。

如果说你曾经参加过ABN联赛，那你就一定知道它的趣味何在。毋庸置疑的是，ABN联赛凭借它十分有趣味的比赛规则，打动了许多运动员的心。

十一月三日的比赛中，风力发电选手又表演了十分Funny的投篮技巧，这让人忍俊不禁。

## 2023.11.10 军训归来有感

虽然有点疲惫，但也具有趣味。桐乡市现代实验学校的八年级同学们于近日结束了军训活动。在本次活动中，班中的小奶奶和小爷爷们也发明了不少的新梗。以下是部分新梗：

- 零星泰国人
- $\sqrt{\text{勾勾}}$
- 丁小萍家庭厨房 × 必胜客
- 缘缘书店 × 趣多多
- 我内裤掉地上了

（您可通过 [vip教育群聊](https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=VRnEPogqyIeEuZJlrm3vh5A7vIdYB09m&authKey=HPTZVJLaoL8Aq1u%2FfljTeR8GMfaqQvy%2F2Bvv9eOwkhnDuznzl6e7tIdkv9%2FP4uvG&noverify=0&group_code=344500534) 向我们提交更多有趣的梗）

## 2023.11.21 Python移位加密实例

你说得对，但是移位加密是一种十分常见的加密方式，甚至2022年的**嘉兴市中小学生信息技术测试**其中的一道大题也与移位加密算法有关。

::: code-tabs

@tab 加密

```python
def encrypt():
    temp = raw_input("Please input your sentence: ")
    key = int(raw_input("Please input your key: "))
    listA = map(ord, temp)
    lens = len(listA)
    for i in range(lens):
        a = listA[i]
        if 65 <= a <= 90:
            a += key
            while a > 90:
                a -= 26
        elif 97 <= a <= 122:
            a += key
            while a > 122:
                a -= 26
        listA[i] = a
    listA = map(chr, listA)
    listA = ''.join(listA)
    print listA
```

@tab 解密

```python
def unencrypt():
    temp = raw_input("Please input your sentence: ")
    key = int(raw_input("Please input your key: "))
    listA = map(ord, temp)
    lens = len(listA)
    for i in range(lens):
        a = listA[i]
        if 65 <= a <= 90:
            a -= key
            while a < 65:
                a += 26
        elif 97 <= a <= 122:
            a -= key
            while a < 97:
                a += 26
        listA[i] = a
    listA = map(chr, listA)
    listA = ''.join(listA)
    print listA
```

@tab 调用

```python
a = int(raw_input("input 0 to encrypt and 1 to unencrypt"))

if a == 0:
    encrypt()
elif a == 1:
    unencrypt()
```

@tab 加解密代码差别

```py
def encrypt(): # [!code --]
def unencrypt(): # [!code ++]
    temp = raw_input("Please input your sentence: ")
    key = int(raw_input("Please input your key: "))
    listA = map(ord, temp)
    lens = len(listA)
    for i in range(lens):
        a = listA[i]
        if 65 <= a <= 90:
            a += key # [!code --]
            a -= key # [!code ++]
            while a > 90:
                a -= 26 # [!code --]
                a += 26 # [!code ++]
        elif 97 <= a <= 122:
            a += key # [!code --]
            a -= key # [!code ++]
            while a > 122:
                a -= 26 # [!code --]
                a += 26 # [!code ++]
        listA[i] = a
    listA = map(chr, listA)
    listA = ''.join(listA)
    print listA
```

:::

## 2023.11.23 Function学习有感

现在是2023年11月23日下午四点三十分。我是现代实验学校的一名学生，正上着数学理科班。此时，窗外突然传来一阵爽朗的笑声，我转头一看，是信息技术老师虞国祥老师。

何跃胜老师此时接了一个电话，可能是冯晓杰老师打来的，他出去了一会。

话说三人最近正沉迷于打红十无法自拔，冯晓杰红十瘾突然犯了，便邀请何跃胜来他家里打红十。以下是两人的对话：

*何跃胜*：哈哈，这把我又赢了。话说最近我在教学生们函数（Function）

*冯晓杰*：哈哈，这不是我们Python里的梗吗，下次使用记得标明出处。

>你说得对，但是，Python函数是组织好的，可重复使用的，用来实现单一，或相关联功能的代码段。函数能提高应用的模块性，和代码的重复利用率。

```python
def woAiDaHongShi():
    print('求你了，让我打红十吧')

woAiDaHongShi()
```

*虞国祥*：哈哈，我学前端，用JavaScript

```javascript
function woAiDaHongShi() { // 声明函数
    document.getElementById("woAiDaHongShi").innerHTML = "woAiDaHongShi";
}
 
woAiDaHongShi(); // 调用函数
```

*何跃胜看了也很是高兴，不禁开了几瓶啤酒，三人一起宿醉了。（完）

### 视频

<!--<video controls width=510>
    <source src="https://jsd.onmicrosoft.cn/gh/chinasd1st/chinasd1st.github.io/videos/news/2023_11_26/2023_11_26_hongshi.mp4" type="video/mp4"/>
    <source src="https://chinasd1st.github.io/videos/news/2023_11_26/2023_11_26_hongshi.mp4"/>
</video>-->

<VidStack
    src="https://chinasd1st.github.io/videos/news/2023_11_26/2023_11_26_hongshi.mp4"
/>
<!--注意修改此处视频后缀名-->

## 2023.11.29 本学期最抽象的一场ABN联赛

你说得对，但是今天我们举行了本学期最抽象的一场ABN联赛。大致参赛人员如下：

| 日期/进球数/球员 | 王浩宇 | 赵奕辉 | 冯圣杰 | 王李惜 | 黄睿涵 | 陈煜波 |
| ---------------- | ------ | ------ | ------ | ------ | ------ | ------ |
| 2023.11.29       | /      | 1      | 1-2    | /      | /      | 0      |
| 2023.12.01       | 14     | 6      | 9      | 0      | 14     | /      |

我们都知道，ABN联赛以它的抽象性和无序性著称，因此，ABN联赛也被人称作没母联赛，足以看出它的没母性。而本次联赛更是将这一特性体现得淋漓精致。

王浩宇先生的校服在本次联赛后基本已经报废，他也是向王李惜先生提出了赔偿请求。

而其他有些哥们在赛场边若无事事地讨论着一些话题，比如冯圣杰是不是[萝莉](https://mzh.moegirl.org.cn/萝莉)控，这是一个问题。

注：[小鸟游六花 - 萌娘百科_万物皆可萌的百科全书](https://mzh.moegirl.org.cn/小鸟游六花)

## 2023.12.1 想不到你也有登上非诚勿扰的一天

🔞爸妈不在家🔞
🥵一个人寂寞🥵
❤️想打红十了❤️
🔞同城空降🔞
🥵劲爆红十🥵

你说得对，但是红十是流行于吉林地区的纸牌游戏。有红十的玩家为一队，先全出完牌的一队胜利。不同地区的玩法略有不同，参加游戏的人数从四人到六人不等。

何跃胜先生作为一名专业的红十玩家，抱着试一试的心态参加了非诚勿扰。

孟非：......有请下一位男嘉宾登场。

（何跃胜拿着他的红十牌闪亮登场）

孟非：你好男嘉宾，介绍一下你自己。

何跃胜：大家好，我叫何跃胜，来自桐乡市现代实验学校。

（掌声）

孟非：好，那么话不多说，我们先看一段VCR

（以下为VCR内容）

何跃胜：大家好，我是来自现代实验学校的何跃胜，是一位数学老师。平常，我总会在数学课上向各位同学们传授自己的教学经验以及解题技巧。除此之外，我上课还喜欢批驳那些罕见，我认为，他们吃着国家的饭，还帮着立本人说好话，简直是脸都不要了，让他们去吃立本人的狗粮吧！我们中国不差这些人！平日里，我最喜欢的休闲娱乐活动是打红十，红十是一个很考验脑力的益智游戏，当然，你数学好的人打红十肯定也不会差。我总是喜欢约上三五好友，一起打上几把红十，这样，一日里的疲惫就全部被消除了。无论如何，我都推荐你打红十，因为这有助于开发你的智力。

（0/24）

男嘉宾遗憾离场。

女嘉宾代表：额，我其实很敬佩男嘉宾的，这种职业。就是我其实不是很喜欢打红十。

（*回到现代实验学校后，何跃胜闷闷不乐。他准备去操场上散散步。811班的王浩宇一行人正在打篮球。）

王浩宇（*冲撞，投篮）

何跃胜：哈哈，一看你就不会打篮球，我教你。

王浩宇先生用力过猛，把何跃胜给zhuangsi了。何跃胜想着今天晚上的牌局，不禁感到遗憾。便掏出手机，给虞国祥打了个电话：抱歉，我今天可能来不了了。

此时，何跃胜的口袋中滑落出了一张纸片，正当众人感到疑惑时，王浩宇捡起一看：是一张红桃十。

原来何跃胜早在一个月之前就准备好了27张红十，准备今天爆杀虞国祥，但是不幸的是，何跃胜被篮球zhuangsi了。

### 视频

<!--<video controls width=510>
    <source src="https://jsd.onmicrosoft.cn/gh/chinasd1st/chinasd1st.github.io/videos/news/2023_12_02/feichengwurao.mp4" type="video/mp4"/>
    
    <source src="https://chinasd1st.github.io/videos/news/2023_12_02/feichengwurao.mp4" type="video/mp4"/>
</video>-->
<!--注意修改此处视频后缀名-->

<VidStack
    src="https://chinasd1st.github.io/videos/news/2023_12_02/feichengwurao.mp4"
/>

## 2023.12.15 鸿合智能电子教鞭-preview-0.0.2

点击此处下载[鸿合智能电子教鞭-preview-0.0.2](https://github.com/Chinasd1st/Electronic-whip/releases/tag/%E9%B8%BF%E5%90%88%E6%99%BA%E8%83%BD%E7%94%B5%E5%AD%90%E6%95%99%E9%9E%AD-preview-0.0.2)


### 视频：使用方法

本视频录制时本人感冒初愈，若有影响观感之处还请见谅
<!--<video controls  width=510>
    <source src="https://jsd.onmicrosoft.cn/gh/chinasd1st/chinasd1st.github.io/videos/news/2023_12_16/jiaobian.mp4" type="video/mp4"/>
    <source src="https://chinasd1st.github.io/videos/news/2023_12_16/jiaobian.mp4" type="video/mp4"/>

</video>-->
<!--注意修改此处视频后缀名-->

<VidStack
    src="https://chinasd1st.github.io/videos/news/2023_12_16/jiaobian.mp4"
/>

## 2024.1.7 BA标题生成器

![BA标题生成器](/img/2024.1.7/BAtitleGenerator.png)
[BA标题生成器（https://chinasd1st.github.io/BA_logo/）](https://chinasd1st.github.io/BA_logo/)

十分易用的BA标题生成器，可以用来整蛊QQ群友等。  
Forked from <https://github.com/ldcivan/BA_logo>

## 2025.1.4 杂谈

时隔将近一年，本网站新闻板块再度更新。过去一年里，发生了许多有意思的事情。接下来我们按时间顺序进行罗列。

**2024.1.28** 本网站站长，兼VIP教育群聊群主zyh，当天多次在群内刷屏，被ljn举报后群聊封禁7天，不得不建立新群（836173999）。

**2024.2.1** 期末考试结束后，ljn、fsj、zyh、syz、syc等人相聚桐乡市濮院镇，开展史诗级会面，共享宴酣之乐。

**2024.2.18** fsj上传自己跳绳视频于钉钉班级群，被zyh恶搞后连续7天发送视频至qq空间，同时还将群名称改为丁孩。

**2024.2.24** zyh拍摄一条自己带着有线耳机跳舞的视频，进行横宽比编辑后发送至群聊，被ljn转发。

**2024.3.2** zyh会在每个节假日至少发送一次@全体成员，如有群成员未及时回复，则有概率被禁言十五分钟，抽取代码由python编写。

**2024.3.23** 由于要准备三科竞赛，现代实验学校的英才班成员无法参加心理周活动，这引起了英才班成员的公愤，在现代视频号评论区公开讨伐。

**2024.3.25** zyh修订了论如何分析变态指数——变态指数的分析与测量一文，并打印出版

**2024.4.6** syz、zyh、fsj等人再次聚会，相聚于振石大酒店品用自助餐，同时留下了“春日饮”“你们自己去拿啊”等经典语录。令人感到有趣的是，聚会时群内成员dxr还未完成作业，因此她明显十分急眼。

**2024.4.10** 现代实验学校学生开展研学活动，活动在平湖澳多奇农庄展开。活动前夜，zyh同学打印了一份名为“朱元璋为什么保留他做过乞丐的历史”的野史知乎问答，并且引用评论“改成mygo就看不出来了(如下图，[来源](https://www.bilibili.com/video/BV1am411r773/))”，让人捧腹大笑。

![mygo](/img/2025.1.4/1-mygo.jpg)
![研学](/img/2025.1.4/2-yanxue.jpeg)

**2024.5.24** wlx妈妈在911（自建）群聊里说道：“分享一个炸裂的消息”“前天晚上放学，cyc在楼梯上看到两个七年级的在亲嘴\[笑哭\]\[笑哭\]”。

![亲嘴](/img/2025.1.4/3-kiss.jpeg)

**2024.6.1** 三科竞赛结束后正值儿童节，zyh、fsj、syc等人再次聚会于号外火锅雅道店，共享欢乐时光。

**2024.6.9** 高考。zyh在吾悦广场吃饭时偶遇陈煜波。

![cyb](/img/2025.1.4/4-cyb.jpeg)

（待完善）

## 2025.1.12 钻门

如下

<!--<video controls height=510>
    <source src="https://jsd.onmicrosoft.cn/gh/chinasd1st/chinasd1st.github.io/videos/news/2023_12_16/jiaobian.mp4" type="video/mp4"/>
    <source src="https://chinasd1st.github.io/videos/news/2025_01_12/video_20250112_145343.mp4" type="video/mp4"/>
    
</video>-->

<VidStack
    src="https://chinasd1st.github.io/videos/news/2025_01_12/video_20250112_145343.mp4"
/>

<!--
<link href="https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.css" rel="stylesheet">
<script src="https://cdn.bootcss.com/aplayer/1.10.1/APlayer.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js"></script>
<meting-js server="netease" type="playlist" id="7721557249" fixed="true"></meting-js>
-->
