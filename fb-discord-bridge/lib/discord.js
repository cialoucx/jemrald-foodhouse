import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

let client = null;

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:          { color: 0xFFC107, emoji: '🟡', label: 'PENDING' },
  confirmed:        { color: 0x2196F3, emoji: '🔵', label: 'CONFIRMED' },
  preparing:        { color: 0xFF9800, emoji: '🟠', label: 'PREPARING' },
  out_for_delivery: { color: 0x8BC34A, emoji: '🛵', label: 'OUT FOR DELIVERY' },
  delivered:        { color: 0x4CAF50, emoji: '🟢', label: 'DELIVERED' },
  cancelled:        { color: 0xF44336, emoji: '🔴', label: 'CANCELLED' },
};

const SOURCE_LABELS = {
  messenger: '💬 Facebook Messenger',
  comment:   '💭 Facebook Comment',
  form:      '📝 Online Order Form',
  app:       '📱 Jemrald App',
};

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initDiscordBot() {
  client = new Client({ intents: [GatewayIntentBits.Guilds] });

  await client.login(process.env.DISCORD_BOT_TOKEN);

  await new Promise((resolve, reject) => {
    client.once('ready', () => {
      console.log(`✅ Discord bot ready — logged in as ${client.user.tag}`);
      resolve();
    });
    client.once('error', reject);
    setTimeout(() => reject(new Error('Discord login timeout')), 15000);
  });
}

// ── Build order embed ─────────────────────────────────────────────────────────
function buildOrderEmbed(order, status = 'pending') {
  const cfg   = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const items = Array.isArray(order.items) ? order.items : [];
  const srcLabel = SOURCE_LABELS[order.source] ?? order.source ?? 'Unknown';

  const itemLines = items.length
    ? items.map(i => `• **${i.name}** ×${i.qty} — ₱${(i.price * i.qty).toFixed(2)}`).join('\n')
    : '_No items listed_';

  const ts = order.created_at
    ? new Date(order.created_at).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' });

  return new EmbedBuilder()
    .setColor(cfg.color)
    .setTitle(`${cfg.emoji}  ${status === 'pending' ? 'NEW ORDER' : 'ORDER UPDATE'} — ${order.order_id}`)
    .addFields(
      { name: '👤 Customer',  value: order.customer_name    || 'Anonymous',  inline: true  },
      { name: '📱 Source',    value: srcLabel,               inline: true  },
      { name: '🕐 Time',      value: ts,                    inline: true  },
      { name: '🛒 Order Items', value: itemLines,            inline: false },
      { name: '💰 Total',     value: `₱${parseFloat(order.total_amount || 0).toFixed(2)}`, inline: true },
      { name: '📞 Contact',   value: order.customer_contact || 'N/A',       inline: true  },
      { name: '📝 Notes',     value: order.notes            || '—',         inline: true  },
      { name: '📋 Status',    value: `${cfg.emoji} **${cfg.label}**`,       inline: false },
    )
    .setFooter({ text: 'Jemrald Foodhouse Order System' })
    .setTimestamp();
}

// ── Send new order embed ──────────────────────────────────────────────────────
export async function sendOrderEmbed(order) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ORDERS_CHANNEL_ID);
    const embed   = buildOrderEmbed(order, order.status || 'pending');
    const msg     = await channel.send({ embeds: [embed] });
    return msg.id;   // store this as discord_message_id in Supabase
  } catch (err) {
    console.error('[Discord] sendOrderEmbed failed:', err.message);
    await sendError(`Failed to send order embed for ${order.order_id}: ${err.message}`);
    return null;
  }
}

// ── Edit existing embed when status changes ───────────────────────────────────
export async function updateOrderEmbed(order, newStatus) {
  try {
    if (!order.discord_message_id) return;
    const channel = await client.channels.fetch(process.env.DISCORD_ORDERS_CHANNEL_ID);
    const msg     = await channel.messages.fetch(order.discord_message_id);
    const embed   = buildOrderEmbed({ ...order, status: newStatus }, newStatus);
    await msg.edit({ embeds: [embed] });

    // Also post to updates channel if available
    if (process.env.DISCORD_UPDATES_CHANNEL_ID) {
      const cfg = STATUS_CONFIG[newStatus] ?? STATUS_CONFIG.pending;
      const updatesChannel = await client.channels.fetch(process.env.DISCORD_UPDATES_CHANNEL_ID);
      const tiny = new EmbedBuilder()
        .setColor(cfg.color)
        .setDescription(`${cfg.emoji} **${order.order_id}** → ${cfg.label} · ${order.customer_name}`)
        .setTimestamp();
      await updatesChannel.send({ embeds: [tiny] });
    }
  } catch (err) {
    console.error('[Discord] updateOrderEmbed failed:', err.message);
    await sendError(`Failed to update embed for ${order.order_id}: ${err.message}`);
  }
}

// ── Send error alert ──────────────────────────────────────────────────────────
export async function sendError(message) {
  try {
    if (!process.env.DISCORD_ERRORS_CHANNEL_ID) return;
    const channel = await client.channels.fetch(process.env.DISCORD_ERRORS_CHANNEL_ID);
    const embed   = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🚨 Bridge Error')
      .setDescription(`\`\`\`${message}\`\`\``)
      .setTimestamp();
    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error('[Discord] sendError failed (cannot send to error channel):', e.message);
  }
}
