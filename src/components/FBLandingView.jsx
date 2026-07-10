import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FBLandingView({ setView }) {
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
        {/* Brand Logo - Static & Square */}
        <div
          style={{
            width: '280px',
            height: '280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '36px',
          }}
        >
          <img
            src="/images/logo-foodhouse.png"
            alt="Jemrald Foodhouse Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

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
