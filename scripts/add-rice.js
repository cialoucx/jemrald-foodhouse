import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Rice items that were in the old database
const riceItems = [
  { name: 'Beef Rice Bowl', category: 'rice', price: 120, stock: 50, emoji: '🍚' },
  { name: 'Chicken Teriyaki Rice', category: 'rice', price: 110, stock: 50, emoji: '🍚' },
  { name: 'Tonkatsu Rice', category: 'rice', price: 130, stock: 50, emoji: '🍚' },
  { name: 'Salmon Rice Bowl', category: 'rice', price: 150, stock: 50, emoji: '🍚' },
  { name: 'Katsudon', category: 'rice', price: 140, stock: 50, emoji: '🍚' },
  { name: 'Gyudon', category: 'rice', price: 135, stock: 50, emoji: '🍚' },
  { name: 'Ebi Tempura Rice', category: 'rice', price: 145, stock: 50, emoji: '🍚' },
  { name: 'Karaage Rice', category: 'rice', price: 115, stock: 50, emoji: '🍚' },
];

async function addRice() {
  console.log('🍚 Adding rice items back...\n');

  // Check current menu
  const { data: existing } = await supabase.from('menu_items').select('name, category').eq('category', 'rice');
  console.log(`Current rice items: ${existing?.length || 0}`);

  if (existing && existing.length > 0) {
    console.log('Rice items already exist:');
    existing.forEach(i => console.log(`  - ${i.name}`));
    console.log('\nSkipping to avoid duplicates.');
    return;
  }

  const { data: inserted, error } = await supabase
    .from('menu_items')
    .insert(riceItems)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Added ${inserted.length} rice items:\n`);
  inserted.forEach(item => {
    console.log(`  🍚 ${item.name.padEnd(30)} ₱${item.price}`);
  });

  // Show full menu summary
  const { data: all } = await supabase.from('menu_items').select('category');
  const cats = {};
  all.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
  console.log('\n── Full Menu Summary ──');
  Object.entries(cats).forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(16)} ${count} items`);
  });
  console.log(`  ${'TOTAL'.padEnd(16)} ${all.length} items`);
}

addRice().catch(console.error);
