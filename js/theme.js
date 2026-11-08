/* ===== Light / dark theme =====
   Saved in localStorage; the first visit follows the device setting.
   Sets data-theme (own CSS variables) and data-bs-theme (Bootstrap components). */
(function () {
  const root = document.documentElement;
  const current = () => localStorage.getItem('theme') || ((window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
  function apply(t) {
    root.dataset.theme = root.dataset.bsTheme = t;
    document.querySelectorAll('[data-theme-toggle]').forEach(b => { b.textContent = t === 'dark' ? 'Light mode' : 'Dark mode'; b.setAttribute('aria-pressed', t === 'dark'); });
  }
  apply(current());
  window.applyThemeLabels = () => apply(current()); // called after the navbar is built
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    const t = current() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', t); apply(t); document.dispatchEvent(new Event('themechange'));
  });
  addEventListener('storage', e => { if (e.key === 'theme') { apply(current()); document.dispatchEvent(new Event('themechange')); } }); // other tab changed it
})();
