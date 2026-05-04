(function () {
  function addCopyButton(pre) {
    if (pre.querySelector('.copy-btn')) return;
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    btn.style.cssText = `
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.3rem;
      background: rgba(0,0,0,0.3);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
      line-height: 0;
    `;

    pre.style.position = "relative";
    pre.appendChild(btn);

    pre.addEventListener("mouseenter", () => btn.style.opacity = "1");
    pre.addEventListener("mouseleave", () => btn.style.opacity = "0");

    btn.addEventListener("click", () => {
      const code = pre.querySelector("code");
      navigator.clipboard.writeText(code.textContent).then(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`, 2000);
      });
    });
  }

  function init() {
    document.querySelectorAll("pre:has(code)").forEach(addCopyButton);
  }

  init();

  const observer = new MutationObserver(init);
  observer.observe(document.body, { childList: true, subtree: true });
})();