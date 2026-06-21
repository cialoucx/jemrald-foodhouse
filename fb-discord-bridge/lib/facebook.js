import axios from 'axios';

const FB_API_BASE = 'https://graph.facebook.com/v19.0';

// ── Send a text reply via Messenger ──────────────────────────────────────────
export async function sendMessengerReply(recipientPsid, text) {
  try {
    await axios.post(
      `${FB_API_BASE}/me/messages`,
      {
        recipient: { id: recipientPsid },
        message:   { text },
      },
      {
        params: { access_token: process.env.FB_PAGE_ACCESS_TOKEN },
      }
    );
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`[Facebook] sendMessengerReply failed for PSID ${recipientPsid}:`, msg);
  }
}

// ── Send an order confirmation with Order ID ──────────────────────────────────
export async function sendOrderConfirmation(recipientPsid, orderId, totalAmount) {
  const text = [
    `🍱 Thank you! Your order has been received.`,
    ``,
    `📋 Order ID: ${orderId}`,
    `💰 Total: ₱${parseFloat(totalAmount).toFixed(2)}`,
    ``,
    `We'll notify you here once your order is being prepared!`,
    `You can also track your order on our app using your Order ID.`,
  ].join('\n');

  await sendMessengerReply(recipientPsid, text);
}

// ── Reply to a Facebook Page comment ─────────────────────────────────────────
export async function replyToComment(commentId, message) {
  try {
    await axios.post(
      `${FB_API_BASE}/${commentId}/comments`,
      { message },
      { params: { access_token: process.env.FB_PAGE_ACCESS_TOKEN } }
    );
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error(`[Facebook] replyToComment failed for comment ${commentId}:`, msg);
  }
}

// ── Verify Facebook webhook HMAC signature ────────────────────────────────────
import crypto from 'crypto';

export function verifyWebhookSignature(rawBody, signature) {
  if (!signature) return false;
  const [algo, hash] = signature.split('=');
  if (algo !== 'sha256') return false;

  const expected = crypto
    .createHmac('sha256', process.env.FB_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'));
}
