import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  Flame,
  Truck,
  PartyPopper,
  AlertTriangle,
  Package,
  ClipboardList,
} from 'lucide-react';

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, clearNotifications } = useNotifications();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="notif-panel open"
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '10px',
              width: '360px',
              background: 'var(--deep)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              zIndex: 200,
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            <div
              className="notif-panel-header"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', margin: 0 }}>
                Notifications
              </h4>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="notif-clear"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: '0.72rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    transition: 'color 0.2s',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="notif-list" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div
                  className="notif-empty"
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: 'var(--muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${n.is_read ? '' : 'unread'}`}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      background: n.is_read ? 'transparent' : 'rgba(154,174,71,0.05)',
                      borderLeft: n.is_read ? 'none' : '3px solid var(--red)',
                    }}
                  >
                    <div
                      className="notif-icon"
                      style={{
                        flexShrink: 0,
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                      }}
                    >
                      {n.icon === 'preparing' && (
                        <Flame size={18} style={{ color: 'var(--red-bright)' }} />
                      )}
                      {n.icon === 'delivering' && (
                        <Truck size={18} style={{ color: 'var(--red-bright)' }} />
                      )}
                      {n.icon === 'delivered' && (
                        <PartyPopper size={18} style={{ color: 'var(--red-bright)' }} />
                      )}
                      {n.icon === 'cancelled' && (
                        <AlertTriangle size={18} style={{ color: 'var(--maple)' }} />
                      )}
                      {n.icon === 'order' && (
                        <Package size={18} style={{ color: 'var(--red-bright)' }} />
                      )}
                      {n.icon === 'order-placed' && (
                        <ClipboardList size={18} style={{ color: 'var(--red-bright)' }} />
                      )}
                      {!n.icon && <Bell size={18} style={{ color: 'var(--muted)' }} />}
                    </div>
                    <div className="notif-body" style={{ flex: 1 }}>
                      <div
                        className="notif-title"
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--cream)',
                          marginBottom: '3px',
                          fontWeight: 500,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        className="notif-msg"
                        style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5 }}
                      >
                        {n.message}
                      </div>
                      <div
                        className="notif-time"
                        style={{
                          fontSize: '0.67rem',
                          color: 'var(--muted)',
                          opacity: 0.6,
                          marginTop: '4px',
                        }}
                      >
                        {new Date(n.created_at).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
