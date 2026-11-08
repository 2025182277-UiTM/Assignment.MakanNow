/* ===== MakanNow mock data (stands in for a database) ===== */

// Hardcoded accounts (simulated authentication)
const USERS = [
  { username: 'admin', password: 'admin123', name: 'Admin', role: 'admin' },
  { username: 'customer', password: 'customer123', name: 'Customer', role: 'customer' }
];

// Product categories
// Bump this number whenever the seed products or categories change, so browsers that saved an older
// catalogue pick up the new one
const CATALOG_VERSION = 2;
const SEED_CATEGORIES = [
  { id: 'rte', name: 'Ready to Eat', color: '#C62828' },
  { id: 'paste', name: 'Cooking Paste', color: '#B26A00' },
  { id: 'sambal', name: 'Sambal', color: '#1F6B45' }
];

// All products are retort-processed, so shelf life is 24 months from the production date
const bestBefore = (d, months = 24) => { const x = new Date(d); x.setMonth(x.getMonth() + months); return x.toISOString().slice(0, 10); };
// id, name, category, price (RM), stock, minimum level, pack size, production date, ingredients
const mk = (id, name, cat, price, stock, min, size, mfg, ing) => ({ id, name, cat, price, stock, min, size, mfg, bb: bestBefore(mfg), ing });

const SEED_PRODUCTS = [
  // Ready to Eat (retort pouch)
  mk('P001', 'Rendang Ayam', 'rte', 12.90, 85, 30, '200g', '2026-09-20', "Chicken, coconut milk, kerisik (toasted coconut), lemongrass, galangal, turmeric leaf, chilli, spices, salt, sugar"),
  mk('P002', 'Rendang Daging', 'rte', 15.90, 64, 30, '200g', '2026-09-20', "Beef, coconut milk, kerisik (toasted coconut), lemongrass, galangal, chilli, tamarind, spices, salt, sugar"),
  mk('P003', 'Kari Ayam', 'rte', 11.90, 72, 30, '200g', '2026-10-02', "Chicken, potato, coconut milk, curry spices, chilli, onion, garlic, curry leaves, salt"),
  mk('P004', 'Ayam Masak Merah', 'rte', 12.50, 18, 25, '200g', '2026-10-02', "Chicken, tomato, chilli paste, onion, garlic, ginger, spices, sugar, salt"),
  mk('P005', 'Gulai Lemak Cili Api', 'rte', 12.90, 40, 25, '200g', '2026-10-10', "Chicken, coconut milk, bird's eye chilli, turmeric, lemongrass, galangal, shallots, salt"),
  mk('P006', 'Asam Pedas Ikan', 'rte', 14.50, 27, 20, '250g', '2026-10-10', "Fish, tamarind, chilli, lady's fingers, tomato, laksa leaves, shallots, garlic, salt, sugar"),
  mk('P007', 'Sambal Sotong', 'rte', 13.50, 0, 20, '150g', '2026-08-28', "Squid, chilli, shallots, garlic, tamarind, belacan (shrimp paste), sugar, salt, oil"),
  // Cooking Paste
  mk('P008', 'Pes Rendang', 'paste', 6.90, 110, 40, '200g', '2026-09-05', "Chilli, lemongrass, galangal, shallots, garlic, ginger, turmeric, spices, oil, salt"),
  mk('P009', 'Pes Kari', 'paste', 5.90, 95, 40, '200g', '2026-09-05', "Chilli, coriander, cumin, fennel, shallots, garlic, ginger, turmeric, oil, salt"),
  mk('P010', 'Pes Asam Pedas', 'paste', 6.50, 58, 30, '200g', '2026-09-18', "Chilli, tamarind, shallots, garlic, lemongrass, belacan (shrimp paste), turmeric, oil, salt, sugar"),
  mk('P011', 'Pes Laksa', 'paste', 7.50, 44, 30, '200g', '2026-09-18', "Chilli, lemongrass, galangal, laksa leaves, dried shrimp, shallots, turmeric, oil, salt"),
  mk('P012', 'Pes Tomyam', 'paste', 6.50, 12, 30, '200g', '2026-08-15', "Chilli, lemongrass, galangal, kaffir lime leaves, lime juice, shallots, garlic, oil, salt, sugar"),
  mk('P013', 'Pes Lemak Cili Api', 'paste', 6.90, 66, 30, '200g', '2026-10-01', "Bird's eye chilli, turmeric, lemongrass, galangal, shallots, garlic, oil, salt"),
  // Sambal
  mk('P014', 'Sambal Tumis Belacan', 'sambal', 7.50, 90, 35, '150g', '2026-09-25', "Chilli, shallots, garlic, belacan (shrimp paste), tamarind, sugar, salt, oil"),
  mk('P015', 'Sambal Bilis', 'sambal', 8.50, 52, 30, '150g', '2026-09-25', "Anchovies, chilli, shallots, garlic, tamarind, sugar, salt, oil"),
  mk('P016', 'Sambal Hijau', 'sambal', 7.90, 33, 25, '150g', '2026-10-05', "Green chilli, shallots, garlic, lime juice, salt, sugar, oil"),
];

/* Sample order history. Generated with a fixed seed (same result every time),
   weighted so the first products in each list sell best. Item name and price are
   copied into each order so history stays correct if a product is later deleted. */
function buildSeedOrders() {
  let s = 7; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const people = [['Customer', 'customer'], ['Nurul Huda', 'nurul'], ['Raj Kumar', 'raj'], ['Wei Ling', 'weiling'], ['Farah Aini', 'farah'], ['Daniel Lee', 'daniel']];
  const perMonth = [4, 5, 5, 6, 7, 9]; // May to Oct 2026: sales grow month by month
  const orders = []; let n = 0;
  perMonth.forEach((count, mi) => {
    for (let k = 0; k < count; k++) {
      n++;
      let person = people[n % 6], status = 'Delivered';
      let day = 3 + (k * 3 + mi * 2) % 24, month = 5 + mi;
      if (n === 34) { person = people[3]; status = 'Preparing'; day = 24; }
      if (n === 35) { person = people[2]; status = 'Out for delivery'; day = 25; }
      if (n === 36) { person = people[0]; status = 'Preparing'; day = 26; }
      const picked = [], items = [], want = 2 + Math.floor(rnd() * 3);
      while (picked.length < want) {
        const idx = Math.floor(Math.pow(rnd(), 1.6) * SEED_PRODUCTS.length);
        if (!picked.includes(idx)) picked.push(idx);
      }
      picked.forEach(idx => {
        const p = SEED_PRODUCTS[idx], c = SEED_CATEGORIES.find(x => x.id === p.cat);
        items.push({ p: p.id, name: p.name, price: p.price, cid: p.cat, cat: c.name, q: 1 + Math.floor(rnd() * 3) });
      });
      orders.push({ id: '#' + (1000 + n), customer: person[0], user: person[1], date: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, status, items });
    }
  });
  return orders;
}
const SEED_ORDERS = buildSeedOrders();
