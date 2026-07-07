import { useState, useEffect, useRef } from 'react';
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
  XCircle,
  Search,
  ArrowRight,
  MapPin,
  Navigation,
  Compass,
  Tag,
  Flame,
  Leaf,
  CircleDot,
  User,
  PlusCircle,
  Soup,
  Sparkles,
} from 'lucide-react';
import { deductIngredients, validateCartStock, checkAvailability } from '../lib/inventoryHelpers';

// Leaflet imports and CSS
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Default service area coordinates (Metro Manila)
const DEFAULT_CENTER = [14.5995, 120.9842];

// Custom Leaflet marker icon using the rich brown theme color (#C62839)
const getCustomIcon = () => {
  if (typeof window === 'undefined' || !L) return null;
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.35));">
      <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0ZM15 20.25C12.1005 20.25 9.75 17.8995 9.75 15C9.75 12.1005 12.1005 9.75 15 9.75C17.8995 9.75 20.25 12.1005 20.25 15C20.25 17.8995 17.8995 20.25 15 20.25Z" fill="#C62839"/>
    </svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Programmatic map center updating component
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
}

export default function FBOrderView() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.backgroundColor = '#FAF7F2';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);
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
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Map Pin Geolocation & Geocoding State
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [mapError, setMapError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  // Geolocation wrapper
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setMapError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = [latitude, longitude];
        setCoords(newCoords);
        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setMapError('Location permission denied. Please search or pin your address manually.');
        } else {
          setMapError('Could not retrieve your location. Please pin manually.');
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat, lng) => {
    setMapError('');
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'JemraldFoodhouse/1.0',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch address from geocoding service.');
      }
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setMapError('Address details not found for this point.');
      }
    } catch (err) {
      console.error('Reverse-geocoding error:', err);
      setMapError('Could not resolve pin address. Please type it manually.');
    }
  };

  const geocodeTimeoutRef = useRef(null);

  const forwardGeocode = async (queryAddress) => {
    if (!queryAddress || queryAddress.trim().length < 6) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddress)}&limit=1&countrycodes=ph`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'JemraldFoodhouse/1.0',
          },
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoords([parseFloat(lat), parseFloat(lon)]);
        setMapError('');
      }
    } catch (err) {
      console.error('Forward geocoding error:', err);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=ph`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'JemraldFoodhouse/1.0',
          },
        }
      );
      if (!response.ok) throw new Error('Nominatim error');
      const data = await response.json();
      const formatted = data.map((item) => ({
        display_name: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
      setSuggestions(formatted);
    } catch (err) {
      console.error('Suggestions fetch error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressChange = (val) => {
    setAddress(val);
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    geocodeTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 600); // 600ms typing delay for fast autocomplete
  };

  const handleSuggestionSelect = (sug) => {
    setAddress(sug.display_name);
    setCoords([sug.lat, sug.lon]);
    setSuggestions([]);
    setMapError('');
  };

  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

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

        const rawDesc = d.description || '';
        const cleanDesc = rawDesc.split(' ||image:')[0];
        const customImage = rawDesc.includes(' ||image:') ? rawDesc.split(' ||image:')[1] : null;

        if (baseCat === 'sushi' || baseCat === 'kimbap' || baseCat === 'solo') {
          const pcsMatch = d.name.match(/^(\d+)pcs\s+(.+)$/i);
          if (pcsMatch) {
            const label = pcsMatch[1] + 'pcs';
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
                variants: [],
              };
            } else if (customImage) {
              grouped[groupKey].imageUrl = customImage;
            }
            grouped[groupKey].variants.push({ label, price: parseFloat(d.price) });
            grouped[groupKey].variants.sort((a, b) => parseInt(a.label) - parseInt(b.label));
          } else {
            const parenMatch = d.name.match(/^(.+)\s+\(([^)]+)\)$/i);
            if (parenMatch) {
              const baseName = parenMatch[1].trim();
              const label = parenMatch[2].trim();
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
                  variants: [],
                };
              } else if (customImage) {
                grouped[groupKey].imageUrl = customImage;
              }
              grouped[groupKey].variants.push({ label, price: parseFloat(d.price) });
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
                variants: [],
              };
            }
          }
        } else if (baseCat === 'baked-sushi') {
          const sizeMatch = d.name.match(/^(.+)\s+\((Small|Medium|Large)\)$/i);
          if (sizeMatch) {
            const baseName = sizeMatch[1].trim();
            const label = sizeMatch[2];
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
                variants: [],
              };
            } else if (customImage) {
              grouped[groupKey].imageUrl = customImage;
            }
            grouped[groupKey].variants.push({ label, price: parseFloat(d.price) });
            const sizeOrder = { small: 1, medium: 2, large: 3 };
            grouped[groupKey].variants.sort((a, b) => {
              const aOrder = sizeOrder[a.label.toLowerCase()] || 99;
              const bOrder = sizeOrder[b.label.toLowerCase()] || 99;
              return aOrder - bOrder;
            });
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
              variants: [],
            };
          }
        } else if (isTakoyaki) {
          const baseName = d.name.replace(/\s*\(\d+pcs\)/i, '').trim();
          const label = baseCat.replace('takoyaki-', '');
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
              variants: [],
            };
          } else if (customImage) {
            grouped[groupKey].imageUrl = customImage;
          }
          grouped[groupKey].variants.push({ label, price: parseFloat(d.price) });
          grouped[groupKey].variants.sort((a, b) => a.label.localeCompare(b.label));
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
            variants: [],
          };
        }
      });
      const mapped = Object.values(grouped).map((item) => {
        if (item.variants && item.variants.length > 0) item.price = item.variants[0].price;
        return item;
      }).sort((a, b) => {
        if (a.category === 'promo' && b.category === 'promo') {
          return a.name.localeCompare(b.name);
        }
        return 0;
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
          setPlacedOrder((prev) => ({
            ...payload.new,
            latitude: prev?.latitude,
            longitude: prev?.longitude,
          }));
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
    if (phone.length !== 11) {
      setError('Phone number must be exactly 11 digits (e.g. 09123456789).');
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

      let dbNotes = notes || null;
      if (isScheduled) {
        dbNotes = `[SCHEDULED: ${scheduleDate} at ${scheduleTime}]${notes ? ' — ' + notes : ''}`;
      }
      if (coords) {
        dbNotes = `${dbNotes ? dbNotes + ' ' : ''}[LOC: ${coords[0].toFixed(6)},${coords[1].toFixed(6)}]`;
      }

      const orderPayload = {
        id: orderNum,
        user_name: name,
        phone,
        address,
        notes: dbNotes,
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

      const finalOrder = {
        ...(savedOrder || orderPayload),
        latitude: coords ? coords[0] : null,
        longitude: coords ? coords[1] : null,
      };
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
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          background: '#FAF7F2',
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
          background: '#FAF7F2', // Uniform background color matching the menu page
        }}
      >
        {/* Content Centered Vertically */}
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
            padding: '60px 20px',
            zIndex: 1,
            textAlign: 'center',
          }}
        >
          {/* Brand Torii Gate Logo - Larger & Animated */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
            style={{
              width: '240px',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '36px',
            }}
          >
            <img
              src="/images/logo-torii.png"
              alt="JR Foodhouse Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </motion.div>

          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '2.8rem',
              color: '#2E2A28', // Deep premium charcoal text
              margin: '0 0 20px 0',
              lineHeight: 1.15,
              fontWeight: 800,
            }}
          >
            Authentic Flavors,
            <br />
            Delivered.
          </h1>

          <p
            style={{
              color: '#74695E', // Muted secondary brown/gray
              fontSize: '1.05rem',
              margin: '0 0 44px 0',
              maxWidth: '320px',
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Craving something special?<br />
            Order authentic Japanese favorites<br />
            straight through Messenger.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#A81F31' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('menu')}
            style={{
              background: '#C62839', // Unified Brand Torii Red Accent Button
              border: 'none',
              color: '#fff',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '1.05rem',
              fontWeight: 600,
              padding: '18px 48px',
              borderRadius: '36px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(198, 40, 57, 0.25)',
              transition: 'background-color 0.2s ease',
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
        paddingBottom: cartCount > 0 ? '90px' : '24px',
        minHeight: '100vh',
        background: '#FAF7F2',
        fontFamily: '"Outfit", sans-serif',
      }}
    >
      {/* Premium Minimal Header */}
      <div
        style={{
          background: '#FAF7F2',
          padding: '20px 24px',
          borderBottom: '1px solid rgba(198, 40, 57, 0.06)',
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
              color: '#C62839',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div
          style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '1.25rem',
            color: '#C62839',
            fontWeight: 700,
            letterSpacing: '-0.3px',
          }}
        >
          {view === 'menu' ? 'Jemrald Menu' : 'Checkout'}
        </div>
      </div>

      {view === 'menu' ? (
        <div style={{ padding: '20px', paddingBottom: cartCount > 0 ? '90px' : '20px' }}>
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
              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="fb-menu-search"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#8c7d75',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontFamily: '"Outfit", sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Search Menu
                </label>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#C62839',
                      pointerEvents: 'none',
                    }}
                  />
                  <motion.input
                    id="fb-menu-search"
                    name="search"
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    whileFocus={{ scale: 1.01, boxShadow: '0 0 0 3px rgba(198, 40, 57, 0.08)' }}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 46px',
                      background: '#ffffff',
                      border: '1px solid rgba(198, 40, 57, 0.15)',
                      borderRadius: '16px',
                      color: '#1e140f',
                      fontSize: '0.92rem',
                      outline: 'none',
                      fontFamily: '"Outfit", sans-serif',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#C62839')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(198, 40, 57, 0.15)')}
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(198, 40, 57, 0.08)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          marginTop: '-11px',
                          background: 'rgba(198, 40, 57, 0.05)',
                          border: 'none',
                          color: '#C62839',
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

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '24px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  scrollbarWidth: 'none',
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
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: '1.5px solid rgba(198, 40, 57, 0.12)',
                      background: filter === cat ? 'rgba(198, 40, 57, 0.08)' : '#ffffff',
                      color: filter === cat ? '#C62839' : '#8c7d75',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      fontFamily: '"Outfit", sans-serif',
                      minHeight: '40px',
                      position: 'relative',
                      zIndex: 1,
                      borderColor: filter === cat ? '#C62839' : 'rgba(198, 40, 57, 0.12)',
                      boxShadow: filter === cat ? 'none' : '0 2px 6px rgba(198, 40, 57, 0.02)',
                    }}
                  >
                    {cat === 'all' && <Compass size={15} color="currentColor" />}
                    {cat === 'promo' && <Tag size={15} color="currentColor" />}
                    {cat === 'sushi' && <Sparkles size={15} color="currentColor" />}
                    {cat === 'baked-sushi' && <Flame size={15} color="currentColor" />}
                    {cat === 'kimbap' && <CircleDot size={15} color="currentColor" />}
                    {cat === 'solo' && <User size={15} color="currentColor" />}
                    {cat === 'salad' && <Leaf size={15} color="currentColor" />}
                    {cat === 'takoyaki' && <CircleDot size={15} color="currentColor" />}
                    {cat === 'add-ons' && <PlusCircle size={15} color="currentColor" />}
                    {cat === 'rice' && <Soup size={15} color="currentColor" />}
                    
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
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(198, 40, 57, 0.03), 0 1px 3px rgba(0, 0, 0, 0.01)',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: '#1e140f', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.2px' }}>
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
                  <span style={{ color: '#1e140f', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>{c.name}</span>
                  <span style={{ color: '#8c7d75', fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>₱{(c.price * c.qty).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => changeQty(c.cartKey, -1)}
                    style={{
                      background: 'rgba(198, 40, 57, 0.06)',
                      border: 'none',
                      color: '#C62839',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
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
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '18px', textAlign: 'center', color: '#1e140f', fontFamily: '"Outfit", sans-serif' }}>
                    {c.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQty(c.cartKey, 1)}
                    style={{
                      background: 'rgba(198, 40, 57, 0.06)',
                      border: 'none',
                      color: '#C62839',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
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
                borderTop: '1px solid rgba(198, 40, 57, 0.08)',
                paddingTop: '12px',
                marginTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
              }}
            >
              <span style={{ color: '#1e140f', fontFamily: '"Outfit", sans-serif' }}>Total</span>
              <span style={{ color: '#C62839', fontFamily: '"Outfit", sans-serif' }}>₱{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', color: '#1e140f', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.2px' }}>
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
                border: `1.5px solid ${payment === 'cash' ? '#C62839' : 'rgba(198, 40, 57, 0.12)'}`,
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: payment === 'cash' ? 'rgba(198, 40, 57, 0.05)' : '#ffffff',
                color: payment === 'cash' ? '#C62839' : '#8c7d75',
                fontSize: '0.85rem',
                fontWeight: 600,
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Outfit", sans-serif',
                boxShadow: payment === 'cash' ? 'none' : '0 2px 6px rgba(198, 40, 57, 0.02)',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Banknote size={24} style={{ color: payment === 'cash' ? '#C62839' : '#8c7d75' }} />
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
                border: `1.5px solid ${payment === 'gcash' ? '#C62839' : 'rgba(198, 40, 57, 0.12)'}`,
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: payment === 'gcash' ? 'rgba(198, 40, 57, 0.05)' : '#ffffff',
                color: payment === 'gcash' ? '#C62839' : '#8c7d75',
                fontSize: '0.85rem',
                fontWeight: 600,
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Outfit", sans-serif',
                boxShadow: payment === 'gcash' ? 'none' : '0 2px 6px rgba(198, 40, 57, 0.02)',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Smartphone size={24} style={{ color: payment === 'gcash' ? '#C62839' : '#8c7d75' }} />
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
                  background: '#ffffff',
                  border: '1px solid rgba(198, 40, 57, 0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(198, 40, 57, 0.03)',
                }}
              >
                <div style={{ color: '#8c7d75', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
                  Send payment to
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontFamily: '"Outfit", sans-serif',
                    color: '#C62839',
                    fontWeight: 700,
                  }}
                >
                  0918 749 1194
                </div>
                <div style={{ color: '#8c7d75', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
                  Jemrald F.
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="fb-gcash-ref"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: '#8c7d75',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontFamily: '"Outfit", sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
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
                    padding: '14px 16px',
                    background: '#ffffff',
                    border: `1px solid ${gcashRef && gcashRef.length === 13 ? '#22c55e' : 'rgba(198, 40, 57, 0.15)'}`,
                    color: '#1e140f',
                    borderRadius: '16px',
                    fontSize: '0.92rem',
                    outline: 'none',
                    fontFamily: '"Outfit", sans-serif',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => {
                    if (!(gcashRef && gcashRef.length === 13)) {
                      e.target.style.borderColor = '#C62839';
                    }
                  }}
                  onBlur={(e) => {
                    if (!(gcashRef && gcashRef.length === 13)) {
                      e.target.style.borderColor = 'rgba(198, 40, 57, 0.15)';
                    }
                  }}
                />
                <div
                  style={{
                    fontSize: '0.75rem',
                    marginTop: '4px',
                    color: gcashRef.length === 13 ? '#22c55e' : '#8c7d75',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 500,
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
                    color: '#8c7d75',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontFamily: '"Outfit", sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
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
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: '2px dashed rgba(198, 40, 57, 0.25)',
                      background: '#ffffff',
                      transition: 'border-color 0.2s, background-color 0.2s',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#C62839';
                      e.currentTarget.style.backgroundColor = 'rgba(198, 40, 57, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(198, 40, 57, 0.25)';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <Upload size={24} style={{ color: '#C62839' }} />
                    <span style={{ fontSize: '0.85rem', color: '#C62839', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>
                      Tap to upload receipt
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#8c7d75', fontFamily: '"Outfit", sans-serif' }}>
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
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(198, 40, 57, 0.15)',
                    }}
                  >
                    <img
                      src={receiptPreview}
                      alt="Receipt"
                      style={{
                        width: '100%',
                        objectFit: 'contain',
                        background: '#FAF7F2',
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
                        padding: '10px 14px',
                        background: 'rgba(34, 197, 94, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.78rem',
                        color: '#22c55e',
                        fontWeight: 600,
                        fontFamily: '"Outfit", sans-serif',
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
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', color: '#1e140f', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.2px' }}>
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
                border: `1.5px solid ${!isScheduled ? '#C62839' : 'rgba(198, 40, 57, 0.12)'}`,
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: !isScheduled ? 'rgba(198, 40, 57, 0.05)' : '#ffffff',
                color: !isScheduled ? '#C62839' : '#8c7d75',
                fontSize: '0.85rem',
                fontWeight: 600,
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Outfit", sans-serif',
                boxShadow: !isScheduled ? 'none' : '0 2px 6px rgba(198, 40, 57, 0.02)',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <Clock size={24} style={{ color: !isScheduled ? '#C62839' : '#8c7d75' }} />
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
                border: `1.5px solid ${isScheduled ? '#C62839' : 'rgba(198, 40, 57, 0.12)'}`,
                borderRadius: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all .2s',
                background: isScheduled ? 'rgba(198, 40, 57, 0.05)' : '#ffffff',
                color: isScheduled ? '#C62839' : '#8c7d75',
                fontSize: '0.85rem',
                fontWeight: 600,
                minHeight: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Outfit", sans-serif',
                boxShadow: isScheduled ? 'none' : '0 2px 6px rgba(198, 40, 57, 0.02)',
              }}
            >
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                <CalendarClock size={24} style={{ color: isScheduled ? '#C62839' : '#8c7d75' }} />
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
                      color: '#8c7d75',
                      fontWeight: 600,
                      marginBottom: '8px',
                      fontFamily: '"Outfit", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      padding: '14px 16px',
                      background: '#ffffff',
                      border: '1px solid rgba(198, 40, 57, 0.15)',
                      color: '#1e140f',
                      borderRadius: '16px',
                      fontSize: '0.92rem',
                      fontFamily: '"Outfit", sans-serif',
                      outline: 'none',
                    }}
                  />
                </div>
                <div className="form-group">
                  <label
                    htmlFor="fb-schedule-time"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: '#8c7d75',
                      fontWeight: 600,
                      marginBottom: '8px',
                      fontFamily: '"Outfit", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
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
                      padding: '14px 16px',
                      background: '#ffffff',
                      border: '1px solid rgba(198, 40, 57, 0.15)',
                      color: '#1e140f',
                      borderRadius: '16px',
                      fontSize: '0.92rem',
                      fontFamily: '"Outfit", sans-serif',
                      outline: 'none',
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
                    padding: '14px',
                    borderRadius: '16px',
                    background: 'rgba(198, 40, 57, 0.05)',
                    border: '1px solid rgba(198, 40, 57, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    color: '#C62839',
                    fontWeight: 600,
                    fontFamily: '"Outfit", sans-serif',
                  }}
                >
                  <CalendarClock size={16} style={{ color: '#C62839', flexShrink: 0 }} />
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

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', color: '#1e140f', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.2px' }}>
            Delivery Details
          </h3>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              htmlFor="fb-name"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#8c7d75',
                fontWeight: 600,
                marginBottom: '8px',
                fontFamily: '"Outfit", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
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
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(198, 40, 57, 0.15)',
                color: '#1e140f',
                borderRadius: '16px',
                fontSize: '0.92rem',
                outline: 'none',
                fontFamily: '"Outfit", sans-serif',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C62839')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(198, 40, 57, 0.15)')}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              htmlFor="fb-phone"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#8c7d75',
                fontWeight: 600,
                marginBottom: '8px',
                fontFamily: '"Outfit", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Phone Number *
            </label>
            <input
              id="fb-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="09123456789"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(198, 40, 57, 0.15)',
                color: '#1e140f',
                borderRadius: '16px',
                fontSize: '0.92rem',
                outline: 'none',
                fontFamily: '"Outfit", sans-serif',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C62839')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(198, 40, 57, 0.15)')}
            />
          </div>

          {/* Map Pin Picker */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#8c7d75',
                fontWeight: 600,
                marginBottom: '8px',
                fontFamily: '"Outfit", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Pin Your Delivery Location
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #C62839',
                  color: '#C62839',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: '"Outfit", sans-serif',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(198, 40, 57, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <Navigation
                  size={13}
                  style={{ transform: 'rotate(45deg)' }}
                />
                {isLocating ? 'Locating...' : 'Use my location'}
              </button>
              {coords && (
                <span style={{ fontSize: '0.78rem', color: '#8c7d75', fontWeight: 500, fontFamily: '"Outfit", sans-serif' }}>
                  Selected: {coords[0].toFixed(4)}, {coords[1].toFixed(4)}
                </span>
              )}
            </div>

            {/* Leaflet Map Wrapper */}
            <div
              style={{
                height: '260px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(198, 40, 57, 0.03)',
                background: '#ffffff',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <MapContainer
                center={coords}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {coords && (
                  <Marker
                    position={coords}
                    draggable={true}
                    icon={getCustomIcon()}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        if (marker != null) {
                          const newPos = marker.getLatLng();
                          setCoords([newPos.lat, newPos.lng]);
                          reverseGeocode(newPos.lat, newPos.lng);
                        }
                      },
                    }}
                  />
                )}
                <MapClickHandler onMapClick={(newCoords) => {
                  setCoords(newCoords);
                  reverseGeocode(newCoords[0], newCoords[1]);
                }} />
                <ChangeView center={coords} />
              </MapContainer>
            </div>

            {/* Inline Graceful Error/Warning Message */}
            {mapError && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.78rem',
                  color: '#b8353e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 500,
                }}
              >
                <span style={{ fontWeight: 600 }}>⚠️</span> {mapError}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '16px', position: 'relative' }}>
            <label
              htmlFor="fb-address"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#8c7d75',
                fontWeight: 600,
                marginBottom: '8px',
                fontFamily: '"Outfit", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Delivery Address *
            </label>
            <textarea
              id="fb-address"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="House #, Street, Barangay"
              rows="3"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(198, 40, 57, 0.15)',
                color: '#1e140f',
                borderRadius: '16px',
                resize: 'none',
                fontSize: '0.92rem',
                outline: 'none',
                fontFamily: '"Outfit", sans-serif',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C62839')}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(198, 40, 57, 0.15)';
                setTimeout(() => {
                  setSuggestions([]);
                }, 250);
              }}
            ></textarea>

            {/* Google-style Autocomplete Dropdown List */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid rgba(198, 40, 57, 0.15)',
                    borderRadius: '16px',
                    marginTop: '6px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                    zIndex: 1000,
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}
                >
                  {suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSuggestionSelect(sug)}
                      style={{
                        padding: '12px 16px',
                        fontSize: '0.88rem',
                        color: '#2E2A28',
                        cursor: 'pointer',
                        borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid rgba(46, 42, 40, 0.05)',
                        fontFamily: '"Outfit", sans-serif',
                        textAlign: 'left',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = '#FAF7F2')}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = '#ffffff')}
                    >
                      <div style={{ fontWeight: 600, color: '#1e140f' }}>{sug.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8c7d75', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {sug.display_name}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label
              htmlFor="fb-notes"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#8c7d75',
                fontWeight: 600,
                marginBottom: '8px',
                fontFamily: '"Outfit", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
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
                padding: '14px 16px',
                background: '#ffffff',
                border: '1px solid rgba(198, 40, 57, 0.15)',
                color: '#1e140f',
                borderRadius: '16px',
                resize: 'none',
                fontSize: '0.92rem',
                outline: 'none',
                fontFamily: '"Outfit", sans-serif',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C62839')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(198, 40, 57, 0.15)')}
            ></textarea>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              fontSize: '0.98rem',
              fontWeight: 700,
              border: 'none',
              background: '#C62839',
              color: '#ffffff',
              cursor: 'pointer',
              fontFamily: '"Outfit", sans-serif',
              transition: 'background-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(198, 40, 57, 0.25)',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#8c3a1d')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#C62839')}
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
              left: 'auto',
              right: 'auto',
              width: '100%',
              maxWidth: '480px',
              background: '#ffffff',
              borderTop: '1px solid rgba(198, 40, 57, 0.08)',
              padding: '16px 20px 24px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 100,
              boxShadow: '0 -8px 30px rgba(198, 40, 57, 0.04), 0 -2px 6px rgba(0, 0, 0, 0.01)',
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
                  background: 'rgba(198, 40, 57, 0.08)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <ShoppingBag size={20} color="#C62839" />
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    background: '#C62839',
                    color: '#ffffff',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Outfit", sans-serif',
                  }}
                >
                  {cartCount}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#8c7d75', fontFamily: '"Outfit", sans-serif', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  Total <span style={{ color: '#C62839', fontSize: '0.75rem', fontWeight: 600 }}>(View Cart)</span>
                </div>
                <div
                  style={{
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '1.2rem',
                    color: '#C62839',
                    fontWeight: 700,
                  }}
                >
                  ₱{cartTotal.toFixed(2)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setView('checkout')}
              style={{
                padding: '12px 28px',
                borderRadius: '16px',
                border: 'none',
                background: '#C62839',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                fontFamily: '"Outfit", sans-serif',
                cursor: 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
                boxShadow: '0 4px 12px rgba(198, 40, 57, 0.2)',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#8c3a1d')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#C62839')}
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
                background: 'rgba(0, 0, 0, 0.4)',
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
                background: '#FAF7F2',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                borderTop: '1px solid rgba(198, 40, 57, 0.08)',
                zIndex: 901,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -10px 40px rgba(198, 40, 57, 0.06)',
                color: '#1e140f',
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {/* Handle bar for dragging visual */}
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  background: '#e2e8f0',
                  borderRadius: '2px',
                  margin: '12px auto 8px auto',
                }}
              />
              
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 20px 16px 20px',
                  borderBottom: '1px solid rgba(198, 40, 57, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={20} style={{ color: '#C62839' }} />
                  <span style={{ fontWeight: 700, fontSize: '1.15rem', fontFamily: '"Outfit", sans-serif', letterSpacing: '-0.3px' }}>Your Cart</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(198, 40, 57, 0.08)', color: '#C62839', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  style={{
                    background: 'rgba(198, 40, 57, 0.05)',
                    border: 'none',
                    color: '#C62839',
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
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8c7d75' }}>
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
                        borderBottom: '1px solid rgba(198, 40, 57, 0.06)',
                        paddingBottom: '12px',
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '12px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e140f' }}>{c.name}</span>
                        <span style={{ color: '#8c7d75', fontSize: '0.82rem', fontWeight: 500 }}>₱{(c.price * c.qty).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => changeQty(c.cartKey, -1)}
                          style={{
                            background: 'rgba(198, 40, 57, 0.06)',
                            border: 'none',
                            color: '#C62839',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: 0,
                            transition: 'background-color 0.2s',
                          }}
                        >
                          &#8722;
                        </button>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, minWidth: '20px', textAlign: 'center', color: '#1e140f' }}>
                          {c.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(c.cartKey, 1)}
                          style={{
                            background: 'rgba(198, 40, 57, 0.06)',
                            border: 'none',
                            color: '#C62839',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: 0,
                            transition: 'background-color 0.2s',
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
                  padding: '20px 20px 28px 20px',
                  borderTop: '1px solid rgba(198, 40, 57, 0.08)',
                  background: '#ffffff',
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
                  <span style={{ fontSize: '0.95rem', color: '#8c7d75', fontWeight: 500 }}>Subtotal</span>
                  <span
                    style={{
                      fontFamily: '"Outfit", sans-serif',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#C62839',
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
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    border: 'none',
                    background: cart.length === 0 ? '#e2e8f0' : '#C62839',
                    color: cart.length === 0 ? '#94a3b8' : '#ffffff',
                    cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: '"Outfit", sans-serif',
                    transition: 'background-color 0.2s, box-shadow 0.2s',
                    boxShadow: cart.length === 0 ? 'none' : '0 4px 12px rgba(198, 40, 57, 0.2)',
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
