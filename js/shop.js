/* ===== Customer shop: label cards, sorting and a product detail window ===== */
const grid = $('shopGrid'), q = $('search'), cat = $('catFilter'), sortBy = $('sortBy');
let detailId = null; // product currently open in the detail window

// Availability label comes from live stock
function availability(p) {
  if (p.stock === 0) return ['Sold out', 's-out'];
  if (p.stock <= p.min) return [`Only ${p.stock} left`, 's-low'];
  return ['Available', 's-ok'];
}
// How to use and how long it keeps once opened, by category (new categories get a general note)
const CARE = {
  rte:    { use: 'Heat the pouch in boiling water for 5 minutes, or pour into a pan and warm for 3 minutes. Serve with rice.', days: 2 },
  paste:  { use: 'Fry the paste in a little oil until fragrant, add your meat or vegetables and coconut milk, then simmer until cooked.', days: 7 },
  sambal: { use: 'Serve as a side, or use it as the base for fried rice, fish or egg dishes.', days: 7 }
};
const careFor = p => CARE[p.cat] || { use: 'Follow the instructions on the pack.', days: 3 };

// Units sold per product (cancelled orders excluded), used for "Best selling"
function unitsSold() {
  const m = {}; getOrders().filter(o => o.status !== 'Cancelled').forEach(o => o.items.forEach(i => { m[i.p] = (m[i.p] || 0) + i.q; })); return m;
}
function sortRows(rows) {
  const s = sortBy.value, sold = s === 'best' ? unitsSold() : {}, order = id => CATS.findIndex(c => c.id === id);
  const by = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, 'name': (a, b) => a.name.localeCompare(b.name),
               'best': (a, b) => (sold[b.id] || 0) - (sold[a.id] || 0), 'default': (a, b) => order(a.cat) - order(b.cat) || a.id.localeCompare(b.id) }[s];
  const list = [...rows].sort(by);
  return [...list.filter(p => p.stock > 0), ...list.filter(p => p.stock === 0)]; // sold-out items go last
}

// Button on a card or in the detail window: sold out / add / stepper showing how many are picked (x2)
function actionHtml(p, n) {
  if (p.stock === 0) return '<button class="btn btn-tag btn-sm w-100" disabled>Sold out</button>';
  if (n === 0) return `<button class="btn btn-tag btn-sm w-100" data-act="inc" data-id="${p.id}">Add to basket</button>`;
  return `<div class="qty"><button class="btn btn-outline-secondary btn-sm" data-act="dec" data-id="${p.id}" aria-label="Remove one ${esc(p.name)}">&minus;</button>
    <span class="qty-n" aria-live="polite">&times;${n}</span>
    <button class="btn btn-tag btn-sm" data-act="inc" data-id="${p.id}" ${n >= p.stock ? 'disabled title="No more in stock"' : ''} aria-label="Add one ${esc(p.name)}">+</button></div>`;
}

function render() {
  fillCats(cat, 'All categories');
  const rows = sortRows(PRODUCTS.filter(p => p.name.toLowerCase().includes(q.value.toLowerCase()) && (!cat.value || p.cat === cat.value)));
  const basket = getBasket();
  grid.innerHTML = rows.length ? rows.map(p => { const [label, cls] = availability(p), c = catById(p.cat), n = basket[p.id] || 0;
    return `<div class="col-6 col-md-4 col-xl-3"><div class="shop-card ${n ? 'picked' : ''}">
      <button type="button" class="shop-tile" data-detail="${p.id}" style="background:${c.color}" aria-label="View details of ${esc(p.name)}">
        <span class="tcat"><span>${esc(c.name)}</span>${n ? `<span class="in-basket">&times;${n} in basket</span>` : ''}</span>
        <span class="tname">${esc(p.name)}</span></button>
      <div class="shop-body">
        <div class="shop-meta"><div><div class="price">${rm(p.price)}</div><div class="sub small">${esc(p.size)} &middot; <button type="button" class="more mt-0" data-detail="${p.id}">Details</button></div></div>
          <span class="badge-status ${cls}">${label}</span></div>
        ${actionHtml(p, n)}
      </div></div></div>`; }).join('') : '<p class="muted">No products found. Try another search or category.</p>';
  $('count').textContent = `${rows.length} products`;
  if (detailId) drawDetail();
}

// ----- Detail window -----
function drawDetail() {
  const p = productById(detailId);
  if (!p) { detailId = null; bootstrap.Modal.getOrCreateInstance($('detailModal')).hide(); return; } // deleted while open
  const c = catById(p.cat), [label, cls] = availability(p), care = careFor(p), n = getBasket()[p.id] || 0;
  $('dHead').style.background = c.color; $('dCat').textContent = c.name; $('dName').textContent = p.name;
  $('dBody').innerHTML = `
    <div class="d-flex justify-content-between align-items-end"><div><div class="price">${rm(p.price)}</div><div class="sub">${esc(p.size)}</div></div><span class="badge-status ${cls}">${label}</span></div>
    <dl class="facts">
      <dt>Ingredients</dt><dd>${p.ing ? esc(p.ing) : 'See the pack for the full ingredients list.'}</dd>
      <dt>How to use</dt><dd>${esc(care.use)}</dd>
      <dt>Storage</dt><dd>Keep in a cool, dry place. Once opened, keep chilled and finish within ${care.days} days.</dd>
      <dt>Best before</dt><dd>${fmtDate(p.bb)} (24 months shelf life, retort processed)</dd>
      <dt>Produced</dt><dd>${fmtDate(p.mfg)}</dd>
    </dl>
    <div class="mt-4" id="dAction">${actionHtml(p, n)}</div>`;
}
function openDetail(id) { detailId = id; drawDetail(); bootstrap.Modal.getOrCreateInstance($('detailModal')).show(); }
$('detailModal').addEventListener('hidden.bs.modal', () => { detailId = null; });

// Clicks: open details, or add / remove from the basket (works on cards and inside the detail window)
function onClick(e) {
  const d = e.target.closest('[data-detail]'); if (d) return openDetail(d.dataset.detail);
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const id = b.dataset.id, act = b.dataset.act;
  changeBasket(id, act === 'inc' ? 1 : -1);   // saveBasket() redraws the grid and the detail window
  // keep keyboard focus on the same control after the redraw
  const root = b.closest('#detailModal') || grid;
  const again = root.querySelector(`[data-act="${act}"][data-id="${id}"]:not([disabled])`) || root.querySelector(`[data-id="${id}"][data-act]:not([disabled])`);
  if (again) again.focus();
}
grid.addEventListener('click', onClick);
$('dBody').addEventListener('click', onClick);
[q, cat, sortBy].forEach(el => el.addEventListener('input', render));
render();
