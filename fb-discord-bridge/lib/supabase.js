import { createClient } from '@supabase/supabase-js';

// Uses SERVICE ROLE key — server-side only, never exposed to browser
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── Create a new order ────────────────────────────────────────────────────────
export async function createOrder(orderData) {
  const { data, error } = await supabase
    .from('fb_orders')
    .insert([orderData])
    .select()
    .single();

  if (error) throw new Error(`Supabase createOrder: ${error.message}`);
  return data;
}

// ── Save Discord message ID back to the order row ─────────────────────────────
export async function saveDiscordMessageId(orderId, discordMessageId) {
  const { error } = await supabase
    .from('fb_orders')
    .update({ discord_message_id: discordMessageId })
    .eq('order_id', orderId);

  if (error) console.error('[Supabase] saveDiscordMessageId:', error.message);
}

// ── Get order by order_id string (e.g. JFH-20260401-0042) ────────────────────
export async function getOrderByOrderId(orderId) {
  const { data, error } = await supabase
    .from('fb_orders')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) return null;
  return data;
}

// ── Update order status ───────────────────────────────────────────────────────
export async function updateOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase
    .from('fb_orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) throw new Error(`Supabase updateOrderStatus: ${error.message}`);
  return data;
}

// ── Upsert customer record ────────────────────────────────────────────────────
export async function upsertCustomer(fbPsid, name, contact) {
  if (!fbPsid) return;

  const { data: existing } = await supabase
    .from('fb_customers')
    .select('id, order_count')
    .eq('fb_psid', fbPsid)
    .single();

  if (existing) {
    await supabase
      .from('fb_customers')
      .update({
        name,
        contact,
        order_count: (existing.order_count || 0) + 1,
        last_order_at: new Date().toISOString(),
      })
      .eq('fb_psid', fbPsid);
  } else {
    await supabase.from('fb_customers').insert([{
      fb_psid: fbPsid,
      name,
      contact,
      order_count: 1,
      first_order_at: new Date().toISOString(),
      last_order_at:  new Date().toISOString(),
    }]);
  }
}

// ── Write an audit log entry ──────────────────────────────────────────────────
export async function writeAuditLog(orderId, action, details = {}) {
  const { error } = await supabase.from('fb_audit_log').insert([{
    order_id: orderId,
    action,
    details,
  }]);
  if (error) console.error('[Supabase] writeAuditLog:', error.message);
}
