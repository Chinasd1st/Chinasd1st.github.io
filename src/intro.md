---
icon: circle-info
#cover: /assets/images/cover3.jpg
---

# 介绍页

<div style="display: flex; flex-direction: column; align-items: center; gap: 2.5rem; margin: 2rem 0 4rem; width: 100%; max-width: 100%; overflow-x: hidden;">

  <h2 style="margin: 0.5rem 0; color: var(--vp-c-brand);">Github Stats</h2>
  
  <!-- Stats Card -->
  <a href="https://github.com/anuraghazra/github-readme-stats" target="_blank" rel="noopener noreferrer" style="width: 100%; max-width: 500px; text-align: center;">
    <img
      src="https://github-readme-stats.vercel.app/api?username=Chinasd1st&show_icons=true&count_private=true&hide=contribs&hide_border=true&bg_color=00000000&text_color=888888&icon_color=7dd3fc&title_color=60a5fa"
      alt="GitHub Stats"
      style="width: 100%; height: auto; max-width: 500px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); transition: transform 0.3s; display: block; margin: 0 auto;"
      @mouseover="this.style.transform='scale(1.03)'"
      @mouseout="this.style.transform='scale(1)'"
    />
  </a>

  <!-- Top Langs -->
  <a href="https://github.com/anuraghazra/github-readme-stats" target="_blank" rel="noopener noreferrer" style="width: 100%; max-width: 400px; text-align: center;">
    <img
      src="https://github-readme-stats.vercel.app/api/top-langs/?username=Chinasd1st&layout=compact&hide_border=true&bg_color=00000000&text_color=888888&title_color=60a5fa&icon_color=7dd3fc&langs_count=8"
      alt="Top Languages"
      style="width: 100%; height: auto; max-width: 400px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); transition: transform 0.3s; display: block; margin: 0 auto;"
    />
  </a>
</div>

<div style="text-align: center; margin: 3rem 0 2rem;">

  <h2 style="margin: 0.5rem 0; color: var(--vp-c-brand);">🖼️ 头像来源</h2>
  <p style="margin: 0.5rem 0; font-size: 1.05rem;">
    <strong>From:</strong> <a href="https://sp6.diverse.jp/">Stream Palette 6 -CHATTING-</a><br>
    <strong>Illustrator:</strong> FAMY / ふぁみ  <a href="https://x.com/famy_siraso">@famy_siraso</a>
  </p>
</div>

<div style="text-align: center; margin: 3rem 0; padding: 1.5rem 1rem; background: var(--vp-c-bg-soft); border-radius: 12px; font-size: 0.95rem;">

  <h2 style="margin: 0 0 1.2rem; color: var(--vp-c-brand);">📈 访问统计</h2>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem 1rem; max-width: 500px; margin: 0 auto;">
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>今日访问量</strong><br>
      <span id="busuanzi_today_pv" style="font-size: 1.4rem; font-weight: bold; color: var(--vp-c-brand);">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 次
    </div>
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>今日访客</strong><br>
      <span id="busuanzi_today_uv" style="font-size: 1.4rem; font-weight: bold; color: var(--vp-c-brand);">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 人
    </div>
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>总访问量</strong><br>
      <span id="busuanzi_site_pv" style="font-size: 1.4rem; font-weight: bold; color: var(--vp-c-brand);">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 次
    </div>  
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>总访客数</strong><br>
      <span id="busuanzi_site_uv" style="font-size: 1.4rem; font-weight: bold; color: var(--vp-c-brand);">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 人
    </div>
  </div>
</div>
