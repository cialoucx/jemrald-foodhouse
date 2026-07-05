import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// The image is served as a local static file from /images/set-b-promo.jpg
// For the description metadata we'll point to the production URL directly
const IMAGE_URL = '/images/set-b-promo.jpg';
const description = `1 Cheese Maki + 1 Mango Maki + 1 California Maki ||image:${IMAGE_URL}`;

async function main() {
  // Check if Set B already exists
  const { data: existing } = await supabase
    .from('menu_items')
    .select('id, name')
    .ilike('name', '%Set B%');

  console.log('Existing Set B rows:', existing);

  if (existing && existing.length > 0) {
    // Update existing row
    for (const row of existing) {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          name: 'Set B - Cheese, Mango & California Maki',
          description,
        })
        .eq('id', row.id)
        .select();
      if (error) console.error('Update error:', error.message);
      else console.log('Updated Set B:', data);
    }
  } else {
    // Insert new row
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: 'Set B - Cheese, Mango & California Maki',
        category: 'promo',
        price: 350,
        stock: 30,
        emoji: '🏷️',
        description,
      })
      .select();
    if (error) console.error('Insert error:', error.message);
    else console.log('Inserted Set B:', data);
  }
}

main();
