// ===== 站点配置 =====
// 仓库信息用于读取 GitHub Issues（成员发布的动态）。
// 如果以后仓库名/组织名变了，只改这里即可。
window.EIDM_CONFIG = {
  owner: "ZZU-EIDM-Lab",
  repo: "zzu-eidm-lab.github.io",
  // 五个研究组：name 用于匹配 Issue 标题前缀 [name]，slug 用于发布模板文件名
  groups: [
    { name: "未来航天机器人", slug: "aerospace", icon: "🚀" },
    { name: "无人零售机器人", slug: "retail", icon: "🛒" },
    { name: "飞行机器人", slug: "flying", icon: "🛩️" },
    { name: "仿生灵巧手", slug: "hand", icon: "🖐️" },
    { name: "机器狗+机械臂", slug: "dogarm", icon: "🐕" }
  ]
};
