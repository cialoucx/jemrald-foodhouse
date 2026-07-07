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

    const totalStr = parseFloat(order.total || 0).toFixed(2)
    const rawPayment = order.payment || 'cod'
    const paymentStr = rawPayment.toLowerCase() === 'gcash' ? '   GCASH   ' : ' CASH ON DELIVERY '
    const items = order.items ? (Array.isArray(order.items) ? order.items : JSON.parse(order.items)) : []

    const orderIdStr = `Order #${order.id}`
    
    // Calculate spaces between Order ID and Payment Badge inside the borders (width is 38)
    const padCount = 38 - orderIdStr.length - paymentStr.length
    const headerPad = ' '.repeat(Math.max(1, padCount))

    // Payment badge ANSI
    // GCash: Green background, white text (Paid)
    // COD: Gold background, black text (Dark Gold badge)
    const badgeAnsi = rawPayment.toLowerCase() === 'gcash'
      ? `\u001b[1;37;42m${paymentStr}\u001b[30;47m`
      : `\u001b[1;30;43m${paymentStr}\u001b[30;47m`

    // Format the date/time using standard "Jul 7, 2026 • 6:48 PM" separator
    const tsFormatted = (() => {
      const d = order.created_at ? new Date(order.created_at) : new Date();
      const dateStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true });
      return `${dateStr} • ${timeStr}`;
    })()

    const customerName = order.user_name || 'Anonymous'

    // Price (TOTAL) -> Green if paid (GCash), Soft Gold (\u001b[1;33m) if unpaid (COD)
    const totalColor = rawPayment.toLowerCase() === 'gcash' ? '\u001b[1;32;47m' : '\u001b[1;33;47m'
    const totalAmount = `${totalColor}₱${totalStr}\u001b[30;47m`

    // Helper to format rows aligned at column 12 with a light gray background (47) and bordered edges
    const formatFieldRow = (label: string, valueAnsi: string, plainValue: string) => {
      const labelPad = label.padEnd(12, ' ')
      const lineText = `${labelPad}${plainValue}`
      const spaces = ' '.repeat(Math.max(0, 38 - lineText.length))
      return `\u001b[30;47m│ ${labelPad}${valueAnsi}${spaces} │\u001b[0m`
    }

    const customerLine = formatFieldRow('Customer', `\u001b[1;30;47m${customerName}\u001b[30;47m`, customerName)
    const totalLine    = formatFieldRow('Total', totalAmount, `₱${totalStr}`)
    const placedLine   = formatFieldRow('Placed', `\u001b[1;30;47m${tsFormatted}\u001b[30;47m`, tsFormatted)

    let scheduledLine = ''
    const isScheduled = order.scheduled_date && order.scheduled_time
    if (isScheduled) {
      const schedDate = new Date(order.scheduled_date + 'T00:00:00')
      const schedStr = schedDate.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + ` at ${order.scheduled_time}`
      scheduledLine = `\n` + formatFieldRow('Scheduled', `\u001b[1;33;47m${schedStr}\u001b[30;47m`, schedStr)
    }

    // Format items list with quantities right aligned (using cross multiplication symbol ×)
    const formattedItems = items.length
      ? items.map((i: any) => {
          let name = i.name || ''
          if (name.length > 32) {
            name = name.slice(0, 29) + '...'
          }
          const qty = i.quantity || i.qty || 1
          const qtyStr = `×${qty}`
          const spaces = ' '.repeat(Math.max(1, 38 - name.length - qtyStr.length))
          return `\u001b[30;47m│ ${name}${spaces}${qtyStr} │\u001b[0m`
        }).join('\n')
      : `\u001b[30;47m│ _No items listed_${' '.repeat(22)} │\u001b[0m`

    // Borders and dividers matching 42 characters total width
    const topBorder = `\u001b[30;47m┌${'─'.repeat(40)}┐\u001b[0m`
    const divider = `\u001b[2;30;47m├${'─'.repeat(40)}┤\u001b[0m`
    const bottomBorder = `\u001b[30;47m└${'─'.repeat(40)}┘\u001b[0m`

    const headerLine = `\u001b[30;47m│ ${orderIdStr}${headerPad}${badgeAnsi} │\u001b[0m`

    const ansiContent = [
      topBorder,
      headerLine,
      divider,
      customerLine,
      totalLine,
      placedLine,
      scheduledLine,
      divider,
      formattedItems,
      bottomBorder
    ].filter(Boolean).join('\n')

    const adminUrl = `${SITE_URL}/admin?tab=orders`

    // Embed left border is JR Brand Green (#556B5D)
    const embedColor = 0x556B5D

    // Build embed object
    const embed: any = {
      color: embedColor,
      description: `\`\`\`ansi\n${ansiContent}\n\`\`\`\n` +
        `Jemrald Foodhouse  ·  **[Open Order →](${adminUrl})**`
    }

    // Attach GCash receipt screenshot if available
    if (order.gcash_receipt_url) {
      embed.image = { url: order.gcash_receipt_url }
    }

    // Create a beautiful Discord message using an Embed + Button component
    const discordPayload = {
      content: `New order received — **[Open dashboard](${adminUrl})**`,
      embeds: [embed],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link Button
              label: "View Order",
              url: adminUrl
            }
          ]
        }
      ]
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
