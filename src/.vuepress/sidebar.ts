import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    {
      text: "文章存档",
      icon: "book",
      prefix: "old/",
      children: "structure",
    },
    "intro",
  ],
});
