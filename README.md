# 具身智能灵巧操作实验室（EIDM Lab）· 实验室主页

纯静态实验室主页，无需构建，推送到 GitHub 即发布到：

> https://zzu-eidm-lab.github.io/

## 页面

| 文件 | 作用 |
|---|---|
| `index.html` | 首页（含最新动态，自动按时间倒序） |
| `research.html` | 五大研究组 + 各组动态 |
| `publications.html` | 论文与成果（目前留空，待补充） |
| `publish.html` | 成员发布入口（不在导航公开，仅成员收藏） |
| `contact.html` | 联系我们（邮箱 / 通讯地址） |
| `assets/` | 样式、脚本、图片 |
| `.github/ISSUE_TEMPLATE/` | 五个研究组的发布模板 |
| `.nojekyll` | 纯静态，关闭 Jekyll |

## 五大研究组

1. 未来航天机器人
2. 无人零售机器人
3. 飞行机器人
4. 仿生灵巧手
5. 机器狗+机械臂

## 成员发布（仅组织成员可操作，按时间倒序）

采用 **GitHub Issues 作为内容来源**，无需服务器/数据库。访问控制如下：

- **访客**：网站任何页面都**没有发布按钮**；只能查看内容。
- **组织成员**：收藏并访问 `/publish.html`（该页不在导航中公开，且 `noindex`），
  用 GitHub 账号登录后即可发布；也可直接到仓库的 Issues 操作。
- **权限由 GitHub 保证**：只有拥有写权限的组织成员才能创建/编辑/删除；
  非成员创建的 Issue 会被 `.github/workflows/guard-issues.yml` **自动关闭**，
  且前端只显示 `OWNER / MEMBER / COLLABORATOR` 的 **open** Issue，因此不会出现在网站上。
- **编辑 / 删除**：在网站动态卡片点「查看 / 编辑」进入 Issue，用铅笔编辑，
  或在 Issue 右上角 `⋯ → Delete issue` 删除；关闭 Issue 也会从网站消失。
- **图片**：图片存放在仓库 `assets/uploads/`。成员在 `/publish.html` 点「上传图片到仓库」
  直接拖拽上传，然后在动态正文写 `![图](文件名.jpg)`（会自动指向 `assets/uploads/`），
  也可写完整路径 `assets/uploads/文件名.jpg`。

前端脚本 `assets/js/posts.js` 通过 GitHub API 拉取 Issue，按创建时间**倒序**展示。

说明：
- 内容没有写进仓库文件，实时来自 Issues；成员有 GitHub 账号即可，不需要额外注册。
- GitHub 匿名 API 有频率限制（每 IP 约 60 次/小时），脚本已做 5 分钟浏览器缓存。
  若访问量大，可后续加一个 GitHub Action 把 Issue 导出成静态 JSON。
- 标题前缀必须是五个研究组之一，否则只会出现在“最新动态（全部）”里。

## 发布步骤

1. 组织下新建 **Public** 仓库，名字必须是 `zzu-eidm-lab.github.io`；
2. 推送本目录所有文件到 `main`；
3. 仓库 **Settings → Pages**：Source 选 **Deploy from a branch**，
   Branch 选 `main`，目录 `/ (root)`，Save；
4. 等 1–2 分钟访问站点。

```bash
git init
git add .
git commit -m "init lab site"
git branch -M main
git remote add origin https://github.com/ZZU-EIDM-Lab/zzu-eidm-lab.github.io.git
git push -u origin main
```

## 需要替换的占位内容

- **实验室 Logo**：已放在 `assets/img/logo.png`，如需更换直接覆盖同名文件。
- 各研究组简介（`research.html` 中每组 `<p>`）。
- 论文与成果（`publications.html`，目前为空）。
- 联系信息（`contact.html` 中的邮箱与通讯地址）。
- 首页文案与页脚机构信息。
- 若组织/仓库名变化，改 `assets/js/config.js`。

## 本地预览

```bash
python -m http.server 8000
```

访问 http://localhost:8000/ （注：本地预览时 Issues 动态仍从线上仓库读取）。

## 自定义域名（可选）

Pages 设置里填 **Custom domain**，并在 DNS 添加指向
`zzu-eidm-lab.github.io` 的 CNAME。
