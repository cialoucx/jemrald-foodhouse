import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Camera,
  User,
  Phone,
  MapPin,
  Mail,
  Sun,
  Moon,
  LogOut,
  Save,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  if (!user) {
    return (
      <div
        className="view active"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: 'var(--muted)',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px' }}>Please sign in to view your profile.</p>
          <button
            onClick={() => document.dispatchEvent(new CustomEvent('open-auth'))}
            style={{
              background: 'var(--red)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (phone && phone.length !== 11) {
      showToast('Phone number must be exactly 11 digits (e.g. 09123456789).', true);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name, phone, address });
    } catch (err) {
      showToast(err.message || 'Failed to save profile', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', true);
      return;
    }
    setUploading(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      showToast(err.message || 'Failed to upload image', true);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '14px 16px',
    color: 'var(--cream)',
    outline: 'none',
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: 'var(--muted)',
    marginBottom: '8px',
    fontFamily: '"DM Sans", sans-serif',
  };

  return (
    <div className="view active" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="profile-header"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate('/menu')}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            color: 'var(--muted)',
            padding: '8px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <ArrowLeft size={16} />
          Back to Menu
        </button>
        <h2
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.2rem',
            color: 'var(--cream)',
            margin: 0,
          }}
        >
          Profile & Settings
        </h2>
        <div style={{ width: '120px' }} />
      </div>

      <div
        className="profile-content"
        style={{ maxWidth: '600px', margin: '0 auto', padding: '30px 20px 100px' }}
      >
        {/* Profile Picture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '36px',
          }}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'relative',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: user.avatar_url ? 'none' : 'var(--surface2)',
                border: '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={40} style={{ color: 'var(--muted)', opacity: 0.5 }} />
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg)',
              }}
            >
              {uploading ? (
                <Loader2
                  size={14}
                  style={{ color: '#fff', animation: 'spin 1s linear infinite' }}
                />
              ) : (
                <Camera size={14} style={{ color: '#fff' }} />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted)',
              margin: 0,
              letterSpacing: '0.5px',
            }}
          >
            Tap to change photo
          </p>
        </motion.div>

        {/* Section Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '28px',
            background: 'var(--surface2)',
            borderRadius: '10px',
            padding: '4px',
          }}
        >
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
                transition: 'all 0.2s',
                background: activeSection === tab.key ? 'var(--red)' : 'transparent',
                color: activeSection === tab.key ? '#fff' : 'var(--muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSection === 'profile' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* Name */}
            <div>
              <label style={labelStyle}>
                <User size={14} />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label style={labelStyle}>
                <Mail size={14} />
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                style={{
                  ...inputStyle,
                  opacity: 0.5,
                  cursor: 'not-allowed',
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>
                <Phone size={14} />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="09123456789"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle}>
                <MapPin size={14} />
                Delivery Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, Street, Barangay, City"
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '80px',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--red)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                background: 'var(--red)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontFamily: '"DM Sans", sans-serif',
                opacity: saving ? 0.7 : 1,
                transition: 'opacity 0.2s',
                marginTop: '4px',
              }}
            >
              {saving ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.div>
        )}

        {activeSection === 'settings' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Theme Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {theme === 'dark' ? (
                  <Moon size={20} style={{ color: 'var(--red-bright)' }} />
                ) : (
                  <Sun size={20} style={{ color: 'var(--red-bright)' }} />
                )}
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>
                    Appearance
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  width: '52px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.3s',
                  background: theme === 'dark' ? 'var(--red)' : 'var(--border)',
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: theme === 'dark' ? '27px' : '3px',
                    transition: 'left 0.3s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </button>
            </div>

            {/* Account Info */}
            <div
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '18px 20px',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--muted)',
                  marginBottom: '12px',
                }}
              >
                Account
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>Email</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{user.email}</span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>Account type</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--red-bright)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 500,
                  }}
                >
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleLogout}
              style={{
                width: '100%',
                background: 'none',
                color: 'var(--maple)',
                border: '1px solid rgba(160, 76, 76, 0.3)',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '0.8rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontFamily: '"DM Sans", sans-serif',
                marginTop: '8px',
                transition: 'all 0.2s',
              }}
            >
              <LogOut size={18} />
              Sign Out
            </motion.button>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
