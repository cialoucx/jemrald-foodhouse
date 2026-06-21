import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Actual rice & salad items from the menu images
const newItems = [
  // Rice items
  { name: 'Chicken Torikatsu', category: 'rice', price: 140, stock: 50, emoji: '🍚' },
  { name: 'Pork Torikatsu', category: 'rice', price: 150, stock: 50, emoji: '🍚' },
  { name: 'Chicken Katsudon', category: 'rice', price: 150, stock: 50, emoji: '🍚' },
  { name: 'Pork Katsudon', category: 'rice', price: 160, stock: 50, emoji: '🍚' },
  // Salad items (replacing old harumaki salad entries)
  { name: 'Chicken Salad', category: 'salad', price: 150, stock: 50, emoji: '🥗' },
  { name: 'Pork Salad', category: 'salad', price: 160, stock: 50, emoji: '🥗' },
];

async function fixMenu() {
  console.log('🔄 Fixing rice & salad items...\n');

  // 1. Delete old placeholder rice items
  const { data: oldRice } = await supabase.from('menu_items').select('id, name').eq('category', 'rice');
  if (oldRice && oldRice.length > 0) {
    console.log(`🗑️  Removing ${oldRice.length} old rice items:`);
    oldRice.forEach(i => console.log(`   - ${i.name}`));
    const ids = oldRice.map(i => i.id);
    await supabase.from('recipes').delete().in('menu_item_id', ids);
    await supabase.from('menu_items').delete().in('id', ids);
  }

  // 2. Delete old salad items (Harumaki Salad)
  const { data: oldSalad } = await supabase.from('menu_items').select('id, name').eq('category', 'salad');
  if (oldSalad && oldSalad.length > 0) {
    console.log(`\n🗑️  Removing ${oldSalad.length} old salad items:`);
    oldSalad.forEach(i => console.log(`   - ${i.name}`));
    const ids = oldSalad.map(i => i.id);
    await supabase.from('recipes').delete().in('menu_item_id', ids);
    await supabase.from('menu_items').delete().in('id', ids);
  }

  // 3. Insert correct items
  const { data: inserted, error } = await supabase
    .from('menu_items')
    .insert(newItems)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`\n✅ Added ${inserted.length} correct items:\n`);
  inserted.forEach(item => {
    const icon = item.category === 'rice' ? '🍚' : '🥗';
    console.log(`  ${icon} ${item.name.padEnd(25)} ₱${item.price}  [${item.category}]`);
  });

  // Full summary
  const { data: all } = await supabase.from('menu_items').select('category');
  const cats = {};
  all.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1; });
  console.log('\n── Full Menu Summary ──');
  Object.entries(cats).sort().forEach(([cat, count]) => {
    console.log(`  ${cat.padEnd(16)} ${count} items`);
  });
  console.log(`  ${'TOTAL'.padEnd(16)} ${all.length} items`);
}

fixMenu().catch(console.error);
