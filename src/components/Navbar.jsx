import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, LogOut, User, Bell, Sun, Moon, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const { unreadCount, markAsRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);

  const toggleNotifs = () => {
    if (!showNotifs) markAsRead();
    setShowNotifs(!showNotifs);
  };

  // Don't show the main navbar on the landing page if desired,
  // but for now, we'll show it everywhere except it might have a transparent background on landing.
  const isLanding = location.pathname === '/';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`nav ${isLanding ? 'landing-nav' : ''}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: isLanding ? 'transparent' : 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: isLanding ? 'none' : '1px solid var(--border)',
        padding: '0 40px',
        height: isLanding ? '80px' : '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link to="/" className="logo-text" style={{ textDecoration: 'none' }}>
        <span
          style={{
            fontFamily: '"Poppins", sans-serif',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--primary)',
            letterSpacing: '1px',
            display: 'block',
          }}
        >
          Jemrald
        </span>
        <span
          style={{
            fontSize: '0.5rem',
            letterSpacing: '3px',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            display: 'block',
            marginTop: '2px',
          }}
        >
          Foodhouse
        </span>
      </Link>

      {!isLanding && (
        <div className="nav-links">
          <Link to="/menu" className={`nav-btn ${location.pathname === '/menu' ? 'active' : ''}`}>
            Menu
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`nav-btn ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            >
              Admin Panel
            </Link>
          )}
        </div>
      )}

      <div className="nav-right">
        {user ? (
          <>
            {user.role !== 'admin' && (
              <>
                <div
                  className="user-greeting"
                  style={{ fontSize: '0.8rem', color: 'var(--muted)' }}
                >
                  Hello,{' '}
                  <span style={{ color: 'var(--cream)', fontWeight: 500 }}>
                    {user.name.split(' ')[0]}
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <motion.button
                    whileHover={{ color: 'var(--cream)', borderColor: 'var(--muted)' }}
                    onClick={toggleNotifs}
                    className="notif-btn"
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      padding: '8px 14px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minWidth: 44,
                      minHeight: 44,
                    }}
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          background: 'var(--primary)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'absolute',
                          top: -5,
                          right: -5,
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </motion.button>
                  <NotificationPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
                </div>

                <motion.button
                  whileHover={{ color: 'var(--cream)', borderColor: 'var(--muted)' }}
                  onClick={() => {
                    console.log('Dispatching open-tracker event');
                    document.dispatchEvent(new CustomEvent('open-tracker'));
                  }}
                  className="orders-btn"
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.72rem',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  <ClipboardList size={14} />
                  Orders
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleCart}
                  className="cart-btn"
                  style={{
                    background: 'var(--primary)',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#fff',
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '0.77rem',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShoppingBag size={16} />
                  Cart
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="cart-count"
                      style={{
                        background: '#fff',
                        color: 'var(--primary)',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ color: 'var(--cream)', borderColor: 'var(--muted)' }}
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="logout-btn"
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.72rem',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: 44,
                    minHeight: 44,
                  }}
                >
                  <LogOut size={14} />
                  Logout
                </motion.button>
              </>
            )}
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.dispatchEvent(new CustomEvent('open-auth'))}
            className="ln-btn primary"
            style={{
              background: 'var(--primary)',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontFamily: '"Open Sans", sans-serif',
              fontSize: '0.75rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '10px 24px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <User size={16} />
            Sign In
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
}
