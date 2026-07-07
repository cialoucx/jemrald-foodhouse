import express from 'express';
import { parseFormOrder } from '../lib/orderParser.js';
import { createOrder, saveDiscordMessageId } from '../lib/supabase.js';
import { sendOrderEmbed } from '../lib/discord.js';
import { generateOrderId } from '../lib/orderIdGen.js';

const router = express.Router();

// POST /order - Creates an order from a standard HTML order form submission
router.post('/', async (req, res) => {
  try {
    const orderData = parseFormOrder(req.body);
    const orderId = await generateOrderId();
    
    // Normalise
    const payload = {
      order_id: orderId,
      customer_name: orderData.customer_name,
      customer_contact: orderData.customer_contact,
      source: orderData.source,
      items: orderData.items,
      total_amount: orderData.total_amount,
      notes: orderData.notes,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const saved = await createOrder(payload);
    
    // Send to Discord
    const discordMessageId = await sendOrderEmbed(saved);
    if (discordMessageId) {
      await saveDiscordMessageId(saved.order_id, discordMessageId);
    }

    res.status(201).json({ success: true, order: saved });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
