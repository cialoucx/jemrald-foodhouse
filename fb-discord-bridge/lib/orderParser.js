/**
 * orderParser.js
 *
 * Parses raw form POST body or a Facebook Messenger message payload
 * into a normalised order object ready for Supabase insertion.
 */

// ── Menu catalogue (matches your Supabase menu_items categories) ──────────────
export const MENU_ITEMS = [
  // Sushi sets
  { id: 'sushi-california-8',   name: 'California Maki (8pcs)',    category: 'sushi-8pcs',  price: 180 },
  { id: 'sushi-spicy-tuna-8',   name: 'Spicy Tuna Roll (8pcs)',    category: 'sushi-8pcs',  price: 195 },
  { id: 'sushi-dragon-8',       name: 'Dragon Roll (8pcs)',        category: 'sushi-8pcs',  price: 210 },
  { id: 'sushi-california-10',  name: 'California Maki (10pcs)',   category: 'sushi-10pcs', price: 220 },
  { id: 'sushi-spicy-tuna-10',  name: 'Spicy Tuna Roll (10pcs)',   category: 'sushi-10pcs', price: 235 },
  // Rice
  { id: 'rice-java',            name: 'Java Rice',                 category: 'rice',        price: 35  },
  { id: 'rice-garlic',          name: 'Garlic Rice',               category: 'rice',        price: 35  },
  // Salads
  { id: 'salad-kani',           name: 'Kani Salad',                category: 'salad',       price: 95  },
  { id: 'salad-house',          name: 'House Salad',               category: 'salad',       price: 75  },
  // Takoyaki
  { id: 'takoyaki-6',           name: 'Takoyaki (6pcs)',           category: 'takoyaki',    price: 120 },
  { id: 'takoyaki-12',          name: 'Takoyaki (12pcs)',          category: 'takoyaki',    price: 220 },
];

// ── Parse a submitted HTML form body ─────────────────────────────────────────
/**
 * @param {object} body - Express req.body from the /order POST
 * @returns {{ customer_name, customer_contact, source, items, total_amount, notes }}
 */
export function parseFormOrder(body) {
  const selectedIds = Array.isArray(body.items) ? body.items : body.items ? [body.items] : [];

  // Build items array from selected IDs + quantities
  const items = selectedIds.map(id => {
    const menuItem = MENU_ITEMS.find(m => m.id === id);
    if (!menuItem) return null;
    const qty = parseInt(body[`qty_${id}`] ?? '1', 10) || 1;
    return { name: menuItem.name, qty, price: menuItem.price };
  }).filter(Boolean);

  const total_amount = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return {
    customer_name:    (body.customer_name    || '').trim(),
    customer_contact: (body.customer_contact || '').trim(),
    source:           'form',
    items,
    total_amount,
    notes:            (body.notes || '').trim(),
  };
}

// ── Parse a Facebook Messenger text message ───────────────────────────────────
/**
 * Very basic keyword parser for Phase 2 Messenger bot integration.
 * Customers can type something like:
 *   "2 california maki 8pcs, 1 matcha latte"
 *
 * @param {string} text - Raw message text from FB Messenger
 * @param {string} senderName - Customer's FB display name
 * @param {string} senderId - Facebook Page-Scoped ID
 * @returns {object|null} Parsed order or null if too ambiguous
 */
export function parseMessengerOrder(text, senderName, senderId) {
  const lower = text.toLowerCase();
  const items = [];

  for (const menuItem of MENU_ITEMS) {
    const keywords = menuItem.name.toLowerCase().split(' ');
    const mainWord = keywords.find(w => w.length > 4) || keywords[0];
    if (!lower.includes(mainWord)) continue;

    // Try to extract a leading quantity: "2 california..." → qty=2
    const pattern = new RegExp(`(\\d+)\\s+${mainWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    const match   = text.match(pattern);
    const qty     = match ? parseInt(match[1], 10) : 1;

    items.push({ name: menuItem.name, qty, price: menuItem.price });
  }

  if (items.length === 0) return null;

  const total_amount = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return {
    customer_name:    senderName,
    customer_contact: senderId,  // FB PSID — will be stored for Messenger reply
    source:           'messenger',
    items,
    total_amount,
    notes:            '',
    fb_psid:          senderId,
  };
}
