import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  CalendarClock,
  ClipboardList,
  ChefHat,
  Bike,
  CircleCheck,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const STATUS_STEPS = [
  {
    key: 'pending',
    label: 'Order Confirmed',
    subtitle: 'We received your order',
    IconComponent: ClipboardList,
  },
  {
    key: 'preparing',
    label: 'Preparing',
    subtitle: 'Kitchen is working on it',
    IconComponent: ChefHat,
  },
  {
    key: 'out_for_delivery',
    label: 'On the Way',
    subtitle: 'Driver is arriving soon',
    IconComponent: Bike,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    subtitle: 'Enjoy your meal!',
    IconComponent: CircleCheck,
  },
];

export default function FBOrderTracker({ placedOrder, setPlacedOrder, setView }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!placedOrder) return null;

  const isCancelled = placedOrder.status === 'cancelled';
  const currentStepIdx = isCancelled
    ? -1
    : Math.max(
        0,
        STATUS_STEPS.findIndex((s) => s.key === placedOrder.status)
      );
  const progress = isCancelled ? 0 : ((currentStepIdx + 1) / STATUS_STEPS.length) * 100;

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', placedOrder.id)
        .select()
        .single();
      if (error) throw error;
      setPlacedOrder(data);
      setShowCancelModal(false);
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className="fb-order-container"
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        background: '#faf8f5',
        fontFamily: '"Outfit", sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <CheckCircle2 size={48} style={{ color: '#C62839', margin: '0 auto 16px' }} />
        <h2
          style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '1.8rem',
            fontWeight: 700,
            margin: '0 0 8px 0',
            color: '#C62839',
            letterSpacing: '-0.3px',
          }}
        >
          Order #{placedOrder.id}
        </h2>
        <p style={{ color: '#8c7d75', margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>
          Thanks, {placedOrder.user_name}! Keep this page open to track your food.
        </p>
        {placedOrder.scheduled_date && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'rgba(198, 40, 57, 0.05)',
              border: '1px solid rgba(198, 40, 57, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              justifyContent: 'center',
            }}
          >
            <CalendarClock size={18} style={{ color: '#C62839' }} />
            <span style={{ color: '#C62839', fontSize: '0.85rem', fontWeight: 600 }}>
              Scheduled for{' '}
              {new Date(placedOrder.scheduled_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at {placedOrder.scheduled_time}
            </span>
          </div>
        )}
      </div>

      {isCancelled ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(198, 40, 57, 0.03)',
            border: '1.5px solid rgba(239, 68, 68, 0.15)',
            marginBottom: '32px',
          }}
        >
          <XCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
          <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
            This order has been cancelled.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(198, 40, 57, 0.03)',
            marginBottom: '32px',
          }}
        >
          {/* Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Order progress"
            style={{
              background: 'rgba(198, 40, 57, 0.08)',
              borderRadius: '999px',
              height: '6px',
              marginBottom: '30px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{ height: '100%', background: '#C62839', borderRadius: '999px' }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {/* Steps Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {STATUS_STEPS.map((step, index) => {
              const isDone = index < currentStepIdx;
              const isActive = index === currentStepIdx;
              const isPending = index > currentStepIdx;

              return (
                <div key={step.key} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <motion.div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: isDone
                          ? 'rgba(198, 40, 57, 0.08)'
                          : isActive
                            ? 'rgba(198, 40, 57, 0.04)'
                            : '#ffffff',
                        border: isActive
                          ? '2px solid #C62839'
                          : isDone
                            ? '2px solid #C62839'
                            : '2px solid rgba(198, 40, 57, 0.12)',
                      }}
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={
                        isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}
                      }
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} style={{ color: '#C62839' }} />
                      ) : (
                        <step.IconComponent
                          size={18}
                          style={{ color: isActive ? '#C62839' : '#8c7d75' }}
                        />
                      )}
                    </motion.div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        style={{
                          width: '2px',
                          height: '100%',
                          minHeight: '30px',
                          background: isDone ? '#C62839' : 'rgba(198, 40, 57, 0.12)',
                          margin: '4px 0',
                        }}
                      />
                    )}
                  </div>

                  <motion.div
                    style={{ flex: 1, paddingTop: '6px' }}
                    animate={{ opacity: isPending ? 0.4 : 1 }}
                  >
                    <p
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        margin: '0 0 2px 0',
                        color: isActive
                          ? '#C62839'
                          : isDone
                            ? '#C62839'
                            : '#8c7d75',
                      }}
                    >
                      {step.label}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#8c7d75', margin: 0 }}>
                      {step.subtitle}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', flexDirection: 'column' }}>
          {placedOrder.status === 'pending' && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1.5px solid #ef4444',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: '"Outfit", sans-serif',
                width: '100%',
                fontSize: '0.9rem',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#fef2f2')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ffffff')}
            >
              Cancel Order
            </button>
          )}

          <button
            onClick={() => (window.location.href = 'https://m.me/jemraldfoodhouse')}
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: '#C62839',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: '"Outfit", sans-serif',
              width: '100%',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(198, 40, 57, 0.2)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#8c3a1d')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#C62839')}
          >
            Return to Messenger
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('fb_active_order');
              setPlacedOrder(null);
              setView('menu');
            }}
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'transparent',
              border: '1.5px solid rgba(198, 40, 57, 0.15)',
              color: '#8c7d75',
              cursor: 'pointer',
              fontFamily: '"Outfit", sans-serif',
              width: '100%',
              fontSize: '0.9rem',
              fontWeight: 700,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = 'rgba(198, 40, 57, 0.02)')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
          >
            Place Another Order
          </button>
        </div>

        {/* Custom Confirmation Modal */}
        <AnimatePresence>
          {showCancelModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCancelModal(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  zIndex: 1000,
                }}
              />
              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  x: '-50%',
                  y: '-50%',
                  width: '90%',
                  maxWidth: '340px',
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '24px',
                  zIndex: 1001,
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                  textAlign: 'center',
                  fontFamily: '"Outfit", sans-serif',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}
                >
                  <XCircle size={28} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e140f', margin: '0 0 8px 0' }}>
                  Cancel Order?
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#8c7d75', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: '#ffffff',
                      border: '1.5px solid rgba(198, 40, 57, 0.15)',
                      color: '#8c7d75',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: '0.9rem',
                    }}
                  >
                    No, Keep
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: '#ef4444',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
  );
}
