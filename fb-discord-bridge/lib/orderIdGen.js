import { supabase } from './supabase.js';

/**
 * Generates a human-readable Order ID: JFH-YYYYMMDD-XXXX
 * The numeric suffix is based on how many fb_orders exist today.
 * Example: JFH-20260401-0042
 */
export async function generateOrderId() {
  const now = new Date();
  // Use Manila timezone for date portion
  const datePart = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }).replace(/-/g, '');
  // datePart → "20260401"

  const startOfDay = new Date(`${datePart.slice(0,4)}-${datePart.slice(4,6)}-${datePart.slice(6,8)}T00:00:00+08:00`).toISOString();

  const { count } = await supabase
    .from('fb_orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay);

  const seq = String((count ?? 0) + 1).padStart(4, '0');
  return `JFH-${datePart}-${seq}`;
}
