import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  { text: 'Status', link: 'https://stats.uptimerobot.com/NCUFdoSfM4' },,
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
    ]
  },

  {
    text: '博文',
    children: [
      {
        text: '2025',
        children: [
          { text: '木柜子乐队相关内容', link: '/post/GirlsBands' },
          { text: '弱智游戏分享：Revolution Idle', link: '/post/RevolutionIdle' },
          { text: '古今中外奇文选', link: '/post/PeculiarAnthology' },
          { text: '猎奇文章合集：清明特辑', link: '/post/Qingming' },
        ]
      }
    ]
  },  
  { text: 'QQ机器人文档', link: '/old/QqBotGuide' },
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
          {
            text: 'bilibili',
            link: 'https://space.bilibili.com/520682236'
          }
        ]
      }
    ]
  }
]);
