import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dessertItems = [
  { name: 'Mochi Ice Cream (3pcs)', category: 'dessert', price: 110, stock: 50, emoji: '🍡' },
  { name: 'Matcha Panna Cotta', category: 'dessert', price: 95, stock: 50, emoji: '🍮' },
];

const drinksItems = [
  { name: 'Matcha Latte', category: 'drinks', price: 85, stock: 50, emoji: '🍵' },
  { name: 'Buko Juice', category: 'drinks', price: 50, stock: 50, emoji: '🥥' },
  { name: 'Iced Tea', category: 'drinks', price: 55, stock: 50, emoji: '🧊' },
];

async function addBack() {
  console.log('Adding desserts and drinks back...\n');
  const allItems = [...dessertItems, ...drinksItems];
  const { data: inserted, error } = await supabase.from('menu_items').insert(allItems).select();
  if (error) { console.error('Error:', error.message); return; }
  console.log(`Added ${inserted.length} items:`);
  inserted.forEach(i => console.log(`  ${i.emoji} ${i.name} - P${i.price} [${i.category}]`));

  const { data: all } = await supabase.from('menu_items').select('category');
  const cats = {};
  all.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
  console.log('\nFull menu:');
  Object.entries(cats).sort().forEach(([c, n]) => console.log(`  ${c}: ${n}`));
  console.log(`  TOTAL: ${all.length}`);
}

addBack().catch(console.error);
