/* ===== MakanNow shared logic: role guard, storage, orders, basket, layout ===== */
const PAGE = location.pathname.split('/').pop() || 'index.html';
const CURRENT_USER = JSON.parse(sessionStorage.getItem('user') || 'null');
const $ = id => document.getElementById(id);

// Pages each role may open, and each role's home page
const ROLE_PAGES = {
  admin: ['dashboard.html', 'admin-orders.html', 'products.html', 'categories.html', 'customers.html'],
  customer: ['home.html', 'shop.html', 'orders.html']
};
const HOME = { admin: 'dashboard.html', customer: 'home.html' };
if (PAGE !== 'index.html') {
  if (!CURRENT_USER) location.replace('index.html');
  else if (!ROLE_PAGES[CURRENT_USER.role].includes(PAGE)) location.replace(HOME[CURRENT_USER.role]);
}

/* ---------- Storage ----------
   localStorage is shared by every tab in the same browser, so admin changes
   (stock, products, orders) show up live in a customer's tab and the other way round. */
const store = { get: (k, d) => JSON.parse(localStorage.getItem(k) || d), set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
let CATS = [], PRODUCTS = [];
function loadState() {
  let c = store.get('catalog', 'null');
  if (c && c.v !== CATALOG_VERSION) c = null; // saved by an older version of the seed data: start from the new one
  CATS = c ? c.categories : JSON.parse(JSON.stringify(SEED_CATEGORIES));
  PRODUCTS = c ? c.products : JSON.parse(JSON.stringify(SEED_PRODUCTS));
  // products saved before ingredients existed: copy the ingredients from the seed data
  PRODUCTS.forEach(p => { if (p.ing === undefined) { const s = SEED_PRODUCTS.find(x => x.id === p.id); if (s) p.ing = s.ing; } });
}
const saveCatalog = () => store.set('catalog', { v: CATALOG_VERSION, categories: CATS, products: PRODUCTS });
loadState();

/* ---------- Helpers ---------- */
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rm = n => 'RM ' + n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = d => new Date(d).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const productById = id => PRODUCTS.find(p => p.id === id);
const catById = id => CATS.find(c => c.id === id) || { name: 'Uncategorised', color: '#777' };
const MAX_STOCK = 2000; // maximum units of any one product
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PALETTE = ['#1B1B18', '#FFB703', '#C62828', '#2A4D8F', '#1F6B45', '#7A4B2A'];

function stockStatus(p) {
  if (p.stock === 0) return { key: 'out', label: 'Out of stock', cls: 's-out' };
  if (p.stock <= p.min) return { key: 'low', label: 'Low stock', cls: 's-low' };
  return { key: 'ok', label: 'In stock', cls: 's-ok' };
}
// (Re)fill a category dropdown and keep the current choice. allLabel === null means no blank option.
function fillCats(sel, allLabel) {
  const v = sel.value;
  sel.innerHTML = (allLabel === null ? '' : `<option value="">${allLabel}</option>`) + CATS.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  sel.value = CATS.some(c => c.id === v) ? v : (allLabel === null && CATS[0] ? CATS[0].id : '');
}
// Chart helper: destroys the old chart first so pages can redraw live
const CHARTS = {};
function makeChart(id, cfg) {
  Chart.defaults.font.family = "'Barlow', sans-serif"; Chart.defaults.color = '#1B1B18';
  Chart.defaults.color = cssVar('--text'); Chart.defaults.borderColor = cssVar('--line'); Chart.defaults.elements.arc.borderColor = cssVar('--surface');
  if (CHARTS[id]) CHARTS[id].destroy(); CHARTS[id] = new Chart($(id), cfg);
}
function flash(text, type = 'success') {
  const el = $('flash'); if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}" role="status">${text}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 3500);
}

/* ---------- Click-to-copy (tracking numbers) ---------- */
function copyText(t) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
  return new Promise((resolve, reject) => { // fallback for pages not served over https (e.g. opened as a file)
    const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy') ? resolve() : reject(); } catch (err) { reject(err); }
    ta.remove();
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const t = b.dataset.copy;
  copyText(t).then(() => {
    b.textContent = 'Copied!'; b.classList.add('copied');
    setTimeout(() => { b.textContent = t; b.classList.remove('copied'); }, 1400);
  }).catch(() => { // could not copy: select the text so the user can press Ctrl+C
    const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  });
});

/* ---------- Orders ---------- */
function getOrders() {
  const st = store.get('statusOverrides', '{}');
  return [...store.get('newOrders', '[]'), ...SEED_ORDERS]
    .map(o => ({ ...o, status: st[o.id] || o.status }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
const getMyOrders = () => getOrders().filter(o => o.user === CURRENT_USER.username);
const orderTotal = o => o.items.reduce((s, i) => s + i.price * i.q, 0);
const orderStatusCls = s => ({ 'Delivered': 's-ok', 'Preparing': 's-low', 'Out for delivery': 's-info', 'Cancelled': 's-out' }[s]);
// Tracking number is issued once an order ships (Out for delivery or Delivered)
const trackingNo = o => ['Out for delivery', 'Delivered'].includes(o.status) ? `MNW${o.date.replace(/-/g, '').slice(2)}${o.id.slice(1)}MY` : null;
const trackingHtml = o => { const t = trackingNo(o); return t ? `<button type="button" class="track" data-copy="${t}" title="Click to copy" aria-label="Copy tracking number ${t}">${t}</button>` : `<span class="text-muted small">${o.status === 'Cancelled' ? '-' : 'Issued when shipped'}</span>`; };
// Category of an order line: uses the current category name (so renames show everywhere), falls back to the saved name
const catOfItem = i => { const c = CATS.find(x => x.id === i.cid); return c ? { name: c.name, color: c.color } : { name: i.cat, color: null }; };
const unitsOf = o => o.items.reduce((s, i) => s + i.q, 0);
const totalHtml = o => `${rm(orderTotal(o))}<span class="sub">${unitsOf(o)} items</span>`;
// Items in an order: show the first 2 lines, the rest sit behind "+N more" (keeps long orders short)
const OPEN_ITEMS = new Set(), ITEMS_SHOWN = 2;
const toggleItems = id => { OPEN_ITEMS.has(id) ? OPEN_ITEMS.delete(id) : OPEN_ITEMS.add(id); };
function itemsHtml(o) {
  const open = OPEN_ITEMS.has(o.id), extra = o.items.length - ITEMS_SHOWN;
  const line = i => `<div class="ln"><span class="dot" style="background:${catOfItem(i).color || '#999'}"></span><span>${esc(i.name)}</span><span class="x">&times;${i.q}</span></div>`;
  const list = (open || extra <= 0 ? o.items : o.items.slice(0, ITEMS_SHOWN)).map(line).join('');
  return list + (extra > 0 ? `<button class="more" data-more="${o.id}" aria-expanded="${open}">${open ? 'Show less' : `+${extra} more`}</button>` : '');
}
function setOrderStatus(id, status) { const st = store.get('statusOverrides', '{}'); st[id] = status; store.set('statusOverrides', st); }
// Group orders by month: returns labels and a total per month using valueFn(order)
function byMonth(orders, valueFn) {
  const keys = [...new Set(orders.map(o => o.date.slice(0, 7)))].sort();
  return { labels: keys.map(k => MONTH_NAMES[+k.slice(5) - 1]), values: keys.map(k => +orders.filter(o => o.date.startsWith(k)).reduce((s, o) => s + valueFn(o), 0).toFixed(2)) };
}
// Customer cancels an order: only allowed while it is still "Preparing". Stock goes back on the shelf.
function cancelOrder(id) {
  loadState();
  const o = getOrders().find(x => x.id === id);
  if (!o || o.status !== 'Preparing') return false;
  setOrderStatus(id, 'Cancelled');
  o.items.forEach(i => { const p = productById(i.p); if (p) p.stock = Math.min(MAX_STOCK, p.stock + i.q); });
  saveCatalog();
  return true;
}

/* ---------- Customer basket (per session) ---------- */
const getBasket = () => JSON.parse(sessionStorage.getItem('basket') || '{}');
function saveBasket(b) { sessionStorage.setItem('basket', JSON.stringify(b)); drawBasket(); if (PAGE === 'shop.html' && typeof render === 'function') render(); }
// Add (+1) or remove (-1) one unit; never more than the stock available
function changeBasket(id, delta) {
  const p = productById(id); if (!p) return;
  const b = getBasket(); b[id] = Math.min((b[id] || 0) + delta, p.stock);
  if (b[id] <= 0) delete b[id];
  saveBasket(b);
}
const addToBasket = id => changeBasket(id, 1);
function drawBasket() {
  const list = $('basketList'); if (!list) return;
  const b = getBasket(), ids = Object.keys(b).filter(id => productById(id));
  document.getElementById('basketCount').textContent = ids.reduce((s, id) => s + b[id], 0);
  $('basketTotal').textContent = rm(ids.reduce((s, id) => s + productById(id).price * b[id], 0));
  list.innerHTML = ids.length ? ids.map(id => { const p = productById(id);
    return `<div class="d-flex justify-content-between align-items-center border-bottom py-2">
      <div><div class="fw-medium">${esc(p.name)}</div><small class="text-muted">${rm(p.price)} each</small></div>
      <div class="btn-group btn-group-sm"><button class="btn btn-outline-secondary" data-act="dec" data-id="${id}" aria-label="Remove one">-</button>
        <span class="px-2 fw-semibold">${b[id]}</span>
        <button class="btn btn-outline-secondary" data-act="inc" data-id="${id}" aria-label="Add one">+</button></div></div>`; }).join('')
    : '<p class="text-muted">Your basket is empty. Add items from the shop.</p>';
  $('placeOrder').disabled = !ids.length;
}
let orderJustPlaced = false;
function placeOrder() {
  loadState(); // use the latest stock before checking out
  const b = getBasket(), items = [], warn = [];
  Object.keys(b).forEach(id => {
    const p = productById(id); if (!p) return;
    const q = Math.min(b[id], p.stock);
    if (q < b[id]) warn.push(`${esc(p.name)}: only ${p.stock} left`);
    if (q > 0) items.push({ p: id, name: p.name, price: p.price, cid: p.cat, cat: catById(p.cat).name, q });
  });
  if (warn.length) { // stock changed while shopping: fix the basket and ask the customer to confirm again
    const nb = {}; items.forEach(i => nb[i.p] = i.q); saveBasket(nb);
    $('basketMsg').innerHTML = `<div class="alert alert-warning">Stock changed: ${warn.join('; ')}. Basket updated, please check and place the order again.</div>`;
    if (typeof render === 'function') render(); return;
  }
  if (!items.length) return;
  const id = '#' + (1000 + getOrders().length + 1);
  const mine = store.get('newOrders', '[]');
  mine.push({ id, ts: Date.now(), customer: CURRENT_USER.name, user: CURRENT_USER.username, date: new Date().toISOString().slice(0, 10), status: 'Preparing', items });
  store.set('newOrders', mine);
  items.forEach(i => { productById(i.p).stock -= i.q; }); // deduct stock
  saveCatalog();
  saveBasket({});
  orderJustPlaced = true;
  $('basketMsg').innerHTML = `<div class="alert alert-success">Order ${id} placed. <a href="orders.html">View in My orders</a></div>`;
  if (typeof render === 'function') render();
}

/* ---------- New-order notice for the admin ---------- */
// An order is "new" until the admin opens the Orders page after it was placed
const unseenOrders = () => { const seen = +localStorage.getItem('adminSeenAt') || 0; return store.get('newOrders', '[]').filter(o => o.ts > seen); };
function updateNewBadge() { const b = $('newBadge'); if (!b) return; const n = unseenOrders().length; b.textContent = n; b.hidden = !n; }
const markOrdersSeen = () => { localStorage.setItem('adminSeenAt', Date.now()); updateNewBadge(); };
let knownOrderIds = new Set(store.get('newOrders', '[]').map(o => o.id));
function toast(html) {
  let area = $('toastArea');
  if (!area) { document.body.insertAdjacentHTML('beforeend', '<div id="toastArea" class="toast-area" aria-live="polite"></div>'); area = $('toastArea'); }
  const t = document.createElement('div'); t.className = 'toast-note'; t.innerHTML = html; area.appendChild(t); setTimeout(() => t.remove(), 7000);
}
function announceNewOrders() {
  const fresh = store.get('newOrders', '[]').filter(o => !knownOrderIds.has(o.id));
  fresh.forEach(o => knownOrderIds.add(o.id));
  if (!fresh.length) return;
  const o = fresh[fresh.length - 1];
  toast(fresh.length === 1 ? `<strong>New order ${o.id}</strong> from ${esc(o.customer)} &middot; ${rm(orderTotal(o))} <a href="admin-orders.html">View</a>`
                            : `<strong>${fresh.length} new orders</strong> <a href="admin-orders.html">View</a>`);
}

/* ---------- Layout: same navbar and footer on every page ---------- */
function renderLayout() {
  const role = CURRENT_USER.role;
  const links = role === 'admin'
    ? [['dashboard.html', 'Dashboard'], ['admin-orders.html', 'Orders<span class="new-badge" id="newBadge" hidden></span>'], ['products.html', 'Products'], ['categories.html', 'Categories'], ['customers.html', 'Customers']]
    : [['home.html', 'Home'], ['shop.html', 'Shop'], ['orders.html', 'My orders']];
  const basketBtn = role === 'customer'
    ? `<button class="btn btn-sm btn-outline-light me-2" data-bs-toggle="offcanvas" data-bs-target="#basket">Basket <span id="basketCount" class="badge bg-warning text-dark">0</span></button>` : '';
  $('nav').innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-dark app-nav" aria-label="Main navigation"><div class="container">
    <a class="navbar-brand brand" href="${HOME[role]}"><span class="brand-dot"></span>MakanNow</a>
    <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu" aria-label="Toggle menu"><span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse" id="menu">
      <ul class="navbar-nav me-auto">${links.map(l => `<li class="nav-item"><a class="nav-link ${PAGE === l[0] ? 'active' : ''}" href="${l[0]}">${l[1]}</a></li>`).join('')}</ul>
      <span class="text-white me-3 small">${esc(CURRENT_USER.name)}</span>
      <button class="btn btn-sm btn-outline-light me-2" data-theme-toggle>Dark mode</button>${basketBtn}
      <button class="btn btn-sm btn-tag" id="logoutBtn">Log out</button>
    </div></div></nav>`;
  $('footer').innerHTML = `
  <footer class="app-footer"><div class="container d-flex flex-column flex-md-row justify-content-between gap-2">
    <span>&copy; 2026 MakanNow &middot; Retort ready-to-eat meals and cooking pastes &middot; IMS566 Individual Project</span>
    <span>Built by <strong>Fariz Azim</strong> &middot; <a href="https://github.com/your-username/makannow">GitHub repo</a></span>
  </div></footer>`;
  if (window.applyThemeLabels) applyThemeLabels();
  if (role === 'admin') updateNewBadge();
  $('logoutBtn').onclick = () => { sessionStorage.clear(); location.href = 'index.html'; };

  if (role === 'customer') { // basket drawer
    document.body.insertAdjacentHTML('beforeend', `
    <div class="offcanvas offcanvas-end" tabindex="-1" id="basket" aria-label="Basket">
      <div class="offcanvas-header"><h2 class="h5 mb-0">Your basket</h2><button class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div>
      <div class="offcanvas-body d-flex flex-column">
        <div id="basketMsg"></div><div id="basketList" class="flex-grow-1"></div>
        <div class="d-flex justify-content-between fs-5 my-3"><span>Total</span><strong id="basketTotal"></strong></div>
        <button class="btn btn-tag btn-lg" id="placeOrder">Place order</button>
      </div></div>`);
    $('placeOrder').onclick = placeOrder;
    $('basketList').onclick = e => {
      const btn = e.target.closest('button[data-act]'); if (!btn) return;
      changeBasket(btn.dataset.id, btn.dataset.act === 'inc' ? 1 : -1);
    };
    $('basket').addEventListener('hidden.bs.offcanvas', () => { if (orderJustPlaced && PAGE === 'home.html') location.reload(); });
    drawBasket();
  }
}
if (PAGE !== 'index.html' && CURRENT_USER) renderLayout();

// LIVE UPDATE: when another tab changes stock, products or orders, reload the data and redraw this page
window.addEventListener('storage', () => {
  loadState();
  if (CURRENT_USER && CURRENT_USER.role === 'admin') { announceNewOrders(); updateNewBadge(); }
  if (typeof drawBasket === 'function') drawBasket();
  if (typeof render === 'function') render();
});

// Theme changed: redraw so charts pick up the new colours
document.addEventListener('themechange', () => { if (typeof render === 'function') render(); });

/* ---------- Tables on phones ----------
   Long tables turn into stacked cards (see .table-stack in the CSS). Each cell gets its column
   name as a label and its content is wrapped so the label can sit beside it. */
function labelTable(t) {
  const heads = [...t.querySelectorAll('thead th')].map(h => h.textContent.trim());
  t.querySelectorAll('tbody td').forEach(td => {
    if (td.dataset.label !== undefined) return;
    const i = [...td.parentElement.children].indexOf(td);
    td.dataset.label = td.colSpan > 1 ? '' : (heads[i] || '');
    td.innerHTML = `<div class="cv">${td.innerHTML}</div>`;
  });
}
document.querySelectorAll('table.table-stack').forEach(t => {
  labelTable(t);
  new MutationObserver(() => labelTable(t)).observe(t.querySelector('tbody'), { childList: true });
});
