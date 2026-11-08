/* ===== Customer: my orders, with cancel ===== */
const body = $('orderBody'), filter = $('statusFilter');
function render() {
  const rows = getMyOrders().filter(o => !filter.value || o.status === filter.value);
  body.innerHTML = rows.length ? rows.map(o =>
    `<tr><td><div class="t-main">${o.id}</div><span class="sub">${fmtDate(o.date)}</span></td><td>${itemsHtml(o)}</td><td>${totalHtml(o)}</td><td>${trackingHtml(o)}</td>
     <td class="c"><span class="badge-status ${orderStatusCls(o.status)}">${o.status}</span></td>
     <td>${o.status === 'Preparing' ? `<button class="btn btn-sm btn-outline-danger" data-id="${o.id}">Cancel order</button>` : ''}</td></tr>`).join('')
    : '<tr><td colspan="6" class="text-center muted py-4">No orders to show.</td></tr>';
}
// "+N more" opens or closes the full item list for that order
body.addEventListener('click', e => {
  const m = e.target.closest('[data-more]'); if (!m) return;
  toggleItems(m.dataset.more); render(); const again = body.querySelector(`[data-more="${m.dataset.more}"]`); if (again) again.focus();
});
// Cancel is only possible while the order is still being prepared
body.addEventListener('click', e => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  if (!confirm(`Cancel order ${b.dataset.id}? The items go back into stock.`)) return;
  if (cancelOrder(b.dataset.id)) flash(`Order ${b.dataset.id} cancelled.`);
  else flash('This order can no longer be cancelled because it is already on its way.', 'warning');
  render();
});
filter.addEventListener('input', render);
render();
