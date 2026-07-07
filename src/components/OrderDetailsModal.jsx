import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, User, MapPin, Hash, Calendar, Phone, FileText, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

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

const parseLocationFromNotes = (notes) => {
  if (!notes) return null;
  const match = notes.match(/\[LOC:\s*([-\d.]+),\s*([-\d.]+)\]/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
};

const getCleanedNotes = (notes) => {
  if (!notes) return '';
  return notes
    .replace(/\[LOC:\s*([-\d.]+),\s*([-\d.]+)\]/g, '')
    .replace(/\[SCHEDULED:[^\]]*\]/g, '')
    .replace(/^\s*—\s*/, '')
    .trim();
};

export default function OrderDetailsModal({ isOpen, onClose, order, onStatusUpdate }) {
  const { showToast } = useToast();
  const [updating, setUpdating] = useState(false);

  const formatDate = (ts) =>
    new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getItemTotal = (item) => {
    const qty = Number(item.quantity ?? item.qty ?? 1);
    if (item.subtotal != null && !isNaN(Number(item.subtotal))) {
      return Number(item.subtotal);
    }
    const unitPrice =
      item.price != null
        ? Number(item.price)
        : item.unit_price != null
          ? Number(item.unit_price)
          : item.item_price != null
            ? Number(item.item_price)
            : null;
    if (unitPrice != null && !isNaN(unitPrice)) {
      return unitPrice * qty;
    }
    return null;
  };

  const handleStatusChange = async (newStatus) => {
    if (!order || updating) return;
    setUpdating(true);
    try {
      const sanitizedId = order.id.replace('#', '');
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .filter('id', 'ilike', `%${sanitizedId}`);
      if (error) throw error;
      showToast(`Order ${order.id} is now ${newStatus.replace(/_/g, ' ')}`);
      if (onStatusUpdate) onStatusUpdate(order.id, newStatus);

      // Notify customer
      if (order.user_email) {
        const statusMessages = {
          preparing: {
            title: 'Order Being Prepared',
            message: `Your order ${order.id} is now being prepared!`,
            icon: 'preparing',
          },
          out_for_delivery: {
            title: 'Out for Delivery',
            message: `Your order ${order.id} is on its way!`,
            icon: 'delivering',
          },
          delivered: {
            title: 'Order Delivered',
            message: `Your order ${order.id} has been delivered. Enjoy your meal!`,
            icon: 'delivered',
          },
          cancelled: {
            title: 'Order Cancelled',
            message: `Your order ${order.id} has been cancelled. Contact us for help.`,
            icon: 'cancelled',
          },
        };
        const notif = statusMessages[newStatus];
        if (notif) {
          await supabase.from('notifications').insert({
            target_email: order.user_email,
            title: notif.title,
            message: notif.message,
            icon: notif.icon,
            is_read: false,
          });
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', true);
    } finally {
      setUpdating(false);
    }
  };

  if (!order) return null;
  const isCancelled = order.status === 'cancelled';
  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const progress = isCancelled ? 0 : ((currentStep + 1) / ORDER_STEPS.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '36px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShoppingBag size={24} color="var(--red-bright)" />
                <h2
                  style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', margin: 0 }}
                >
                  Order Details
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Order ID & Date */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  background: 'var(--surface2)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--muted)',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '6px',
                  }}
                >
                  <Hash size={12} /> Order ID
                </div>
                <div style={{ color: 'var(--red-bright)', fontWeight: 600, fontSize: '0.85rem' }}>
                  {order.id}
                </div>
              </div>
              <div
                style={{
                  background: 'var(--surface2)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--muted)',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '6px',
                  }}
                >
                  <Calendar size={12} /> Date & Time
                </div>
                <div style={{ color: 'var(--cream)', fontSize: '0.85rem' }}>
                  {formatDate(order.created_at)}
                </div>
              </div>
            </div>

            {/* Scheduled Order Badge */}
            {order.scheduled_date && (
              <div
                style={{
                  background: 'rgba(154, 174, 71, 0.1)',
                  border: '1px solid rgba(154, 174, 71, 0.25)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Calendar size={20} style={{ color: 'var(--red-bright)', flexShrink: 0 }} />
                <div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: 'var(--muted)',
                      marginBottom: '4px',
                    }}
                  >
                    📅 Scheduled Delivery
                  </div>
                  <div style={{ color: 'var(--cream)', fontSize: '0.9rem', fontWeight: 600 }}>
                    {new Date(order.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {order.scheduled_time && ` at ${order.scheduled_time}`}
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <User size={14} /> Customer
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cream)' }}>
                  {order.user_name}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{order.user_email}</div>
                {order.phone && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--muted)',
                      fontSize: '0.82rem',
                      marginTop: '2px',
                    }}
                  >
                    <Phone size={14} color="var(--muted)" /> {order.phone}
                  </div>
                )}
                {order.address && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--muted)',
                      fontSize: '0.82rem',
                      marginTop: '4px',
                    }}
                  >
                    <MapPin size={14} /> {order.address}
                  </div>
                )}
                {(() => {
                  const coords = parseLocationFromNotes(order.notes);
                  if (!coords) return null;
                  return (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--red-bright)',
                        fontSize: '0.8rem',
                        marginTop: '4px',
                        textDecoration: 'none',
                        fontWeight: 500,
                        width: 'fit-content'
                      }}
                    >
                      <ExternalLink size={12} /> Pin Location: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </a>
                  );
                })()}
              </div>
            </div>

            {/* Notes */}
            {(() => {
              const cleaned = getCleanedNotes(order.notes);
              if (!cleaned) return null;
              return (
                <div style={{ marginBottom: '24px' }}>
                  <h3
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileText size={14} /> Order Notes
                  </h3>
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.15)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      fontSize: '0.85rem',
                      color: 'var(--cream)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.4',
                    }}
                  >
                    {cleaned}
                  </div>
                </div>
              );
            })()}

            {/* Order Items */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '12px',
                }}
              >
                Items
              </h3>
              <div
                style={{
                  background: 'rgba(0,0,0,0.15)',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {order.items?.map((item, idx) => {
                  const qty = Number(item.quantity ?? item.qty ?? 1);
                  const total = getItemTotal(item);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                        color: 'var(--cream)',
                        marginBottom: idx < order.items.length - 1 ? '10px' : 0,
                        paddingBottom: idx < order.items.length - 1 ? '10px' : 0,
                        borderBottom:
                          idx < order.items.length - 1
                            ? '1px solid rgba(255,255,255,0.04)'
                            : 'none',
                      }}
                    >
                      <div>
                        <span
                          style={{ color: 'var(--muted)', marginRight: '8px', fontWeight: 500 }}
                        >
                          {qty}x
                        </span>
                        {item.name}
                      </div>
                      <div style={{ fontWeight: 500 }}>
                        {total != null ? `₱${total.toFixed(2)}` : '—'}
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    marginTop: '12px',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 600,
                    color: 'var(--cream)',
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--red-bright)', fontSize: '1rem' }}>
                    ₱{Number(order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            {!isCancelled ? (
              <div
                style={{
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  marginBottom: '20px',
                }}
              >
                {/* ETA Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: 'var(--muted)',
                    }}
                  >
                    ETA
                  </span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: order.status === 'delivered' ? '#22c55e' : 'var(--cream)',
                    }}
                  >
                    {ETA_MAP[order.status]}
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    background: 'var(--surface2)',
                    borderRadius: '999px',
                    height: '4px',
                    marginBottom: '20px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    style={{
                      height: '100%',
                      background: 'var(--red-bright)',
                      borderRadius: '999px',
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {ORDER_STEPS.map((step, index) => {
                    const isDone = index < currentStep;
                    const isActive = index === currentStep;
                    const isPending = index > currentStep;
                    const isNext = index === currentStep + 1 && !isCancelled;

                    return (
                      <div key={step.key} style={{ display: 'flex', gap: '12px' }}>
                        {/* Icon + Connector */}
                        <div
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                          <motion.div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: isNext ? 'pointer' : 'default',
                              background: isDone
                                ? '#1D9E75'
                                : isActive
                                  ? 'rgba(154,174,71,0.15)'
                                  : 'var(--surface2)',
                              border: isActive
                                ? '2px solid var(--red-bright)'
                                : isDone
                                  ? '2px solid #1D9E75'
                                  : '2px solid var(--border)',
                              opacity: updating && isNext ? 0.5 : 1,
                              transition: 'all 0.2s',
                            }}
                            animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                            transition={
                              isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}
                            }
                            onClick={() => isNext && handleStatusChange(step.key)}
                            whileHover={isNext ? { scale: 1.1 } : {}}
                          >
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={isDone ? 'done' : step.key}
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.6 }}
                                transition={{ duration: 0.3 }}
                                style={{ fontSize: '14px' }}
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
                                minHeight: '24px',
                                background: 'var(--border)',
                                margin: '4px 0',
                                borderRadius: '2px',
                                overflow: 'hidden',
                              }}
                            >
                              <motion.div
                                style={{ width: '100%', background: '#1D9E75' }}
                                animate={{ height: isDone ? '100%' : '0%' }}
                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <motion.div
                          style={{
                            paddingTop: '6px',
                            paddingBottom: index < ORDER_STEPS.length - 1 ? '16px' : '0',
                            flex: 1,
                          }}
                          animate={{ opacity: isPending ? 0.4 : 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <p
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 500,
                              margin: 0,
                              color: isActive
                                ? 'var(--red-bright)'
                                : isDone
                                  ? '#22c55e'
                                  : 'var(--muted)',
                              fontFamily: '"DM Sans", sans-serif',
                            }}
                          >
                            {step.label}
                            {isNext && (
                              <span
                                style={{
                                  marginLeft: '8px',
                                  fontSize: '0.6rem',
                                  color: 'var(--red-bright)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px',
                                  opacity: 0.7,
                                }}
                              >
                                Click to advance
                              </span>
                            )}
                          </p>
                          <AnimatePresence>
                            {(isActive || isDone) && (
                              <motion.p
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--muted)',
                                  margin: '2px 0 0',
                                }}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
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
                  background: 'rgba(160, 76, 76, 0.1)',
                  border: '1px solid rgba(160, 76, 76, 0.2)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                <p
                  style={{ color: 'var(--maple)', fontSize: '0.9rem', fontWeight: 500, margin: 0 }}
                >
                  This order was cancelled.
                </p>
              </div>
            )}

            {/* Admin Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!isCancelled && order.status !== 'delivered' && (
                <>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updating}
                    style={{
                      background: 'rgba(160, 76, 76, 0.15)',
                      border: '1px solid rgba(160, 76, 76, 0.3)',
                      color: 'var(--maple)',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 500,
                      fontFamily: '"DM Sans", sans-serif',
                      opacity: updating ? 0.5 : 1,
                    }}
                  >
                    Cancel Order
                  </button>
                </>
              )}
              <div style={{ flex: 1 }} />
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  textTransform: 'capitalize',
                  alignSelf: 'center',
                }}
              >
                Paid via {order.payment}
                {order.gcash_ref && ` • Ref: ${order.gcash_ref}`}
              </div>
            </div>

            {/* GCash Receipt */}
            {order.gcash_receipt_url && (
              <div style={{ marginTop: '16px' }}>
                <h3
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  🧾 GCash Receipt
                </h3>
                <div
                  style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    background: '#f5f5f5',
                  }}
                >
                  <a href={order.gcash_receipt_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={order.gcash_receipt_url}
                      alt="GCash Receipt"
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        display: 'block',
                        cursor: 'pointer',
                      }}
                    />
                  </a>
                  <div
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--surface2)',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Ref #:{' '}
                      <strong style={{ color: 'var(--cream)' }}>{order.gcash_ref || 'N/A'}</strong>
                    </span>
                    <a
                      href={order.gcash_receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--red-bright)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      View Full Size ↗
                    </a>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
