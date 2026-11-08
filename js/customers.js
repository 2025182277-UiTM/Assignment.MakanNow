/* ===== Admin customers: registered accounts and their order activity ===== */
function render() {
  const orders = getOrders().filter(o => o.status !== 'Cancelled'), map = {};
  // Accounts first, so a registered user with no orders still appears
  USERS.filter(u => u.role === 'customer').forEach(u => { map[u.username] = { name: u.name, type: 'Demo account', n: 0, spent: 0, last: '' }; });
  store.get('users', '[]').forEach(u => { map[u.username] = { name: u.name, type: 'Registered', n: 0, spent: 0, last: '' }; });
  orders.forEach(o => {
    const c = map[o.user] || (map[o.user] = { name: o.customer, type: 'Sample data', n: 0, spent: 0, last: '' });
    c.n++; c.spent += orderTotal(o); if (o.date > c.last) c.last = o.date;
  });
  const rows = Object.entries(map).map(([u, c]) => ({ u, ...c })).sort((a, b) => b.spent - a.spent);
  $('kCust').textContent = rows.length;
  $('kReg').textContent = rows.filter(r => r.type === 'Registered').length;
  $('kRepeat').textContent = rows.filter(r => r.n >= 2).length;
  $('kAvg').textContent = rm(orders.length ? orders.reduce((s, o) => s + orderTotal(o), 0) / orders.length : 0);
  $('custBody').innerHTML = rows.map(r =>
    `<tr><td><div class="t-main">${esc(r.name)}</div><span class="sub">${esc(r.u)}</span></td>
     <td class="c"><span class="badge-status ${r.type === 'Registered' ? 's-info' : r.type === 'Demo account' ? 's-low' : 's-ok'}">${r.type}</span></td>
     <td>${r.n}</td><td>${rm(r.spent)}</td><td>${r.last ? fmtDate(r.last) : '-'}</td></tr>`).join('');
}
render();
