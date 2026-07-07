import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from '../components/CartDrawer';
import { ArrowRight, Star, ShoppingBag, Utensils, Flame, Coffee } from 'lucide-react';
import './landing-layout.css';
import VueWrapper from '../components/VueWrapper';
import SampleVueComponent from '../components/SampleVueComponent.vue';

const FEATURE_LIST = [
  { title: 'Sourced Daily', desc: 'Fresh produce and meats sourced every morning.' },
  { title: 'Master Chefs', desc: 'Decades of combined experience in Japanese culinary arts.' },
  { title: 'Zero Compromise', desc: 'We never cut corners on ingredients or preparation.' },
];

export default function LandingPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadMenu() {
      const { data } = await supabase.from('menu_items').select('*').order('id');
      if (data) {
        // Group similar to original logic for consistency
        const grouped = {};
        data.forEach((d) => {
          const baseCat = d.category;
          const isTakoyaki = baseCat.startsWith('takoyaki-');

          const rawDesc = d.description || '';
          const cleanDesc = rawDesc.split(' ||image:')[0];
          const customImage = rawDesc.includes(' ||image:') ? rawDesc.split(' ||image:')[1] : null;

          if (baseCat === 'sushi' || baseCat === 'kimbap' || baseCat === 'solo') {
            const pcsMatch = d.name.match(/^(\d+)pcs\s+(.+)$/i);
            if (pcsMatch) {
              const baseName = pcsMatch[2].trim();
              const groupKey = `${baseCat}_${baseName}`;
              if (!grouped[groupKey]) {
                grouped[groupKey] = {
                  id: d.id,
                  name: baseName,
                  emoji: d.emoji,
                  desc: cleanDesc,
                  imageUrl: customImage,
                  category: baseCat,
                  stock: d.stock,
                  price: parseFloat(d.price),
                };
              } else if (customImage) {
                grouped[groupKey].imageUrl = customImage;
              }
            } else {
              const parenMatch = d.name.match(/^(.+)\s+\(([^)]+)\)$/i);
              if (parenMatch) {
                const baseName = parenMatch[1].trim();
                const groupKey = `${baseCat}_${baseName}`;
                if (!grouped[groupKey]) {
                  grouped[groupKey] = {
                    id: d.id,
                    name: baseName,
                    emoji: d.emoji,
                    desc: cleanDesc,
                    imageUrl: customImage,
                    category: baseCat,
                    stock: d.stock,
                    price: parseFloat(d.price),
                  };
                } else if (customImage) {
                  grouped[groupKey].imageUrl = customImage;
                }
              } else {
                const groupKey = `${baseCat}_${d.name}`;
                grouped[groupKey] = {
                  id: d.id,
                  name: d.name,
                  emoji: d.emoji,
                  desc: cleanDesc,
                  imageUrl: customImage,
                  price: parseFloat(d.price),
                  category: d.category,
                  stock: d.stock,
                };
              }
            }
          } else if (baseCat === 'baked-sushi') {
            const sizeMatch = d.name.match(/^(.+)\s+\((Small|Medium|Large)\)$/i);
            if (sizeMatch) {
              const baseName = sizeMatch[1].trim();
              const groupKey = `baked-sushi_${baseName}`;
              if (!grouped[groupKey]) {
                grouped[groupKey] = {
                  id: d.id,
                  name: baseName,
                  emoji: d.emoji,
                  desc: cleanDesc,
                  imageUrl: customImage,
                  category: 'baked-sushi',
                  stock: d.stock,
                  price: parseFloat(d.price),
                };
              } else if (customImage) {
                grouped[groupKey].imageUrl = customImage;
              }
            } else {
              const groupKey = `baked-sushi_${d.name}`;
              grouped[groupKey] = {
                id: d.id,
                name: d.name,
                emoji: d.emoji,
                desc: cleanDesc,
                imageUrl: customImage,
                price: parseFloat(d.price),
                category: d.category,
                stock: d.stock,
              };
            }
          } else if (isTakoyaki) {
            const baseName = d.name.replace(/\s*\(\d+pcs\)/i, '').trim();
            const groupKey = `takoyaki_${baseName}`;
            if (!grouped[groupKey]) {
              grouped[groupKey] = {
                id: d.id,
                name: baseName,
                emoji: d.emoji,
                desc: cleanDesc,
                imageUrl: customImage,
                category: 'takoyaki',
                stock: d.stock,
                price: parseFloat(d.price),
              };
            } else if (customImage) {
              grouped[groupKey].imageUrl = customImage;
            }
          } else {
            const groupKey = `${baseCat}_${d.name}`;
            grouped[groupKey] = {
              id: d.id,
              name: d.name,
              emoji: d.emoji,
              desc: cleanDesc,
              imageUrl: customImage,
              price: parseFloat(d.price),
              category: d.category,
              stock: d.stock,
            };
          }
        });
        const sorted = Object.values(grouped).sort((a, b) => {
          if (a.category === 'promo' && b.category === 'promo') {
            return a.name.localeCompare(b.name);
          }
          return 0;
        });
        setMenuItems(sorted);
      }
    }
    loadMenu();
  }, []);

  // Use raw items directly to display
  // 3x2 grid -> 5 items + 1 view all
  const displayItems =
    filter === 'all'
      ? menuItems.slice(0, 5)
      : menuItems.filter((i) => i.category === filter).slice(0, 5);

  return (
    <div className="jf-landing">
      {/* 1. Nav */}
      <nav className={`jf-nav ${scrolled ? 'jf-nav-scrolled' : ''}`}>
        <div className="jf-nav-brand">Jemrald</div>

        <div className="jf-nav-links">
          <a href="#menu">Menu</a>
          <a href="#about">Why Us</a>
          <a href="#reviews">Reviews</a>
        </div>

        <div className="jf-nav-actions">
          <button className="icon-btn" onClick={toggleCart}>
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          <button
            className="jf-btn-primary"
            onClick={() =>
              user
                ? navigate('/menu')
                : document.dispatchEvent(
                    new CustomEvent('open-auth', { detail: { tab: 'register' } })
                  )
            }
          >
            Order Now
          </button>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="jf-hero">
        <div className="jf-hero-content">
          <h1 className="jf-headline">
            Food that makes
            <br />
            you feel <span className="text-red">alive.</span>
          </h1>
          <p className="jf-subheadline">Authentic flavors delivered to your door in minutes.</p>
          <button className="jf-btn-primary large mt-6" onClick={() => navigate('/menu')}>
            Explore the Menu <ArrowRight size={18} />
          </button>
        </div>

        <div className="jf-hero-visual">
          <div className="jf-watermark">JF</div>
          <motion.div
            className="jf-mini-card"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mini-card-img">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
                alt="Special Bowl"
              />
            </div>
            <div className="mini-card-info">
              <h4>Signature Beef Bowl</h4>
              <div className="mini-stats">
                <span className="rating">
                  <Star size={12} className="star-icon" fill="currentColor" /> 4.9
                </span>
                <span className="orders">1.2k+ Orders</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Marquee bar */}
      <div className="jf-marquee">
        <div className="marquee-content">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="marquee-group">
              {menuItems.slice(0, 10).map((item) => (
                <span key={item.id + '-' + i} className="marquee-item">
                  {item.name} •
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="jf-container">
        {/* 4. Category Row */}
        <div className="jf-category-row">
          <button
            className={`cat-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <Utensils size={16} /> All
          </button>
          <button
            className={`cat-pill ${filter === 'sushi' ? 'active' : ''}`}
            onClick={() => setFilter('sushi')}
          >
            <Utensils size={16} /> Sushi Platter
          </button>
          <button
            className={`cat-pill ${filter === 'baked-sushi' ? 'active' : ''}`}
            onClick={() => setFilter('baked-sushi')}
          >
            <Utensils size={16} /> Baked Sushi
          </button>
          <button
            className={`cat-pill ${filter === 'kimbap' ? 'active' : ''}`}
            onClick={() => setFilter('kimbap')}
          >
            <Utensils size={16} /> Kimbap
          </button>
          <button
            className={`cat-pill ${filter === 'solo' ? 'active' : ''}`}
            onClick={() => setFilter('solo')}
          >
            <Utensils size={16} /> Sushi Solo
          </button>
          <button
            className={`cat-pill ${filter === 'salad' ? 'active' : ''}`}
            onClick={() => setFilter('salad')}
          >
            <Flame size={16} /> Salad
          </button>
          <button
            className={`cat-pill ${filter === 'takoyaki' ? 'active' : ''}`}
            onClick={() => setFilter('takoyaki')}
          >
            <Utensils size={16} /> Takoyaki
          </button>
          <button
            className={`cat-pill ${filter === 'add-ons' ? 'active' : ''}`}
            onClick={() => setFilter('add-ons')}
          >
            <Coffee size={16} /> Add-ons
          </button>
        </div>

        {/* 5. Menu Preview */}
        <section id="menu" className="jf-section">
          <div className="menu-grid-3x2">
            {displayItems.map((item) => (
              <div key={item.id} className="jf-menu-tile">
                <div className="tile-category">{item.category}</div>
                <h3 className="tile-name">{item.name}</h3>
                <p className="tile-desc">{item.desc}</p>
                <div className="tile-bottom">
                  <span className="tile-price">₱{parseFloat(item.price || 0).toFixed(2)}</span>
                  <button
                    className="tile-add"
                    onClick={() =>
                      document.dispatchEvent(new CustomEvent('open-item', { detail: item }))
                    }
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}

            <div className="jf-menu-tile view-all-tile" onClick={() => navigate('/menu')}>
              <h3>View all Menu Items</h3>
              <ArrowRight size={24} />
            </div>
          </div>
        </section>

        {/* 6. Split: Why Jemrald + Reviews */}
        <section id="about" className="jf-split-section">
          <div className="split-left">
            <h2 className="section-title">Why Jemrald?</h2>
            <div className="feature-list">
              {FEATURE_LIST.map((feat, i) => (
                <div key={i} className="feat-item">
                  <div className="feat-number">{i + 1}</div>
                  <div>
                    <h4>{feat.title}</h4>
                    <p>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="reviews" className="split-right">
            <h2 className="section-title">Real Reviews</h2>
            <div className="reviews-stack">
              <div className="review-card">
                <div className="review-stars">★★★★★</div>
                <p>
                  "The best Japanese delivery in the city. The packaging is incredible and the food
                  is always warm."
                </p>
                <span className="review-author">— Sarah K.</span>
              </div>
              <div className="review-card outline">
                <div className="review-stars">★★★★★</div>
                <p>
                  "Their spicy tuna roll is absolute perfection. I order from here at least twice a
                  week."
                </p>
                <span className="review-author">— Mike T.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Vue Component Integration Demo */}
        <section className="jf-section" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Vue Integration</h2>
            <VueWrapper component={SampleVueComponent} props={{ title: 'Interactive Vue Counter', initialCount: 5 }} />
          </div>
        </section>

        {/* 7. CTA + Order Preview */}
        <section className="jf-cta-preview">
          <div className="cta-left">
            <h2 className="massive-title">Ready to order?</h2>
            <p>Experience the best. No registration required.</p>
            <button className="jf-btn-primary massive mt-4" onClick={() => navigate('/menu')}>
              Start Order
            </button>
          </div>
          <div className="cta-right">
            <div className="mock-cart">
              <div className="mock-cart-header">Your Order</div>
              <div className="mock-cart-items">
                <div className="mock-item">
                  <div className="mock-item-info">
                    <span>Salmon Sushi (8pcs)</span>
                    <span className="mock-qty">x1</span>
                  </div>
                  <span className="mock-price">$12.50</span>
                </div>
                <div className="mock-item">
                  <div className="mock-item-info">
                    <span>Miso Soup</span>
                    <span className="mock-qty">x2</span>
                  </div>
                  <span className="mock-price">$6.00</span>
                </div>
              </div>
              <div className="mock-cart-total">
                <span>Total</span>
                <span>$18.50</span>
              </div>
              <button className="mock-checkout" onClick={() => navigate('/menu')}>
                Go to Checkout
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 8. Footer */}
      <footer className="jf-footer">
        <div className="jf-footer-brand">Jemrald</div>
        <div className="jf-footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
        <div className="jf-footer-copy">
          © {new Date().getFullYear()} Jemrald Foodhouse. All rights reserved.
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
