import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, XCircle, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';

// ─── Order Steps Config ──────────────────────────────────────────────────────
const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', subtitle: 'We received your order', icon: '🧾' },
  { key: 'preparing', label: 'Preparing', subtitle: 'Kitchen is working on it', icon: '👨‍🍳' },
  {
    key: 'out_for_delivery',
    label: 'On the Way',
    subtitle: 'Driver picked up your order',
    icon: '🛵',
  },
  { key: 'delivered', label: 'Delivered', subtitle: 'Enjoy your meal!', icon: '✅' },
];

const STATUS_INDEX = {
  pending: 0,
  preparing: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

const ETA_MAP = {
  pending: '~25 min',
  preparing: '~18 min',
  out_for_delivery: '~8 min',
  delivered: 'Arrived!',
  cancelled: 'Cancelled',
};

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price',
  'Delivery taking too long',
  'Need to modify the order',
  'Other',
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OrderTracker() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  // Guest order lookup
  const [guestOrderId, setGuestOrderId] = useState('');
  const [guestOrder, setGuestOrder] = useState(null);
  const [guestSearching, setGuestSearching] = useState(false);
  const [guestError, setGuestError] = useState('');

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    };
    fetchOrders();

    const channel = supabase
      .channel('order-tracker')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_email=eq.${user.email}`,
        },
        (payload) => {
          const updated = payload.new;
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === updated.id);
            if (idx !== -1) {
              const oldStatus = prev[idx].status;
              const newOrders = [...prev];
              newOrders[idx] = updated;

              if (oldStatus !== 'delivered' && updated.status === 'delivered') {
                showToast('Your order has been delivered! Please rate your experience.');
                setIsOpen(false);
                document.dispatchEvent(new CustomEvent('open-review'));
              }
              return newOrders;
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `user_email=eq.${user.email}`,
        },
        (payload) => {
          setOrders((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showToast]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    document.addEventListener('open-tracker', handleOpen);
    return () => document.removeEventListener('open-tracker', handleOpen);
  }, []);

  const handleCancelOrder = async (orderId, reason) => {
    try {
      const sanitizedId = orderId.replace('#', '');
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .filter('id', 'ilike', `%${sanitizedId}`);
      if (error) throw error;

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      if (guestOrder && guestOrder.id === orderId) {
        setGuestOrder((prev) => ({ ...prev, status: 'cancelled' }));
      }
      showToast('Order cancelled successfully. Refund will be processed if applicable.');
      setCancelTarget(null);

      // Notify admin
      const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const adminNotifs = admins.map((a) => ({
          target_email: a.email,
          title: 'Order Cancelled by Customer',
          message: `Order ${orderId} was cancelled. Reason: ${reason || 'Not specified'}`,
          icon: 'cancelled',
          is_read: false,
        }));
        await supabase.from('notifications').insert(adminNotifs);
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', true);
    }
  };

  const handleGuestSearch = async () => {
    if (!guestOrderId.trim()) return;
    setGuestSearching(true);
    setGuestError('');
    setGuestOrder(null);
    try {
      const searchTerm = guestOrderId.trim().replace(/^#/, '');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('id', `%${searchTerm}`)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setGuestError('Order not found. Please check your order ID.');
      } else {
        setGuestOrder(data);
      }
    } catch (err) {
      setGuestError(err.message || 'Failed to look up order.');
    } finally {
      setGuestSearching(false);
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay open tracker-overlay"
            style={{ paddingTop: '8vh', zIndex: 900 }}
            onClick={() => {
              setIsOpen(false);
              setCancelTarget(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              className="modal tracking-modal"
              style={{ width: '520px', padding: '32px', maxHeight: '85vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCancelTarget(null);
                }}
                className="close-btn"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>

              {/* Modal Header */}
              <div style={{ marginBottom: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '4px',
                  }}
                >
                  <Clock color="var(--red-bright)" size={20} />
                  <h2
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1.5rem',
                      margin: 0,
                      color: 'var(--cream)',
                      fontWeight: 700,
                    }}
                  >
                    My Orders
                  </h2>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                  Track your delivery in real-time.
                </p>
              </div>

              {/* Filter Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  margin: '20px 0',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '16px',
                }}
              >
                {['all', 'active', 'history'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: filter === f ? 'var(--surface)' : 'none',
                      border: '1px solid',
                      borderColor: filter === f ? 'var(--border)' : 'transparent',
                      color: filter === f ? 'var(--cream)' : 'var(--muted)',
                      padding: '5px 14px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: filter === f ? 500 : 400,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'var(--muted)',
                      padding: '40px 0',
                      fontSize: '0.85rem',
                    }}
                  >
                    No orders yet. Place an order to track it here!
                  </div>
                ) : (
                  <>
                    {/* Active Orders */}
                    {(filter === 'all' || filter === 'active') &&
                      activeOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          isExpanded={expandedOrder === order.id}
                          onToggle={() =>
                            setExpandedOrder(expandedOrder === order.id ? null : order.id)
                          }
                          formatDateTime={formatDateTime}
                          onCancel={() => setCancelTarget(order)}
                        />
                      ))}

                    {filter === 'active' && activeOrders.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'var(--muted)',
                          padding: '40px 0',
                          fontSize: '0.85rem',
                        }}
                      >
                        No active orders.
                      </div>
                    )}

                    {/* Past Orders */}
                    {(filter === 'all' || filter === 'history') && pastOrders.length > 0 && (
                      <>
                        {filter === 'all' && (
                          <div
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '2px',
                              textTransform: 'uppercase',
                              color: 'var(--muted)',
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            History
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                          </div>
                        )}
                        {pastOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            isExpanded={expandedOrder === order.id}
                            onToggle={() =>
                              setExpandedOrder(expandedOrder === order.id ? null : order.id)
                            }
                            formatDateTime={formatDateTime}
                            isPast
                          />
                        ))}
                      </>
                    )}

                    {filter === 'history' && pastOrders.length === 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'var(--muted)',
                          padding: '40px 0',
                          fontSize: '0.85rem',
                        }}
                      >
                        No past orders found.
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Dialog */}
      <CancelDialog
        order={cancelTarget}
        onConfirm={handleCancelOrder}
        onClose={() => setCancelTarget(null)}
      />

      {/* Floating tracker button for active orders */}
      <AnimatePresence>
        {!isOpen && activeOrders.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="tracker-pill-wrapper"
            style={{
              position: 'fixed',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 90,
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              style={{
                background: 'var(--red)',
                border: 'none',
                color: '#fff',
                borderRadius: '30px',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(211, 18, 27, 0.28)',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                letterSpacing: '0.3px',
              }}
            >
              <Clock size={15} /> Track {activeOrders.length} order
              {activeOrders.length > 1 ? 's' : ''}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Cancel Confirmation Dialog ──────────────────────────────────────────────
function CancelDialog({ order, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(order.id, reason);
    setSubmitting(false);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(3px)',
            padding: '20px',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '28px 28px 24px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              <AlertTriangle size={22} style={{ color: 'var(--red-bright)' }} />
            </div>

            {/* Title */}
            <h3
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '1.25rem',
                color: 'var(--cream)',
                textAlign: 'center',
                margin: '0 0 6px',
              }}
            >
              Cancel Order?
            </h3>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--muted)',
                textAlign: 'center',
                margin: '0 0 22px',
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to cancel order{' '}
              <strong style={{ color: 'var(--cream)' }}>{order.id}</strong>?
              {order.payment === 'gcash' && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '6px',
                    color: 'var(--red-bright)',
                    fontSize: '0.75rem',
                  }}
                >
                  Your GCash refund will be processed within 3–5 business days.
                </span>
              )}
            </p>

            {/* Reason Dropdown */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.62rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--muted)',
                  marginBottom: '7px',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Reason for cancellation (optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: reason ? 'var(--cream)' : 'var(--muted)',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                <option value="">Select a reason...</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleClose}
                disabled={submitting}
                style={{
                  flex: 1,
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.2s',
                }}
              >
                Keep Order
              </button>
              <motion.button
                whileHover={!submitting ? { scale: 1.02 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                onClick={handleConfirm}
                disabled={submitting}
                style={{
                  flex: 1,
                  background: 'var(--red)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  opacity: submitting ? 0.65 : 1,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {submitting ? 'Cancelling...' : 'Cancel Order'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Order Card ──────────────────────────────────────────────────────────────
function OrderCard({ order, isExpanded, onToggle, formatDateTime, isPast, onCancel }) {
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isOutForDelivery = order.status === 'out_for_delivery';
  const canCancel = !isPast && !isCancelled && !isDelivered && !isOutForDelivery;
  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const progress = isCancelled ? 0 : ((currentStep + 1) / ORDER_STEPS.length) * 100;

  return (
    <motion.div
      layout
      style={{
        background: isPast ? 'var(--surface2)' : 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        opacity: isPast ? 0.82 : 1,
      }}
    >
      {/* Card Header — vertical stacked layout */}
      <div
        onClick={onToggle}
        style={{
          padding: '16px 18px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Row 1: Order ID + Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: isPast ? '0.92rem' : '1rem',
              color: 'var(--cream)',
              fontWeight: isPast ? 400 : 600,
              letterSpacing: '0.2px',
            }}
          >
            Order {order.id}
          </span>
          <StatusBadge status={order.status} />
        </div>

        {/* Row 2: Date + Total — stacked info row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border2)',
            paddingTop: '10px',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.4 }}>
            {formatDateTime(order.created_at)}
          </span>
          <span
            style={{
              fontSize: isPast ? '0.9rem' : '1rem',
              fontWeight: 700,
              color: 'var(--red-bright)',
              fontFamily: '"Playfair Display", serif',
            }}
          >
            ₱{parseFloat(order.total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 18px 18px',
                borderTop: '1px solid var(--border2)',
                paddingTop: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Items List */}
              <div
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginBottom: idx < order.items.length - 1 ? '8px' : 0,
                      color: 'var(--cream)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--muted)', marginRight: '6px' }}>{item.qty}×</span>
                      {item.name}
                    </div>
                    <div style={{ color: 'var(--muted)' }}>
                      ₱{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    marginTop: '10px',
                    paddingTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--cream)',
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--red-bright)' }}>
                    ₱{parseFloat(order.total).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress Tracker */}
              {!isCancelled ? (
                <div
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border2)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  {/* ETA Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: 'var(--muted)',
                        fontFamily: '"DM Sans", sans-serif',
                      }}
                    >
                      ETA
                    </span>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: order.status === 'delivered' ? 'var(--secondary)' : 'var(--cream)',
                      }}
                    >
                      {ETA_MAP[order.status]}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      background: 'var(--border)',
                      borderRadius: '999px',
                      height: '3px',
                      marginBottom: '18px',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      style={{
                        height: '100%',
                        background: 'var(--red-bright)',
                        borderRadius: '999px',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>

                  {/* Steps — vertical */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {ORDER_STEPS.map((step, index) => {
                      const isDone = index < currentStep;
                      const isActive = index === currentStep;
                      const isPending = index > currentStep;

                      return (
                        <div key={step.key} style={{ display: 'flex', gap: '12px' }}>
                          {/* Icon + Connector Line */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <motion.div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: isDone
                                  ? 'rgba(4, 118, 71, 0.12)'
                                  : isActive
                                    ? 'var(--surface)'
                                    : 'var(--surface2)',
                                border: isActive
                                  ? '2px solid var(--red-bright)'
                                  : isDone
                                    ? '2px solid var(--secondary)'
                                    : '2px solid var(--border)',
                              }}
                              animate={isActive ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                              transition={
                                isActive
                                  ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                                  : {}
                              }
                            >
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={isDone ? 'done' : step.key}
                                  initial={{ opacity: 0, scale: 0.6 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.6 }}
                                  transition={{ duration: 0.25 }}
                                  style={{ fontSize: '13px' }}
                                >
                                  {isDone ? '✓' : step.icon}
                                </motion.span>
                              </AnimatePresence>
                            </motion.div>

                            {index < ORDER_STEPS.length - 1 && (
                              <div
                                style={{
                                  width: '2px',
                                  flex: 1,
                                  minHeight: '20px',
                                  background: 'var(--border)',
                                  margin: '3px 0',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <motion.div
                                  style={{ width: '100%', background: 'var(--secondary)' }}
                                  animate={{ height: isDone ? '100%' : '0%' }}
                                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Step Text */}
                          <motion.div
                            style={{
                              paddingTop: '4px',
                              paddingBottom: index < ORDER_STEPS.length - 1 ? '14px' : '0',
                              flex: 1,
                            }}
                            animate={{ opacity: isPending ? 0.38 : 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                margin: 0,
                                color: isActive
                                  ? 'var(--red-bright)'
                                  : isDone
                                    ? 'var(--secondary)'
                                    : 'var(--muted)',
                                fontFamily: '"DM Sans", sans-serif',
                              }}
                            >
                              {step.label}
                            </p>
                            <AnimatePresence>
                              {(isActive || isDone) && (
                                <motion.p
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--muted)',
                                    margin: '2px 0 0',
                                  }}
                                  initial={{ opacity: 0, y: 3 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                >
                                  {step.subtitle}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      color: 'var(--red-bright)',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    This order was cancelled.
                  </p>
                </div>
              )}

              {/* Footer: Cancel button + Payment method */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  {canCancel ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        color: 'var(--muted)',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontFamily: '"DM Sans", sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <XCircle size={13} />
                      Cancel Order
                    </motion.button>
                  ) : isOutForDelivery ? (
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--muted)',
                        fontStyle: 'italic',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <XCircle size={11} style={{ opacity: 0.45 }} />
                      Cannot cancel — order is on the way
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  Paid via {order.payment}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    pending: {
      bg: 'rgba(211, 18, 27, 0.08)',
      text: 'var(--red-bright)',
      border: 'rgba(211, 18, 27, 0.2)',
    },
    preparing: {
      bg: 'rgba(217, 163, 74, 0.1)',
      text: 'var(--maple)',
      border: 'rgba(217, 163, 74, 0.25)',
    },
    out_for_delivery: {
      bg: 'rgba(211, 18, 27, 0.08)',
      text: 'var(--red-bright)',
      border: 'rgba(211, 18, 27, 0.2)',
    },
    delivered: {
      bg: 'rgba(4, 118, 71, 0.1)',
      text: 'var(--secondary)',
      border: 'rgba(4, 118, 71, 0.25)',
    },
    cancelled: { bg: 'rgba(42, 37, 28, 0.07)', text: 'var(--muted)', border: 'var(--border2)' },
  };
  const c = colors[status] || colors.pending;
  const label = status?.replace(/_/g, ' ');

  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        fontSize: '0.62rem',
        fontWeight: 600,
        letterSpacing: '0.4px',
        padding: '3px 8px',
        borderRadius: '4px',
        textTransform: 'capitalize',
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      {label}
    </motion.span>
  );
}
