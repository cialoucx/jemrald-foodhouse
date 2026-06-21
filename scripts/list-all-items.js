import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function list() {
  const { data, error } = await supabase.from('menu_items').select('*').order('id');
  if (error) {
    console.error('Error fetching menu items:', error);
    return;
  }
  console.log(`--- REMOTE DATABASE MENU ITEMS (${data.length} items) ---`);
  data.forEach(item => {
    console.log(`[id: ${item.id}] [${item.category}] ${item.name} - ₱${item.price} (Stock: ${item.stock})`);
  });
}

list();
