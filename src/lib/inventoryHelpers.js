import { supabase } from './supabase';

/**
 * Deduct ingredient stock based on recipes when an order is placed.
 * @param {Array} orderItems - Array of { id (menu_item_id), qty }
 */
export async function deductIngredients(orderItems) {
  // 1. Get all menu_item_ids from the order
  const menuItemIds = orderItems.map((item) => item.id).filter(Boolean);
  if (menuItemIds.length === 0) return;

  // 2. Fetch recipes for these menu items
  const { data: recipes, error: recipeErr } = await supabase
    .from('recipes')
    .select('menu_item_id, ingredient_id, quantity_per_serving')
    .in('menu_item_id', menuItemIds);

  if (recipeErr || !recipes || recipes.length === 0) return;

  // 3. Calculate total deduction per ingredient
  const deductions = {};
  for (const item of orderItems) {
    const itemRecipes = recipes.filter((r) => r.menu_item_id === item.id);
    for (const recipe of itemRecipes) {
      const key = recipe.ingredient_id;
      if (!deductions[key]) deductions[key] = 0;
      deductions[key] += recipe.quantity_per_serving * item.qty;
    }
  }

  // 4. Fetch current ingredient quantities
  const ingredientIds = Object.keys(deductions);
  const { data: ingredients } = await supabase
    .from('inventory_items')
    .select('id, quantity, name, min_stock')
    .in('id', ingredientIds);

  if (!ingredients) return;

  // 5. Update each ingredient
  const lowStockIngredients = [];
  for (const ingredient of ingredients) {
    const newQty = Math.max(0, ingredient.quantity - deductions[ingredient.id]);
    await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', ingredient.id);

    if (newQty <= (ingredient.min_stock || 10)) {
      lowStockIngredients.push({ ...ingredient, newQty });
    }
  }

  // 6. Send low stock alerts if needed
  if (lowStockIngredients.length > 0) {
    await sendLowStockAlerts(lowStockIngredients);
  }
}

/**
 * Restore ingredient stock when an order is cancelled.
 * @param {Array} orderItems - Array of { id (menu_item_id), qty } from the order
 */
export async function restoreIngredients(orderItems) {
  const menuItemIds = orderItems.map((item) => item.id).filter(Boolean);
  if (menuItemIds.length === 0) return;

  // Fetch recipes
  const { data: recipes } = await supabase
    .from('recipes')
    .select('menu_item_id, ingredient_id, quantity_per_serving')
    .in('menu_item_id', menuItemIds);

  if (!recipes || recipes.length === 0) return;

  // Calculate total restoration per ingredient
  const restorations = {};
  for (const item of orderItems) {
    const itemRecipes = recipes.filter((r) => r.menu_item_id === item.id);
    for (const recipe of itemRecipes) {
      const key = recipe.ingredient_id;
      if (!restorations[key]) restorations[key] = 0;
      restorations[key] += recipe.quantity_per_serving * item.qty;
    }
  }

  // Fetch current quantities and restore
  const ingredientIds = Object.keys(restorations);
  const { data: ingredients } = await supabase
    .from('inventory_items')
    .select('id, quantity')
    .in('id', ingredientIds);

  if (!ingredients) return;

  for (const ingredient of ingredients) {
    const newQty = ingredient.quantity + restorations[ingredient.id];
    await supabase.from('inventory_items').update({ quantity: newQty }).eq('id', ingredient.id);
  }
}

/**
 * Check which menu items are available based on ingredient stock.
 * Returns a Map of menuItemId => maxServings (0 means unavailable).
 * @param {Array} menuItemIds - Array of menu item IDs to check
 * @returns {Object} - { menuItemId: maxServings }
 */
export async function checkAvailability(menuItemIds) {
  const availability = {};
  menuItemIds.forEach((id) => {
    availability[id] = Infinity;
  });

  // Fetch all recipes for these menu items
  const { data: recipes } = await supabase
    .from('recipes')
    .select('menu_item_id, ingredient_id, quantity_per_serving')
    .in('menu_item_id', menuItemIds);

  if (!recipes || recipes.length === 0) {
    // No recipes defined — treat all as available (unlimited)
    return availability;
  }

  // Get unique ingredient IDs
  const ingredientIds = [...new Set(recipes.map((r) => r.ingredient_id))];

  // Fetch current ingredient stock
  const { data: ingredients } = await supabase
    .from('inventory_items')
    .select('id, quantity')
    .in('id', ingredientIds);

  if (!ingredients) return availability;

  const stockMap = {};
  ingredients.forEach((i) => {
    stockMap[i.id] = i.quantity;
  });

  // For each menu item, calculate how many servings we can make
  for (const menuItemId of menuItemIds) {
    const itemRecipes = recipes.filter((r) => r.menu_item_id === menuItemId);

    if (itemRecipes.length === 0) {
      // No recipe defined for this item — treat as available
      availability[menuItemId] = Infinity;
      continue;
    }

    let maxServings = Infinity;
    for (const recipe of itemRecipes) {
      const stock = stockMap[recipe.ingredient_id] || 0;
      const servings =
        recipe.quantity_per_serving > 0
          ? Math.floor(stock / recipe.quantity_per_serving)
          : Infinity;
      maxServings = Math.min(maxServings, servings);
    }
    availability[menuItemId] = maxServings;
  }

  return availability;
}

/**
 * Validate that all cart items can be fulfilled with current ingredient stock.
 * @param {Array} cartItems - Array of { id (menu_item_id), qty }
 * @returns {{ valid: boolean, unavailable: string[] }}
 */
export async function validateCartStock(cartItems) {
  const menuItemIds = cartItems.map((item) => item.id).filter(Boolean);
  if (menuItemIds.length === 0) return { valid: true, unavailable: [] };

  const availability = await checkAvailability(menuItemIds);
  const unavailable = [];

  for (const item of cartItems) {
    if (availability[item.id] !== undefined && availability[item.id] < item.qty) {
      unavailable.push(item.name);
    }
  }

  return {
    valid: unavailable.length === 0,
    unavailable,
  };
}

/**
 * Send low stock notifications to admin users.
 * @param {Array} lowStockItems - Array of { name, newQty, min_stock }
 */
async function sendLowStockAlerts(lowStockItems) {
  const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin');

  if (!admins || admins.length === 0) return;

  const itemsList = lowStockItems
    .map((i) => `• ${i.name}: ${parseFloat(i.newQty).toFixed(1)} remaining`)
    .join('\n');

  const notifications = admins.map((admin) => ({
    target_email: admin.email,
    title: '⚠️ Low Ingredient Stock',
    message: `The following ingredients are running low:\n${itemsList}`,
    icon: 'order',
    is_read: false,
  }));

  await supabase.from('notifications').insert(notifications);
}
