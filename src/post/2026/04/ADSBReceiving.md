---
date: 2026-04-19
category:
    - 计算机技术
tags: 
    - SDR
    - 无线电
    - ADS-B
    - 航空
icon: satellite-dish
cover: /img/Cover/2026.4.19/cover.webp

---

# RTL-SDR + Dump1090 + Tar1090 搭建简单 ADS-B 接收系统

:::warning

本人不是专业的无线电玩家，文中如有差错，望请指正。

:::

## 前言

22年的时候不知怎地看到了 SDR 相关内容，于是心血来潮在网上购入了一套简单的 RTL-SDR 设备。后来因为各种原因被闲置了；近来闲的没事干又把它拿出来了。

由于本人所在城市出租车已近乎绝迹，同时附近也没有机场，所以这套设备只能用来听听广播啥的，除此之外就是用来接收 ADS-B 信号了。

:::note

这一设备现在疑似还有售：[HamGeek 100KHz-1.7GHz RTL08THFR+ SDR Radio Upconverter+1PPM TXCO RTL-SDR Receiver RTL2832U+R820T2 SDR](https://www.thanksbuyer.com/products/100khz-1-7ghz-rtl08thfr-sdr-radio-upconverter-1ppm-txco-rtl-sdr-receiver-rtl2832u-r820t2-sdr)，但是不知道为什么我这台没有上变频器的拨杆😡😡

:::

![RTL2832U，实际上就是电视棒，但是有 1PPM TCXO 温补晶振](/img/2026.4.19/02_RTL_SDR.webp)

:::note 无关内容

马航MH370飞机卫星通信系统（SATCOM）的 **Satellite Data Unit (SDU)** 在重新通电后，其内部的恒温控制晶体震荡器（OCXO）产生了明显的**温度暖机漂移**（warm-up drift）。研究者正是通过分析 Inmarsat 卫星数据中这种特征性的频率偏移，推断出 SDU 曾经历过较长时间的断电后重新上电，成为当时重要的技术线索之一。（Grok）[^1][^2]

:::

## Dump1090

[antirez/dump1090](https://github.com/antirez/dump1090) 提供了 ADS-B 信号解码功能，由于原仓库只提供了源码，所以我使用了 [gvanem/Dump1090](https://github.com/gvanem/Dump1090/) 这一编译、打包后的仓库。该仓库一站式地提供了 **receiver（接收）**, **decoder（解码）** 和 **web-server（服务器）**，用户除简单配置驱动外几乎可以傻瓜式操作。这一版本的 Dump1090 集成了 [Tar1090](https://github.com/wiedehopf/tar1090/) 这一现代化的 Web UI（其实我不知道它到底算什么），同时还使用了来自 [Tar1090-DB](https://github.com/wiedehopf/tar1090-db/) 的数据，可以直接解析出机场相关信息并显示在 UI 中。Web 端甚至还提供了一个高级的侧栏展示这一航班的相关信息。tar1090 在 Windows 上没有原生完整版本，所以使用这一集成版本是当前最优解（使用由社区维护的 Windows 移植版 dump1090，集成了 tar1090 的 web_root）。

### 安装

直接克隆整个仓库即可。或者点击 “Code” → “Download ZIP” 下载主分支。

```bash
git clone https://github.com/gvanem/Dump1090.git
```

### 使用与配置

首次使用直接运行：

```bash
.\dump1090.exe --interactive --net
```

可能会弹出要求用户选择地理位置的提示。可以按需填写或在 `dump1090.cfg` 中编辑`homepos` 字段。建议使用 Google Maps 等工具获取精确的经纬度信息。

```ini
homepos = lat, long # 经度和纬度
```

如果配置错误可能会提示：

```bash
All aircrafts failed 'global-dist check' (130, sum: 130).
Fix your "homepos = lat,lon" to continue.
```

因为 `homepos` 设置错误，导致程序认为所有接收到的飞机位置都“太远”。

配置无误即可正常使用。注意不要同时打开 SDRSharp 等软件防止 RTL-SDR 被异常占用报错。

```txt
ICAO   Callsign  Reg-num  Cntry  DEP  DEST  Altitude  Speed   Lat      Long    Hdg   Dist   Msg Seen /                 
780FA5 CBJ5901   B-8542   CN     HGH  TSN       2993    581  +30.172 +120.747  121   53.1   152   0 s                  
780F05 CDC8673   B-8336   CN     HGH  WEF       2049    338  +30.329 +120.493  293   34.0    37   0 s                  
781350 CDG1198   B-1230   CN     ZUH  WNZ       8255    744  +29.994 +120.857   13   75.3  1083   0 s                  
780291 CES2994   B-8561   CN     SHA  KOW       8110    824  +30.510 +120.112  215   46.3   725   0 s                  
781D9D CES510    B-328Z   CN     HKG  PVG       6412    705  +29.858 +121.315   23  111.1   864  58 s                  
781C50 CES5245   B-325T   CN     PVG  BHY       9169    889  +30.164 +119.805  210   90.1  2643   0 s                  
780606 CES9705   B-5265   CN     LUM  PVG       7943    766  +29.692 +120.977   57  110.8   551   0 s                  
780E29 CHH7210   B-6060   CN     HRB  CAN      10387    835  +30.356 +119.865  210   74.5  2030   0 s                  
781871 CHH7744   B-20E5   CN     HRB  NKG       7791    853  +30.110 +119.775  163   96.0  1419   1 s                  
780730 CSN3585   B-8869   CN     PVG  CAN       9466    821  +30.468 +120.008  213   57.2   642   0 s                  
78225B CSN3969     -      CN     CSX  PVG       7471    775  +29.826 +121.211   57  107.9  2136   0 s                  
888200 VJC5307     -      VN     NGB  CXR       3457    644  +29.980 +121.118  238   88.7   431   0 s   
```

![命令行输出](/img/2026.4.19/04_console.webp)

其中：

- **ICAO**：飞机全球唯一 24 位地址码
- **Callsign**：航班呼号
- **Reg-num**：飞机注册号
- **Cntry**：国籍
- **DEP / DEST**：起飞机场 / 目的地机场代码
- **Altitude**：海拔高度
- **Speed**：地面速度
- **Lat / Long**：经纬度
- **Hdg**：航向
- **Dist**：与你的距离
- **Msg / Seen**：接收报文数量与最后更新时间（60s未更新则移除）

:::warning

1. Dump1090 默认使用国际公制单位。若想使用海里、节、英尺等可以将下面字段改为 `false`。

    ```ini
    metric = true # Show units as metric.
    ```

:::

### 统计数据

`Ctrl + C` 退出后会展示统计信息，以下是其中比较重要的几项解读：

:::center

| 统计项目                        | 含义说明                                              |
| ------------------------------- | ----------------------------------------------------- |
| 2.6 M valid preambles           | 总共收到 **260 万个**有效前导码，数值越高信号质量越好 |
| 24964 demodulated with 0 errors | 完全没有错误的解码数量                                |
| 23073 with CRC okay             | 通过 CRC 校验、确认正确的消息数量                     |
| 1871 errors corrected           | 成功修复了 1871 条有错误的消息（纠错能力还挺强😇😇）  |
| 24944 total usable messages     | 最终真正能用的有效消息总数                            |
| 31 unique aircrafts             | 当前一共看到了**31 架**不同的飞机                     |
| 1 CPR errors                    | 只有 1 次位置解码出错（属于正常范围）                 |

:::

## Tar1090

### WebUI

`--interactive --net` 参数开启了交互模式，访问[http://localhost:8080/index.html](http://localhost:8080/index.html)即可打开 Tar1090。

![tar1090 Web UI](/img/2026.4.19/01_tar1090.webp)

本人身处华东地区，解析速度基本都维持在 **~100 msgs/s**，有时甚至能来到 **~150 msgs/s**。

### 图层叠加

点击画面右上角 ~~形似hololive logo的~~ legend图标可以选择地图样式和图层叠加。国内可以使用 **openAIP TMS** 图层来获取机场相关信息。

![openAIP TMS实例](/img/2026.4.19/06_openAIP_TMS.webp)

- **右侧（带跑道符号）**：**杭州萧山国际机场（ZSHC）**  
  这是杭州目前的主力 **4F级** 民用国际机场，标高约 7 米（MSL），塔台常用频率 118.300 MHz，最长跑道长度约 3599 米。

- **左侧（简单圆圈符号）**：**杭州笕桥机场（Jianqiao Airfield）**  
  标高约 13 米，曾是杭州的主要机场，目前主要用于军用和通用航空。

#### 航路图

由于国内的 Tar1090 没有 **Enroute Chart（航路图）**，无法直接在地图上显示标准的航路点（Waypoint）、航路（Airway）、VOR/DME 导航台、MEA（最低航路高度）等专业航空信息。

[SkyVector](https://skyvector.com/)是全球知名免费航图平台，虽然中国大陆地区的航路图覆盖不完整，但可查看周边国家或部分中国机场的 IFR Enroute 图。

![航路图](/img/2026.4.19/07_Enroute_Chart.webp)

:::note
下列内容参考[维基百科 - 杭州萧山国际机场](https://zh.wikipedia.org/wiki/%E6%9D%AD%E5%B7%9E%E8%90%A7%E5%B1%B1%E5%9B%BD%E9%99%85%E6%9C%BA%E5%9C%BA)
:::
图中：

- **HANGZHOU VOR/DME（杭州 VOR/DME）**
  - **识别码**：**HGH**
  - **频率**：**113.0 MHz**（VOR），通道 **CH 77**
  - **坐标**：**N30°14.46' E120°27.62'**
  - 这是杭州地区最主要的 VHF 全向信标兼测距设备（VOR/DME），用于飞机航路导航、进近引导和位置定位。

- **Hangzhou/Xiaoshan (ZSHC)**
  - **ATIS 频率**：**127.25 MHz**（自动终端情报服务，用于播报机场实时天气、跑道使用等信息）。

### KML 导出

Tar 1090 提供了 KML 导出功能，点击 UI 上的飞机图标打开侧栏，在“Export KML”处提供了三个选项，分别对应不同的高度参考系：

1. **geometric altitude (EGM96)**

    $$
    h = \text{EGM96}
    $$

    直接使用真实几何海拔

2. **baro + avg.(EGM96 - baro)**

    $$
    h = \text{baro} + \overline{\text{EGM96} - \text{baro}}
    $$

    对整条导出航迹中所有有效点的 $\Delta h$ 求平均值，然后把这个常量平均偏差加到每一点的 baro 高度上

3. **uncorrected pressure alt.**

    $$
    h = \text{baro}
    $$

    直接使用原始气压高度

其中 $\Delta h = (\text{EGM96} − \text{baro}) = \text{真实海拔} − \text{气压表读数}$。

不知为何本人尝试使用前两项进行导出时全都只有空文件。以下以第三个选项为例：
![KML 导入 Google Earth Pro](/img/2026.4.19/05_GEP.webp)

```xml :collapsed-lines
<?xml version="1.0" encoding="UTF-8"?>
<kml
  xmlns="http://www.opengis.net/kml/2.2"
  xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Folder  >
    <Folder  >
      <name  >B-1856 track</name>
      <Placemark  >
        <name  >B-1856</name>
        <Style  >
          <LineStyle  >
            <color  >ff1c1ae3</color>
            <width  >4</width>
          </LineStyle>
          <IconStyle  >
            <Icon  >
              <href  >http://maps.google.com/mapfiles/kml/shapes/airports.png</href>
            </Icon>
          </IconStyle>
        </Style>
        <gx:Track >
          <altitudeMode  >absolute</altitudeMode>
          <extrude  >1</extrude>
          <when  >2026-04-19T08:38:46.807Z</when>
          <when  >2026-04-19T08:38:37.007Z</when>
          <when  >2026-04-19T08:40:12.184Z</when>
          ···
          <when  >2026-04-19T08:50:48.602Z</when>
          <gx:coord >120.612757 30.319611 1600</gx:coord>
          <gx:coord >120.612757 30.319611 1600</gx:coord>
          <gx:coord >120.697394 30.216825 2918</gx:coord>
          ···
          <gx:coord >121.55198 30.507523 6332</gx:coord>
        </gx:Track>
      </Placemark>
    </Folder>
  </Folder>
</kml>

```

在导出的 KML 文件中，`<gx:Track>` 部分包含了飞机飞行轨迹的关键信息。

```xml
<altitudeMode>absolute</altitudeMode>
<extrude>1</extrude>
```

#### `<altitudeMode>absolute</altitudeMode>`

**absolute** 表示：**使用绝对海拔高度**（相对于平均海平面 MSL 的真实几何高度）。也就是说，`<gx:coord>` 中最后一个数值（如 1600、2918、6332）代表的是**距离海平面的实际高度**（单位为米）。

#### `<extrude>1</extrude>`

**extrude** 意为“挤出”；设置为 `1` 时，Google Earth 会从每个轨迹点**垂直向下拉一条线到地面**，形成投影，这样可以直观地看到飞机在不同位置的飞行高度变化，视觉效果更好。

#### `<gx:coord>`

```xml
<gx:coord>经度 纬度 高度</gx:coord>
```

例如：`120.612757 30.319611 1600` 表示：

- 经度：120.612757°
- 纬度：30.319611°
- 高度：1600 米（因为使用了 `absolute` 模式）

#### `<when>`

记录每个轨迹点对应的 **UTC 时间**，用于在 Google Earth 中播放飞行动画。

## 天线与天线摆放

ADS-B 信号工作在 1090MHz 垂直极化波。根据

$$
\lambda = \frac{c}{f} = \frac{3 \times 10^8}{1.090 \times 10^9} \text{m} \approx 0.275 \,\text{m} \approx 275 \,\text{mm}
$$

$$
L_{\frac{1}{4}\lambda} \approx \frac{275}{4} \text{mm} \approx 68.75 \,\text{mm}
$$

得出天线最佳长度应为 6 ~ 7cm。由于家里没有合适的同轴线，暂且用 25cm 的天线替代。ADS-B 信号是视距传播（Line-of-Sight, LOS），发射天线与接收天线在相互可视范围内，天线必须垂直竖立放置，倾斜或平放会造成信号剧烈衰减，几乎无法接收信号。

推荐某宝上直接购买专用 1090MHz 吸盘/胶棒天线。

![天线摆放，有点简陋致歉](/img/2026.4.19/03_aerial.webp)

[^1]: [MH370 Debris Drift Analysis (Updated). The Search for MH370. @Richard.](https://www.mh370search.com/2021/01/21/mh370-debris-drift-analysis/comment-page-2/)
[^2]: [也许这就是马航MH370离奇消失的真相（BV1Tg3vzXEww）. 哔哩哔哩. 掣驰工作室.](https://www.bilibili.com/video/BV1Tg3vzXEww/?t=1620)
