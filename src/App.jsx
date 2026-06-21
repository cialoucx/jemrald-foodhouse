import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CustomerView from './pages/CustomerView';
import ProfilePage from './pages/ProfilePage';
import AdminView from './pages/AdminView';
import FBOrderView from './pages/FBOrderView';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ReviewsSection from './components/ReviewsSection';
import OrderTracker from './components/OrderTracker';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

import { useLocation } from 'react-router-dom';

import Chatbot from './components/Chatbot';

function GlobalOverlays() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isFbOrder = location.pathname === '/fb-order';

  if (isAdmin) return <AuthModal />;
  if (isFbOrder) return null;

  return (
    <>
      <AuthModal />
      <ReviewsSection />
      <OrderTracker />
      <Chatbot />
    </>
  );
}

function ConditionalNavbar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isCustomerRoute = location.pathname === '/menu' || location.pathname === '/profile';
  const isFbOrder = location.pathname === '/fb-order';

  if (isAdmin || isCustomerRoute || isFbOrder) return null;
  return <Navbar />;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <CartProvider>
                <div className="app-container">
                  <ConditionalNavbar />
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/menu" element={<CustomerView />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/fb-order" element={<FBOrderView />} />
                    <Route path="/admin/*" element={<AdminView />} />
                  </Routes>
                  <GlobalOverlays />
                </div>
              </CartProvider>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
