import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    {
      text: "文章存档",
      collapsible: true,
      expanded: true,  
      icon: "book",
      prefix: "old/",
      children: "structure",
    },
    {
      text: "博文",
      collapsible: true,
      expanded: true,  
      icon: "book",
      prefix: "post/",
      children: "structure",
    },
    "intro",
  ],
});
