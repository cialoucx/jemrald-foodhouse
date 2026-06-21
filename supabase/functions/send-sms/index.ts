import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

declare const Deno: any;

// Discord Webhook URLs from environment variables
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL')?.trim()
const DISCORD_RESERVATION_WEBHOOK_URL = Deno.env.get('DISCORD_RESERVATION_WEBHOOK_URL')?.trim()
const SITE_URL = Deno.env.get('SITE_URL')?.trim() || 'https://jemrald-foodhouse.vercel.app'

Deno.serve(async (req: any) => {
  try {
    // Read the Database Webhook payload
    const payload = await req.json()
    
    // Supabase INSERT webhook places the new row inside `record`
    const order = payload.record
    
    if (!order || !order.id) {
      console.error('[Discord Debug] Invalid payload received:', payload)
      return new Response(JSON.stringify({ error: 'No order record found in payload' }), { status: 400 })
    }

    if (!DISCORD_WEBHOOK_URL) {
      console.error('[Discord Debug] DISCORD_WEBHOOK_URL missing in environment variables')
      return new Response(JSON.stringify({ error: 'Discord configuration missing' }), { status: 500 })
    }

    const totalStr = parseFloat(order.total).toFixed(2)
    const paymentStr = (order.payment || 'unknown').toUpperCase()
    const items = order.items ? (Array.isArray(order.items) ? order.items : JSON.parse(order.items)) : []
    const itemsList = items.map((i: any) => `▫️ **${i.name}** x${i.quantity || i.qty || 1}`).join('\n')

    const orderDate = order.created_at ? new Date(order.created_at) : new Date()
    const dateStr = orderDate.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' })
    const timeStr = orderDate.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit' })

    const isScheduled = order.scheduled_date && order.scheduled_time
    let scheduledStr = ''
    if (isScheduled) {
      const schedDate = new Date(order.scheduled_date + 'T00:00:00')
      scheduledStr = schedDate.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ` at ${order.scheduled_time}`
    }

    const adminUrl = `${SITE_URL}/admin?tab=orders`

    // Build fields array
    const fields: any[] = [
      { name: "👤 Customer", value: order.user_name || 'Anonymous', inline: false },
      { name: "💰 Total Amount", value: `**₱${totalStr}**`, inline: true },
      { name: "💳 Payment Method", value: paymentStr, inline: true },
    ]

    // Add scheduled delivery field if applicable
    if (isScheduled) {
      fields.push({ name: "📅 Scheduled Delivery", value: `**${scheduledStr}**`, inline: false })
    }

    fields.push(
      { name: "🕒 Order Placed", value: `${dateStr} at ${timeStr}`, inline: false },
      { name: "📋 Items Ordered", value: itemsList || "_No items listed_", inline: false },
    )

    // Add GCash receipt info if present
    if (order.gcash_ref) {
      fields.push({ name: "🧾 GCash Ref #", value: `\`${order.gcash_ref}\``, inline: true })
    }

    fields.push(
      { name: "🚀 Quick Action", value: `[View Order in Admin Panel](${adminUrl})`, inline: false }
    )

    // Build embed object
    const embed: any = {
      title: isScheduled ? `📅 Scheduled Order #${order.id}` : `Order #${order.id}`,
      url: adminUrl,
      color: isScheduled ? 0xf59e0b : 0xdb2777,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: "🥢 Jemrald Foodhouse Admin Portal" }
    }

    // Attach GCash receipt screenshot if available
    if (order.gcash_receipt_url) {
      embed.image = { url: order.gcash_receipt_url }
    }

    // Create a beautiful Discord message using an Embed
    const discordPayload = {
      content: isScheduled 
        ? `📅 **Scheduled Order Received!**\n🔗 [Open Admin Dashboard](${adminUrl})`
        : `🔔 **New Order Received!**\n🔗 [Open Admin Dashboard](${adminUrl})`,
      embeds: [embed]
    }

    console.log(`[Discord Debug] Sending notification for order ${order.id} (${isScheduled ? 'SCHEDULED' : 'REGULAR'})...`)

    // Send to the appropriate Discord channel
    const targetWebhook = isScheduled && DISCORD_RESERVATION_WEBHOOK_URL 
      ? DISCORD_RESERVATION_WEBHOOK_URL 
      : DISCORD_WEBHOOK_URL

    const res = await fetch(targetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    })

    console.log(`[Discord Debug] Discord Response Status: ${res.status} (sent to ${isScheduled ? 'reservation' : 'orders'} channel)`)

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Discord Debug] Discord Failed:', errorText)
    } else {
      console.log('[Discord Debug] Notification Sent Successfully!')
    }

    return new Response(JSON.stringify({ success: res.ok }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error: any) {
    console.error('[Discord Debug] Fatal Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
