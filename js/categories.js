/* ===== Admin categories: add, rename, delete ===== */
const COLORS = ['#C62828', '#B26A00', '#1F6B45', '#2A4D8F', '#7A4B2A', '#00707A']; // colour used on shop labels and charts

function render() {
  $('catBody').innerHTML = CATS.length ? CATS.map(c => {
    const n = PRODUCTS.filter(p => p.cat === c.id).length;
    return `<tr><td><span class="chip" style="background:${c.color}"></span></td>
      <td class="t-main">${esc(c.name)}</td><td>${n}</td>
      <td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary" data-act="edit" data-id="${c.id}" aria-label="Edit ${esc(c.name)}">Edit</button>
        <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${c.id}" aria-label="Delete ${esc(c.name)}">Delete</button></td></tr>`; }).join('')
    : '<tr><td colspan="4" class="text-center muted py-4">No categories yet. Add one above.</td></tr>';
  $('count').textContent = `${CATS.length} categories, ${PRODUCTS.length} products`;
}
$('catBody').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const c = CATS.find(x => x.id === b.dataset.id), n = PRODUCTS.filter(p => p.cat === c.id).length;
  if (b.dataset.act === 'edit') { // open the edit modal with the current name
    $('eId').value = c.id; $('eName').value = c.name; $('editMsg').className = 'alert d-none';
    bootstrap.Modal.getOrCreateInstance($('editModal')).show(); return;
  }
  if (!confirm(n ? `Delete "${c.name}" and its ${n} products? This cannot be undone.` : `Delete "${c.name}"?`)) return;
  CATS = CATS.filter(x => x.id !== c.id); PRODUCTS = PRODUCTS.filter(p => p.cat !== c.id);
  saveCatalog(); render(); flash(`Deleted category ${esc(c.name)}.`);
});
$('catForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('cName').value.trim(), msg = $('catMsg');
  const err = t => { msg.textContent = t; msg.className = 'alert alert-danger'; };
  if (!name) return err('Enter a category name.');
  if (CATS.some(c => c.name.toLowerCase() === name.toLowerCase())) return err('That category already exists.');
  CATS.push({ id: 'c' + Date.now(), name, color: COLORS[CATS.length % COLORS.length] });
  saveCatalog(); $('catForm').reset(); msg.className = 'alert d-none'; render(); flash(`Added category ${esc(name)}.`);
});
// Edit form: rename a category (its products stay linked)
$('editForm').addEventListener('submit', e => {
  e.preventDefault();
  const c = CATS.find(x => x.id === $('eId').value), name = $('eName').value.trim(), msg = $('editMsg');
  const err = t => { msg.textContent = t; msg.className = 'alert alert-danger'; };
  if (!c) return err('This category no longer exists.');
  if (!name) return err('Enter a category name.');
  if (CATS.some(x => x.id !== c.id && x.name.toLowerCase() === name.toLowerCase())) return err('Another category already uses this name.');
  c.name = name; saveCatalog();
  bootstrap.Modal.getOrCreateInstance($('editModal')).hide(); render(); flash(`Category renamed to ${esc(name)}.`);
});
render();
