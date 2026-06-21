import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const newItems = [
  {
    name: 'Set G - Sweet & Spicy, Sweet & Mango Maki',
    category: 'promo',
    price: 350,
    stock: 30,
    emoji: '🏷️',
    description: '1 Sweet and Spicy + 1 Sweet Maki + 1 Mango Maki'
  },
  {
    name: 'Set H - Green, Crazy & Sweet and Spicy Maki',
    category: 'promo',
    price: 350,
    stock: 30,
    emoji: '🏷️',
    description: '1 Green Maki + 1 Crazy Maki + 1 Sweet and Spicy'
  },
  {
    name: 'Set I - Mango, Sweet & Spicy & California Maki',
    category: 'promo',
    price: 350,
    stock: 30,
    emoji: '🏷️',
    description: '1 Mango Maki + 1 Sweet and Spicy + 1 California Maki'
  },
];

async function addNewItems() {
  console.log('🏷️  Adding new promo sets...\n');

  const { data: existing, error: fetchErr } = await supabase
    .from('menu_items')
    .select('name');

  if (fetchErr) {
    console.error('❌ Error fetching existing menu:', fetchErr.message);
    return;
  }

  const existingNames = new Set(existing.map(i => i.name));
  const toInsert = newItems.filter(i => !existingNames.has(i.name));
  const skipped = newItems.filter(i => existingNames.has(i.name));

  if (skipped.length > 0) {
    console.log(`⚠️  Skipping ${skipped.length} already existing item(s):`);
    skipped.forEach(i => console.log(`  - ${i.name}`));
  }

  if (toInsert.length === 0) {
    console.log('\n⚠️  Nothing new to insert.');
    return;
  }

  console.log(`📋 Inserting ${toInsert.length} promo set(s):`);
  toInsert.forEach(i => console.log(`  - ${i.name}`));

  const { data: inserted, error: insertErr } = await supabase
    .from('menu_items')
    .insert(toInsert)
    .select();

  if (insertErr) {
    console.error('❌ Error inserting items:', insertErr.message);
    return;
  }

  console.log(`\n✅ Successfully added ${inserted.length} promo set(s)!`);
  inserted.forEach(item => {
    console.log(`  [${item.category.padEnd(10)}] ${item.name.padEnd(50)} ₱${item.price}`);
  });
}

addNewItems().catch(console.error);
