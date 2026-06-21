# Implementation Plan: Guest Checkout + Facebook Login + Messenger Bot

## Problem
Lazy/first-time customers find login/signup a hassle, but loyal customers need accounts for order history and tracking. Most customers message on Facebook Page.

## Solution Overview
Three-phase feature set to reduce friction for new customers while retaining value for loyal ones:
1. **Guest Checkout** — Order without creating an account
2. **Facebook OAuth Login** — One-click login via Facebook (since they're already there)
3. **FB Messenger Bot** — Order directly through Facebook Messenger

---

## Phase 1: Guest Checkout (Highest Impact)

### Goal
Remove the login gate from checkout. Guests fill in name/phone/address directly in the checkout form and place orders without an account.

### Changes

#### 1.1 `src/components/CartDrawer.jsx`
- Remove the login check in `handleOpenCheckout` (lines 31-35)
- Replace with: allow checkout always, just require name/phone/address/email in step 1
- Add email field to checkout form (needed to identify guest orders and send notifications)
- Modify `handlePlaceOrder`:
  - If user is logged in: `user_email = user.email` (current behavior)
  - If guest: `user_email = email from form`, set `is_guest = true`
- For guest orders, skip the customer notification insert (no Supabase auth user to target)
- After placing guest order, show a toast suggesting account creation: "Order placed! Create an account to track orders easily."

#### 1.2 `orders` table (Supabase)
- Add column: `is_guest BOOLEAN DEFAULT false`
- The existing `user_email`, `user_name`, `phone`, `address` fields already support guest data

#### 1.3 `src/components/OrderTracker.jsx`
- Currently fetches orders by `user.email` from auth context
- Add fallback: allow manual order lookup by order ID + phone number
- Add an "Enter Order ID" field for guest users to track their order

#### 1.4 `src/components/CartDrawer.jsx` — Post-order Account Upsell
- After guest order is placed, show a subtle banner: "Create an account to earn points and track orders"
- Links to the auth modal register tab

### Files to Modify
| File | Change |
|------|--------|
| `src/components/CartDrawer.jsx` | Remove login gate, add email field, handle guest orders |
| `src/components/OrderTracker.jsx` | Add manual order lookup by ID |
| `orders` table | Add `is_guest` column |

---

## Phase 2: Facebook OAuth Login

### Goal
Add "Continue with Facebook" button to login/register modals for one-click authentication.

### Setup Required (Manual — User Must Do)
1. **Meta Developer Console** (developers.facebook.com):
   - Create Business app
   - Add Facebook Login product
   - Set Valid OAuth Redirect URI: `https://dizhijidescnxidyfwpd.supabase.co/auth/v1/callback`
   - Copy App ID + App Secret
2. **Supabase Dashboard**:
   - Authentication → Providers → Facebook → Enable
   - Paste App ID as Client ID, App Secret as Client Secret
   - URL Configuration → Add `http://localhost:5173/**` for dev

### Code Changes

#### 2.1 `src/context/AuthContext.jsx`
- Add `signInWithFacebook` method using `supabase.auth.signInWithOAuth({ provider: 'facebook' })`
- Update `fetchProfile` to auto-create profile for OAuth users who don't have one:
  ```js
  if (!profile) {
    const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
    await supabase.from('profiles').insert({ id: authUser.id, name, email: authUser.email, role: 'customer' });
  }
  ```

#### 2.2 `src/components/AuthModal.jsx`
- Add "Continue with Facebook" button in both login and register forms
- Add "or" divider between form submit and OAuth button
- Facebook blue button (#1877F2) with FB icon SVG

#### 2.3 `src/pages/AuthCallback.jsx` (NEW FILE)
- Handles OAuth redirect at `/auth/callback`
- Listens for `onAuthStateChange` with `SIGNED_IN` event
- Checks profile role, redirects to `/menu` (customer) or `/admin` (admin)

#### 2.4 `src/App.jsx`
- Add route: `<Route path="/auth/callback" element={<AuthCallback />} />`

### Files to Create/Modify
| File | Change |
|------|--------|
| `src/context/AuthContext.jsx` | Add `signInWithFacebook`, update `fetchProfile` for OAuth |
| `src/components/AuthModal.jsx` | Add Facebook login button |
| `src/pages/AuthCallback.jsx` | **NEW** — OAuth callback handler |
| `src/App.jsx` | Add `/auth/callback` route |

---

## Phase 3: FB Messenger Bot

### Goal
Customers message the Facebook Page → bot takes their order → order appears in admin dashboard.

### Architecture
```
Customer (Messenger) → Facebook Webhook → Supabase Edge Function (Deno) → Supabase DB
                                            ↕
                                      Facebook Send API (replies)
```

### Setup Required (Manual — User Must Do)
1. **Meta Developer Console**:
   - Same app from Phase 2, add Messenger product
   - Generate Page Access Token
   - Set webhook URL: `https://dizhijidescnxidyfwpd.supabase.co/functions/v1/messenger-webhook`
   - Set verify token (custom string)
   - Subscribe to: `messages`, `messaging_postbacks`
2. **Supabase CLI**:
   ```bash
   supabase secrets set PAGE_ACCESS_TOKEN=<token>
   supabase secrets set VERIFY_TOKEN=<verify-token>
   supabase secrets set APP_SECRET=<app-secret>
   ```

### Code Changes

#### 3.1 `supabase/functions/messenger-webhook/index.ts` (NEW FILE)
- Supabase Edge Function (Deno) acting as webhook handler
- **GET** handler: Webhook verification (responds with `hub.challenge`)
- **POST** handler: Processes incoming messages/postbacks
- State machine for order flow:
  ```
  WELCOME → SELECT_CATEGORY → SELECT_ITEM → ENTER_QUANTITY → ITEM_ADDED
    → (add more or checkout) → ENTER_ADDRESS → ENTER_PHONE → SELECT_PAYMENT
    → CONFIRM_ORDER → ORDER_PLACED
  ```
- Stores conversation state in `chat_sessions` table
- On order confirmation: inserts into `orders` table (same schema as website orders)
- Uses `EdgeRuntime.waitUntil()` for background processing (Facebook 20s timeout)

#### 3.2 `chat_sessions` table (NEW — Supabase)
```sql
CREATE TABLE chat_sessions (
  psid TEXT PRIMARY KEY,
  current_state TEXT NOT NULL DEFAULT 'WELCOME',
  order_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3 Messenger API Functions (in Edge Function)
- `sendMessage(psid, text)` — Send text message
- `sendQuickReplies(psid, text, replies)` — Send quick reply buttons
- `sendTemplate(psid, payload)` — Send generic/button templates
- `sendMenuCategories(psid)` — Fetch from `menu_items` table, show categories
- `sendMenuItems(psid, category)` — Show items in a category with "Add to Order" buttons

#### 3.4 Order Flow (Bot Conversation)
1. User sends "Hi" or clicks "Get Started" → Welcome + menu categories as quick replies
2. User selects category → Show items from `menu_items` table (generic template)
3. User clicks "Add to Order" → Ask quantity
4. User enters qty → Show running total, ask "Add more?" or "Checkout"
5. User selects "Checkout" → Ask delivery address
6. User enters address → Ask phone number
7. User enters phone → Show payment options (Cash/GCash)
8. User selects payment → Show order summary with Confirm/Modify/Cancel buttons
9. User confirms → Insert into `orders` table, send confirmation message

#### 3.5 Admin Integration
- Messenger orders appear in admin dashboard (same `orders` table)
- Admin can update status → customer gets notified via Messenger
- Add `customer_psid TEXT` column to `orders` table for Messenger order identification

### Files to Create/Modify
| File | Change |
|------|--------|
| `supabase/functions/messenger-webhook/index.ts` | **NEW** — Webhook handler |
| `supabase/functions/messenger-webhook/messenger.ts` | **NEW** — Messenger API helpers |
| `supabase/functions/messenger-webhook/order-flow.ts` | **NEW** — Order conversation logic |
| `orders` table | Add `customer_psid` column |
| `chat_sessions` table | **NEW** |

---

## Implementation Order

1. **Phase 1 (Guest Checkout)** — Start here, highest impact, no external setup needed
2. **Phase 2 (Facebook OAuth)** — Requires Meta Developer + Supabase dashboard setup
3. **Phase 3 (Messenger Bot)** — Most complex, builds on Phase 2's Meta app setup

## Verification

- **Phase 1**: Place an order without being logged in → verify it appears in admin dashboard
- **Phase 2**: Click "Continue with Facebook" → verify profile auto-creates → verify login works
- **Phase 3**: Send message to Facebook Page → verify bot responds → place order via Messenger → verify appears in admin dashboard
