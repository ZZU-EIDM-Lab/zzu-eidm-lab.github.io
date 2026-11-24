// ===== ZZU EIDM Lab — 交互脚本 =====
(function () {
  // 移动端菜单
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // 高亮当前页
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  // 页脚年份
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
