---
icon: circle-info
#cover: /assets/images/cover3.jpg
---

# 介绍页

<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem; margin: 2.5rem 0; width: 100%; max-width: 900px; margin-left: auto; margin-right: auto; padding: 0 0.5rem; box-sizing: border-box;">

  <!-- Github Stats Card -->
  <a href="https://github.com/anuraghazra/github-readme-stats" target="_blank" rel="noopener noreferrer" style="flex: 1 1 380px; max-width: 420px; text-align: center; min-width: 280px;">
    <h3 style="margin: 0.4rem 0 0.8rem; font-size: 1.25rem;">Github Stats</h3>
    <img
      src="https://github-readme-stats.vercel.app/api?username=Chinasd1st&show_icons=true&count_private=true&hide=contribs&hide_border=true&bg_color=00000000&text_color=888888&icon_color=7dd3fc&title_color=60a5fa"
      alt="GitHub Stats"
      style="width: 100%; height: auto; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.08); transition: transform 0.3s ease, box-shadow 0.3s ease; display: block;"
      @mouseover="this.style.transform='scale(1.04)'; this.style.boxShadow='0 10px 40px rgba(0,0,0,0.12)'"
      @mouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 6px 24px rgba(0,0,0,0.08)'"
    />
  </a>

  <!-- Top Languages Card -->
  <a href="https://github.com/anuraghazra/github-readme-stats" target="_blank" rel="noopener noreferrer" style="flex: 1 1 300px; max-width: 340px; text-align: center; min-width: 280px;">
    <h3 style="margin: 0.4rem 0 0.8rem; font-size: 1.25rem;">Top Languages</h3>
    <img
      src="https://github-readme-stats.vercel.app/api/top-langs/?username=Chinasd1st&layout=compact&hide_border=true&bg_color=00000000&text_color=888888&title_color=60a5fa&icon_color=7dd3fc&langs_count=8"
      alt="Top Languages"
      style="width: 100%; height: auto; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.08); transition: transform 0.3s ease, box-shadow 0.3s ease; display: block;"
      @mouseover="this.style.transform='scale(1.04)'; this.style.boxShadow='0 10px 40px rgba(0,0,0,0.12)'"
      @mouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 6px 24px rgba(0,0,0,0.08)'"
    />
  </a>

  <!-- WakaTime Stats Card -->
  <a href="https://wakatime.com/@Silentnrtx" target="_blank" rel="noopener noreferrer" style="flex: 1 1 380px; max-width: 420px; text-align: center; min-width: 280px;">
    <h3 style="margin: 0.4rem 0 0.8rem; font-size: 1.25rem;">WakaTime Stats</h3>
    <img
      src="https://github-readme-stats.vercel.app/api/wakatime?username=Silentnrtx&custom_title=Silentnrtx%27s%20WakaTime%20Stats&langs_count=9&hide_border=true&bg_color=00000000&text_color=888888&icon_color=7dd3fc&title_color=60a5fa"
      alt="Silentnrtx's WakaTime Stats"
      style="width: 100%; height: auto; border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.08); transition: transform 0.3s ease, box-shadow 0.3s ease; display: block;"
      @mouseover="this.style.transform='scale(1.04)'; this.style.boxShadow='0 10px 40px rgba(0,0,0,0.12)'"
      @mouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 6px 24px rgba(0,0,0,0.08)'"
    />
  </a>

</div>

<div style="text-align: center; margin: 3rem 0 2rem;">

  <h2 style="margin: 0.5rem 0;">🖼️ 头像来源</h2>
  <p style="margin: 0.5rem 0; font-size: 1.05rem;">
    <strong>From:</strong> <a href="https://sp6.diverse.jp/">Stream Palette 6 -CHATTING-</a><br>
    <strong>Illustrator:</strong> FAMY / ふぁみ  <a href="https://x.com/famy_siraso">@famy_siraso</a>
  </p>
</div>

<div style="text-align: center; margin: 3rem 0; padding: 1.5rem 1rem; background: var(--vp-c-bg-soft); border-radius: 12px; font-size: 0.95rem;">

  <h2 style="margin: 0 0 1.2rem;">📈 访问统计</h2>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem 1rem; max-width: 500px; margin: 0 auto;">
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>今日访问量</strong><br>
      <span id="busuanzi_today_pv" style="font-size: 1.4rem; font-weight: bold;">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 次
    </div>
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>今日访客</strong><br>
      <span id="busuanzi_today_uv" style="font-size: 1.4rem; font-weight: bold;">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 人
    </div>
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>总访问量</strong><br>
      <span id="busuanzi_site_pv" style="font-size: 1.4rem; font-weight: bold;">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 次
    </div>  
    <div style="padding: 1rem;  border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <strong>总访客数</strong><br>
      <span id="busuanzi_site_uv" style="font-size: 1.4rem; font-weight: bold;">
        <i class="fa fa-spinner fa-spin"></i>
      </span> 人
    </div>
  </div>
</div>
