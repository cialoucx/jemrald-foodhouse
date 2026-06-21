import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Package,
  ClipboardList,
  Users,
  Bell,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Box,
  Search,
  Filter,
  LayoutDashboard,
  PhilippinePeso,
  TrendingUp,
  BarChart3,
  Star,
  Flame,
  Truck,
  PartyPopper,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from '../components/NotificationPanel';
import { getCategoryIconSmall } from '../components/JapaneseIcons';
import MenuModal from '../components/MenuModal';
import IngredientModal from '../components/IngredientModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { restoreIngredients } from '../lib/inventoryHelpers';

export default function AdminView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { notifications, unreadCount, markAsRead, clearNotifications } = useNotifications();

  // Handle tab switching via URL query params (e.g., /admin?tab=orders)
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = queryParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Menu Management State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Inventory Management State
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);

  // Order Details State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Filtering State
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategory, setMenuCategory] = useState('all');
  const [menuStockStatus, setMenuStockStatus] = useState('all');

  const [invSearch, setInvSearch] = useState('');
  const [invStockStatus, setInvStockStatus] = useState('all');

  const toggleNotifs = () => {
    if (!showNotifs) markAsRead();
    setShowNotifs(!showNotifs);
  };

  // Data State
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    async function loadData() {
      // Load Orders
      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ords) setOrders(ords);

      // Load Inventory
      const { data: inv } = await supabase.from('menu_items').select('*').order('id');
      if (inv) setInventory(inv);

      // Load Inventory Items (Ingredients)
      const { data: invItems } = await supabase.from('inventory_items').select('*').order('name');
      if (invItems) setInventoryItems(invItems);

      // Load Users
      const { data: usrs } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (usrs) setUsers(usrs);

      setLoading(false);
    }
    loadData();

    const subOrders = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') setOrders((prev) => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE')
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)));
        else if (payload.eventType === 'DELETE')
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
      })
      .subscribe();

    const subMenu = supabase
      .channel('admin-menu')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
        if (payload.eventType === 'INSERT') setInventory((prev) => [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE')
          setInventory((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new : i)));
        else if (payload.eventType === 'DELETE')
          setInventory((prev) => prev.filter((i) => i.id !== payload.old.id));
      })
      .subscribe();

    const subInventory = supabase
      .channel('admin-inventory')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') setInventoryItems((prev) => [...prev, payload.new]);
          else if (payload.eventType === 'UPDATE')
            setInventoryItems((prev) =>
              prev.map((i) => (i.id === payload.new.id ? payload.new : i))
            );
          else if (payload.eventType === 'DELETE')
            setInventoryItems((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      )
      .subscribe();

    const subProfiles = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'INSERT') setUsers((prev) => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE')
          setUsers((prev) => prev.map((u) => (u.id === payload.new.id ? payload.new : u)));
        else if (payload.eventType === 'DELETE')
          setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subOrders);
      supabase.removeChannel(subMenu);
      supabase.removeChannel(subInventory);
      supabase.removeChannel(subProfiles);
    };
  }, [user, navigate, showToast]);

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const sanitizedId = id.replace('#', '');
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .filter('id', 'ilike', `%${sanitizedId}`);
      if (error) throw error;
      showToast(`Order ${id} is now ${newStatus}`);
      // Update local state if needed (though realtime usually handles it, manual update is safer)
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));

      // If cancelling, restore ingredient stock
      const order = orders.find((o) => o.id === id);
      if (newStatus === 'cancelled' && order?.items) {
        try {
          await restoreIngredients(order.items);
        } catch (restoreErr) {
          console.error('Failed to restore ingredients:', restoreErr);
        }
      }

      // Notify the customer about the status change
      if (order?.user_email) {
        const statusMessages = {
          preparing: {
            title: 'Order Being Prepared',
            message: `Your order ${id} is now being prepared!`,
            icon: 'preparing',
          },
          out_for_delivery: {
            title: 'Out for Delivery',
            message: `Your order ${id} is on its way!`,
            icon: 'delivering',
          },
          delivered: {
            title: 'Order Delivered',
            message: `Your order ${id} has been delivered. Enjoy your meal!`,
            icon: 'delivered',
          },
          cancelled: {
            title: 'Order Cancelled',
            message: `Your order ${id} has been cancelled. Contact us for help.`,
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
      showToast(err.message || 'Failed to update order', true);
    }
  };

  const handleViewOrder = (order) => {
    console.log(order.items);
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleSaveMenuItem = async (formData) => {
    try {
      if (editingItem) {
        // UPDATE
        const { error } = await supabase
          .from('menu_items')
          .update({
            name: formData.name,
            category: formData.category,
            price: formData.price,
            stock: formData.stock,
            emoji: formData.emoji,
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        setInventory((prev) =>
          prev.map((item) => (item.id === editingItem.id ? { ...item, ...formData } : item))
        );
        showToast('Item updated successfully!');
        return editingItem; // Return for recipe saving
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('menu_items')
          .insert([
            {
              name: formData.name,
              category: formData.category,
              price: formData.price,
              stock: formData.stock,
              emoji: formData.emoji,
            },
          ])
          .select();

        if (error) throw error;
        if (data) {
          setInventory((prev) => [...prev, data[0]]);
          showToast('New item added to menu!');
          return data[0]; // Return for recipe saving
        }
      }
    } catch (err) {
      console.error('Error saving menu item:', err);
      throw err;
    }
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setInventory((prev) => prev.filter((i) => i.id !== id));
      showToast('Item deleted successfully.');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleSaveIngredient = async (formData) => {
    try {
      if (editingIngredient) {
        // UPDATE
        const { error } = await supabase
          .from('inventory_items')
          .update({
            name: formData.name,
            quantity: formData.quantity,
            unit: formData.unit,
            min_stock: formData.min_stock,
          })
          .eq('id', editingIngredient.id);

        if (error) throw error;

        setInventoryItems((prev) =>
          prev.map((item) => (item.id === editingIngredient.id ? { ...item, ...formData } : item))
        );
        showToast('Ingredient updated!');
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('inventory_items')
          .insert([
            {
              name: formData.name,
              quantity: formData.quantity,
              unit: formData.unit,
              min_stock: formData.min_stock,
            },
          ])
          .select();

        if (error) throw error;
        if (data) setInventoryItems((prev) => [...prev, data[0]]);
        showToast('New ingredient added!');
      }
    } catch (err) {
      console.error('Error saving ingredient:', err);
      throw err;
    }
  };

  const deleteIngredient = async (id) => {
    if (!window.confirm('Delete this ingredient?')) return;
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      setInventoryItems((prev) => prev.filter((i) => i.id !== id));
      showToast('Ingredient removed.');
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Filtered Data
  const filteredMenu = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = menuCategory === 'all' || item.category === menuCategory;
    const matchesStock =
      menuStockStatus === 'all' || (menuStockStatus === 'low' ? item.stock <= 5 : item.stock > 5);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const filteredInventoryItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(invSearch.toLowerCase());
    const lowStockThreshold = item.min_stock || 10;
    const matchesStock =
      invStockStatus === 'all' ||
      (invStockStatus === 'low'
        ? item.quantity <= lowStockThreshold
        : item.quantity > lowStockThreshold);
    return matchesSearch && matchesStock;
  });

  // Dashboard Stats Calculations
  const stats = {
    totalRevenue: orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    totalCustomers: users.length,
    lowStockItems: [
      ...inventory.filter((i) => i.stock <= 5),
      ...inventoryItems.filter((i) => i.quantity <= (i.min_stock || 10)),
    ].length,
    recentOrders: orders.slice(0, 5),
  };

  if (loading)
    return (
      <div
        style={{
          padding: '80px',
          textAlign: 'center',
          background: 'var(--black)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--red-bright)',
            borderRadius: '50%',
          }}
        />
        <span
          style={{
            color: 'var(--muted)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '0.8rem',
          }}
        >
          Initializing Admin Portal...
        </span>
      </div>
    );

  return (
    <div className="view active admin-portal">
      <div className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">Admin Dashboard</h1>
          <p className="admin-dash-subtitle">Manage orders, inventory, and users.</p>
        </div>

        {/* Admin Topbar Right */}
        <div className="admin-dash-header-right">
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ color: 'var(--cream)' }}
              onClick={toggleNotifs}
              className="admin-header-notif-btn"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="admin-header-notif-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
            <NotificationPanel isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
          </div>

          <span className="admin-dash-user-info">
            Logged in as <strong>{user.name.split(' ')[0]}</strong>
          </span>
          <button onClick={() => navigate('/')} className="admin-exit-btn">
            <LogOut size={14} /> Exit
          </button>
        </div>
      </div>

      <div className="admin-dash-body">
        {/* SIDEBAR */}
        <div className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
          {[
            { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Overview' },
            { id: 'orders', icon: <ClipboardList size={18} />, label: 'Live Orders' },
            { id: 'menu', icon: <Package size={18} />, label: 'Menu Items' },
            { id: 'inventory', icon: <Box size={18} />, label: 'Inventory (Ingredients)' },
            { id: 'users', icon: <Users size={18} />, label: 'Customers' },
            {
              id: 'notifications',
              icon: <Bell size={18} />,
              label: 'Notifications',
              badge: unreadCount > 0 ? unreadCount : null,
            },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ x: 5 }}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
                if (tab.id === 'notifications') markAsRead();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: activeTab === tab.id ? '#fff' : 'var(--muted)',
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '0.9rem',
                transition: 'all .2s',
                textAlign: 'left',
              }}
            >
              <div style={{ color: activeTab === tab.id ? '#fff' : 'var(--primary)' }}>
                {tab.icon}
              </div>
              <span style={{ fontWeight: activeTab === tab.id ? 500 : 400, flex: 1 }}>
                {tab.label}
              </span>
              {tab.badge && (
                <span
                  style={{
                    background: 'var(--red)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '2px 7px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="admin-main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div>
                  <h2
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1.8rem',
                      marginBottom: '24px',
                    }}
                  >
                    Business Overview
                  </h2>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">
                        <PhilippinePeso size={20} />
                      </div>
                      <div className="stat-label">Total Revenue</div>
                      <div className="stat-value">
                        ₱
                        {stats.totalRevenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon">
                        <ClipboardList size={20} />
                      </div>
                      <div className="stat-label">Total Orders</div>
                      <div className="stat-value">{stats.totalOrders}</div>
                    </div>

                    <div className="stat-card">
                      <div
                        className="stat-icon"
                        style={{
                          background:
                            stats.pendingOrders > 0
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(34, 197, 94, 0.15)',
                          color: stats.pendingOrders > 0 ? '#ef4444' : '#22c55e',
                        }}
                      >
                        <TrendingUp size={20} />
                      </div>
                      <div className="stat-label">Pending Orders</div>
                      <div
                        className="stat-value"
                        style={{ color: stats.pendingOrders > 0 ? '#ef4444' : 'var(--cream)' }}
                      >
                        {stats.pendingOrders}
                      </div>
                    </div>

                    <div className="stat-card">
                      <div
                        className="stat-icon"
                        style={{
                          background:
                            stats.lowStockItems > 0
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(34, 197, 94, 0.15)',
                          color: stats.lowStockItems > 0 ? '#f59e0b' : '#22c55e',
                        }}
                      >
                        <Package size={20} />
                      </div>
                      <div className="stat-label">Stock Alerts</div>
                      <div
                        className="stat-value"
                        style={{ color: stats.lowStockItems > 0 ? '#f59e0b' : 'var(--cream)' }}
                      >
                        {stats.lowStockItems} Items
                      </div>
                    </div>
                  </div>

                  <div
                    className="admin-overview-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                      gap: '24px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <section>
                      <h3 className="dashboard-section-title">Recent Activity</h3>
                      <div
                        className="custom-table-wrapper"
                        style={{
                          overflowX: 'auto',
                          background: 'var(--surface)',
                          borderRadius: '12px',
                          border: '1px solid var(--border2)',
                        }}
                      >
                        <table
                          style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
                        >
                          <thead>
                            <tr
                              style={{
                                borderBottom: '1px solid var(--border)',
                                color: 'var(--muted)',
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                              }}
                            >
                              <th style={{ padding: '12px 16px' }}>Order ID</th>
                              <th style={{ padding: '12px 16px' }}>Status</th>
                              <th style={{ padding: '12px 16px' }}>Amount</th>
                              <th style={{ padding: '12px 16px' }}>Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentOrders.length === 0 ? (
                              <tr>
                                <td
                                  colSpan="4"
                                  style={{
                                    padding: '30px',
                                    textAlign: 'center',
                                    color: 'var(--muted)',
                                  }}
                                >
                                  No recent orders.
                                </td>
                              </tr>
                            ) : (
                              stats.recentOrders.map((o) => (
                                <tr key={o.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                                  <td
                                    style={{
                                      padding: '12px 16px',
                                      color: 'var(--red-bright)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {o.id.slice(0, 8)}...
                                  </td>
                                  <td style={{ padding: '12px 16px' }}>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: 'var(--surface2)',
                                        textTransform: 'capitalize',
                                      }}
                                    >
                                      {o.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                    ₱{o.total.toFixed(2)}
                                  </td>
                                  <td
                                    style={{
                                      padding: '12px 16px',
                                      fontSize: '0.75rem',
                                      color: 'var(--muted)',
                                    }}
                                  >
                                    {formatDate(o.created_at)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                          marginTop: '16px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--red-bright)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        View all orders <TrendingUp size={14} />
                      </button>
                    </section>

                    <section>
                      <h3 className="dashboard-section-title">Quick Stats</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div
                          style={{
                            padding: '20px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--border2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                          }}
                        >
                          <div
                            style={{
                              padding: '10px',
                              background: 'rgba(154, 174, 71, 0.1)',
                              borderRadius: '8px',
                              color: 'var(--red-bright)',
                            }}
                          >
                            <Users size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              Total Customers
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                              {stats.totalCustomers}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: '20px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                            border: '1px solid var(--border2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                          }}
                        >
                          <div
                            style={{
                              padding: '10px',
                              background: 'rgba(154, 174, 71, 0.1)',
                              borderRadius: '8px',
                              color: 'var(--red-bright)',
                            }}
                          >
                            <Star size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              Avg Order Value
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                              ₱{(stats.totalRevenue / (stats.totalOrders || 1)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '24px',
                          padding: '24px',
                          background: 'linear-gradient(135deg, var(--red-dark), var(--red))',
                          borderRadius: '12px',
                          color: '#fff',
                          boxShadow: '0 10px 20px rgba(154, 174, 71, 0.2)',
                        }}
                      >
                        <h4
                          style={{
                            margin: '0 0 8px 0',
                            fontSize: '1rem',
                            fontFamily: '"Playfair Display", serif',
                          }}
                        >
                          Need Help?
                        </h4>
                        <p
                          style={{
                            margin: '0 0 16px 0',
                            fontSize: '0.8rem',
                            opacity: 0.9,
                            lineHeight: 1.5,
                          }}
                        >
                          Access the manual or contact support for advanced administrative tasks.
                        </p>
                        <button
                          style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontWeight: 500,
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.background = 'rgba(255,255,255,0.25)')
                          }
                          onMouseOut={(e) => (e.target.style.background = 'rgba(255,255,255,0.15)')}
                        >
                          Admin Documentation
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              )}
              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div>
                  <h2
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1.8rem',
                      marginBottom: '24px',
                    }}
                  >
                    Live Orders
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.length === 0 ? (
                      <div
                        style={{
                          padding: '60px',
                          textAlign: 'center',
                          color: 'var(--muted)',
                          background: 'var(--surface)',
                          borderRadius: '12px',
                          border: '1px solid var(--border2)',
                        }}
                      >
                        No orders yet.
                      </div>
                    ) : (
                      orders.map((o) => (
                        <AdminOrderCard
                          key={o.id}
                          order={o}
                          formatDate={formatDate}
                          onViewDetails={() => handleViewOrder(o)}
                          onStatusChange={(status) => updateOrderStatus(o.id, status)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}{' '}
              {/* MENU ITEMS TAB */}
              {activeTab === 'menu' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '24px',
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '1.8rem',
                        margin: 0,
                      }}
                    >
                      Menu Management
                    </h2>
                    <button
                      className="hero-btn main"
                      onClick={() => {
                        setEditingItem(null);
                        setIsMenuModalOpen(true);
                      }}
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.8rem',
                        letterSpacing: '2px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: '"DM Sans", sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Plus size={16} /> Add Item
                    </button>
                  </div>

                  {/* FILTER BAR */}
                  <div
                    style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                      <Search
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--muted)',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search menu items..."
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--cream)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <select
                      value={menuCategory}
                      onChange={(e) => setMenuCategory(e.target.value)}
                      style={{
                        padding: '12px',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--cream)',
                        outline: 'none',
                        cursor: 'pointer',
                        colorScheme: 'dark',
                      }}
                    >
                      <option value="all">All Categories</option>
                      <option value="sushi">Sushi</option>
                      <option value="salad">Salad</option>
                      <option value="takoyaki-8pcs">Takoyaki (8pcs)</option>
                      <option value="takoyaki-10pcs">Takoyaki (10pcs)</option>
                      <option value="add-ons">Add-ons</option>
                      <option value="rice">Rice</option>
                    </select>
                    <select
                      value={menuStockStatus}
                      onChange={(e) => setMenuStockStatus(e.target.value)}
                      style={{
                        padding: '12px',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--cream)',
                        outline: 'none',
                        cursor: 'pointer',
                        colorScheme: 'dark',
                      }}
                    >
                      <option value="all">All Stock Status</option>
                      <option value="in">In Stock</option>
                      <option value="low">Low Stock (≤5)</option>
                    </select>
                  </div>

                  <div className="custom-table-wrapper" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--border)',
                            color: 'var(--muted)',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Item Name</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Category</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Price</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Stock</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMenu.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              style={{
                                padding: '30px',
                                textAlign: 'center',
                                color: 'var(--muted)',
                              }}
                            >
                              No menu items found matching filters.
                            </td>
                          </tr>
                        ) : (
                          filteredMenu.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                              <td
                                style={{
                                  padding: '16px 10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                }}
                              >
                                {getCategoryIconSmall(item.category, 24, 'var(--red-bright)')}{' '}
                                {item.name}
                              </td>
                              <td style={{ padding: '16px 10px', textTransform: 'capitalize' }}>
                                {item.category.replace('-', ' ')}
                              </td>
                              <td style={{ padding: '16px 10px', fontWeight: 500 }}>
                                ₱{parseFloat(item.price).toFixed(2)}
                              </td>
                              <td style={{ padding: '16px 10px' }}>
                                <div
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    background:
                                      item.stock <= 5
                                        ? 'rgba(160, 76, 76, 0.2)'
                                        : 'var(--surface2)',
                                    color: item.stock <= 5 ? 'var(--maple)' : 'var(--cream)',
                                  }}
                                >
                                  {item.stock}
                                </div>
                              </td>
                              <td style={{ padding: '16px 10px', display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsMenuModalOpen(true);
                                  }}
                                  style={{
                                    background: 'var(--surface2)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--cream)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => deleteMenuItem(item.id)}
                                  style={{
                                    background: 'rgba(160, 76, 76, 0.15)',
                                    border: '1px solid rgba(160, 76, 76, 0.3)',
                                    color: 'var(--red-bright)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* INVENTORY TAB */}
              {activeTab === 'inventory' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '24px',
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '1.8rem',
                        margin: 0,
                      }}
                    >
                      Ingredient Inventory
                    </h2>
                    <button
                      className="hero-btn main"
                      onClick={() => {
                        setEditingIngredient(null);
                        setIsIngredientModalOpen(true);
                      }}
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.8rem',
                        letterSpacing: '2px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: '"DM Sans", sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Plus size={16} /> Add Ingredient
                    </button>
                  </div>

                  {/* FILTER BAR */}
                  <div
                    style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                      <Search
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--muted)',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search ingredients..."
                        value={invSearch}
                        onChange={(e) => setInvSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 12px 12px 40px',
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'var(--cream)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <select
                      value={invStockStatus}
                      onChange={(e) => setInvStockStatus(e.target.value)}
                      style={{
                        padding: '12px',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--cream)',
                        outline: 'none',
                        cursor: 'pointer',
                        colorScheme: 'dark',
                      }}
                    >
                      <option value="all">All Status</option>
                      <option value="in">In Stock</option>
                      <option value="low">Low Stock</option>
                    </select>
                  </div>

                  <div className="custom-table-wrapper" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--border)',
                            color: 'var(--muted)',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Ingredient</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Quantity</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Unit</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Status</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventoryItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              style={{
                                padding: '30px',
                                textAlign: 'center',
                                color: 'var(--muted)',
                              }}
                            >
                              No ingredients found.
                            </td>
                          </tr>
                        ) : (
                          filteredInventoryItems.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                              <td style={{ padding: '16px 10px', fontWeight: 600 }}>{item.name}</td>
                              <td style={{ padding: '16px 10px' }}>{item.quantity}</td>
                              <td style={{ padding: '16px 10px', color: 'var(--muted)' }}>
                                {item.unit}
                              </td>
                              <td style={{ padding: '16px 10px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    background:
                                      item.quantity <= (item.min_stock || 10)
                                        ? 'rgba(160, 76, 76, 0.2)'
                                        : 'rgba(34,197,94,0.1)',
                                    color:
                                      item.quantity <= (item.min_stock || 10)
                                        ? 'var(--red-bright)'
                                        : '#22c55e',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.quantity <= (item.min_stock || 10)
                                    ? 'Low Stock'
                                    : 'In Stock'}
                                </span>
                              </td>
                              <td style={{ padding: '16px 10px', display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setEditingIngredient(item);
                                    setIsIngredientModalOpen(true);
                                  }}
                                  style={{
                                    background: 'var(--surface2)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--cream)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => deleteIngredient(item.id)}
                                  style={{
                                    background: 'rgba(160, 76, 76, 0.15)',
                                    border: '1px solid rgba(160, 76, 76, 0.3)',
                                    color: 'var(--red-bright)',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div>
                  <h2
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '1.8rem',
                      marginBottom: '24px',
                    }}
                  >
                    Customers
                  </h2>
                  <div className="custom-table-wrapper" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--border)',
                            color: 'var(--muted)',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                          }}
                        >
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Name</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Email</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Role</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Points</th>
                          <th style={{ padding: '16px 10px', fontWeight: 500 }}>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                            <td style={{ padding: '16px 10px' }}>{u.name}</td>
                            <td style={{ padding: '16px 10px', color: 'var(--muted)' }}>
                              {u.email}
                            </td>
                            <td style={{ padding: '16px 10px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '1px',
                                  background:
                                    u.role === 'admin'
                                      ? 'rgba(160, 76, 76, 0.2)'
                                      : 'var(--surface2)',
                                  color: u.role === 'admin' ? 'var(--maple)' : 'var(--muted)',
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '16px 10px',
                                color: 'var(--red-bright)',
                                fontWeight: 700,
                              }}
                            >
                              {u.points || 0}
                            </td>
                            <td
                              style={{
                                padding: '16px 10px',
                                fontSize: '0.85rem',
                                color: 'var(--muted)',
                              }}
                            >
                              {formatDate(u.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '24px',
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '1.8rem',
                        margin: 0,
                      }}
                    >
                      Notifications
                    </h2>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border)',
                          color: 'var(--muted)',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: '40px',
                          textAlign: 'center',
                          color: 'var(--muted)',
                          background: 'var(--surface2)',
                          borderRadius: '12px',
                          border: '1px dashed var(--border)',
                        }}
                      >
                        <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '20px',
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                            }}
                          >
                            {n.icon === 'preparing' && (
                              <Flame size={20} style={{ color: 'var(--red-bright)' }} />
                            )}
                            {n.icon === 'delivering' && (
                              <Truck size={20} style={{ color: 'var(--red-bright)' }} />
                            )}
                            {n.icon === 'delivered' && (
                              <PartyPopper size={20} style={{ color: 'var(--red-bright)' }} />
                            )}
                            {n.icon === 'cancelled' && (
                              <AlertTriangle size={20} style={{ color: 'var(--maple)' }} />
                            )}
                            {n.icon === 'order' && (
                              <Package size={20} style={{ color: 'var(--red-bright)' }} />
                            )}
                            {n.icon === 'order-placed' && (
                              <ClipboardList size={20} style={{ color: 'var(--red-bright)' }} />
                            )}
                            {!n.icon && <Bell size={20} style={{ color: 'var(--muted)' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '4px',
                              }}
                            >
                              <strong style={{ color: 'var(--red-bright)', fontSize: '0.9rem' }}>
                                {n.title}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                {formatDate(n.created_at)}
                              </span>
                            </div>
                            <p
                              style={{
                                margin: 0,
                                color: 'var(--cream)',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                              }}
                            >
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <MenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        onSave={handleSaveMenuItem}
        editingItem={editingItem}
        inventoryItems={inventoryItems}
      />

      <IngredientModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        onSave={handleSaveIngredient}
        editingItem={editingIngredient}
      />

      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedOrder}
        onStatusUpdate={updateOrderStatus}
      />
    </div>
  );
}

// ─── Admin Order Card with Progress Tracker ──────────────────────────────────
const ADMIN_ORDER_STEPS = [
  { key: 'pending', label: 'Placed', icon: '🧾' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'On the Way', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

const ADMIN_STATUS_INDEX = {
  pending: 0,
  preparing: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

function AdminOrderCard({ order, formatDate, onViewDetails, onStatusChange }) {
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const currentStep = ADMIN_STATUS_INDEX[order.status] ?? 0;
  const nextStep =
    currentStep >= 0 && currentStep < ADMIN_ORDER_STEPS.length - 1
      ? ADMIN_ORDER_STEPS[currentStep + 1]
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '1rem',
                color: 'var(--red-bright)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              {order.id}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              {formatDate(order.created_at)}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>
              {order.user_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{order.user_email}</div>
          </div>
        </div>
        <div
          style={{
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--red-bright)' }}>
            ₱{parseFloat(order.total).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
            {order.payment} • {order.items?.length || 0} items
          </div>
        </div>
      </div>

      {/* Scheduled Badge */}
      {order.scheduled_date && (
        <div
          style={{
            margin: '0 20px 12px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(154, 174, 71, 0.1)',
            border: '1px solid rgba(154, 174, 71, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
          }}
        >
          <span style={{ fontSize: '14px' }}>📅</span>
          <span style={{ color: 'var(--cream)', fontWeight: 500 }}>
            Scheduled:{' '}
            {new Date(order.scheduled_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            {order.scheduled_time && ` at ${order.scheduled_time}`}
          </span>
        </div>
      )}

      {/* Progress Steps */}
      {!isCancelled ? (
        <div
          style={{
            padding: '0 20px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0',
          }}
        >
          {ADMIN_ORDER_STEPS.map((step, index) => {
            const isDone = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.key}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                {/* Connector line (behind icon) */}
                {index > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '50%',
                      width: '100%',
                      height: '2px',
                      background: isDone ? 'var(--secondary)' : 'var(--border)',
                      zIndex: 0,
                    }}
                  />
                )}
                {index < ADMIN_ORDER_STEPS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '50%',
                      width: '100%',
                      height: '2px',
                      background: isDone ? 'var(--secondary)' : 'var(--border)',
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1,
                    background: isDone
                      ? 'var(--secondary)'
                      : isActive
                        ? 'rgba(154,174,71,0.15)'
                        : 'var(--surface2)',
                    border: isActive
                      ? '2px solid var(--red-bright)'
                      : isDone
                        ? '2px solid var(--secondary)'
                        : '2px solid var(--border)',
                  }}
                  animate={isActive ? { scale: [1, 1.06, 1] } : {}}
                  transition={
                    isActive ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}
                  }
                >
                  <span style={{ fontSize: '13px' }}>{isDone ? '✓' : step.icon}</span>
                </motion.div>

                {/* Label */}
                <span
                  style={{
                    fontSize: '0.6rem',
                    marginTop: '6px',
                    textAlign: 'center',
                    color: isActive ? 'var(--red-bright)' : isDone ? '#22c55e' : 'var(--muted)',
                    fontWeight: isActive ? 600 : 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            margin: '0 20px 20px',
            padding: '14px',
            background: 'rgba(160, 76, 76, 0.1)',
            border: '1px solid rgba(160, 76, 76, 0.2)',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--maple)',
            fontWeight: 500,
          }}
        >
          Order Cancelled
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {nextStep && !isCancelled && !isDelivered && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStatusChange(nextStep.key)}
              style={{
                background: 'var(--red)',
                border: 'none',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
              }}
            >
              {nextStep.label} →
            </motion.button>
          )}
          {!isCancelled && !isDelivered && (
            <button
              onClick={() => onStatusChange('cancelled')}
              style={{
                background: 'rgba(160, 76, 76, 0.15)',
                border: '1px solid rgba(160, 76, 76, 0.3)',
                color: 'var(--maple)',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Cancel
            </button>
          )}
        </div>
        <button
          onClick={onViewDetails}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--cream)',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontFamily: '"DM Sans", sans-serif',
            transition: 'all 0.2s',
          }}
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
}
