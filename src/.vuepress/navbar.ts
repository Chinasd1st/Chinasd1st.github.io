import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  { text: 'Status', link: 'https://stats.uptimerobot.com/NCUFdoSfM4' },,
  {
    text: '子页面',
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
