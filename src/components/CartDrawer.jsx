import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { getCategoryIconSmall } from './JapaneseIcons';
import { ShoppingBag, Banknote, Smartphone, Mail, Upload, ImageIcon, X } from 'lucide-react';
import { deductIngredients, validateCartStock } from '../lib/inventoryHelpers';

export default function CartDrawer() {
  const { cart, cartTotal, changeQty, isCartOpen, closeCart, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isCheckout, setIsCheckout] = useState(false);
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState(null);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [gcashRef, setGcashRef] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  useEffect(() => {
    if (isCheckout && cart.length === 0) {
      setIsCheckout(false);
    }
  }, [cart.length, isCheckout]);

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckout(true);
    setStep(1);
    setPayment(null);
    setError('');
  };

  const handleNextStep = () => {
    if (!name || !email || !phone || !address) {
      setError('Please fill in all required fields.');
      return;
    }
    if (phone.length !== 11) {
      setError('Phone number must be exactly 11 digits (e.g. 09123456789).');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!payment) {
      setError('Please select a payment method.');
      return;
    }
    if (payment === 'gcash' && !gcashRef) {
      setError('Please enter GCash reference number.');
      return;
    }
    if (payment === 'gcash' && gcashRef && !/^\d{13}$/.test(gcashRef.replace(/\s/g, ''))) {
      setError('GCash reference must be exactly 13 digits.');
      return;
    }
    if (payment === 'gcash' && !receiptFile) {
      setError('Please upload your GCash receipt screenshot.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Validate ingredient stock before placing order
      const stockCheck = await validateCartStock(cart);
      if (!stockCheck.valid) {
        setError(
          `Insufficient stock for: ${stockCheck.unavailable.join(', ')}. Please adjust your order.`
        );
        setIsSubmitting(false);
        return;
      }

      // Generate Order ID
      const orderNum = `JF-${Date.now().toString().slice(-4)}`;
      const isGuest = !user;

      // Upload GCash receipt if provided
      let receiptUrl = null;
      if (payment === 'gcash' && receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `gcash/${orderNum}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile, { upsert: true });
        if (uploadErr) throw new Error('Failed to upload receipt: ' + uploadErr.message);
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
        receiptUrl = urlData.publicUrl;
      }

      const orderPayload = {
        id: orderNum,
        user_email: user?.email || email,
        user_name: name,
        phone,
        address,
        notes: notes || null,
        payment,
        gcash_ref: gcashRef || null,
        gcash_receipt_url: receiptUrl,
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          qty: c.qty,
          price: c.price,
        })),
        total: cartTotal,
        status: 'pending',
      };

      const { error: dbErr } = await supabase.from('orders').insert(orderPayload);
      if (dbErr) throw dbErr;

      // Direct Failsafe Trigger for Discord Notification
      try {
        await supabase.functions.invoke('send-sms', {
          body: { record: orderPayload }
        });
      } catch (funcErr) {
        console.warn('Failsafe direct Discord notification failed:', funcErr);
      }

      // Deduct ingredient stock based on recipes
      try {
        await deductIngredients(cart);
      } catch (invErr) {
        console.error('Ingredient deduction failed:', invErr);
      }

      // Notify admin users about the new order
      const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const adminNotifs = admins.map((a) => ({
          target_email: a.email,
          title: 'New Order Received',
          message: `${name} placed order ${orderNum} — ₱${cartTotal.toFixed(2)}${isGuest ? ' (Guest)' : ''}`,
          icon: 'order',
          is_read: false,
        }));
        await supabase.from('notifications').insert(adminNotifs);
      }

      // Notify the customer (only if logged in)
      if (user) {
        await supabase.from('notifications').insert({
          target_email: user.email,
          title: 'Order Placed',
          message: `Your order ${orderNum} has been received! We'll notify you when it's being prepared.`,
          icon: 'order-placed',
          is_read: false,
        });
      }

      if (isGuest) {
        showToast(`Order ${orderNum} placed! Create an account to track orders and earn points.`);
      } else {
        showToast(`Order ${orderNum} placed successfully!`);
      }
      clearCart();
      setIsCheckout(false);
      closeCart();
      // Open order tracker
      document.dispatchEvent(new CustomEvent('open-tracker'));
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={closeCart}
            style={{ display: 'block', zIndex: 900 }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="cart-panel open cart-drawer-panel"
            style={{ zIndex: 901 }}
          >
            <div className="cart-header">
              <h2>{isCheckout ? (step === 1 ? 'Details' : 'Payment') : 'Your Order'}</h2>
              <button className="close-btn" onClick={closeCart}>
                ✕
              </button>
            </div>

            {!isCheckout ? (
              // --- CART VIEW ---
              <>
                <div className="cart-items" style={{ flex: 1, overflowY: 'auto' }}>
                  {cart.length === 0 ? (
                    <div className="empty-cart">
                      <div className="icon">
                        <ShoppingBag size={32} style={{ color: 'var(--muted)', opacity: 0.5 }} />
                      </div>
                      <div>Your cart is empty</div>
                    </div>
                  ) : (
                    cart.map((c) => (
                      <motion.div layout key={c.cartKey} className="cart-item">
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            background: 'rgba(154, 174, 71, 0.1)',
                            borderRadius: '8px',
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryIconSmall(c.category, 24, 'var(--red-bright)')}
                        </span>
                        <div className="cart-item-info">
                          <div className="cart-item-name">{c.name}</div>
                          <div className="cart-item-price">₱{(c.price * c.qty).toFixed(2)}</div>
                          <div className="qty-controls">
                            <button className="qty-btn" onClick={() => changeQty(c.cartKey, -1)}>
                              &#8722;
                            </button>
                            <span className="qty-num">{c.qty}</span>
                            <button className="qty-btn" onClick={() => changeQty(c.cartKey, 1)}>
                              +
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <span id="cartTotal">₱{cartTotal.toFixed(2)}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="checkout-btn"
                    disabled={cart.length === 0}
                    onClick={handleOpenCheckout}
                  >
                    Proceed to Checkout
                  </motion.button>
                </div>
              </>
            ) : (
              // --- CHECKOUT VIEW ---
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  {error && (
                    <div className="auth-error show" style={{ marginBottom: '16px' }}>
                      {error}
                    </div>
                  )}

                  {step === 1 ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                      {!user && (
                        <div
                          style={{
                            background: 'rgba(154, 174, 71, 0.08)',
                            border: '1px solid rgba(154, 174, 71, 0.2)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            marginBottom: '16px',
                            fontSize: '0.78rem',
                            color: 'var(--cream)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <Mail size={16} style={{ color: 'var(--red-bright)', flexShrink: 0 }} />
                          <span>
                            Ordering as guest.{' '}
                            <span
                              onClick={() =>
                                document.dispatchEvent(
                                  new CustomEvent('open-auth', { detail: { tab: 'register' } })
                                )
                              }
                              style={{
                                color: 'var(--red-bright)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                textDecoration: 'underline',
                              }}
                            >
                              Create an account
                            </span>{' '}
                            to track orders & earn points.
                          </span>
                        </div>
                      )}
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          placeholder="09123456789"
                        />
                      </div>
                      <div className="form-group">
                        <label>Delivery Address *</label>
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="House #, Street, Barangay"
                          rows="3"
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Landmarks, special instructions..."
                          rows="2"
                        ></textarea>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.67rem',
                          letterSpacing: '2.5px',
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                          marginBottom: '10px',
                        }}
                      >
                        Payment Method
                      </label>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          marginBottom: '24px',
                        }}
                      >
                        <div
                          className={`pay-method ${payment === 'cash' ? 'selected' : ''}`}
                          onClick={() => setPayment('cash')}
                          style={{
                            padding: '16px',
                            border: `1px solid ${payment === 'cash' ? 'var(--red-bright)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all .2s',
                            background:
                              payment === 'cash' ? 'rgba(154, 174, 71, 0.08)' : 'var(--surface2)',
                            color: 'var(--cream)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '1.5rem',
                              marginBottom: '8px',
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            <Banknote size={28} style={{ color: 'var(--red-bright)' }} />
                          </div>
                          Cash on Delivery
                        </div>
                        <div
                          className={`pay-method ${payment === 'gcash' ? 'selected' : ''}`}
                          onClick={() => setPayment('gcash')}
                          style={{
                            padding: '16px',
                            border: `1px solid ${payment === 'gcash' ? 'var(--red-bright)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all .2s',
                            background:
                              payment === 'gcash' ? 'rgba(154, 174, 71, 0.08)' : 'var(--surface2)',
                            color: 'var(--cream)',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '1.5rem',
                              marginBottom: '8px',
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            <Smartphone size={28} style={{ color: 'var(--red-bright)' }} />
                          </div>
                          GCash
                        </div>
                      </div>

                      {payment === 'gcash' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <div
                            style={{
                              background: 'rgba(154, 174, 71, 0.1)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '16px',
                              marginBottom: '20px',
                              textAlign: 'center',
                            }}
                          >
                            <div
                              style={{
                                color: 'var(--muted)',
                                fontSize: '0.8rem',
                                marginBottom: '4px',
                              }}
                            >
                              Send payment to
                            </div>
                            <div
                              style={{
                                fontSize: '1.2rem',
                                fontFamily: '"Playfair Display", serif',
                                color: 'var(--red-bright)',
                              }}
                            >
                              0918 749 1194
                            </div>
                            <div
                              style={{
                                color: 'var(--muted)',
                                fontSize: '0.8rem',
                                marginTop: '4px',
                              }}
                            >
                              Jemmalyn A.
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>GCash Reference No. *</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={gcashRef}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
                                setGcashRef(val);
                              }}
                              placeholder="Enter 13-digit ref no."
                              maxLength={13}
                              style={{
                                borderColor:
                                  gcashRef && gcashRef.length === 13 ? '#22c55e' : undefined,
                              }}
                            />
                            <div
                              style={{
                                fontSize: '0.7rem',
                                marginTop: '4px',
                                color: gcashRef.length === 13 ? '#22c55e' : 'var(--muted)',
                              }}
                            >
                              {gcashRef.length}/13 digits {gcashRef.length === 13 && '✓'}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Upload Receipt Screenshot *</label>
                            {!receiptPreview ? (
                              <label
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '24px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  border: '2px dashed var(--border)',
                                  background: 'var(--surface2)',
                                  transition: 'border-color 0.2s',
                                  gap: '8px',
                                }}
                              >
                                <Upload size={24} style={{ color: 'var(--muted)' }} />
                                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                                  Tap to upload receipt
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--muted)',
                                    opacity: 0.6,
                                  }}
                                >
                                  JPG, PNG (max 5MB)
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) {
                                      setError('Receipt must be under 5MB');
                                      return;
                                    }
                                    setReceiptFile(file);
                                    setReceiptPreview(URL.createObjectURL(file));
                                  }}
                                />
                              </label>
                            ) : (
                              <div
                                style={{
                                  position: 'relative',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                <img
                                  src={receiptPreview}
                                  alt="Receipt"
                                  style={{
                                    width: '100%',
                                    maxHeight: '180px',
                                    objectFit: 'contain',
                                    background: '#f5f5f5',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReceiptFile(null);
                                    setReceiptPreview(null);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <X size={12} />
                                </button>
                                <div
                                  style={{
                                    padding: '6px 10px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.72rem',
                                    color: '#22c55e',
                                  }}
                                >
                                  <ImageIcon size={12} /> Receipt uploaded ✓
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      <div
                        className="co-summary"
                        style={{
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '16px',
                          marginTop: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        {/* Interactive Item List in Checkout */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Your Items</span>
                          {cart.map((c) => (
                            <div key={c.cartKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '12px' }}>
                                <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{c.name}</span>
                                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>₱{(c.price * c.qty).toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => changeQty(c.cartKey, -1)}
                                  style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--cream)',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    lineHeight: 1,
                                    padding: 0,
                                  }}
                                >
                                  &#8722;
                                </button>
                                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>{c.qty}</span>
                                <button
                                  type="button"
                                  onClick={() => changeQty(c.cartKey, 1)}
                                  style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--cream)',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    lineHeight: 1,
                                    padding: 0,
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--border)',
                            paddingTop: '12px',
                          }}
                        >
                          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                            Subtotal
                          </span>
                          <span style={{ color: 'var(--cream)', fontSize: '0.85rem' }}>
                            ₱{cartTotal.toFixed(2)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--border)',
                            paddingTop: '12px',
                          }}
                        >
                          <span style={{ color: 'var(--cream)', fontWeight: 500 }}>Total</span>
                          <span style={{ color: 'var(--red-bright)', fontWeight: 700 }}>
                            ₱{cartTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="cart-footer">
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="btn-cancel"
                      onClick={() => (step === 1 ? setIsCheckout(false) : setStep(1))}
                      style={{
                        flex: 1,
                        padding: '14px',
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: 'var(--muted)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                    {step === 1 ? (
                      <button
                        className="hero-btn main"
                        onClick={handleNextStep}
                        style={{
                          flex: 2,
                          padding: '14px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: '0.85rem',
                        }}
                      >
                        Payment →
                      </button>
                    ) : (
                      <button
                        className="hero-btn main"
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        style={{
                          flex: 2,
                          padding: '14px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: '0.85rem',
                        }}
                      >
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
