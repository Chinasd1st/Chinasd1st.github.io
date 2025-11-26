import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    {
      text: "旧文存档",
      collapsible: true,
      expanded: true,  
      icon: "box-archive",
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
    "UpdateHistory"
  ],
});
