import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function resetOrders() {
  console.log('Resetting all orders...');
  
  // We can delete everything where id is not null
  const { data, error } = await supabase
    .from('orders')
    .delete()
    .not('id', 'is', null);

  if (error) {
    console.error('Error deleting orders:', error.message);
  } else {
    console.log('All orders have been successfully deleted.');
  }
}

resetOrders();
