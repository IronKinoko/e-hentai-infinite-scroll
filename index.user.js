// ==UserScript==
// @name         e-hentai-infinite-scroll
// @namespace    https://github.com/IronKinoko/e-hentai-infinite-scroll
// @version      1.0.2
// @description  Exhentai infinite scroll scripts.
// @author       IronKinoko
// @match        https://exhentai.org/s/*
// @match        https://exhentai.org/g/*
// @grant        none
// ==/UserScript==

(() => {
  // src/views/comic.ts
  function setup() {
    function api_call(page2, nextImgKey2) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", api_url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.withCredentials = true;
        xhr.onreadystatechange = () => {
          if (xhr.readyState === xhr.DONE) {
            resolve(JSON.parse(xhr.responseText));
          }
        };
        xhr.send(JSON.stringify({
          method: "showpage",
          gid,
          page: page2,
          imgkey: nextImgKey2,
          showkey
        }));
      });
    }
    const maxPageSize = parseInt(document.querySelector("#i2 > div.sn > div > span:nth-child(2)").textContent);
    let nextImgKey = document.querySelector("#i3 a[onclick]").onclick.toString().match(/'(?<key>.*)'/).groups.key;
    let page = startpage + 1;
    let isLoading2 = false;
    async function loadImgInfo() {
      if (maxPageSize < page)
        return;
      if (isLoading2)
        return;
      isLoading2 = true;
      const res = await api_call(page, nextImgKey);
      isLoading2 = false;
      const groups = res.i3.match(/'(?<key>.*)'.*src="(?<src>.*)?".*nl\('(?<nl>.*)'\)/).groups;
      renderImg(page, {
        ...groups,
        source: res.s[0] === "/" ? res.s : "/" + res.s
      });
      nextImgKey = groups.key;
      page++;
    }
    function renderImg(page2, info) {
      const { key, source } = info;
      const img = document.createElement("img");
      img.src = "data:image/svg+xml,%3Csvg class='loading-icon' viewBox='0 0 1024 1024' version='1.1' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M512 0a512 512 0 0 1 512 512h-64a448 448 0 0 0-448-448V0z' fill='%23999'%3E%3C/path%3E%3Cstyle%3E%0A.loading-icon %7B animation: rotate 1s infinite linear; %7D%0A@keyframes rotate %7B from %7B transform: rotate(0); %7D to %7B transform: rotate(360deg); %7D %7D%0A%3C/style%3E%3C/svg%3E";
      img.dataset.imgKey = key;
      img.dataset.page = page2 + "";
      img.dataset.source = source;
      img.classList.add("auto-load-img", "auto-load-img-empty");
      img.alt = source;
      loadImg(img, info);
      document.getElementById("i3").append(img);
    }
    function loadImg(imgDOM, info) {
      const { source, src, nl } = info;
      const img = new Image();
      img.onload = () => {
        imgDOM.src = src;
        imgDOM.classList.remove("auto-load-img-empty");
      };
      img.onerror = () => {
        imgDOM.alt = `\u56FE\u7247\u52A0\u8F7D\u51FA\u9519 ${source}?nl=${nl}`;
        retry(imgDOM, info);
      };
      img.src = src;
    }
    function retry(img, info) {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;width:0;height:0;opacity:0;left:0;top:0;";
      const url = new URL(info.source, location.origin);
      url.searchParams.set("nl", info.nl);
      iframe.src = url.toString();
      document.body.append(iframe);
      iframe.contentWindow.addEventListener("DOMContentLoaded", () => {
        const src = iframe.contentWindow.document.querySelector("#i3 a img").getAttribute("src");
        loadImg(img, { ...info, src });
        iframe.remove();
      });
    }
    function injectCSS() {
      const style = document.createElement("style");
      style.innerHTML = `
      .auto-load-img {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 10px;
        display: block;
        box-sizing: border-box;
      }
  
      .auto-load-img-empty {
        min-height:1000px;
        width: 100px !important;
        margin: 0 auto !important;
      }
      #i3 a {
        pointer-events: none;
      }
      `;
      document.head.append(style);
    }
    function resetDefaultImgDOM() {
      const dom = document.querySelector("#i3 a img");
      dom.removeAttribute("style");
      dom.classList.add("auto-load-img");
      dom.dataset.source = location.pathname;
      document.getElementById("i3").append(dom);
      document.querySelector("#i3 a").remove();
    }
    function debounce(fn, delay) {
      let timer;
      return function() {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(fn, delay);
      };
    }
    const replaceCurrentPathname = debounce(function() {
      const imgs = document.querySelectorAll("#i3 img");
      for (const img of imgs) {
        const { top, bottom } = img.getBoundingClientRect();
        const base = 200;
        if (top < base && bottom > base) {
          const source = img.dataset.source;
          if (location.pathname !== source) {
            history.replaceState(null, "", source);
          }
          return;
        }
      }
    }, 30);
    injectCSS();
    resetDefaultImgDOM();
    loadImgInfo();
    document.addEventListener("scroll", () => {
      const dom = document.scrollingElement;
      if (dom.scrollHeight <= dom.scrollTop + dom.clientHeight + 2e3) {
        loadImgInfo();
      }
      replaceCurrentPathname();
    });
  }
  if (/\/s\/.*\/.*/.test(window.location.pathname)) {
    setup();
  }

  // src/views/detail.ts
  var $ = (selector) => document.querySelector(selector);
  function getPageInfo() {
    const rows = +$("#gdo2 .ths").textContent.replace(" rows", "");
    const mode = $("#gdo4 .ths").textContent.toLowerCase();
    const pageSize = (mode === "normal" ? 10 : 5) * rows;
    const total = +$(".gtb p.gpc").textContent.match(/of\s(?<total>\d+)\simages/).groups.total;
    const url = new URL(window.location.href);
    let currentPage = 0;
    if (url.searchParams.has("p")) {
      currentPage = +url.searchParams.get("p");
    }
    const pageCount = +$(".gtb .ptb td:nth-last-child(2)").textContent;
    const unloadPageCount = pageCount - 1 - currentPage;
    let unloadPageLinks = Array(unloadPageCount).fill(0).map((_, i) => {
      url.searchParams.set("p", 1 + currentPage + i + "");
      return url.toString();
    });
    return {
      rows,
      mode,
      url,
      total,
      currentPage,
      pageSize,
      pageCount,
      unloadPageLinks
    };
  }
  var isLoading = false;
  async function loadNextPage(info) {
    if (isLoading)
      return;
    let url = info.unloadPageLinks.shift();
    if (url) {
      isLoading = true;
      const html = await fetch(url).then((r) => r.text());
      isLoading = false;
      const doc = new DOMParser().parseFromString(html, "text/html");
      $("#gdt").append(...doc.querySelector("#gdt").childNodes);
    }
  }
  async function setup2() {
    const info = getPageInfo();
    if (!info.unloadPageLinks.length)
      return;
    document.addEventListener("scroll", () => {
      const dom = document.scrollingElement;
      if ($("#cdiv").getBoundingClientRect().y <= dom.scrollTop + dom.clientHeight + 2e3) {
        loadNextPage(info);
      }
    });
  }
  if (/\/g\/.*\/.*/.test(window.location.pathname)) {
    setup2();
  }
})();
