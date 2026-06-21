import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MenuCard from '../components/MenuCard';
import CartDrawer from '../components/CartDrawer';
import NotificationPanel from '../components/NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import {
  AllIconSmall,
  SushiIconSmall,
  RiceIconSmall,
  SaladIconSmall,
  TakoyakiIconSmall,
  AddOnsIconSmall,
} from '../components/JapaneseIcons';
import { ShoppingBag, ClipboardList, Bell, User, LogOut, Search } from 'lucide-react';
import { checkAvailability } from '../lib/inventoryHelpers';

export default function CustomerView() {
  const [menuItems, setMenuItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);
  const [availability, setAvailability] = useState({});
  const { user, logout } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const { unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const toggleNotifs = () => {
    if (!showNotifs) markAsRead();
    setShowNotifs(!showNotifs);
  };

  useEffect(() => {
    async function loadMenu() {
      const { data, error } = await supabase.from('menu_items').select('*').order('id');
      if (data) {
        processMenuData(data);
        // Check ingredient availability
        const ids = data.map((d) => d.id);
        const avail = await checkAvailability(ids);
        setAvailability(avail);
      }
      setLoading(false);
    }

    function processMenuData(data) {
      const grouped = {};

      data.forEach((d) => {
        let baseCat = d.category;
        let isTakoyaki = baseCat.startsWith('takoyaki-');

        if (baseCat === 'sushi') {
          // Group sushi platters by base name, extract "Xpcs" prefix as variant label
          const pcsMatch = d.name.match(/^(\d+)pcs\s+(.+)$/i);
          if (pcsMatch) {
            const label = pcsMatch[1] + 'pcs';
            const baseName = pcsMatch[2].trim();
            if (!grouped[baseName]) {
              grouped[baseName] = {
                id: d.id,
                name: baseName,
                emoji: d.emoji,
                desc: d.description || '',
                category: 'sushi',
                stock: d.stock,
                variants: [],
              };
            }
            grouped[baseName].variants.push({ label, price: parseFloat(d.price) });
            grouped[baseName].variants.sort((a, b) => {
              const aNum = parseInt(a.label);
              const bNum = parseInt(b.label);
              return aNum - bNum;
            });
          } else {
            // No pcs prefix (e.g. "Bundle (All Flavors)")
            grouped[d.name] = {
              id: d.id,
              name: d.name,
              emoji: d.emoji,
              desc: d.description || '',
              price: parseFloat(d.price),
              category: d.category,
              stock: d.stock,
              variants: [],
            };
          }
        } else if (isTakoyaki) {
          const baseName = d.name.replace(/\s*\(\d+pcs\)/i, '').trim();
          const label = baseCat.includes('8') ? '8pcs' : '10pcs';

          if (!grouped[baseName]) {
            grouped[baseName] = {
              id: d.id,
              name: baseName,
              emoji: d.emoji,
              desc: d.description || '',
              category: 'takoyaki',
              stock: d.stock,
              variants: [],
            };
          }
          grouped[baseName].variants.push({ label, price: parseFloat(d.price) });
          grouped[baseName].variants.sort((a, b) => a.label.localeCompare(b.label));
        } else {
          grouped[d.name] = {
            id: d.id,
            name: d.name,
            emoji: d.emoji,
            desc: d.description || '',
            price: parseFloat(d.price),
            category: d.category,
            stock: d.stock,
            variants: [],
          };
        }
      });

      const mapped = Object.values(grouped).map((item) => {
        if (item.variants && item.variants.length > 0) {
          item.price = item.variants[0].price;
        }
        return item;
      });

      setMenuItems(mapped);
    }

    loadMenu();

    const subscription = supabase
      .channel('customer-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        loadMenu();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const filteredItems = menuItems.filter((i) => {
    const matchesCategory = filter === 'all' || i.category === filter;
    const matchesSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const actionBtnStyle = {
    background: 'none',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    color: 'var(--muted)',
    padding: '10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.2s',
    minWidth: 44,
    minHeight: 44,
  };

  return (
    <div className="view active customer-page">
      {/* Top Bar */}
      <div
        className="customer-top-bar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="logo-text" style={{ textDecoration: 'none', cursor: 'default' }}>
          <span className="brand">Jemrald</span>
          <span className="tagline">Foodhouse</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ borderColor: 'var(--muted)', color: 'var(--cream)' }}
                  onClick={toggleNotifs}
                  style={actionBtnStyle}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: 'var(--red)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>
                <NotificationPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
              </div>

              {/* Orders */}
              <motion.button
                whileHover={{ borderColor: 'var(--muted)', color: 'var(--cream)' }}
                onClick={() => document.dispatchEvent(new CustomEvent('open-tracker'))}
                style={actionBtnStyle}
              >
                <ClipboardList size={18} />
              </motion.button>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleCart}
                style={{
                  ...actionBtnStyle,
                  background: 'var(--red)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 14px',
                  gap: '6px',
                  fontSize: '0.72rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                <ShoppingBag size={16} />
                Cart
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      background: '#fff',
                      color: 'var(--red)',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '0.65rem',
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

              {/* Profile */}
              <motion.button
                whileHover={{ borderColor: 'var(--muted)', color: 'var(--cream)' }}
                onClick={() => navigate('/profile')}
                style={{
                  ...actionBtnStyle,
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  padding: 0,
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <User size={18} />
                )}
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.dispatchEvent(new CustomEvent('open-auth'))}
              style={{
                background: 'var(--red)',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.72rem',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '10px 20px',
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
      </div>

      <div className="banner">
        <motion.div
          className="banner-deco"
          animate={{ y: [0, -15, 0], x: [0, 10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="banner-deco"
          animate={{ y: [0, 20, 0], x: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="banner-deco"
          animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <div className="banner-content">
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Authentic <span>Flavors</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Crafted with passion, delivered fresh
          </motion.p>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          padding: '12px 20px 0',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)',
              pointerEvents: 'none',
            }}
          />
          <motion.input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            whileFocus={{ scale: 1.01, boxShadow: '0 0 0 2px rgba(211, 18, 27, 0.2)' }}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              color: 'var(--cream)',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--red-bright)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                whileHover={{ scale: 1.1, backgroundColor: 'var(--border)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  marginTop: '-11px' /* Center exactly based on height */,
                  background: 'var(--surface)',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
              >
                ✕
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="filter-bar">
        {['all', 'sushi', 'salad', 'takoyaki', 'add-ons', 'rice'].map(
          (cat) => (
            <motion.button
              key={cat}
              className={`filter-tab ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
              whileTap={{ scale: 0.95 }}
            >
              {filter === cat && (
                <motion.div
                  layoutId="activeFilterCustomer"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '30px',
                    background: 'var(--red)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <span
                style={{ display: 'flex', alignItems: 'center', zIndex: 1, position: 'relative' }}
              >
                {cat === 'all' && (
                  <>
                    <AllIconSmall size={16} color="currentColor" style={{ marginRight: 4 }} /> All
                  </>
                )}
                {cat === 'sushi' && (
                  <>
                    <SushiIconSmall size={16} color="currentColor" style={{ marginRight: 4 }} />{' '}
                    Sushi
                  </>
                )}
                {cat === 'salad' && (
                  <>
                    <SaladIconSmall size={16} color="currentColor" style={{ marginRight: 4 }} />{' '}
                    Salad
                  </>
                )}
                {cat === 'takoyaki' && (
                  <>
                    <TakoyakiIconSmall size={16} color="currentColor" style={{ marginRight: 4 }} />{' '}
                    Takoyaki
                  </>
                )}
                {cat === 'add-ons' && (
                  <>
                    <AddOnsIconSmall size={16} style={{ marginRight: 4 }} /> Add-ons
                  </>
                )}
                {cat === 'rice' && (
                  <>
                    <RiceIconSmall size={16} color="currentColor" style={{ marginRight: 4 }} /> Rice
                  </>
                )}

              </span>
            </motion.button>
          )
        )}
      </div>

      <div className="menu-section">
        <div className="section-title">Our Menu</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Loading menu...
          </div>
        ) : (
          <motion.div layout className="menu-grid">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  available={availability[item.id] !== undefined ? availability[item.id] > 0 : true}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <CartDrawer />
    </div>
  );
}
