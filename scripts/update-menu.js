import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Sushi / Salad / Kimbap Platters ───
const sushiSaladKimbap = [
  { name: '24pcs Mix Maki', category: 'sushi', price: 350, stock: 50, emoji: '🍣' },
  { name: '24pcs California Maki', category: 'sushi', price: 320, stock: 50, emoji: '🍣' },
  { name: '30pcs Mix Maki', category: 'sushi', price: 450, stock: 50, emoji: '🍣' },
  { name: '40pcs Mix Maki', category: 'sushi', price: 535, stock: 50, emoji: '🍣' },
  { name: '50pcs Mix Maki', category: 'sushi', price: 690, stock: 50, emoji: '🍣' },
  { name: '50pcs California Maki', category: 'sushi', price: 650, stock: 50, emoji: '🍣' },
  { name: '60pcs California Maki', category: 'sushi', price: 780, stock: 50, emoji: '🍣' },
  { name: '24pcs Harumaki Salad', category: 'salad', price: 480, stock: 50, emoji: '🥗' },
  { name: '30pcs Harumaki Salad', category: 'salad', price: 600, stock: 50, emoji: '🥗' },
  { name: '48pcs Mix Kimbap', category: 'sushi', price: 555, stock: 50, emoji: '🍙' },
  { name: '80pcs Green California Maki', category: 'sushi', price: 1000, stock: 50, emoji: '🍣' },
  { name: '50pcs Mix Maki & 18pcs Harumaki Salad', category: 'sushi', price: 1050, stock: 50, emoji: '🍣' },
  { name: '100pcs Mix Maki', category: 'sushi', price: 1350, stock: 50, emoji: '🍣' },
  { name: '100pcs California Maki', category: 'sushi', price: 1300, stock: 50, emoji: '🍣' },
  { name: '100pcs All Flavors Mix', category: 'sushi', price: 1500, stock: 50, emoji: '🍣' },
  { name: 'Bundle (All Flavors)', category: 'sushi', price: 1600, stock: 50, emoji: '🎁' },
];

// ─── Takoyaki ───
const takoyaki = [
  // 8pcs
  { name: 'All Veggie Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 80, stock: 100, emoji: '🐙' },
  { name: 'All Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 85, stock: 100, emoji: '🐙' },
  { name: 'All Veggie and Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 90, stock: 100, emoji: '🐙' },
  { name: 'Ham and Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 95, stock: 100, emoji: '🐙' },
  { name: 'Crab and Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 100, stock: 100, emoji: '🐙' },
  // 10pcs
  { name: 'All Veggie Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 100, stock: 100, emoji: '🐙' },
  { name: 'All Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 110, stock: 100, emoji: '🐙' },
  { name: 'All Veggie and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 120, stock: 100, emoji: '🐙' },
  { name: 'Ham and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 130, stock: 100, emoji: '🐙' },
  { name: 'Crab and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 140, stock: 100, emoji: '🐙' },
  { name: 'Octobits Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 150, stock: 100, emoji: '🐙' },
  { name: 'Octobits and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 160, stock: 100, emoji: '🐙' },
];

// ─── Takoyaki Add-Ons ───
const addOns = [
  { name: 'Mayo (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🥫' },
  { name: 'Bonito Flakes (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🐟' },
  { name: 'Spicy (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🌶️' },
  { name: 'Cheese (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🧀' },
];

const allItems = [...sushiSaladKimbap, ...takoyaki, ...addOns];

async function updateMenu() {
  console.log('🍣 Starting menu update...\n');

  // First, let's see what's currently in the menu
  const { data: existing, error: fetchErr } = await supabase
    .from('menu_items')
    .select('*')
    .order('id');

  if (fetchErr) {
    console.error('❌ Error fetching existing menu:', fetchErr.message);
    return;
  }

  console.log(`📋 Found ${existing.length} existing menu items.`);

  // Delete all existing items to replace with new menu
  if (existing.length > 0) {
    // Delete related recipes first
    const ids = existing.map(i => i.id);
    const { error: recipeErr } = await supabase
      .from('recipes')
      .delete()
      .in('menu_item_id', ids);
    
    if (recipeErr) {
      console.warn('⚠️ Could not delete old recipes (might not exist):', recipeErr.message);
    }

    const { error: delErr } = await supabase
      .from('menu_items')
      .delete()
      .in('id', ids);
    
    if (delErr) {
      console.error('❌ Error deleting old items:', delErr.message);
      return;
    }
    console.log(`🗑️  Cleared ${existing.length} old menu items.`);
  }

  // Insert new items
  const { data: inserted, error: insertErr } = await supabase
    .from('menu_items')
    .insert(allItems)
    .select();

  if (insertErr) {
    console.error('❌ Error inserting new menu items:', insertErr.message);
    return;
  }

  console.log(`\n✅ Successfully inserted ${inserted.length} new menu items!\n`);
  
  // Summary
  console.log('── Menu Summary ──');
  console.log(`  🍣 Sushi / Salad / Kimbap: ${sushiSaladKimbap.length} items`);
  console.log(`  🐙 Takoyaki: ${takoyaki.length} items`);
  console.log(`  🥫 Add-ons: ${addOns.length} items`);
  console.log(`  ── Total: ${allItems.length} items\n`);

  // Print all inserted items
  inserted.forEach(item => {
    console.log(`  [${item.category.padEnd(14)}] ${item.name.padEnd(45)} ₱${item.price}`);
  });

  console.log('\n🎉 Menu update complete!');
}

updateMenu().catch(console.error);
