import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import FBMenuCard from '../components/FBMenuCard';
import {
  ShoppingBag,
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  ChefHat,
  Bike,
  CircleCheck,
  Banknote,
  Smartphone,
  CalendarClock,
  Clock,
  Upload,
  ImageIcon,
  X,
  Search,
  ArrowRight,
} from 'lucide-react';
import {
  AllIconSmall,
  SushiIconSmall,
  RiceIconSmall,
  SaladIconSmall,
  TakoyakiIconSmall,
  AddOnsIconSmall,
} from '../components/JapaneseIcons';
import { deductIngredients, validateCartStock, checkAvailability } from '../lib/inventoryHelpers';

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

export default function FBOrderView() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cart, cartTotal, cartCount, changeQty, clearCart } = useCart();

  const [view, setView] = useState('landing'); // 'landing', 'menu', 'checkout', 'success'
  const [placedOrder, setPlacedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availability, setAvailability] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState(null);
  const [gcashRef, setGcashRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Schedule for Later
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Time slots from 8AM to 8PM
  const timeSlots = [
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
  ];

  useEffect(() => {
    async function init() {
      // Load menu data
      const { data: menuData } = await supabase.from('menu_items').select('*').order('id');
      if (menuData) {
        processMenuData(menuData);
        // Check ingredient availability
        const ids = menuData.map((d) => d.id);
        const avail = await checkAvailability(ids);
        setAvailability(avail);
      }

      // Check for active guest order in local storage
      const activeOrderId = localStorage.getItem('fb_active_order');
      if (activeOrderId) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', activeOrderId)
          .maybeSingle();
        if (orderData) {
          setPlacedOrder(orderData);
          setView('success');
        } else {
          localStorage.removeItem('fb_active_order');
        }
      }
      setLoading(false);
    }

    function processMenuData(data) {
      const grouped = {};
      data.forEach((d) => {
        let baseCat = d.category;
        let isTakoyaki = baseCat.startsWith('takoyaki-');
        if (baseCat === 'sushi' || baseCat === 'kimbap' || baseCat === 'solo') {
          const pcsMatch = d.name.match(/^(\d+)pcs\s+(.+)$/i);
          if (pcsMatch) {
            const label = pcsMatch[1] + 'pcs';
            const baseName = pcsMatch[2].trim();
            if (!grouped[baseName])
              grouped[baseName] = {
                id: d.id,
                name: baseName,
                emoji: d.emoji,
                desc: d.description || '',
                category: baseCat,
                stock: d.stock,
                variants: [],
              };
            grouped[baseName].variants.push({ label, price: parseFloat(d.price) });
            grouped[baseName].variants.sort((a, b) => parseInt(a.label) - parseInt(b.label));
          } else {
            const parenMatch = d.name.match(/^(.+)\s+\(([^)]+)\)$/i);
            if (parenMatch) {
              const baseName = parenMatch[1].trim();
              const label = parenMatch[2].trim();
              if (!grouped[baseName]) {
                grouped[baseName] = {
                  id: d.id,
                  name: baseName,
                  emoji: d.emoji,
                  desc: d.description || '',
                  category: baseCat,
                  stock: d.stock,
                  variants: [],
                };
              }
              grouped[baseName].variants.push({ label, price: parseFloat(d.price) });
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
          }
        } else if (baseCat === 'baked-sushi') {
          const sizeMatch = d.name.match(/^(.+)\s+\((Small|Medium|Large)\)$/i);
          if (sizeMatch) {
            const baseName = sizeMatch[1].trim();
            const label = sizeMatch[2];
            if (!grouped[baseName])
              grouped[baseName] = {
                id: d.id,
                name: baseName,
                emoji: d.emoji,
                desc: d.description || '',
                category: 'baked-sushi',
                stock: d.stock,
                variants: [],
              };
            grouped[baseName].variants.push({ label, price: parseFloat(d.price) });
            const sizeOrder = { small: 1, medium: 2, large: 3 };
            grouped[baseName].variants.sort((a, b) => {
              const aOrder = sizeOrder[a.label.toLowerCase()] || 99;
              const bOrder = sizeOrder[b.label.toLowerCase()] || 99;
              return aOrder - bOrder;
            });
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
        } else if (isTakoyaki) {
          const baseName = d.name.replace(/\s*\(\d+pcs\)/i, '').trim();
          const label = baseCat.replace('takoyaki-', '');
          if (!grouped[baseName])
            grouped[baseName] = {
              id: d.id,
              name: baseName,
              emoji: d.emoji,
              desc: d.description || '',
              category: 'takoyaki',
              stock: d.stock,
              variants: [],
            };
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
        if (item.variants && item.variants.length > 0) item.price = item.variants[0].price;
        return item;
      });
      setMenuItems(mapped);
    }

    init();
  }, []);

  // Auto-redirect to menu if cart becomes empty during checkout
  useEffect(() => {
    if (view === 'checkout' && cart.length === 0) {
      setView('menu');
    }
    if (cart.length === 0 && isCartOpen) {
      setIsCartOpen(false);
    }
  }, [cart.length, view, isCartOpen]);

  // Real-time tracking subscription
  useEffect(() => {
    if (!placedOrder || view !== 'success') return;

    const channel = supabase
      .channel(`fb-order-${placedOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${placedOrder.id}`,
        },
        (payload) => {
          setPlacedOrder(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [placedOrder?.id, view]);

  const filteredItems = menuItems.filter((i) => {
    const matchesCategory = filter === 'all' || i.category === filter;
    const matchesSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePlaceOrder = async () => {
    if (!name || !phone || !address) {
      setError('Please provide your name, phone, and delivery address.');
      return;
    }
    if (!payment) {
      setError('Please select a payment method.');
      return;
    }
    if (payment === 'gcash' && !gcashRef) {
      setError('Please enter GCash reference number.');
      return;
    }
    if (payment === 'gcash' && gcashRef && !/^\d{13}$/.test(gcashRef.replace(/\s/g, ''))) {
      setError('GCash reference number must be exactly 13 digits.');
      return;
    }
    if (payment === 'gcash' && !receiptFile) {
      setError('Please upload your GCash receipt screenshot for verification.');
      return;
    }
    if (isScheduled && (!scheduleDate || !scheduleTime)) {
      setError('Please select a date and time for your scheduled order.');
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

      const orderNum = `FB-${Date.now().toString().slice(-4)}`;

      // Upload GCash receipt if provided
      let receiptUrl = null;
      if (payment === 'gcash' && receiptFile) {
        setUploadingReceipt(true);
        const fileExt = receiptFile.name.split('.').pop();
        const filePath = `gcash/${orderNum}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile, { upsert: true });
        if (uploadErr) throw new Error('Failed to upload receipt: ' + uploadErr.message);
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(filePath);
        receiptUrl = urlData.publicUrl;
        setUploadingReceipt(false);
      }

      const orderPayload = {
        id: orderNum,
        user_name: name,
        phone,
        address,
        notes: isScheduled
          ? `[SCHEDULED: ${scheduleDate} at ${scheduleTime}]${notes ? ' — ' + notes : ''}`
          : notes || null,
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
        scheduled_date: isScheduled ? scheduleDate : null,
        scheduled_time: isScheduled ? scheduleTime : null,
      };

      const { data: savedOrder, error: dbErr } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();
      if (dbErr) throw dbErr;

      // Direct Failsafe Trigger for Discord Notification
      try {
        const finalPayload = savedOrder || orderPayload;
        await supabase.functions.invoke('send-sms', {
          body: { record: finalPayload }
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

      const finalOrder = savedOrder || orderPayload;
      setPlacedOrder(finalOrder);
      localStorage.setItem('fb_active_order', finalOrder.id);

      // Notify admins
      const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const scheduledLabel = isScheduled
          ? ` — 📅 Scheduled for ${scheduleDate} at ${scheduleTime}`
          : '';
        const adminNotifs = admins.map((a) => ({
          target_email: a.email,
          title: isScheduled ? '📅 Scheduled Facebook Order!' : 'New Facebook Order!',
          message: `${name} placed Quick Order ${orderNum} (₱${cartTotal.toFixed(2)}) via fb-link.${scheduledLabel}`,
          icon: 'order',
          is_read: false,
        }));
        await supabase.from('notifications').insert(adminNotifs);
      }

      clearCart();
      setView('success');
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'success' && placedOrder) {
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
            <p
              style={{ color: 'var(--red-bright)', fontWeight: 600, fontSize: '1.1rem', margin: 0 }}
            >
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

  if (view === 'landing') {
    return (
      <div
        className="fb-order-container"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        {/* Animated Background Rings */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            style={{
              position: 'absolute',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              border: '1px solid rgba(211, 18, 27, 0.15)',
            }}
            animate={{ scale: [1, 1.05, 1], rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            style={{
              position: 'absolute',
              width: '480px',
              height: '480px',
              borderRadius: '50%',
              border: '1px solid rgba(211, 18, 27, 0.08)',
            }}
            animate={{ scale: [1.05, 1, 1.05], rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px',
            zIndex: 1,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'var(--red)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 10px 25px rgba(211, 18, 27, 0.4)',
            }}
          >
            <span
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '2.5rem',
                color: '#fff',
                fontWeight: 800,
              }}
            >
              J
            </span>
          </div>

          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '2.2rem',
              color: 'var(--cream)',
              margin: '0 0 16px 0',
              lineHeight: 1.2,
            }}
          >
            Authentic Flavors,
            <br />
            Delivered.
          </h1>

          <p
            style={{
              color: 'var(--muted)',
              fontSize: '1rem',
              margin: '0 0 40px 0',
              maxWidth: '300px',
              lineHeight: 1.5,
            }}
          >
            Craving something special? Order from Jemrald Foodhouse straight through Messenger.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('menu')}
            style={{
              background: 'var(--red)',
              border: 'none',
              color: '#fff',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '16px 40px',
              borderRadius: '30px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(211, 18, 27, 0.3)',
            }}
          >
            Order Now <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="fb-order-container"
      style={{
        paddingBottom: cartCount > 0 ? '80px' : '20px',
        minHeight: '100vh',
        background: view === 'menu' ? '#f9f9f9' : 'var(--bg)',
      }}
    >
      {/* Minimal Header */}
      <div
        style={{
          background: view === 'menu' ? '#ffffff' : 'var(--nav-bg)',
          padding: '16px 20px',
          borderBottom: view === 'menu' ? '1px solid #e2e8f0' : '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {view === 'checkout' && (
          <button
            onClick={() => setView('menu')}
            aria-label="Go back to menu"
            style={{
              position: 'absolute',
              left: '16px',
              color: 'var(--cream)',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.2rem',
            color: view === 'menu' ? '#0f172a' : 'var(--red-bright)',
            fontWeight: 700,
          }}
        >
          {view === 'menu' ? 'Jemrald Menu' : 'Checkout'}
        </div>
      </div>

      {view === 'menu' ? (
        <div style={{ padding: '20px' }}>
          {loading ? (
            <div
              style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '40px' }}
              aria-live="polite"
            >
              Loading menu...
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: view === 'menu' ? '#94a3b8' : 'var(--muted)',
                    pointerEvents: 'none',
                  }}
                />
                <motion.input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  whileFocus={{ scale: 1.01, boxShadow: view === 'menu' ? '0 0 0 2px rgba(0, 138, 75, 0.15)' : '0 0 0 2px rgba(211, 18, 27, 0.2)' }}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: view === 'menu' ? '#ffffff' : 'var(--surface2)',
                    border: view === 'menu' ? '1px solid #e2e8f0' : '1px solid var(--border)',
                    borderRadius: '12px',
                    color: view === 'menu' ? '#0f172a' : 'var(--cream)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: '"DM Sans", sans-serif',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = view === 'menu' ? '#008a4b' : 'var(--red-bright)')}
                  onBlur={(e) => (e.target.style.borderColor = view === 'menu' ? '#e2e8f0' : 'var(--border)')}
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
                        marginTop: '-11px',
                        background: view === 'menu' ? '#e2e8f0' : 'var(--surface)',
                        border: 'none',
                        color: view === 'menu' ? '#64748b' : 'var(--muted)',
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

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '20px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                }}
              >
                {[
                  'all',
                  'promo',
                  'sushi',
                  'baked-sushi',
                  'kimbap',
                  'solo',
                  'salad',
                  'takoyaki',
                  'add-ons',
                  'rice',
                ].map((cat) => (
                  <motion.button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    aria-pressed={filter === cat}
                    aria-label={`Filter by ${cat}`}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '12px 16px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      background: view === 'menu' ? '#ffffff' : 'var(--surface2)',
                      color: view === 'menu'
                        ? (filter === cat ? '#008a4b' : '#64748b')
                        : (filter === cat ? 'var(--cream)' : 'var(--muted)'),
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      transition: 'color 0.2s, border-color 0.2s',
                      fontFamily: '"DM Sans", sans-serif',
                      minHeight: '44px',
                      position: 'relative',
                      zIndex: 1,
                      borderColor: view === 'menu'
                        ? (filter === cat ? '#008a4b' : '#e2e8f0')
                        : (filter === cat ? 'var(--red-bright)' : 'var(--border)'),
                    }}
                  >
                    {filter === cat && (
                      <motion.div
                        layoutId="activeFilterFB"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '999px',
                          background: view === 'menu' ? 'rgba(0, 138, 75, 0.12)' : 'rgba(154, 174, 71, 0.2)',
                          zIndex: -1,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    {cat === 'all' && <AllIconSmall size={16} color="currentColor" />}
                    {cat === 'promo' && <span style={{ fontSize: '14px' }}>🏷️</span>}
                    {cat === 'sushi' && <SushiIconSmall size={16} color="currentColor" />}
                    {cat === 'baked-sushi' && <SushiIconSmall size={16} color="currentColor" />}
                    {cat === 'kimbap' && <SushiIconSmall size={16} color="currentColor" />}
                    {cat === 'solo' && <SushiIconSmall size={16} color="currentColor" />}
                    {cat === 'salad' && <SaladIconSmall size={16} color="currentColor" />}
                    {cat === 'takoyaki' && <TakoyakiIconSmall size={16} color="currentColor" />}
                    {cat === 'add-ons' && <AddOnsIconSmall size={16} />}
                    {cat === 'rice' && <RiceIconSmall size={16} color="currentColor" />}
                    {cat === 'add-ons'
                      ? 'Add-ons'
                      : cat === 'promo'
                        ? '350 Promo'
                        : cat === 'baked-sushi'
                          ? 'Baked Sushi'
                          : cat === 'kimbap'
                            ? 'Kimbap'
                            : cat === 'solo'
                              ? 'Solo'
                              : cat === 'sushi'
                                ? 'Sushi Platter'
                                : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </motion.button>
                ))}
              </div>
              <div className="fb-menu-grid">
                {filteredItems.map((item) => (
                  <FBMenuCard
                    key={item.id}
                    item={item}
                    available={
                      availability[item.id] !== undefined ? availability[item.id] > 0 : true
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Checkout View */
        <div style={{ padding: '24px 20px' }}>
          {error && (
            <div className="auth-error show" role="alert" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div
            style={{
              background: 'var(--surface2)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border)',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--cream)' }}>
              Order Summary
            </h3>
            {cart.map((c) => (
              <div
                key={c.cartKey}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '12px' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>₱{(c.price * c.qty).toFixed(2)}</span>
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
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '18px', textAlign: 'center', color: 'var(--cream)' }}>
                    {c.qty}
                  </span>
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
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '12px',
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
              }}
            >
              <span style={{ color: 'var(--cream)' }}>Total</span>
              <span style={{ color: 'var(--red-bright)' }}>₱{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--cream)' }}>
            Payment Method
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-pressed={payment === 'cash'}
              onClick={() => setPayment('cash')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPayment('cash');
                }
              }}
              style={{
                padding: '16px',
                border: `1px solid ${payment === 'cash' ? 'var(--red-bright)' : 'var(--border)'}`,
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: payment === 'cash' ? 'rgba(154, 174, 71, 0.08)' : 'var(--surface2)',
                color: 'var(--cream)',
                fontSize: '0.85rem',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Banknote size={28} style={{ color: 'var(--red-bright)' }} />
              </div>
              Cash on Delivery
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-pressed={payment === 'gcash'}
              onClick={() => setPayment('gcash')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPayment('gcash');
                }
              }}
              style={{
                padding: '16px',
                border: `1px solid ${payment === 'gcash' ? 'var(--red-bright)' : 'var(--border)'}`,
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: payment === 'gcash' ? 'rgba(154, 174, 71, 0.08)' : 'var(--surface2)',
                color: 'var(--cream)',
                fontSize: '0.85rem',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Smartphone size={28} style={{ color: 'var(--red-bright)' }} />
              </div>
              GCash
            </div>
          </div>

          {payment === 'gcash' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginBottom: '24px' }}
            >
              <div
                style={{
                  background: 'rgba(154, 174, 71, 0.1)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
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
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Jemrald F.
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="fb-gcash-ref"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--muted)',
                    marginBottom: '6px',
                  }}
                >
                  GCash Reference No. *
                </label>
                <input
                  id="fb-gcash-ref"
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
                    width: '100%',
                    padding: '12px',
                    background: 'var(--surface)',
                    border: `1px solid ${gcashRef && gcashRef.length === 13 ? '#22c55e' : 'var(--border)'}`,
                    color: '#000',
                    borderRadius: '8px',
                    transition: 'border-color 0.2s',
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
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--muted)',
                    marginBottom: '6px',
                  }}
                >
                  Upload Receipt Screenshot *
                </label>
                {!receiptPreview ? (
                  <label
                    htmlFor="fb-receipt-upload"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '2px dashed var(--border)',
                      background: 'var(--surface)',
                      transition: 'border-color 0.2s',
                      gap: '8px',
                    }}
                  >
                    <Upload size={24} style={{ color: 'var(--muted)' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Tap to upload receipt
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', opacity: 0.6 }}>
                      JPG, PNG (max 5MB)
                    </span>
                    <input
                      id="fb-receipt-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          setError('Receipt image must be under 5MB');
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
                        objectFit: 'contain',
                        background: '#f5f5f5',
                        display: 'block',
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
                        top: '8px',
                        right: '8px',
                        width: '28px',
                        height: '28px',
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
                      <X size={14} />
                    </button>
                    <div
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        color: '#22c55e',
                      }}
                    >
                      <ImageIcon size={14} /> Receipt uploaded ✓
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Schedule for Later */}
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--cream)' }}>
            When do you want it?
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-pressed={!isScheduled}
              onClick={() => setIsScheduled(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsScheduled(false);
                }
              }}
              style={{
                padding: '16px',
                border: `1px solid ${!isScheduled ? 'var(--red-bright)' : 'var(--border)'}`,
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: !isScheduled ? 'rgba(154, 174, 71, 0.08)' : 'var(--surface2)',
                color: 'var(--cream)',
                fontSize: '0.85rem',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Clock size={28} style={{ color: 'var(--red-bright)' }} />
              </div>
              Order Now
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-pressed={isScheduled}
              onClick={() => setIsScheduled(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsScheduled(true);
                }
              }}
              style={{
                padding: '16px',
                border: `1px solid ${isScheduled ? 'var(--red-bright)' : 'var(--border)'}`,
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: isScheduled ? 'rgba(154, 174, 71, 0.08)' : 'var(--surface2)',
                color: 'var(--cream)',
                fontSize: '0.85rem',
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <CalendarClock size={28} style={{ color: 'var(--red-bright)' }} />
              </div>
              Schedule for Later
            </div>
          </div>

          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginBottom: '24px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label
                    htmlFor="fb-schedule-date"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Date *
                  </label>
                  <input
                    id="fb-schedule-date"
                    type="date"
                    value={scheduleDate}
                    min={getMinDate()}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: '#000',
                      borderRadius: '8px',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label
                    htmlFor="fb-schedule-time"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Time *
                  </label>
                  <select
                    id="fb-schedule-time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: '#000',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select time...</option>
                    {timeSlots.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {scheduleDate && scheduleTime && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(154, 174, 71, 0.1)',
                    border: '1px solid rgba(154, 174, 71, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    color: 'var(--cream)',
                  }}
                >
                  <CalendarClock size={16} style={{ color: 'var(--red-bright)', flexShrink: 0 }} />
                  Your order will be prepared for{' '}
                  <strong>
                    {new Date(scheduleDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </strong>
                  &nbsp;at&nbsp;<strong>{scheduleTime}</strong>
                </div>
              )}
            </motion.div>
          )}

          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--cream)' }}>
            Delivery Details
          </h3>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              htmlFor="fb-name"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--muted)',
                marginBottom: '6px',
              }}
            >
              Full Name *
            </label>
            <input
              id="fb-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dela Cruz"
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: '#000',
                borderRadius: '8px',
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              htmlFor="fb-phone"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--muted)',
                marginBottom: '6px',
              }}
            >
              Phone Number *
            </label>
            <input
              id="fb-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XX XXX XXXX"
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: '#000',
                borderRadius: '8px',
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              htmlFor="fb-address"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--muted)',
                marginBottom: '6px',
              }}
            >
              Delivery Address *
            </label>
            <textarea
              id="fb-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House #, Street, Barangay"
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: '#000',
                borderRadius: '8px',
                resize: 'none',
              }}
            ></textarea>
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label
              htmlFor="fb-notes"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--muted)',
                marginBottom: '6px',
              }}
            >
              Notes (Optional)
            </label>
            <textarea
              id="fb-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Landmarks or special instructions..."
              rows="2"
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: '#000',
                borderRadius: '8px',
                resize: 'none',
              }}
            ></textarea>
          </div>

          <button
            className="hero-btn main"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isSubmitting ? 'Placing Order...' : `Place Order (₱${cartTotal.toFixed(2)})`}
          </button>
        </div>
      )}

      {/* Floating Checkout Bar for Menu View */}
      <AnimatePresence>
        {view === 'menu' && cartCount > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--surface2)',
              borderTop: '1px solid var(--border)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 100,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <div
              onClick={() => setIsCartOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCartOpen(true);
                }
              }}
            >
              <div
                style={{
                  position: 'relative',
                  background: 'var(--red)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag size={20} color="#fff" />
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#fff',
                    color: 'var(--red)',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Total <span style={{ color: 'var(--red-bright)', fontSize: '0.75rem', textDecoration: 'underline' }}>(View Cart)</span>
                </div>
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.1rem',
                    color: 'var(--cream)',
                    fontWeight: 700,
                  }}
                >
                  ₱{cartTotal.toFixed(2)}
                </div>
              </div>
            </div>
            <button
              className="hero-btn main"
              onClick={() => setView('checkout')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Checkout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FB Bottom Sheet Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                zIndex: 900,
              }}
            />
            {/* Cart Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '80vh',
                background: 'var(--card-bg)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                borderTop: '1px solid var(--border)',
                zIndex: 901,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
                color: 'var(--cream)',
              }}
            >
              {/* Handle bar for dragging visual */}
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  background: 'var(--border)',
                  borderRadius: '2px',
                  margin: '12px auto 8px auto',
                  opacity: 0.7,
                }}
              />
              
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 20px 16px 20px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} style={{ color: 'var(--red-bright)' }} />
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: '"Playfair Display", serif' }}>Your Cart</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(211, 18, 27, 0.15)', color: 'var(--red-bright)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--cream)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Items List */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                    <ShoppingBag size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cart.map((c) => (
                    <div
                      key={c.cartKey}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingBottom: '12px',
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '12px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.name}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>₱{(c.price * c.qty).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => changeQty(c.cartKey, -1)}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--cream)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: 0,
                          }}
                        >
                          &#8722;
                        </button>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                          {c.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(c.cartKey, 1)}
                          style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--cream)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: 0,
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '20px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--card-bg)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>Subtotal</span>
                  <span
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--red-bright)',
                    }}
                  >
                    ₱{cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setView('checkout');
                  }}
                  disabled={cart.length === 0}
                  className="hero-btn main"
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
