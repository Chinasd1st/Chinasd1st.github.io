---
date: 2026-10-06
category:
    - 计算机技术
tags: 
    - 3D
    - Blender
    - MMD
    - MikuMikuDance
    - 建模
icon: code
# description: 
# cover: /img/Cover/2026.6.15/cover.webp
---

# Blender MMD 最简通用步骤

本文是Blender中MMD制作的最小化、普适化的制作步骤简述，仅用作制作参考，不能适用于所有情形与自定义要求较高的场景。

[[toc]]

## 0. 环境

- Blender 5.0+ ，作者使用的版本为 Blender 5.2.2 LTS，最后更新于 2026年9月15日。Blender LTS (Long-term support) 版本支持时限为两年，而普通版本则支持至下一个版本发布。目前支持版本请参阅下图：

![0.1 Blender EoF，https://endoflife.date/blender.svg](https://endoflife.date/blender.svg)

- 插件 `bl_ext.blender_org.mmd_tools`（4.x 扩展版）。以下所有演示均基于该环境。

### 0.1. Blender 及相关扩展安装

1. 访问[Blender - The Free and Open Source 3D Creation Software — blender.org](https://www.blender.org/)，点击顶部导航栏的`Download`，跳转至 Blender 下载页面。按需选择版本即可，其中 Portable 版本是`.zip`压缩包，不执行安装，即点即用。
2. 安装后，打开 Blender，点击菜单栏 `Edit/编辑` → `Preferences/偏好设置...` → `获取扩展` → 搜索 "MMD Tools" → 点击安装即可。（或：访问<https://extensions.blender.org/add-ons/mmd-tools>，参照页面指示进行安装即可。）

![MMD Tools v4.5.14](/img/2026.10.6/0.1.1.webp)

### 0.2. 制作前需要你需要知晓的内容

#### 0.2.1. EEVEE & Cycles

1. 属性面板中`渲染`菜单中Scene部分：有两个渲染引擎可供选择，分别是 EEVEE 和 Cycles 。其中：
   1. EV 为实时光栅化渲染，使用屏幕空间近似，渲染速度极快，适合 MMD 场景使用。
   2. Cy 为真实路径追踪，物理正确但耗时较长。常适用于单帧渲染。若需要使用，务必在 `Edit/编辑` → `Preferences/偏好设置...` → `系统` → `Cycles 渲染设备` 中，N 卡选 OptiX（通常比 CUDA 快）；A 卡选 HIP。当渲染更简单的场景或使用更简单的材质时， CUDA 往往会更快，而 OptiX 对于具有大量反射和折射的更复杂场景来说速度更快。
2. 对于EV：渲染采样一般选择 64，预览 16，视场景复杂程度可以自由修改。

## 1. 导入

安装 MMD Tools 后在画面视口（3D 视图）右上角看到`<`箭头，点击，出现一侧边栏，打开 MMD Tools 菜单即可。

### 1.1 PMX 模型

PMX 模型是人物模型。后缀为 PMX 的模型一律在`模型`区导入。

模型下载：模之屋：https://www.aplaybox.com/

### 1.2 VMD 动作/摄像机

VMD 是人物动作或摄像机文件。

导入人物动作时，在大纲视图选中人物骨骼（常被命名为 `xxx_arm`），看到人物骨骼八面体出现橙色高亮即可在 MMD Tools 中的`运动`区导入。

导入摄像机也是类似的。若导入成功，在动画面板可以看到关键帧。

## 2. 物理

物理一般随 PMX 模型已经绑定至人物骨骼。例如头发、裙摆、衣服等。

### 2.1. MMD Tools 烘焙

#### 2.1.1. 装配

选中人物骨架后，在`装配`区域点击`全部`。MMD Tools就会自动进行装配。

#### 2.1.2. 烘焙

装配后，需要进行物理烘焙。烘焙（bake）即进行预先解算+固化的过程。在`刚体物理`区域调整合适的参数范围：

| 参数 | 推荐范围 | 说明 |
| --- | --- | --- |
| **Substeps（子步）** | `4–8` | 低于 `4` 易穿透，高于 `8` 收益低 |
| **Iterations（迭代）** | `10–20` | 约束常用区间 |

- Substeps 线性增加成本，换取更细的时间分辨率。穿透率降低。
- Iterations 指数增加成本（边际递减），越大，约束残差越小，接触和关节越稳定。

注意烘焙物理必须从首帧开始，不然会有意料之外的后果。

### 2.2. NexGiMa 烘焙

NexGiMa 是由 猫のしもべ（@mmd_neko）开发的兼容软件。参见[NexGiMa — 猫の毛づくろい](https://www.nekosmb.com/nexgima/)。以下为操作方式[^1]：

[^1]: <https://site-builder.wiki/posts/69095>

1. 菜单 → 「ツール > キー焼き込み」（工具 > 键烘焙）
2. 勾选 「物理焼き込み」（物理烘焙）
3. 在 「ベイク用物理演算設定」选预设
4. 设烘焙帧范围 → OK 开始

### 2.3. MMD 桥烘焙

UP主 rint- 通过 [AiMiDi/mmdbridge](https://github.com/AiMiDi/mmdbridge) 实现了vmd烘焙。这一软件要求使用 MikuMikuDance 本体并安装 DirectX End-User Runtimes (June 2010)、Microsoft Visual C++ Redistributable ，本文在此不展开叙述。参见：

<https://www.bilibili.com/opus/1102730546871533640>
<https://github.com/rintrint/mmdbridge>

## 3. 场景

场景依旧可以无脑模之屋下载。下载完的`.blend`文件直接将所有场景集合拖入即可，也可在开始做的时候直接点开`.blend`文件，免去导入这一步。

## 4. 导出

导出直接在`属性`面板选择`输出`，一般导出 PNG 序列，这样做一来可以断点续渲（接着上次渲染的进度渲染），另一方面可以避免 Blender 莫名闪退导致的 crash。

### 4.1. 分辨率

一般1920*1080即可。

### 4.2. 色彩

一般标准即可。渲染面板胶片处勾选透明可以隐藏世界背景，输出透明底内容。

### 4.3. 帧率

VMD动作一般为30帧，若要扩充至60帧，可以在`Animation/动画`面板进行插帧，方法为选中人物骨骼，看到关键帧，单击`S`进入缩放模式，随后单击`2`表示扩充一倍。注意同样扩充表情关键帧。但是一般不推荐，因为会导致渲染导出时长翻倍。

可以使用[nihui/rife-ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan)这一跨平台 vulkan 插帧软件进行插帧，节省大量时间。

### 4.4. 光追

场景光源较多、材质复杂（如皮革反光质感）时可以打开。否则没有必要。

## 5. 合成

可以直接FFmpeg（frame%04d.png 按需修改，这里指形如 `frame0001.png` 的 png 序列）：

```bash
ffmpeg -framerate 30 -i frame%04d.png -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:v libx264 -crf 18 -movflags +faststart output.mp4
```

GPU加速添加`-hwaccel`即可。

如果有透明通道：

```bash
... -c:v prores_ks -pix_fmt yuva444p10le
```

也可以 Premiere 中导入 png 序列。

## 6. FAQ♂

1. Q: **模型贴图乱码导致贴图加载失败怎么办？**
   A：这种现象常出现于日本作者分享的模型。解压时（以Bandizip为例）代码页勾选日语（Shift-JIS）即可。

2. Q：**怎么切换成摄像机视角？**
   A：Numpad 小键盘 `0`。Numpad `1`/`3`/`7` = 前/右/顶视图

3. Q：**快速切换视图着色方式？**
   A：`Z`键长按，然后鼠标拖动到你想要的视图（线稿、材质等）。

4. Q：**两个物体重叠移动视角画面闪烁？**
   A：**Z-fighting**现象，此时：
   $$ z_{\text{buffer}} \text{精度} < |z_1 - z_2| $$
   拉开间距即可。
