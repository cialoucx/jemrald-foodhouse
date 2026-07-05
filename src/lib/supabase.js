import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dizhijidescnxidyfwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kDi_EdlYR2Ol3hKRoF2tpA_34najeDJ';

// Real Supabase Client (initialized lazily to avoid connection errors in offline mode)
let realSupabaseInstance = null;
function getRealSupabase() {
  if (!realSupabaseInstance) {
    realSupabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return realSupabaseInstance;
}

const isBrowser = typeof window !== 'undefined';

// Connection Check & Offline Toggle
if (isBrowser) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('online') === 'true') {
    sessionStorage.setItem('supabase_offline', 'false');
  } else if (params.get('offline') === 'true') {
    sessionStorage.setItem('supabase_offline', 'true');
  }

  if (sessionStorage.getItem('supabase_offline') === null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch(SUPABASE_URL, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    })
      .then(() => {
        clearTimeout(timeoutId);
        sessionStorage.setItem('supabase_offline', 'false');
      })
      .catch(() => {
        clearTimeout(timeoutId);
        console.warn('[Supabase] Remote server unreachable. Switching to offline fallback.');
        sessionStorage.setItem('supabase_offline', 'true');
        window.location.reload();
      });
  }
}

// Default Seed Data
const defaultMenuItems = [
  // Promo (Sets A to J)
  { id: 101, name: 'Set A', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: 'Promo Set A Platter' },
  { id: 102, name: 'Set B', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: 'Promo Set B Platter' },
  { id: 103, name: 'Set C', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: 'Promo Set C Platter' },
  { id: 104, name: 'Set D', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: 'Promo Set D Platter' },
  { id: 105, name: 'Set E', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: 'Promo Set E Platter' },
  { id: 106, name: 'Set F', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: 'Promo Set F Platter' },
  { id: 1, name: 'Set G - Sweet & Spicy, Sweet & Mango Maki', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: '1 Sweet and Spicy + 1 Sweet Maki + 1 Mango Maki' },
  { id: 2, name: 'Set H - Green, Crazy & Sweet and Spicy Maki', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: '1 Green Maki + 1 Crazy Maki + 1 Sweet and Spicy' },
  { id: 3, name: 'Set I - Mango, Sweet & Spicy & California Maki', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: '1 Mango Maki + 1 Sweet and Spicy + 1 California Maki' },
  { id: 107, name: 'Set J', category: 'promo', price: 350, stock: 30, emoji: '🏷️', description: 'Promo Set J Platter' },

  // Sushi & Maki Platters
  { id: 4, name: '24pcs Mix Maki', category: 'sushi', price: 350, stock: 50, emoji: '🍣', description: 'Assorted maki platter' },
  { id: 5, name: '24pcs California Maki', category: 'sushi', price: 320, stock: 50, emoji: '🍣', description: 'California maki platter' },
  { id: 6, name: '30pcs Mix Maki', category: 'sushi', price: 450, stock: 50, emoji: '🍣', description: 'Assorted maki platter' },
  { id: 7, name: '40pcs Mix Maki', category: 'sushi', price: 535, stock: 50, emoji: '🍣', description: 'Assorted maki platter' },
  { id: 8, name: '50pcs Mix Maki', category: 'sushi', price: 690, stock: 50, emoji: '🍣', description: 'Assorted maki platter' },
  { id: 9, name: '50pcs California Maki', category: 'sushi', price: 650, stock: 50, emoji: '🍣', description: 'California maki platter' },
  { id: 10, name: '60pcs California Maki', category: 'sushi', price: 780, stock: 50, emoji: '🍣', description: 'California maki platter' },
  { id: 11, name: '48pcs Mix Kimbap', category: 'kimbap', price: 555, stock: 50, emoji: '🍙', description: 'Delicious Korean-style kimbap' },
  { id: 216, name: '8pcs Mix Kimbap', category: 'kimbap', price: 150, stock: 50, emoji: '🍙', description: 'Mixed flavor Korean-style kimbap' },
  { id: 12, name: '80pcs Green California Maki', category: 'sushi', price: 1000, stock: 50, emoji: '🍣', description: 'Premium green California maki' },
  { id: 13, name: '50pcs Mix Maki & 18pcs Harumaki Salad', category: 'sushi', price: 1050, stock: 50, emoji: '🍣', description: 'Combo platter of maki and salad' },
  { id: 14, name: '100pcs Mix Maki', category: 'sushi', price: 1350, stock: 50, emoji: '🍣', description: 'Huge assorted maki platter' },
  { id: 15, name: '100pcs California Maki', category: 'sushi', price: 1300, stock: 50, emoji: '🍣', description: 'Huge California maki platter' },
  { id: 16, name: '100pcs All Flavors Mix', category: 'sushi', price: 1500, stock: 50, emoji: '🍣', description: 'Ultimate maki mix' },
  { id: 17, name: 'Bundle (All Flavors)', category: 'sushi', price: 1600, stock: 50, emoji: '🎁', description: 'Special bundle containing all flavors' },
  { id: 108, name: '10pcs Cheesy Overload California Maki', category: 'sushi', price: 170, stock: 50, emoji: '🍣', description: 'California maki with melted cheese' },
  { id: 109, name: '30pcs Crabgo & 30pcs California Maki', category: 'sushi', price: 950, stock: 50, emoji: '🍣', description: 'Combo platter of Crabgo and California Maki' },
  { id: 110, name: '50pcs California Maki & 18pcs Harumaki Salad', category: 'sushi', price: 1000, stock: 50, emoji: '🍣', description: 'Combo platter of California maki and harumaki salad' },
  { id: 111, name: '50pcs Crunchy Cheese', category: 'sushi', price: 750, stock: 50, emoji: '🍣', description: 'Crunchy cheese roll platter' },
  { id: 112, name: '50pcs Mix Maki Happy Birthday', category: 'sushi', price: 700, stock: 50, emoji: '🍣', description: 'Special birthday mix maki platter' },
  { id: 113, name: '60pcs Pizza Mix Maki', category: 'sushi', price: 800, stock: 50, emoji: '🍣', description: 'Pizza style baked mix maki platter' },
  { id: 115, name: '70pcs California Maki', category: 'sushi', price: 940, stock: 50, emoji: '🍣', description: 'Large California maki platter' },
  { id: 116, name: '70pcs Mix Maki', category: 'sushi', price: 950, stock: 50, emoji: '🍣', description: 'Large assorted maki platter' },
  { id: 117, name: '80pcs Mix Maki', category: 'sushi', price: 1000, stock: 50, emoji: '🍣', description: 'Huge assorted maki platter' },
  { id: 201, name: '80pcs Mix Maki with Dedication', category: 'sushi', price: 1050, stock: 50, emoji: '🍣', description: 'Assorted maki platter with custom dedication' },
  { id: 202, name: '50pcs Cheesy Overload California Maki', category: 'sushi', price: 750, stock: 50, emoji: '🍣', description: 'California maki with melted cheese overload' },
  { id: 204, name: 'Mango Baked Sushi (Small)', category: 'baked-sushi', price: 180, stock: 50, emoji: '🍣', description: 'Delicious baked sushi topped with ripe mango' },
  { id: 205, name: 'Mango Baked Sushi (Medium)', category: 'baked-sushi', price: 350, stock: 50, emoji: '🍣', description: 'Delicious baked sushi topped with ripe mango' },
  { id: 206, name: 'Mango Baked Sushi (Large)', category: 'baked-sushi', price: 550, stock: 50, emoji: '🍣', description: 'Delicious baked sushi topped with ripe mango' },
  { id: 207, name: 'Crab Baked Sushi (Small)', category: 'baked-sushi', price: 180, stock: 50, emoji: '🍣', description: 'Savory baked sushi filled with crab' },
  { id: 208, name: 'Crab Baked Sushi (Medium)', category: 'baked-sushi', price: 350, stock: 50, emoji: '🍣', description: 'Savory baked sushi filled with crab' },
  { id: 209, name: 'Crab Baked Sushi (Large)', category: 'baked-sushi', price: 550, stock: 50, emoji: '🍣', description: 'Savory baked sushi filled with crab' },
  { id: 210, name: 'Cheese Baked Sushi (Small)', category: 'baked-sushi', price: 180, stock: 50, emoji: '🍣', description: 'Rich and creamy cheese baked sushi' },
  { id: 211, name: 'Cheese Baked Sushi (Medium)', category: 'baked-sushi', price: 350, stock: 50, emoji: '🍣', description: 'Rich and creamy cheese baked sushi' },
  { id: 212, name: 'Cheese Baked Sushi (Large)', category: 'baked-sushi', price: 550, stock: 50, emoji: '🍣', description: 'Rich and creamy cheese baked sushi' },
  { id: 213, name: 'California Baked Sushi (Small)', category: 'baked-sushi', price: 180, stock: 50, emoji: '🍣', description: 'Baked version of the classic California maki' },
  { id: 214, name: 'California Baked Sushi (Medium)', category: 'baked-sushi', price: 350, stock: 50, emoji: '🍣', description: 'Baked version of the classic California maki' },
  { id: 215, name: 'California Baked Sushi (Large)', category: 'baked-sushi', price: 550, stock: 50, emoji: '🍣', description: 'Baked version of the classic California maki' },
  { id: 171, name: 'Kimbap Mango', category: 'kimbap', price: 130, stock: 50, emoji: '🍙', description: 'Sweet mango filled kimbap' },
  { id: 172, name: 'Kimbap Cheese', category: 'kimbap', price: 140, stock: 50, emoji: '🍙', description: 'Rich cheese filled kimbap' },
  { id: 173, name: 'Kimbap Crab', category: 'kimbap', price: 150, stock: 50, emoji: '🍙', description: 'Savory crab filled kimbap' },
  { id: 174, name: 'Kimbap Spam', category: 'kimbap', price: 160, stock: 50, emoji: '🍙', description: 'Spam filled kimbap' },

  // Salad
  { id: 18, name: '24pcs Harumaki Salad', category: 'salad', price: 480, stock: 50, emoji: '🥗', description: 'Fresh harumaki salad platter' },
  { id: 19, name: '30pcs Harumaki Salad', category: 'salad', price: 600, stock: 50, emoji: '🥗', description: 'Fresh harumaki salad platter' },
  { id: 20, name: 'Chicken Salad', category: 'salad', price: 150, stock: 50, emoji: '🥗', description: 'Fresh chicken salad bowl' },
  { id: 21, name: 'Pork Salad', category: 'salad', price: 160, stock: 50, emoji: '🥗', description: 'Fresh pork salad bowl' },
  { id: 114, name: '6pcs Harumaki Salad', category: 'salad', price: 125, stock: 50, emoji: '🥗', description: 'Fresh harumaki salad portion' },
  { id: 131, name: 'Tonkatsu with Salad', category: 'salad', price: 160, stock: 50, emoji: '🥗', description: 'Crispy tonkatsu served with salad' },
  { id: 132, name: 'Torikatsu with Salad', category: 'salad', price: 150, stock: 50, emoji: '🥗', description: 'Crispy torikatsu served with salad' },

  // Takoyaki (8pcs)
  { id: 22, name: 'All Veggie Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 80, stock: 100, emoji: '🐙', description: 'Veggie filled takoyaki' },
  { id: 23, name: 'All Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 85, stock: 100, emoji: '🐙', description: 'Cheese filled takoyaki' },
  { id: 24, name: 'All Veggie and Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 90, stock: 100, emoji: '🐙', description: 'Veggie & cheese takoyaki' },
  { id: 25, name: 'Ham and Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 95, stock: 100, emoji: '🐙', description: 'Ham & cheese takoyaki' },
  { id: 26, name: 'Crab and Cheese Takoyaki (8pcs)', category: 'takoyaki-8pcs', price: 100, stock: 100, emoji: '🐙', description: 'Crab & cheese takoyaki' },

  // Takoyaki (10pcs)
  { id: 27, name: 'All Veggie Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 100, stock: 100, emoji: '🐙', description: 'Veggie filled takoyaki' },
  { id: 28, name: 'All Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 110, stock: 100, emoji: '🐙', description: 'Cheese filled takoyaki' },
  { id: 29, name: 'All Veggie and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 120, stock: 100, emoji: '🐙', description: 'Veggie & cheese takoyaki' },
  { id: 30, name: 'Ham and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 130, stock: 100, emoji: '🐙', description: 'Ham & cheese takoyaki' },
  { id: 31, name: 'Crab and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 140, stock: 100, emoji: '🐙', description: 'Crab & cheese takoyaki' },
  { id: 32, name: 'Octobits Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 150, stock: 100, emoji: '🐙', description: 'Classic octobits takoyaki' },
  { id: 33, name: 'Octobits and Cheese Takoyaki (10pcs)', category: 'takoyaki-10pcs', price: 160, stock: 100, emoji: '🐙', description: 'Octobits & cheese takoyaki' },
  { id: 203, name: 'Mix Takoyaki (24pcs)', category: 'takoyaki-24pcs', price: 240, stock: 100, emoji: '🐙', description: 'Mixed flavors takoyaki platter (Veggie, Cheese, Ham, Crab, Octobits)' },

  // Add-ons
  { id: 34, name: 'Mayo (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🥫', description: 'Extra mayo sauce' },
  { id: 35, name: 'Bonito Flakes (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🐟', description: 'Extra bonito flakes' },
  { id: 36, name: 'Spicy (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🌶️', description: 'Extra spicy kick' },
  { id: 37, name: 'Cheese (Add-on)', category: 'add-ons', price: 10, stock: 999, emoji: '🧀', description: 'Extra cheese sauce' },

  // Solo Maki Rolls
  { id: 118, name: 'Crab Cheese Roll', category: 'solo', price: 150, stock: 50, emoji: '🍣', description: 'Sushi roll with crab and cream cheese' },
  { id: 119, name: 'Crab Kani (8pcs)', category: 'sushi', price: 250, stock: 50, emoji: '🍣', description: 'Kani sushi rolls' },
  { id: 120, name: 'Crabgo', category: 'solo', price: 150, stock: 50, emoji: '🍣', description: 'Kani crab rolls' },
  { id: 121, name: 'Crabstic Roll', category: 'solo', price: 150, stock: 50, emoji: '🍣', description: 'Classic crabstick sushi roll' },
  { id: 122, name: 'Creamy Cheese', category: 'solo', price: 150, stock: 50, emoji: '🍣', description: 'Extra creamy cheese roll' },
  { id: 123, name: 'Crunchy Cheese', category: 'solo', price: 160, stock: 50, emoji: '🍣', description: 'Crunchy cheese roll' },
  { id: 124, name: 'Kani Mango Roll', category: 'sushi', price: 160, stock: 50, emoji: '🍣', description: 'Roll with crab sticks and sweet mango' },
  { id: 125, name: 'Mango on Top Roll', category: 'sushi', price: 150, stock: 50, emoji: '🍣', description: 'Sushi roll topped with fresh mango' },
  { id: 126, name: 'Mango Cheese Roll', category: 'solo', price: 150, stock: 50, emoji: '🍣', description: 'Sweet mango and cheese roll' },
  { id: 127, name: 'Crazy Maki', category: 'solo', price: 120, stock: 50, emoji: '🍣', description: 'Spicy crazy maki rolls' },
  { id: 128, name: 'Riri Cheese', category: 'solo', price: 130, stock: 50, emoji: '🍣', description: 'Special riri cheese roll' },
  { id: 129, name: 'Sweet & Spicy', category: 'solo', price: 120, stock: 50, emoji: '🍣', description: 'Sweet and spicy glazed maki' },
  { id: 130, name: 'Veggie Roll', category: 'solo', price: 180, stock: 50, emoji: '🍣', description: 'Fresh vegetable sushi roll' },
  { id: 184, name: 'California Maki', category: 'solo', price: 115, stock: 50, emoji: '🍣', description: 'Classic California maki' },
  { id: 177, name: 'Sweet Molly', category: 'solo', price: 120, stock: 50, emoji: '🍣', description: 'Sweet maki roll' },
  { id: 165, name: 'Crabgo Sushi', category: 'solo', price: 150, stock: 50, emoji: '🍣', description: 'Kani crab sushi' },
  { id: 168, name: 'Mix Chessy and Spicy Overload (Mix)', category: 'solo', price: 170, stock: 50, emoji: '🍣', description: 'Cheesy and spicy overload maki' },
  { id: 217, name: 'Mix Chessy and Spicy Overload (Cheesy Overload)', category: 'solo', price: 170, stock: 50, emoji: '🍣', description: 'Cheesy overload maki variant' },
  { id: 218, name: 'Mix Chessy and Spicy Overload (Spicy Overload)', category: 'solo', price: 170, stock: 50, emoji: '🍣', description: 'Spicy overload maki variant' },

  // Rice
  { id: 38, name: 'Chicken Torikatsu', category: 'rice', price: 140, stock: 50, emoji: '🍚', description: 'Crispy chicken torikatsu with rice' },
  { id: 39, name: 'Pork Torikatsu', category: 'rice', price: 150, stock: 50, emoji: '🍚', description: 'Crispy pork torikatsu with rice' },
  { id: 40, name: 'Chicken Katsudon', category: 'rice', price: 150, stock: 50, emoji: '🍚', description: 'Chicken katsudon rice bowl' },
  { id: 41, name: 'Pork Katsudon', category: 'rice', price: 160, stock: 50, emoji: '🍚', description: 'Pork katsudon rice bowl' },
];

const defaultInventoryItems = [
  { id: 1, name: 'Sushi Rice', quantity: 25, unit: 'kg', min_stock: 5 },
  { id: 2, name: 'Nori Sheets', quantity: 500, unit: 'pcs', min_stock: 50 },
  { id: 3, name: 'Salmon', quantity: 5000, unit: 'g', min_stock: 500 },
  { id: 4, name: 'Crab Sticks', quantity: 200, unit: 'pcs', min_stock: 20 },
  { id: 5, name: 'Cucumber', quantity: 3000, unit: 'g', min_stock: 300 },
  { id: 6, name: 'Mango', quantity: 50, unit: 'pcs', min_stock: 10 },
  { id: 7, name: 'Mayo', quantity: 2000, unit: 'g', min_stock: 200 },
  { id: 8, name: 'Bonito Flakes', quantity: 1000, unit: 'g', min_stock: 100 },
  { id: 9, name: 'Cheese Sauce', quantity: 2000, unit: 'g', min_stock: 200 },
  { id: 10, name: 'Takoyaki Veggies', quantity: 5000, unit: 'g', min_stock: 500 },
  { id: 11, name: 'Octobits', quantity: 3000, unit: 'g', min_stock: 300 },
  { id: 12, name: 'Chicken', quantity: 10000, unit: 'g', min_stock: 1000 },
  { id: 13, name: 'Pork', quantity: 10000, unit: 'g', min_stock: 1000 },
];

const defaultRecipes = [
  { id: 1, menu_item_id: 4, ingredient_id: 1, quantity_per_serving: 0.1 },
  { id: 2, menu_item_id: 4, ingredient_id: 2, quantity_per_serving: 3 },
  { id: 3, menu_item_id: 38, ingredient_id: 1, quantity_per_serving: 0.15 },
  { id: 4, menu_item_id: 38, ingredient_id: 12, quantity_per_serving: 200 },
  { id: 5, menu_item_id: 39, ingredient_id: 1, quantity_per_serving: 0.15 },
  { id: 6, menu_item_id: 39, ingredient_id: 13, quantity_per_serving: 200 },
  { id: 7, menu_item_id: 22, ingredient_id: 10, quantity_per_serving: 80 },
];

const defaultProfiles = [
  { id: 'admin-id', name: 'Admin User', email: 'admin@jemrald.com', role: 'admin', phone: '09123456789', address: 'Main Street', avatar_url: '' }
];

// Offline Channels Registry
const mockChannels = [];

// Local Storage Helper
function getOfflineTable(table, defaultData = []) {
  if (!isBrowser) return defaultData;
  const key = `offline_${table}`;
  let val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  
  // Force update if the data was initialized before adding new items (specifically Set A)
  const parsed = JSON.parse(val);
  if (table === 'menu_items' && !parsed.some(item => item.name.toLowerCase().includes('set a'))) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  
  return parsed;
}

function saveOfflineTable(table, data) {
  if (!isBrowser) return;
  localStorage.setItem(`offline_${table}`, JSON.stringify(data));
}

function broadcastChange(table, eventType, oldData, newData) {
  mockChannels.forEach(chan => {
    if (chan.callbacks) {
      chan.callbacks.forEach(cb => {
        if (cb.filter && cb.filter.table === table) {
          cb.callback({
            eventType,
            new: newData,
            old: oldData
          });
        }
      });
    }
  });
}

class MockQueryBuilder {
  constructor(table, getItems, saveItems) {
    this.table = table;
    this.getItems = getItems;
    this.saveItems = saveItems;
    this.filters = [];
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.limitVal = null;
    this.orderVal = null;
    this.operation = 'select'; // 'select', 'insert', 'update', 'delete'
    this.payload = null;
  }

  select(columns) {
    if (this.operation === 'select') {
      this.operation = 'select';
    }
    return this;
  }

  insert(payload) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push(item => item[col] == val);
    return this;
  }

  in(col, vals) {
    this.filters.push(item => vals.includes(item[col]));
    return this;
  }

  or(filterStr) {
    return this;
  }

  filter(col, op, val) {
    if (op === 'ilike') {
      const cleanVal = val.toLowerCase().replace(/%/g, '');
      this.filters.push(item => item[col] && item[col].toLowerCase().includes(cleanVal));
    }
    return this;
  }

  order(col, opts = {}) {
    this.orderVal = { col, ascending: opts.ascending !== false };
    return this;
  }

  limit(num) {
    this.limitVal = num;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async then(onfulfilled, onrejected) {
    try {
      const res = await this.execute();
      return onfulfilled(res);
    } catch (err) {
      return onrejected ? onrejected(err) : Promise.reject(err);
    }
  }

  async execute() {
    let items = [...this.getItems()];

    if (this.operation === 'select') {
      // Apply filters
      for (const filter of this.filters) {
        items = items.filter(filter);
      }

      // Order
      if (this.orderVal) {
        items.sort((a, b) => {
          const valA = a[this.orderVal.col];
          const valB = b[this.orderVal.col];
          if (valA < valB) return this.orderVal.ascending ? -1 : 1;
          if (valA > valB) return this.orderVal.ascending ? 1 : -1;
          return 0;
        });
      }

      // Limit
      if (this.limitVal !== null) {
        items = items.slice(0, this.limitVal);
      }

      if (this.isSingle || this.isMaybeSingle) {
        return { data: items[0] || null, error: null };
      }

      return { data: items, error: null };
    }

    if (this.operation === 'insert') {
      const isArray = Array.isArray(this.payload);
      const rowsToInsert = isArray ? this.payload : [this.payload];
      
      const insertedRows = rowsToInsert.map((row, index) => {
        const id = row.id || `mock-${Date.now()}-${index}-${Math.floor(Math.random()*1000)}`;
        return {
          id,
          created_at: new Date().toISOString(),
          ...row
        };
      });

      items = [...items, ...insertedRows];
      this.saveItems(items);

      insertedRows.forEach(row => {
        broadcastChange(this.table, 'INSERT', null, row);
      });

      if (this.isSingle || this.isMaybeSingle) {
        return { data: insertedRows[0] || null, error: null };
      }
      return { data: isArray ? insertedRows : insertedRows[0], error: null };
    }

    if (this.operation === 'update') {
      let updatedRows = [];
      const updatedItems = items.map(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(item)) {
            matches = false;
            break;
          }
        }

        if (matches) {
          const oldItem = { ...item };
          const newItem = { ...item, ...this.payload };
          updatedRows.push({ oldItem, newItem });
          return newItem;
        }
        return item;
      });

      this.saveItems(updatedItems);

      updatedRows.forEach(({ oldItem, newItem }) => {
        broadcastChange(this.table, 'UPDATE', oldItem, newItem);
      });

      if (this.isSingle || this.isMaybeSingle) {
        return { data: updatedRows[0]?.newItem || null, error: null };
      }
      return { data: updatedRows.map(r => r.newItem), error: null };
    }

    if (this.operation === 'delete') {
      let deletedRows = [];
      const remainingItems = items.filter(item => {
        let matches = true;
        for (const filter of this.filters) {
          if (!filter(item)) {
            matches = false;
            break;
          }
        }
        if (matches) {
          deletedRows.push(item);
          return false;
        }
        return true;
      });

      this.saveItems(remainingItems);

      deletedRows.forEach(row => {
        broadcastChange(this.table, 'DELETE', row, null);
      });

      return { data: deletedRows, error: null };
    }

    return { data: null, error: null };
  }
}

class SupabaseWrapper {
  constructor() {
    this.isOffline = isBrowser && sessionStorage.getItem('supabase_offline') === 'true';
  }

  from(table) {
    if (this.isOffline) {
      return this.mockFrom(table);
    }
    return getRealSupabase().from(table);
  }

  mockFrom(table) {
    console.info(`[Supabase] Offline Mode: Serving table "${table}" locally.`);
    const getItems = () => {
      if (table === 'menu_items') return getOfflineTable('menu_items', defaultMenuItems);
      if (table === 'inventory_items') return getOfflineTable('inventory_items', defaultInventoryItems);
      if (table === 'recipes') return getOfflineTable('recipes', defaultRecipes);
      if (table === 'profiles') return getOfflineTable('profiles', defaultProfiles);
      if (table === 'orders') return getOfflineTable('orders', []);
      if (table === 'notifications') return getOfflineTable('notifications', []);
      return getOfflineTable(table, []);
    };

    const saveItems = (items) => {
      saveOfflineTable(table, items);
    };

    return new MockQueryBuilder(table, getItems, saveItems);
  }

  get auth() {
    if (this.isOffline) {
      return this.mockAuth;
    }
    return getRealSupabase().auth;
  }

  get mockAuth() {
    return {
      async getSession() {
        const session = isBrowser ? JSON.parse(localStorage.getItem('mock_session') || 'null') : null;
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback) {
        const session = isBrowser ? JSON.parse(localStorage.getItem('mock_session') || 'null') : null;
        setTimeout(() => callback('SIGNED_IN', session), 0);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      async signInWithPassword({ email, password }) {
        let profiles = getOfflineTable('profiles', defaultProfiles);
        let profile = profiles.find(p => p.email === email);
        if (!profile) {
          const isAdmin = email.includes('admin');
          profile = {
            id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
            name: email.split('@')[0],
            email,
            role: isAdmin ? 'admin' : 'customer',
            phone: '',
            address: '',
            avatar_url: ''
          };
          profiles.push(profile);
          saveOfflineTable('profiles', profiles);
        }
        const session = { user: { id: profile.id, email: profile.email } };
        if (isBrowser) localStorage.setItem('mock_session', JSON.stringify(session));
        return { data: { user: session.user, session }, error: null };
      },
      async signUp({ email, password, options }) {
        const name = options?.data?.name || email.split('@')[0];
        const profiles = getOfflineTable('profiles', defaultProfiles);
        const id = 'mock-user-' + Math.random().toString(36).substr(2, 9);
        const profile = {
          id,
          name,
          email,
          role: 'customer',
          phone: '',
          address: '',
          avatar_url: ''
        };
        profiles.push(profile);
        saveOfflineTable('profiles', profiles);
        const session = { user: { id, email } };
        if (isBrowser) localStorage.setItem('mock_session', JSON.stringify(session));
        return { data: { user: session.user, session }, error: null };
      },
      async signOut() {
        if (isBrowser) localStorage.removeItem('mock_session');
        return { error: null };
      }
    };
  }

  get storage() {
    if (this.isOffline) {
      return this.mockStorage;
    }
    return getRealSupabase().storage;
  }

  get mockStorage() {
    return {
      from(bucket) {
        return {
          async upload(path, file, options) {
            return { data: { path }, error: null };
          },
          getPublicUrl(path) {
            let publicUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
            if (path.startsWith('avatars/')) {
              publicUrl = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + path;
            }
            return { data: { publicUrl } };
          }
        };
      }
    };
  }

  get functions() {
    if (this.isOffline) {
      return {
        async invoke(name, options) {
          console.info(`[Supabase] Offline Mode: Mock invoking function "${name}" with payload:`, options);
          return { data: { success: true }, error: null };
        }
      };
    }
    return getRealSupabase().functions;
  }

  channel(name) {
    if (this.isOffline) {
      console.info(`[Supabase] Offline Channel Subscribed: "${name}"`);
      return new MockChannel(name);
    }
    return getRealSupabase().channel(name);
  }

  removeChannel(channel) {
    if (this.isOffline) {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
      return;
    }
    getRealSupabase().removeChannel(channel);
  }
}

class MockChannel {
  constructor(name) {
    this.name = name;
    this.callbacks = [];
  }
  on(event, filter, callback) {
    this.callbacks.push({ event, filter, callback });
    return this;
  }
  subscribe() {
    mockChannels.push(this);
    return this;
  }
  unsubscribe() {
    const idx = mockChannels.indexOf(this);
    if (idx > -1) mockChannels.splice(idx, 1);
  }
}

export const supabase = new SupabaseWrapper();
