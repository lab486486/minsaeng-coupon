/**
 * Sidebar: "쿠팡파트너스 API Key" → /admin/coupang (new tab)
 * Keep DOM writes minimal so MutationObservers don't thrash the sidebar.
 */
(function () {
  const PAGE = "/admin/coupang";
  const ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 7h10a2 2 0 0 1 2 2v1H5V9a2 2 0 0 1 2-2Zm12 5H5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5ZM9 15.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>';
  const EXTERNAL_ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>';

  let started = false;
  let pending = false;
  let built = false;

  function getRoot() {
    return document.getElementById("nc-root");
  }

  function getSidebar(root) {
    return root.querySelector("aside") || root.querySelector('[class*="Sidebar"]');
  }

  function findAnchor(sidebar) {
    return (
      sidebar.querySelector('a[href="#/collections/adsense"]') ||
      sidebar.querySelector('a[href*="#/collections/adsense"]') ||
      sidebar.querySelector('a[href="#/collections/site"]') ||
      sidebar.querySelector('a[href^="#/collections/"]')
    );
  }

  function placeLink(link, sidebar) {
    const adsense =
      sidebar.querySelector('a[href="#/collections/adsense"]') ||
      sidebar.querySelector('a[href*="#/collections/adsense"]');
    const sample = adsense || findAnchor(sidebar);
    if (!sample) return;

    const sampleRow = sample.closest("li");
    const list = sampleRow ? sampleRow.parentElement : sample.parentElement;
    if (!list) return;

    if (sampleRow && sampleRow.tagName === "LI") {
      let row = link.closest("li");
      if (!row || row === sampleRow) {
        row = document.createElement("li");
        row.className = "cms-coupang-nav-row";
        row.appendChild(link);
      }
      if (adsense) {
        const adsenseRow = adsense.closest("li");
        if (adsenseRow && link.parentElement !== adsenseRow && row.nextElementSibling !== adsenseRow) {
          // Place Coupang after AdSense in monetize group.
          if (row !== adsenseRow.nextSibling) {
            list.insertBefore(row, adsenseRow.nextSibling);
          }
        } else if (!row.isConnected) {
          list.insertBefore(row, adsenseRow ? adsenseRow.nextSibling : null);
        }
      } else if (!row.isConnected) {
        list.insertBefore(row, sampleRow.nextSibling);
      }
    } else if (!link.isConnected) {
      sample.parentElement.insertBefore(link, sample.nextSibling);
    }
  }

  function buildLink() {
    const link = document.createElement("a");
    link.className = "cms-coupang-nav cms-collection-link";
    link.dataset.collection = "coupang";
    link.href = PAGE;
    link.target = "_blank";
    link.rel = "noopener";
    link.title = "쿠팡파트너스 API Key 설정";

    const icon = document.createElement("span");
    icon.className = "cms-collection-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = ICON;
    link.appendChild(icon);

    const label = document.createElement("span");
    label.className = "cms-coupang-label";
    label.textContent = "쿠팡파트너스 API Key";
    link.appendChild(label);

    const external = document.createElement("span");
    external.className = "cms-coupang-external";
    external.setAttribute("aria-hidden", "true");
    external.title = "새 창에서 열기";
    external.innerHTML = EXTERNAL_ICON;
    link.appendChild(external);

    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      window.open(PAGE, "_blank", "noopener");
    });

    return link;
  }

  function ensureNavLink(root) {
    const sidebar = getSidebar(root);
    if (!sidebar || !findAnchor(sidebar)) return;

    let link = sidebar.querySelector("a.cms-coupang-nav");
    if (!link) {
      link = buildLink();
      built = true;
    }
    placeLink(link, sidebar);
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
    const observer = new MutationObserver(function (mutations) {
      // Ignore our own coupang node churn.
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type !== "childList") continue;
        var nodes = [];
        if (m.addedNodes) nodes = nodes.concat(Array.prototype.slice.call(m.addedNodes));
        if (m.removedNodes) nodes = nodes.concat(Array.prototype.slice.call(m.removedNodes));
        var onlyCoupang = nodes.length > 0 && nodes.every(function (n) {
          return (
            n.nodeType === 1 &&
            (n.classList &&
              (n.classList.contains("cms-coupang-nav") ||
                n.classList.contains("cms-coupang-nav-row") ||
                n.classList.contains("cms-sidebar-divider-row")))
          );
        });
        if (onlyCoupang) continue;
        schedule();
        return;
      }
    });
    observer.observe(root, { childList: true, subtree: true });
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
