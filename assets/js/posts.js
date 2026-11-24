// ===== 成员动态：从 GitHub Issues 读取，按发布时间倒序显示 =====
(function () {
  var CFG = window.EIDM_CONFIG;
  if (!CFG) return;

  var REPO = CFG.owner + "/" + CFG.repo;
  var API = "https://api.github.com/repos/" + REPO + "/issues";
  var MEMBER = { OWNER: 1, MEMBER: 1, COLLABORATOR: 1 };
  var GROUP_NAMES = CFG.groups.map(function (g) { return g.name; });
  var CACHE_KEY = "eidm_posts_v2";
  var CACHE_TTL = 5 * 60 * 1000; // 5 分钟

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function parseTitle(title) {
    var m = title.match(/^\s*[\[【]\s*([^\]】]+?)\s*[\]】]\s*/);
    if (m && (GROUP_NAMES.indexOf(m[1]) >= 0 || m[1] === "论文")) {
      return { group: m[1], title: title.slice(m[0].length) };
    }
    return { group: null, title: title };
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  if (window.DOMPurify) {
    window.DOMPurify.addHook("afterSanitizeAttributes", function (node) {
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
      if (node.tagName === "IMG") {
        var src = node.getAttribute("src") || "";
        // 相对路径：只写文件名 -> 自动指向仓库的 assets/uploads/
        if (src && !/^(https?:)?\/\//i.test(src) && src.charAt(0) !== "/" && !/^data:/i.test(src)) {
          if (src.indexOf("/") === -1) src = "assets/uploads/" + src;
          node.setAttribute("src", src);
        }
        node.setAttribute("loading", "lazy");
        node.setAttribute("referrerpolicy", "no-referrer");
      }
    });
  }

  function cleanRaw(body) {
    if (!body) return "";
    return String(body)
      .replace(/<!--[\s\S]*?-->/g, "")      // 去掉模板中的注释
      .replace(/（在这里填写内容）/g, "")    // 去掉占位符
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // 把 Issue 正文（Markdown）渲染成安全的 HTML，支持图片、加粗、列表、链接等
  function renderBody(body) {
    var raw = cleanRaw(body);
    if (!raw) return "";
    if (window.marked && window.DOMPurify) {
      try {
        var html = window.marked.parse(raw, { breaks: true, gfm: true });
        return window.DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "u", "s", "del", "a",
            "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "h4",
            "h5", "h6", "img", "hr", "table", "thead", "tbody", "tr", "th", "td"],
          ALLOWED_ATTR: ["href", "src", "alt", "title", "width", "height", "align"]
        });
      } catch (e) { /* fall through */ }
    }
    return '<div class="plain">' + esc(raw).replace(/\n/g, "<br>") + "</div>";
  }

  function renderFeed(el, posts) {
    var g = el.getAttribute("data-feed");
    var list = (!g || g === "all")
      ? posts.filter(function (p) { return p.group !== "论文"; })
      : posts.filter(function (p) { return p.group === g; });
    if (!list.length) {
      el.innerHTML =
        '<div class="feed-empty">暂无内容。组织成员登录 GitHub 后，点击“发布”即可创建。</div>';
      return;
    }
    el.innerHTML = list.map(function (p) {
      var bodyHtml = renderBody(p.body);
      return '<article class="post">' +
        '<div class="post-head"><h4>' + esc(p.title) + '</h4>' +
        '<time datetime="' + esc(p.date) + '">' + esc(fmtDate(p.date)) + "</time></div>" +
        (bodyHtml ? '<div class="post-body">' + bodyHtml + "</div>" : "") +
        '<div class="post-foot">' +
        (p.author ? '<span>发布者：' + esc(p.author) + "</span>" : "") +
        ' <a href="' + esc(p.url) + '" target="_blank" rel="noopener">查看 / 编辑 ↗</a>' +
        "</div></article>";
    }).join("");
  }

  function parsePaper(p) {
    var body = cleanRaw(p.body);
    var f = { authors: "", venue: "", year: "", link: "", desc: [] };
    body.split("\n").forEach(function (line) {
      if (!line.trim()) return;
      var m = line.match(/^\s*([^：:]{1,16})\s*[:：]\s*(.*)$/);
      if (m) {
        var key = m[1].trim();
        var val = m[2].trim();
        if (/^(作者|authors?|author)/i.test(key)) { f.authors = val; return; }
        if (/^(会议|期刊|发表|venue|conference|journal)/i.test(key)) { f.venue = val; return; }
        if (/^(年份|年|year)/i.test(key)) { f.year = val; return; }
        if (/^(链接|网址|url|link|pdf)/i.test(key)) { f.link = val; return; }
        if (/^(摘要|说明|abstract)/i.test(key)) { if (val) f.desc.push(val); return; }
      }
      f.desc.push(line.trim());
    });
    return f;
  }

  function linkHref(raw) {
    if (!raw) return "";
    var m = raw.match(/\]\((https?:\/\/[^)]+)\)/);
    if (m) return m[1];
    m = raw.match(/https?:\/\/\S+/);
    return m ? m[0] : "";
  }

  function renderPapers(el, posts) {
    var list = posts.filter(function (p) { return p.group === "论文"; });
    if (!list.length) {
      el.innerHTML = '<div class="feed-empty">暂无论文。组织成员可在发布页添加。</div>';
      return;
    }
    el.innerHTML = list.map(function (p) {
      var f = parsePaper(p);
      var tag = [f.venue, f.year].filter(Boolean).join(" ");
      var href = linkHref(f.link);
      var descHtml = f.desc.length ? renderBody(f.desc.join("\n")) : "";
      var meta = [];
      if (href) meta.push('<a href="' + esc(href) + '" target="_blank" rel="noopener">链接</a>');
      else if (f.link) meta.push(esc(f.link));
      meta.push('<a href="' + esc(p.url) + '" target="_blank" rel="noopener">查看 / 编辑</a>');
      return '<div class="pub">' +
        '<span class="venue">' + esc(tag || "论文") + "</span>" +
        "<div>" +
        '<p class="title">' + esc(p.title) + "</p>" +
        (f.authors ? '<p class="authors">' + esc(f.authors) + "</p>" : "") +
        '<p class="meta">' + meta.join(" ") + "</p>" +
        (descHtml ? '<div class="paper-desc">' + descHtml + "</div>" : "") +
        "</div></div>";
    }).join("");
  }

  function showError(containers) {
    containers.forEach(function (c) {
      c.innerHTML = '<div class="feed-empty">动态加载失败（可能触发了 GitHub API 访问限制）。' +
        '稍后刷新，或直接到 <a href="https://github.com/' + REPO +
        '/issues" target="_blank" rel="noopener">GitHub Issues</a> 查看。</div>';
    });
  }

  async function fetchAllIssues() {
    // 简单缓存，减少 API 调用
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        var c = JSON.parse(raw);
        if (Date.now() - c.t < CACHE_TTL) return c.d;
      }
    } catch (e) {}

    var results = [];
    var url = API + "?state=open&per_page=100&sort=created&direction=desc";
    for (var page = 0; url && page < 3; page++) {
      var res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      if (!Array.isArray(data)) throw new Error("bad response");
      results = results.concat(data);
      var link = res.headers.get("Link") || "";
      var next = link.match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
      if (data.length < 100) break;
    }

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: results }));
    } catch (e) {}
    return results;
  }

  function setupLightbox() {
    if (document.getElementById("eidm-lightbox")) return;
    var box = document.createElement("div");
    box.id = "eidm-lightbox";
    box.className = "lightbox";
    box.innerHTML = '<button class="lightbox-close" aria-label="关闭">×</button><img alt="" />';
    document.body.appendChild(box);

    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("lightbox-close")) {
        box.classList.remove("open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") box.classList.remove("open");
    });
    document.addEventListener("click", function (e) {
      var img = e.target && e.target.closest ? e.target.closest(".post-body img") : null;
      if (!img) return;
      e.preventDefault();
      box.querySelector("img").src = img.currentSrc || img.src;
      box.classList.add("open");
    });
  }

  function normalize(o) {
    var p = parseTitle(o.title || "");
    return {
      title: p.title || o.title || "",
      group: p.group,
      body: o.body || "",
      date: o.created_at,
      url: o.html_url,
      author: o.author
    };
  }

  // 优先读取站内静态 JSON（由 GitHub Action 导出，无 API 限流、同源更快）
  async function fetchStatic() {
    var res = await fetch("data/posts.json?_=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    var data = await res.json();
    if (!Array.isArray(data)) throw new Error("bad json");
    return data.map(normalize);
  }

  async function load() {
    var feeds = Array.prototype.slice.call(document.querySelectorAll("[data-feed]"));
    var papers = Array.prototype.slice.call(document.querySelectorAll("[data-papers]"));
    setupPublish();
    setupLightbox();
    if (!feeds.length && !papers.length) return;

    try {
      var posts;
      try {
        posts = await fetchStatic();
      } catch (eStatic) {
        // 兜底：直接读 GitHub API（静态文件缺失时）
        var issues = await fetchAllIssues();
        posts = issues
          .filter(function (i) { return !i.pull_request && MEMBER[i.author_association]; })
          .map(function (i) {
            return normalize({
              title: i.title,
              body: i.body,
              created_at: i.created_at,
              html_url: i.html_url,
              author: i.user && i.user.login
            });
          });
      }

      posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
      feeds.forEach(function (c) { renderFeed(c, posts); });
      papers.forEach(function (c) { renderPapers(c, posts); });
    } catch (e) {
      feeds.forEach(function (c) { renderFeed(c, []); });
      papers.forEach(function (c) { renderPapers(c, []); });
    }
  }

  function setupPublish() {
    document.querySelectorAll("[data-template]").forEach(function (a) {
      var slug = a.getAttribute("data-template");
      a.href = "https://github.com/" + REPO + "/issues/new?template=" + slug + ".md";
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
