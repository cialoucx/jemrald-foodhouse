import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixMusubi() {
  const fixes = [
    { old: 'Spam Masubi (3pcs)', new: 'Spam Musubi (3pcs)' },
    { old: 'Spam Masubi (2pcs)', new: 'Spam Musubi (2pcs)' },
  ];

  for (const fix of fixes) {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ name: fix.new })
      .eq('name', fix.old)
      .select();

    if (error) {
      console.error(`❌ Failed to rename "${fix.old}":`, error.message);
    } else if (data.length === 0) {
      console.warn(`⚠️  Item not found: "${fix.old}"`);
    } else {
      console.log(`✅ Renamed: "${fix.old}" → "${fix.new}"`);
    }
  }
}

fixMusubi().catch(console.error);
