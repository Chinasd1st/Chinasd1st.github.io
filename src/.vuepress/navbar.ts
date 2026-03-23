import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "旧文存档",
    icon: "box-archive",
    link: "/old/",
  },
  {
    text: "博文",
    icon: "book",
    link: "/post/"
  },
  {
    text: "子页面",
    icon: "pager",
    children: [
      { text: "黄睿涵导航页", link: "https://chinasd1st.github.io/pages/", icon: "compass" },
      { text: "蔚蓝档案标题生成器", link: "https://chinasd1st.github.io/BA_logo/", icon: "gears" },
      { text: "Material Player", link: "https://chinasd1st.github.io/material-music-3/", icon: "music" },
      { text: "CineTech Architecture", link: "https://chinasd1st.github.io/lensoptics-lab/", icon: "camera" }
    ],
  },
  {
    text: "v1.0.1",
    icon: "code-commit",
    children: [
      {
        text: "网站事宜",
        children: [
          { text: "更新历史", link: "UpdateHistory.html", icon: "clock-rotate-left" },
          { text: "FAQ", link: "/old/2023/10/ProblemsSolving.html", icon: "question" }
        ],
      },
      {
        text: "联系我们",
        children: [
          { text: "bilibili", link: "https://space.bilibili.com/520682236", icon: "fab:bilibili" },
          { text: "Github", link: "https://github.com/Chinasd1st", icon: "fab:github" },
          { text: "X (Twitter)", link: "https://x.com/Silentnrtx", icon: "fab:x-twitter" },
        ],
      }
    ],
  },
  {
    text: "订阅更新",
    icon: "rss", // 核心订阅图标（仅保留名称）
    children: [
      {
        text: "订阅格式",
        children: [
          { text: "RSS 2.0", link: "https://chinasd1st.github.io/rss", icon: "rss" },
          { text: "Atom 1.0", link: "https://chinasd1st.github.io/atom", icon: "atom" },
          { text: "JSON Feed", link: "https://chinasd1st.github.io/feed.json", icon: "file-code" }
        ],
      },
    ],
  },
]);
