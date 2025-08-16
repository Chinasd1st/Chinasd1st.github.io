import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  // { text: 'Status', link: 'https://stats.uptimerobot.com/NCUFdoSfM4' },
  {
    text: '旧文存档',
    children: [
      {
        text: '小奶奶二创作品',
        children: [
          { text: '小奶奶诗集', link: '/old/Poems' },
          { text: '中华民国临时春晚', link: '/old/SpringFestival' },
          { text: '中登', link: '/old/zhongDeng' },
          { text: '愚公智叟', link: '/old/Mountain' },
          { text: '小奶奶新闻', link: '/old/news' }
        ]
      },
      {
        text: 'Others',
        children: [
          { text: 'Playground', link: '/old/Playground' },
          { text: '极限挑战：生命挑战', link: '/old/dianBi.md' },
          { text: '文理联赛讽刺作品集', link: '/old/ASCompetition.md' },
          { text: '猎奇文章合集', link: '/old/RyoukiArticle.md' }
        ]
      }
    ],
    icon: 'box-archive'
  },
  {
    text: '博文',
    children: [
      {
        text: '2025',
        children: [
          { text: "木柜子乐队相关内容", link: "/post/GirlsBands", icon: "guitar" },
          { text: "弱智游戏分享：Revolution Idle", link: "/post/RevolutionIdle", icon: "gamepad" },
          { text: "古今中外奇文选", link: "/post/PeculiarAnthology", icon: "book-open" },
          { text: "猎奇文章合集：清明特辑", link: "/post/Qingming", icon: "scroll" },
          { text: "黄睿涵导航页", link: "/post/HuangRuihanNavigation", icon: "compass" },
          { text: "Synthesizer V 本体及声库相关购买流程", link: "/post/SynthesizerV", icon: "music" },
          { text: "Twikoo评论组件的引入", link: "/post/TwikooPlugin", icon: "comments" },
          { text: "李晨煜b站收藏夹标签统计", link: "/post/LCYBilibiliFavoritesStatistics", icon: "person-chalkboard" },
          { text: "王浩宇偷偷OD泰诺后不慎睡着了", link: "/post/WHYODTylenol", icon: "pills" },
          { text: "传奇人物志", link: "/post/LegendaryPerson", icon: "user-tie" },
          { text: "屎", link: "/post/Shit", icon: "poo" },
          { text: "李晨煜不看网课", link: "/post/LCYSchoolWork", icon: "laptop" }
        ]
      }
    ],
    icon: 'book'
  },
  { text: 'QQ机器人文档', link: '/old/QqBotGuide', icon: 'robot'},
  {
    text: 'v.alpha-0.0.4',
    children: [
      {
        text: '网站事宜',
        children: [
          { text: '更新历史', link: '/old/UpdateHistory' },
          { text: 'Problems Q&A', link: '/old/ProblemsSolving' }
        ]
      },
      {
        text: '联系我们',
        children: [
          { text: 'bilibili', link: 'https://space.bilibili.com/520682236' }
        ]
      }
    ],
    icon: 'code-commit'
  }
]);