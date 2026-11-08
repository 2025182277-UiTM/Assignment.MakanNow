/* ===== Admin products: search, filter, add, restock, delete ===== */
const body = $('prodBody'), q = $('search'), cat = $('catFilter'), st = $('statusFilter');

function render() {
  fillCats(cat, 'All categories'); fillCats($('pCat'), null);
  const rows = PRODUCTS.filter(p => (p.name + p.id).toLowerCase().includes(q.value.toLowerCase()) && (!cat.value || p.cat === cat.value) && (!st.value || stockStatus(p).key === st.value));
  body.innerHTML = rows.length ? rows.map(p => { const s = stockStatus(p);
    return `<tr><td><div class="t-main">${esc(p.name)}</div><span class="sub"><span class="dot" style="background:${catById(p.cat).color}"></span>${p.id} &middot; ${esc(catById(p.cat).name)} &middot; ${esc(p.size)}</span></td>
    <td>${rm(p.price)}</td><td><div class="t-main">${p.stock}</div><span class="sub">min ${p.min}</span></td><td>${fmtDate(p.bb)}</td>
    <td class="c"><span class="badge-status ${s.cls}">${s.label}</span></td>
    <td><div class="d-flex flex-wrap gap-1"><button class="btn btn-sm btn-tag" data-act="restock" data-id="${p.id}">Add stock</button>
      <button class="btn btn-sm btn-outline-secondary" data-act="price" data-id="${p.id}" aria-label="Edit price of ${esc(p.name)}">Edit price</button>
      <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${p.id}" aria-label="Delete ${esc(p.name)}">Delete</button></div></td></tr>`; }).join('')
    : '<tr><td colspan="6" class="text-center muted py-4">No products match. Clear the search or filters.</td></tr>';
  $('count').textContent = `${rows.length} of ${PRODUCTS.length} products`;
}
[q, cat, st].forEach(el => el.addEventListener('input', render));

// Table buttons: restock (opens modal) and delete (asks first)
body.addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const p = productById(b.dataset.id);
  if (b.dataset.act === 'restock') {
    const room = MAX_STOCK - p.stock;
    $('rsId').value = p.id; $('rsName').textContent = `${p.name} (now ${p.stock}, room for ${room} more)`; $('rsQty').value = ''; $('rsQty').max = room; $('rsMsg').className = 'alert d-none';
    bootstrap.Modal.getOrCreateInstance($('restockModal')).show();
  } else if (b.dataset.act === 'price') {
    $('prId').value = p.id; $('prName').textContent = `${p.name} (now ${rm(p.price)})`; $('prVal').value = p.price.toFixed(2); $('prMsg').className = 'alert d-none';
    bootstrap.Modal.getOrCreateInstance($('priceModal')).show();
  } else if (confirm(`Delete "${p.name}"? Past orders keep their record.`)) {
    PRODUCTS = PRODUCTS.filter(x => x.id !== p.id); saveCatalog(); render(); flash(`Deleted ${esc(p.name)}.`);
  }
});

// Edit price form
$('priceForm').addEventListener('submit', e => {
  e.preventDefault();
  const p = productById($('prId').value), v = Math.round(parseFloat($('prVal').value) * 100) / 100;
  const err = t => { $('prMsg').textContent = t; $('prMsg').className = 'alert alert-danger'; };
  if (!p) return err('This product no longer exists.');
  if (!(v >= 0.1) || v > 999.99) return err('Enter a price between RM 0.10 and RM 999.99.');
  if (v === p.price) return err('That is already the current price.');
  const old = p.price; p.price = v; saveCatalog();
  bootstrap.Modal.getOrCreateInstance($('priceModal')).hide(); render(); flash(`${esc(p.name)}: price changed from ${rm(old)} to ${rm(v)}.`);
});

// Restock form (maximum 2000 units per product)
$('restockForm').addEventListener('submit', e => {
  e.preventDefault();
  const qty = parseInt($('rsQty').value, 10), p = productById($('rsId').value);
  const rsErr = t => { $('rsMsg').textContent = t; $('rsMsg').className = 'alert alert-danger'; };
  if (!p || !(qty > 0)) return rsErr('Enter a quantity of 1 or more.');
  if (p.stock + qty > MAX_STOCK) return rsErr(`The maximum is ${MAX_STOCK} units per product. You can add up to ${MAX_STOCK - p.stock} more.`);
  p.stock += qty; saveCatalog(); bootstrap.Modal.getOrCreateInstance($('restockModal')).hide(); render(); flash(`Added ${qty} units to ${esc(p.name)}.`);
});

// Add product form
$('mfg').value = new Date().toISOString().slice(0, 10);
$('addForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('pName').value.trim(), size = $('pSize').value.trim(), price = parseFloat($('pPrice').value);
  const stock = parseInt($('pStock').value, 10), min = parseInt($('pMin').value, 10), mfg = $('mfg').value, msg = $('addMsg');
  const err = t => { msg.textContent = t; msg.className = 'alert alert-danger'; };
  if (!CATS.length) return err('Create a category first on the Categories page.');
  if (!name || !size) return err('Enter the product name and pack size.');
  if (PRODUCTS.some(p => p.name.toLowerCase() === name.toLowerCase())) return err('A product with this name already exists.');
  if (!(price > 0)) return err('Price must be more than 0.');
  if (!(stock >= 0) || !(min >= 0)) return err('Stock and minimum level must be 0 or more.');
  if (stock > MAX_STOCK || min > MAX_STOCK) return err(`The maximum is ${MAX_STOCK} units per product.`);
  if (!mfg) return err('Choose the production date.');
  const next = Math.max(0, ...PRODUCTS.map(p => parseInt(p.id.slice(1), 10))) + 1;
  PRODUCTS.push({ id: 'P' + String(next).padStart(3, '0'), name, cat: $('pCat').value, price, stock, min, size, mfg, bb: bestBefore(mfg), ing: $('pIng').value.trim() });
  saveCatalog(); $('addForm').reset(); $('mfg').value = new Date().toISOString().slice(0, 10); msg.className = 'alert d-none';
  bootstrap.Modal.getOrCreateInstance($('addModal')).hide(); render(); flash(`Added ${esc(name)}.`);
});
render();
