/* ===== Customer home: personal summary and spending charts ===== */
function render() {
  const INK = cssVar('--text');
  $('welcome').textContent = 'Welcome back, ' + CURRENT_USER.name;
  const all = getMyOrders(), orders = all.filter(o => o.status !== 'Cancelled');
  $('kOrders').textContent = orders.length;
  $('kSpent').textContent = rm(orders.reduce((s, o) => s + orderTotal(o), 0));
  $('kItems').textContent = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.q, 0), 0);
  $('kActive').textContent = orders.filter(o => o.status !== 'Delivered').length;
  $('recentBody').innerHTML = all.length ? all.slice(0, 3).map(o =>
    `<tr><td><div class="t-main">${o.id}</div><span class="sub">${fmtDate(o.date)}</span></td><td>${totalHtml(o)}</td><td class="c"><span class="badge-status ${orderStatusCls(o.status)}">${o.status}</span></td></tr>`).join('')
    : '<tr><td colspan="3" class="text-center muted py-3">No orders yet. Visit the Shop to place your first one.</td></tr>';

  // Chart 1: my spending per month
  const m = byMonth(orders, orderTotal);
  makeChart('monthChart', { type: 'bar',
    data: { labels: m.labels, datasets: [{ label: 'Spent (RM)', data: m.values, backgroundColor: INK, borderRadius: 0 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'RM' } } } } });
  // Chart 2: what I buy, by category
  const cat = {}, col = {};
  orders.forEach(o => o.items.forEach(i => { const c = catOfItem(i); cat[c.name] = (cat[c.name] || 0) + i.price * i.q; col[c.name] = c.color; }));
  const names = Object.keys(cat);
  makeChart('catChart', { type: 'doughnut',
    data: { labels: names, datasets: [{ data: names.map(n => +cat[n].toFixed(2)), backgroundColor: names.map((n, i) => col[n] || PALETTE[i % PALETTE.length]) }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } } });
}
render();
