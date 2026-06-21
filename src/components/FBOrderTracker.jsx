import { motion } from 'framer-motion';
import {
  CheckCircle2,
  CalendarClock,
  ClipboardList,
  ChefHat,
  Bike,
  CircleCheck,
} from 'lucide-react';

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
  if (!placedOrder) return null;

  const isCancelled = placedOrder.status === 'cancelled';
  const currentStepIdx = isCancelled
    ? -1
    : Math.max(
        0,
        STATUS_STEPS.findIndex((s) => s.key === placedOrder.status)
      );
  const progress = isCancelled ? 0 : ((currentStepIdx + 1) / STATUS_STEPS.length) * 100;

  return (
    <div
      className="fb-order-container"
      style={{
        minHeight: '100vh',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <CheckCircle2 size={48} style={{ color: 'var(--secondary)', margin: '0 auto 16px' }} />
        <h2
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.8rem',
            margin: '0 0 8px 0',
            color: 'var(--cream)',
          }}
        >
          Order #{placedOrder.id}
        </h2>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
          Thanks, {placedOrder.user_name}! Keep this page open to track your food.
        </p>
        {placedOrder.scheduled_date && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(154, 174, 71, 0.1)',
              border: '1px solid rgba(154, 174, 71, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              justifyContent: 'center',
            }}
          >
            <CalendarClock size={18} style={{ color: 'var(--red-bright)' }} />
            <span style={{ color: 'var(--cream)', fontSize: '0.85rem', fontWeight: 500 }}>
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
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--red-bright)', fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
            This order has been cancelled.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
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
              background: 'var(--border)',
              borderRadius: '999px',
              height: '4px',
              marginBottom: '30px',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{ height: '100%', background: 'var(--secondary)', borderRadius: '999px' }}
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
                          ? 'rgba(154, 174, 71, 0.15)'
                          : isActive
                            ? 'var(--surface)'
                            : 'var(--surface2)',
                        border: isActive
                          ? '2px solid var(--red-bright)'
                          : isDone
                            ? '2px solid var(--secondary)'
                            : '2px solid var(--border)',
                      }}
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={
                        isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}
                      }
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} style={{ color: 'var(--secondary)' }} />
                      ) : (
                        <step.IconComponent
                          size={18}
                          style={{ color: isActive ? 'var(--red-bright)' : 'var(--muted)' }}
                        />
                      )}
                    </motion.div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        style={{
                          width: '2px',
                          height: '100%',
                          minHeight: '30px',
                          background: isDone ? 'var(--secondary)' : 'var(--border)',
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
                          ? 'var(--red-bright)'
                          : isDone
                            ? 'var(--secondary)'
                            : 'var(--muted)',
                      }}
                    >
                      {step.label}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
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
        <button
          className="btn-cancel"
          onClick={() => (window.location.href = 'https://m.me/jemraldfoodhouse')}
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--cream)',
            cursor: 'pointer',
            fontFamily: '"DM Sans", sans-serif',
            width: '100%',
          }}
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
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: '"DM Sans", sans-serif',
            width: '100%',
            fontSize: '0.85rem',
          }}
        >
          Place Another Order
        </button>
      </div>
    </div>
  );
}
