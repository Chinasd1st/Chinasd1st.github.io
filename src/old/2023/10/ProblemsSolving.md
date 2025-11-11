---
date: 2023-10-28
category:
  - 存档
  - 网站事宜
---

# 问题解决

## WebsiteTechnicalProblems 网站技术问题

### Q1 为什么有时候“小奶奶诗集”界面中的播放器无法正常显示？

Why sometimes the player in the "Little Grandmother's Poetry Collection" interface **cannot be displayed** properly?

### 解决方案

出现这种情况是正常的，由于使用的是APlayer.js和Meting.js脚本，播放音乐时会从网易云音乐进行歌词、音频、封面文件的获取，如有存在速率或带宽限制，页面内容呈现时间会较长。此外，我们的网站托管在Github上，可能由于Github使用了境外服务器，导致加载时间较长。
  
It is normal for this situation to occur as we are using the APlayer.js and Meting.js scripts, which retrieve lyrics, audio, and cover files from Netease Cloud Music when playing music. If there are rate or bandwidth limitations, it may take longer for the page content to be presented. Additionally, our website is hosted on Github, and the use of overseas servers by Github may result in longer loading times.

## WebsiteContentProblems 网站内容问题

1. Copyright 版权  

    我们的网站一律使用[CC BY-NC-SA 4.0许可](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans)
    <p xmlns:cc="http://creativecommons.org/ns#" >*This work is licensed under <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC-SA 4.0<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="/icon/cc.svg"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="/icon/by.svg"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="/icon/nc.svg"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="/icon/sa.svg"></a></p>

2. Embed our page in your website 在您的网站中嵌入我们的页面

```html
<iframe src="https://chinasd1st.github.io"></iframe>
```
