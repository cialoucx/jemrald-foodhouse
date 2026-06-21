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
