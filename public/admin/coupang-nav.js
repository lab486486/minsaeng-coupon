/**
 * Sidebar: "쿠팡파트너스 API Key" → /admin/coupang (new tab)
 *
 * Important: never inherit Decap's active/selected classes from the current
 * collection link — that made Coupang look hovered/selected forever.
 */
(function () {
  const PAGE = "/admin/coupang";
  const ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 7h10a2 2 0 0 1 2 2v1H5V9a2 2 0 0 1 2-2Zm12 5H5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5ZM9 15.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>';
  const EXTERNAL_ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>';

  let started = false;
  let pending = false;

  function getRoot() {
    return document.getElementById("nc-root");
  }

  function getSidebar(root) {
    return root.querySelector("aside") || root.querySelector('[class*="Sidebar"]');
  }

  function looksActive(el) {
    if (!el) return true;
    if (el.getAttribute("aria-current")) return true;
    if (el.getAttribute("aria-selected") === "true") return true;
    var cls = typeof el.className === "string" ? el.className : "";
    if (/\b(active|selected|current)\b/i.test(cls)) return true;
    var parent = el.parentElement;
    if (parent) {
      var pCls = typeof parent.className === "string" ? parent.className : "";
      if (/\b(active|selected|current)\b/i.test(pCls)) return true;
      if (parent.getAttribute("aria-current")) return true;
    }
    return false;
  }

  function copyInactiveClasses(from, to) {
    if (!from) return;
    from.classList.forEach(function (cls) {
      if (cls.indexOf("cms-") === 0) return;
      if (/\b(active|selected|current)\b/i.test(cls)) return;
      to.classList.add(cls);
    });
  }

  function stripActiveState(link) {
    if (!link) return;
    link.removeAttribute("aria-current");
    link.removeAttribute("aria-selected");
    link.removeAttribute("data-active");
    Array.prototype.slice.call(link.classList).forEach(function (cls) {
      if (/\b(active|selected|current)\b/i.test(cls)) {
        link.classList.remove(cls);
      }
    });
    // Drop emotion active hashes by rebasing against an inactive sibling sample.
  }

  function rebaseClasses(link, sample) {
    if (!link || !sample || looksActive(sample)) return;
    var keep = {};
    link.classList.forEach(function (cls) {
      if (cls.indexOf("cms-") === 0) keep[cls] = true;
    });
    link.className = "";
    Object.keys(keep).forEach(function (cls) {
      link.classList.add(cls);
    });
    if (!link.classList.contains("cms-coupang-nav")) link.classList.add("cms-coupang-nav");
    if (!link.classList.contains("cms-collection-link")) link.classList.add("cms-collection-link");
    copyInactiveClasses(sample, link);
  }

  function pickInactiveSample(sidebar) {
    var preferred = [
      sidebar.querySelector("a.cms-shortlinks-nav"),
      sidebar.querySelector('a[href="#/collections/adsense"]'),
      sidebar.querySelector('a[href*="#/collections/adsense"]'),
      sidebar.querySelector('a[href="#/collections/site"]'),
      sidebar.querySelector('a[href*="#/collections/site"]'),
    ];
    for (var i = 0; i < preferred.length; i++) {
      if (preferred[i] && !looksActive(preferred[i])) return preferred[i];
    }

    var links = sidebar.querySelectorAll('a[href^="#/collections/"]');
    for (var j = 0; j < links.length; j++) {
      if (!looksActive(links[j])) return links[j];
    }
    return links[0] || preferred[0] || null;
  }

  function ensureOwnRow(link, sample) {
    if (!link || !sample) return;
    var sampleRow = sample.closest("li") || sample.parentElement;
    if (!sampleRow || !sampleRow.parentElement) return;
    var list = sampleRow.parentElement;

    // Keep Coupang in its own <li> so it never shares Decap's active row styles.
    var row = link.closest("li");
    if (sampleRow.tagName === "LI") {
      if (!row || row === sampleRow) {
        row = document.createElement("li");
        row.className = "cms-coupang-nav-row";
        row.appendChild(link);
      }
      if (row.parentElement !== list) {
        var adsense =
          list.querySelector('a[href="#/collections/adsense"]') ||
          list.querySelector('a[href*="#/collections/adsense"]');
        var adsenseRow = adsense ? adsense.closest("li") : null;
        if (adsenseRow && adsenseRow.parentElement === list) {
          list.insertBefore(row, adsenseRow.nextSibling);
        } else if (sampleRow.parentElement === list) {
          list.insertBefore(row, sampleRow.nextSibling);
        } else {
          list.appendChild(row);
        }
      }
      row.removeAttribute("aria-current");
      Array.prototype.slice.call(row.classList).forEach(function (cls) {
        if (/\b(active|selected|current)\b/i.test(cls)) row.classList.remove(cls);
      });
    } else if (!link.isConnected) {
      sample.parentElement.insertBefore(link, sample.nextSibling);
    }
  }

  function ensureNavLink(root) {
    const sidebar = getSidebar(root);
    if (!sidebar) return;

    let link = sidebar.querySelector("a.cms-coupang-nav");
    const sample = pickInactiveSample(sidebar);
    if (!sample || !sample.parentElement) return;

    if (!link) {
      link = document.createElement("a");
      link.className = "cms-coupang-nav cms-collection-link";
      link.dataset.collection = "coupang";
      copyInactiveClasses(sample, link);

      const icon = document.createElement("span");
      icon.className = "cms-collection-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = ICON;
      link.appendChild(icon);

      const label = document.createElement("span");
      label.className = "cms-coupang-label";
      label.textContent = "쿠팡파트너스 API Key";
      link.appendChild(label);

      link.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.open(PAGE, "_blank", "noopener");
      });
    }

    if (!link.querySelector(".cms-coupang-external")) {
      const external = document.createElement("span");
      external.className = "cms-coupang-external";
      external.setAttribute("aria-hidden", "true");
      external.title = "새 창에서 열기";
      external.innerHTML = EXTERNAL_ICON;
      link.appendChild(external);
    }

    link.href = PAGE;
    link.target = "_blank";
    link.rel = "noopener";
    link.title = "쿠팡파트너스 API Key 설정";

    stripActiveState(link);
    rebaseClasses(link, sample);
    ensureOwnRow(link, sample);
    stripActiveState(link);
  }

  function sync() {
    const root = getRoot();
    if (!root) return;
    ensureNavLink(root);
  }

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      sync();
    });
  }

  function start() {
    if (started) return;
    started = true;
    const root = getRoot();
    if (!root) return;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, attributes: true });
    window.addEventListener("hashchange", schedule);
    schedule();
  }

  function waitForCms() {
    const root = getRoot();
    if (root && root.firstElementChild) {
      start();
      return;
    }
    window.requestAnimationFrame(waitForCms);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForCms);
  } else {
    waitForCms();
  }
})();
