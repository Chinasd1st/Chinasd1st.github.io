import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "旧文存档",
    icon: "box-archive",
    children: [
      {
        text: "2023.08",
        children: [
          { text: "小奶奶诗集", link: "/old/2023/08/Poems.html", icon: "book" }
        ],
      },
      {
        text: "2023.10",
        children: [
          { text: "中华民国临时春晚", link: "/old/2023/10/SpringFestival.html", icon: "tv" },
          { text: "Playground", link: "/old/2023/10/Playground.html", icon: "flask" },
          //{ text: "更新历史", link: "/old/2023/10/UpdateHistory.html", icon: "clock-rotate-left" },
          { text: "FAQ", link: "/old/2023/10/ProblemsSolving.html", icon: "question" }
        ],
      },
      {
        text: "2023.11",
        children: [
          { text: "小奶奶新闻", link: "/old/2023/11/news.html", icon: "newspaper" }
        ],
      },
      {
        text: "2023.12",
        children: [
          { text: "中登", link: "/old/2023/12/zhongDeng.html", icon: "person" },
          { text: "愚公智叟", link: "/old/2023/12/Mountain.html", icon: "mountain" }
        ],
      },
      {
        text: "2024.09",
        children: [
          { text: "QQ机器人文档", link: "/old/2024/09/QqBotGuide.html", icon: "robot" }
        ],
      },
      {
        text: "2024.10",
        children: [
          { text: "极限挑战：生命挑战", link: "/old/2024/10/dianBi.html", icon: "heart-pulse" }
        ],
      },
      {
        text: "2024.12",
        children: [
          { text: "文理联赛讽刺作品集", link: "/old/2024/12/ASCompetition.html", icon: "school" }
        ],
      },
      {
        text: "2025.02",
        children: [
          { text: "猎奇文章合集", link: "/old/2025/02/RyoukiArticle.html", icon: "book" },
          { text: "Sovits 教程", link: "/old/2025/02/SovitsTutorial.html", icon: "book" }
        ],
      }
    ],
  },
  {
    text: "博文",
    icon: "book",
    children: [
      {
        text: "2025.02",
        children: [
          { text: "木柜子乐队相关内容", link: "/post/2025/02/GirlsBands.html", icon: "guitar" }
        ],
      },
      {
        text: "2025.03",
        children: [
          { text: "弱智游戏分享：Revolution Idle", link: "/post/2025/03/RevolutionIdle.html", icon: "gamepad" },
          { text: "古今中外奇文选", link: "/post/2025/03/PeculiarAnthology.html", icon: "book-open" }
        ],
      },
      {
        text: "2025.04",
        children: [
          { text: "猎奇文章合集：清明特辑", link: "/post/2025/04/Qingming.html", icon: "scroll" }
        ],
      },
      {
        text: "2025.06",
        children: [
          { text: "黄睿涵导航页", link: "/post/2025/06/HuangRuihanNavigation.html", icon: "compass" }
        ],
      },
      {
        text: "2025.07",
        children: [
          { text: "Synthesizer V 本体及声库相关购买流程", link: "/post/2025/07/SynthesizerV.html", icon: "music" },
          { text: "Twikoo评论组件的引入", link: "/post/2025/07/TwikooPlugin.html", icon: "comments" },
          { text: "李晨煜b站收藏夹标签统计", link: "/post/2025/07/LCYBilibiliFavoritesStatistics.html", icon: "tag" },
          { text: "王浩宇偷偷OD泰诺后不慎睡着了", link: "/post/2025/07/WHYODTylenol.html", icon: "pills" }
        ],
      },
      {
        text: "2025.08",
        children: [
          { text: "传奇人物志", link: "/post/2025/08/LegendaryPerson.html", icon: "user-tie" },
          { text: "屎", link: "/post/2025/08/Shit.html", icon: "poo" },
          { text: "李晨煜不看网课", link: "/post/2025/08/LCYSchoolWork.html", icon: "person-chalkboard" },
          { text: "桐高军训实录", link: "/post/2025/08/MilitaryTraining.html", icon: "person-military-rifle" },
          { text: "视频合辑", link: "/post/2025/08/VideosCompilation.html", icon: "film" }
        ],
      },
      {
        text: "2025.09",
        children: [
          { text: "Hyperflip介绍", link: "/post/2025/09/HyperflipIntroduction.html", icon: "music" }
        ],
      },
      {
        text: "2025.11",
        children: [
          { text: "同人音乐聆听记录", link: "/post/2025/11/DoujinMusicRecords.html", icon: "music" }
        ],
      },
      {
        text: "2026.01",
        children: [
          { text: "桐高幽默事件", link: "/post/2026/01/HumorousIncidents.html", icon: "user-tie" }
        ],
      }
    ],
  },
  {
    text: "子页面",
    icon: "folder",
    children: [
      { text: "黄睿涵导航页", link: "https://chinasd1st.github.io/pages/", icon: "compass" },
      { text: "蔚蓝档案标题生成器", link: "https://chinasd1st.github.io/BA_logo/", icon: "gears" },
      { text: "Material Player", link: "https://chinasd1st.github.io/material-music-3/", icon: "music" }

    ],
  },
  {
    text: "v1.0.0",
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
          { text: "bilibili", link: "https://space.bilibili.com/520682236", icon: "fab:bilibili" }
        ],
      }
    ],
  }
]);
