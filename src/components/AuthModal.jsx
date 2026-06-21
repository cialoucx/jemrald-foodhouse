import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    regName: z.string().min(1, 'Full name is required'),
    regEmail: z.string().email('Invalid email address'),
    regPass: z.string().min(6, 'Password must be at least 6 characters'),
    regConf: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.regPass === data.regConf, {
    message: 'Passwords do not match.',
    path: ['regConf'],
  });

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('login');
  const [authError, setAuthError] = useState('');

  const { login, register, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
    reset: resetLogin,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
    reset: resetSignup,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
      if (e.detail?.tab) {
        setTab(e.detail.tab);
        setAuthError('');
      }
    };
    document.addEventListener('open-auth', handleOpen);
    return () => document.removeEventListener('open-auth', handleOpen);
  }, []);

  const resetForms = () => {
    resetLogin();
    resetSignup();
    setAuthError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForms();
  };

  const onLogin = async (data) => {
    setAuthError('');
    try {
      const userData = await login(data.email, data.password);
      showToast('Welcome back! 🎉');
      setIsOpen(false);
      resetForms();
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/menu');
      }
    } catch (err) {
      setAuthError(err.message || 'Something went wrong.');
    }
  };

  const onRegister = async (data) => {
    setAuthError('');
    try {
      const userData = await register(data.regName, data.regEmail, data.regPass);
      showToast(`Account created! Welcome, ${data.regName.split(' ')[0]}! 🎉`);
      setIsOpen(false);
      resetForms();
      navigate('/menu');
    } catch (err) {
      setAuthError(err.message || 'Something went wrong.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay open"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 18, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="modal auth-modal auth-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                zIndex: 2,
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '4px',
                minWidth: 44,
                minHeight: 44,
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--cream)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            >
              <X size={18} />
            </button>

            {/* Branding Header */}
            <div
              style={{
                padding: '28px 32px 0',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: '"Poppins", sans-serif',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  letterSpacing: '2px',
                  display: 'block',
                  lineHeight: 1,
                }}
              >
                Jemrald
              </span>
              <span
                style={{
                  fontSize: '0.5rem',
                  letterSpacing: '5px',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Foodhouse
              </span>
            </div>

            {/* Tabs */}
            <div
              className="auth-tabs"
              style={{
                display: 'flex',
                margin: '20px 32px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <button
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setTab('login');
                  setAuthError('');
                }}
                style={{ flex: 1 }}
              >
                Log In
              </button>
              <button
                className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setTab('register');
                  setAuthError('');
                }}
                style={{ flex: 1 }}
              >
                Register
              </button>
            </div>

            {/* Form Content */}
            <div style={{ padding: '24px 32px 28px' }}>
              {/* Error Message */}
              <AnimatePresence mode="wait">
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="auth-error show"
                    style={{ display: 'block' }}
                  >
                    {authError}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {tab === 'login' ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLoginSubmit(onLogin)}
                    className="auth-form active"
                    style={{ display: 'block' }}
                  >
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Log in to view your orders and points.</p>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        {...registerLogin('email')}
                        placeholder="Email"
                        autoComplete="email"
                      />
                      {loginErrors.email && (
                        <span style={{ color: 'red', fontSize: '0.8rem' }}>
                          {loginErrors.email.message}
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        {...registerLogin('password')}
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                      {loginErrors.password && (
                        <span style={{ color: 'red', fontSize: '0.8rem' }}>
                          {loginErrors.password.message}
                        </span>
                      )}
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoginSubmitting}>
                      {isLoginSubmitting ? 'Signing In...' : 'Sign In'}
                    </button>

                    <p
                      style={{
                        textAlign: 'center',
                        marginTop: '16px',
                        fontSize: '0.78rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Don't have an account?{' '}
                      <span
                        onClick={() => {
                          setTab('register');
                          setAuthError('');
                        }}
                        style={{
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'color 0.2s',
                        }}
                      >
                        Register
                      </span>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSignupSubmit(onRegister)}
                    className="auth-form active"
                    style={{ display: 'block' }}
                  >
                    <h2 className="auth-title">Create Account</h2>
                    <p className="auth-subtitle">Join Jemrald Foodhouse today.</p>

                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        {...registerSignup('regName')}
                        placeholder="Name"
                        autoComplete="name"
                      />
                      {signupErrors.regName && (
                        <span style={{ color: 'red', fontSize: '0.8rem' }}>
                          {signupErrors.regName.message}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        {...registerSignup('regEmail')}
                        placeholder="Email"
                        autoComplete="email"
                      />
                      {signupErrors.regEmail && (
                        <span style={{ color: 'red', fontSize: '0.8rem' }}>
                          {signupErrors.regEmail.message}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        {...registerSignup('regPass')}
                        placeholder="6+ characters"
                        autoComplete="new-password"
                      />
                      {signupErrors.regPass && (
                        <span style={{ color: 'red', fontSize: '0.8rem' }}>
                          {signupErrors.regPass.message}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        {...registerSignup('regConf')}
                        placeholder="Re-type password"
                        autoComplete="new-password"
                      />
                      {signupErrors.regConf && (
                        <span style={{ color: 'red', fontSize: '0.8rem' }}>
                          {signupErrors.regConf.message}
                        </span>
                      )}
                    </div>

                    <button type="submit" className="submit-btn" disabled={isSignupSubmitting}>
                      {isSignupSubmitting ? 'Creating...' : 'Create Account'}
                    </button>

                    <p
                      style={{
                        textAlign: 'center',
                        marginTop: '16px',
                        fontSize: '0.78rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Already have an account?{' '}
                      <span
                        onClick={() => {
                          setTab('login');
                          setAuthError('');
                        }}
                        style={{
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'color 0.2s',
                        }}
                      >
                        Log In
                      </span>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
