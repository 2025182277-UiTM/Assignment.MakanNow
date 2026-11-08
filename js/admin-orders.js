/* ===== Admin: all customer orders, with status updates ===== */
const body = $('orderBody'), q = $('search'), st = $('statusFilter'), SEEN_AT = +localStorage.getItem('adminSeenAt') || 0, STATUSES = ['Preparing', 'Out for delivery', 'Delivered'], SEL = { 'Preparing': 'st-prep', 'Out for delivery': 'st-ship', 'Delivered': 'st-done' };
function render() {
  const all = getOrders(), valid = all.filter(o => o.status !== 'Cancelled');
  $('kOrders').textContent = all.length;
  $('kOrdersSub').textContent = `${all.length - valid.length} cancelled`;
  $('kRevenue').textContent = rm(valid.reduce((s, o) => s + orderTotal(o), 0));
  $('kPrep').textContent = all.filter(o => o.status === 'Preparing').length;
  $('kShip').textContent = all.filter(o => o.status === 'Out for delivery').length;
  const rows = all.filter(o => (o.customer + o.id).toLowerCase().includes(q.value.toLowerCase()) && (!st.value || o.status === st.value));
  body.innerHTML = rows.length ? rows.map(o =>
    `<tr class="${o.ts > SEEN_AT ? 'row-new' : ''}"><td><div class="t-main">${o.id}${o.ts > SEEN_AT ? '<span class="new-tag">NEW</span>' : ''}</div><span class="sub">${fmtDate(o.date)}</span></td><td>${esc(o.customer)}</td><td>${itemsHtml(o)}</td>
     <td>${totalHtml(o)}</td><td>${trackingHtml(o)}</td>
     <td class="c">${o.status === 'Cancelled' ? '<span class="badge-status s-out" title="Cancelled by the customer">Cancelled</span>' :
       `<select class="form-select form-select-sm status-sel ${SEL[o.status]}" data-id="${o.id}" aria-label="Status for order ${o.id}">${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>`}</td></tr>`).join('')
    : '<tr><td colspan="6" class="text-center muted py-4">No orders match. Clear the search or filter.</td></tr>';
  markOrdersSeen(); // the admin has now seen everything placed so far
}
body.addEventListener('change', e => { if (e.target.matches('.status-sel')) { setOrderStatus(e.target.dataset.id, e.target.value); render(); } });
// "+N more" opens or closes the full item list for that order
body.addEventListener('click', e => {
  const m = e.target.closest('[data-more]'); if (!m) return;
  toggleItems(m.dataset.more); render(); const again = body.querySelector(`[data-more="${m.dataset.more}"]`); if (again) again.focus();
});
[q, st].forEach(el => el.addEventListener('input', render));
render();
