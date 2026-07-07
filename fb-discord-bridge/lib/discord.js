import { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

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
  const rawPayment = order.payment || 'cod';
  
  // Left border is JR Brand Green (#556B5D)
  const embedColor = 0x556B5D;

  const orderIdStr = `Order #${order.order_id || order.id}`;
  const paymentStr = rawPayment.toLowerCase() === 'gcash' ? '   GCASH   ' : ' CASH ON DELIVERY ';
  
  // Calculate spaces between Order ID and Payment Badge inside the borders (width is 38)
  const padCount = 38 - orderIdStr.length - paymentStr.length;
  const headerPad = ' '.repeat(Math.max(1, padCount));

  // Payment badge ANSI (COD: Gold background, GCash: Green background)
  const badgeAnsi = rawPayment.toLowerCase() === 'gcash'
    ? `\u001b[1;37;42m${paymentStr}\u001b[30;47m`  
    : `\u001b[1;30;43m${paymentStr}\u001b[30;47m`;

  // Format the date/time using standard "Jul 7, 2026 • 6:48 PM" separator
  const tsFormatted = (() => {
    const d = order.created_at ? new Date(order.created_at) : new Date();
    const dateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  })();

  const customerName = order.customer_name || 'Anonymous';
  
  // Price (TOTAL) -> Green if paid (GCash), Soft Gold (\u001b[1;33m) if unpaid (COD)
  const totalColor = rawPayment.toLowerCase() === 'gcash' ? '\u001b[1;32;47m' : '\u001b[1;33;47m';
  const totalAmount = `${totalColor}₱${parseFloat(order.total_amount || order.total || 0).toFixed(2)}\u001b[30;47m`;
  
  // Helper to format rows aligned at column 12 with a light gray background (47) and bordered edges
  const formatFieldRow = (label, valueAnsi, plainValue) => {
    const labelPad = label.padEnd(12, ' ');
    const lineText = `${labelPad}${plainValue}`;
    const spaces = ' '.repeat(Math.max(0, 38 - lineText.length));
    return `\u001b[30;47m│ ${labelPad}${valueAnsi}${spaces} │\u001b[0m`;
  };

  const customerLine = formatFieldRow('Customer', `\u001b[1;30;47m${customerName}\u001b[30;47m`, customerName);
  const totalLine    = formatFieldRow('Total', totalAmount, `₱${parseFloat(order.total_amount || order.total || 0).toFixed(2)}`);
  const placedLine   = formatFieldRow('Placed', `\u001b[1;30;47m${tsFormatted}\u001b[30;47m`, tsFormatted);

  // Optional scheduled delivery details inside codeblock
  let scheduledLine = '';
  if (order.scheduled_date) {
    const schedDate = new Date(order.scheduled_date);
    const schedStr = schedDate.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + (order.scheduled_time ? ` at ${order.scheduled_time}` : '');
    scheduledLine = `\n` + formatFieldRow('Scheduled', `\u001b[1;33;47m${schedStr}\u001b[30;47m`, schedStr);
  }

  // Status line if not pending
  let statusLine = '';
  if (status !== 'pending') {
    const statusColors = {
      confirmed: '\u001b[1;34;47m', // Blue
      preparing: '\u001b[1;33;47m', // Yellow
      out_for_delivery: '\u001b[1;32;47m', // Green/Yellow
      delivered: '\u001b[1;32;47m', // Green
      cancelled: '\u001b[1;31;47m', // Red
    };
    const sColor = statusColors[status] || '\u001b[1;37;47m';
    statusLine = `\n` + formatFieldRow('Status', `${sColor}${cfg.label}\u001b[30;47m`, cfg.label);
  }

  // Format Items list with quantities right aligned (using cross multiplication symbol ×)
  const formattedItems = items.length
    ? items.map(i => {
        let name = i.name;
        if (name.length > 32) {
          name = name.slice(0, 29) + '...';
        }
        const qty = i.quantity || i.qty || 1;
        const qtyStr = `×${qty}`;
        const spaces = ' '.repeat(Math.max(1, 38 - name.length - qtyStr.length));
        return `\u001b[30;47m│ ${name}${spaces}${qtyStr} │\u001b[0m`;
      }).join('\n')
    : `\u001b[30;47m│ _No items listed_${' '.repeat(22)} │\u001b[0m`;

  // Borders and dividers matching 42 characters total width
  const topBorder = `\u001b[30;47m┌${'─'.repeat(40)}┐\u001b[0m`;
  const divider = `\u001b[2;30;47m├${'─'.repeat(40)}┤\u001b[0m`;
  const bottomBorder = `\u001b[30;47m└${'─'.repeat(40)}┘\u001b[0m`;

  const headerLine = `\u001b[30;47m│ ${orderIdStr}${headerPad}${badgeAnsi} │\u001b[0m`;

  const ansiContent = [
    topBorder,
    headerLine,
    divider,
    customerLine,
    totalLine,
    placedLine,
    scheduledLine,
    statusLine,
    divider,
    formattedItems,
    bottomBorder
  ].filter(Boolean).join('\n');

  const dashboardUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/admin`;

  return new EmbedBuilder()
    .setColor(embedColor)
    .setDescription(
      `\`\`\`ansi\n${ansiContent}\n\`\`\`\n` +
      `Jemrald Foodhouse  ·  **[Open Order →](${dashboardUrl})**`
    );
}

// ── Send new order embed ──────────────────────────────────────────────────────
export async function sendOrderEmbed(order) {
  try {
    const channel = await client.channels.fetch(process.env.DISCORD_ORDERS_CHANNEL_ID);
    const embed   = buildOrderEmbed(order, order.status || 'pending');
    const dashboardUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/admin`;
    
    const button = new ButtonBuilder()
      .setLabel('Open Order')
      .setURL(dashboardUrl)
      .setStyle(ButtonStyle.Link);
    const row = new ActionRowBuilder().addComponents(button);

    const msg     = await channel.send({
      content: `New order received — **[Open Order →](${dashboardUrl})**`,
      embeds: [embed],
      components: [row]
    });
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
    const dashboardUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/admin`;

    const button = new ButtonBuilder()
      .setLabel('Open Order')
      .setURL(dashboardUrl)
      .setStyle(ButtonStyle.Link);
    const row = new ActionRowBuilder().addComponents(button);

    await msg.edit({ embeds: [embed], components: [row] });

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
