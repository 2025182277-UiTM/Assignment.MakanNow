/* ===== Admin dashboard: summary, charts, restock list, latest orders ===== */
function render() {
  const INK = cssVar('--text');
  const orders = getOrders().filter(o => o.status !== 'Cancelled'); // cancelled orders do not count as sales
  const low = PRODUCTS.filter(p => stockStatus(p).key !== 'ok');
  $('kProducts').textContent = PRODUCTS.length;
  $('kValue').textContent = rm(PRODUCTS.reduce((s, p) => s + p.stock * p.price, 0));
  $('kLow').textContent = low.length;
  $('kOpen').textContent = orders.filter(o => o.status !== 'Delivered').length;
  $('kProductsSub').textContent = `across ${CATS.length} categories`;
  $('kValueSub').textContent = `${PRODUCTS.reduce((s, p) => s + p.stock, 0).toLocaleString()} units on hand`;
  $('kLowSub').textContent = `${PRODUCTS.filter(p => p.stock === 0).length} sold out`;
  $('kOpenSub').textContent = `${orders.filter(o => o.status === 'Preparing').length} still to prepare`;

  // Chart 1: monthly revenue
  const m = byMonth(orders, orderTotal);
  makeChart('salesChart', { type: 'line',
    data: { labels: m.labels, datasets: [{ label: 'Revenue (RM)', data: m.values, borderColor: '#C62828', backgroundColor: 'rgba(198,40,40,.10)', fill: true, tension: .3, pointBackgroundColor: INK }] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'RM' } } } } });

  // Chart 2: revenue by category
  const cat = {}, col = {};
  orders.forEach(o => o.items.forEach(i => { const c = catOfItem(i); cat[c.name] = (cat[c.name] || 0) + i.price * i.q; col[c.name] = c.color; }));
  const names = Object.keys(cat);
  makeChart('catChart', { type: 'doughnut',
    data: { labels: names, datasets: [{ data: names.map(n => +cat[n].toFixed(2)), backgroundColor: names.map((n, i) => col[n] || PALETTE[i % PALETTE.length]) }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });

  // Chart 3: top 6 best sellers by units
  const units = {};
  orders.forEach(o => o.items.forEach(i => { units[i.name] = (units[i.name] || 0) + i.q; }));
  const top = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 6);
  makeChart('topChart', { type: 'bar',
    data: { labels: top.map(t => t[0]), datasets: [{ label: 'Units sold', data: top.map(t => t[1]), backgroundColor: INK, borderRadius: 0 }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } } } });

  // Restock list: most urgent first
  $('restockBody').innerHTML = low.length ? low.sort((a, b) => a.stock / a.min - b.stock / b.min).slice(0, 6).map(p => { const s = stockStatus(p);
    return `<tr><td>${esc(p.name)}</td><td>${p.stock} / ${p.min}</td><td class="c"><span class="badge-status ${s.cls}">${s.label}</span></td></tr>`; }).join('')
    : '<tr><td colspan="3" class="muted text-center py-3">Everything is above its minimum level.</td></tr>';

  // Latest 5 orders from customers
  $('latestOrders').innerHTML = getOrders().slice(0, 5).map(o =>
    `<tr><td><div class="t-main">${o.id}</div><span class="sub">${fmtDate(o.date)}</span></td><td>${esc(o.customer)}</td><td>${totalHtml(o)}</td><td class="c"><span class="badge-status ${orderStatusCls(o.status)}">${o.status}</span></td></tr>`).join('');
}
render();
