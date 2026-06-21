import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getCategoryIcon } from './JapaneseIcons';
import { Check } from 'lucide-react';

export default function MenuCard({ item, available = true }) {
  const { addToCart } = useCart();
  const [showVariants, setShowVariants] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const hasVariants = item.variants && item.variants.length > 0;
  const hasMultipleVariants = item.variants && item.variants.length > 1;
  const displayPrice = hasMultipleVariants
    ? `₱${item.variants[0].price} / ₱${item.variants[item.variants.length - 1].price}`
    : hasVariants
      ? `₱${item.variants[0].price}`
      : `₱${item.price.toFixed(2)}`;
  const displayUnit = hasMultipleVariants
    ? `${item.variants[0].label} / ${item.variants[item.variants.length - 1].label}`
    : hasVariants
      ? item.variants[0].label
      : '';

  const customImages = {
    // Specific combos
    '50pcs california maki and 18pcs harumaki salad': '/images/50pcs California maki and 18pcs Harumaki salad ₱1k.jpg',
    '50pcs california maki & 18pcs harumaki salad': '/images/50pcs California maki and 18pcs Harumaki salad ₱1k.jpg',
    '50pcs mix maki and 18pcs harumaki salad': '/images/50pcs California maki and 18pcs Harumaki salad ₱1k.jpg',
    '50pcs mix maki & 18pcs harumaki salad': '/images/50pcs California maki and 18pcs Harumaki salad ₱1k.jpg',
    '30pcs crabgo and 30pcs california maki': '/images/30pcs Crabgo and 30pcs california maki ₱950.jpg',
    '30pcs crabgo & 30pcs california maki': '/images/30pcs Crabgo and 30pcs california maki ₱950.jpg',

    // Set promos
    'set a': '/images/set a.jpg',
    'set b': '/images/set b.jpg',
    'set c': '/images/set c.jpg',
    'set d': '/images/set d.jpg',
    'set e': '/images/set e.jpg',
    'set f': '/images/set f.jpg',
    'set g': '/images/set g.jpg',
    'set h': '/images/set h.jpg',
    'set i': '/images/set-i.jpg',
    'set j': '/images/set j.jpg',

    // California Maki sizes
    '10pcs cheesy overload california maki': '/images/10pcs cheesy overload california maki ₱170.jpg',
    'cheesy overload california maki': '/images/10pcs cheesy overload california maki ₱170.jpg',
    '24pcs california maki': '/images/24pcs all california maki ₱320.jpg',
    '50pcs california maki': '/images/50pcs california maki ₱650.jpg',
    '60pcs california maki': '/images/50pcs california maki ₱650.jpg',
    '70pcs california maki': '/images/70pcs all california maki ₱940.jpg',

    // Mix Maki sizes
    '24pcs mix maki': '/images/24pcs. mix maki ₱350.jpg',
    '30pcs mix maki': '/images/30pcs mix maki ₱450.jpg',
    '40pcs mix maki': '/images/40pcs. mix maki ₱535.jpg',
    'mix maki happy birthday': '/images/50pcs. Mix Maki Happy Birthday ₱700.jpg',
    '50pcs mix maki': '/images/50pcs. Mix Maki ₱690.jpg',
    '60pcs pizza mix maki': '/images/60pcs Pizza mix maki ₱800.jpg',
    '70pcs mix maki': '/images/70pcs. mix maki ₱950.jpg',
    '80pcs mix maki': '/images/80pcs. mix maki ₱1k.jpg',
    '100pcs mix maki': '/images/100pcs. Mix maki ₱1350.jpg',

    // Salad
    '6pcs harumaki salad': '/images/6pcs harumaki salad ₱125.jpg',
    'harumaki salad': '/images/6pcs harumaki salad ₱125.jpg',
    'chicken salad': '/images/6pcs harumaki salad ₱125.jpg',
    'pork salad': '/images/6pcs harumaki salad ₱125.jpg',

    // Kimbap
    '48pcs mix kimbap': '/images/48pcs. Mix Kimbap ₱555.jpg',
    'kimbap': '/images/kimbap flavor cheese-₱140 _ mango -₱130 _ spam-₱160 _ crab -₱150.jpg',

    // Solo rolls
    'sweet and spicy': '/images/solo 8pcs sweet and spicy ₱120.jpg',
    'sweet & spicy': '/images/solo 8pcs sweet and spicy ₱120.jpg',
    'crazy maki': '/images/solo 8pcs crazy maki ₱120.jpg',
    'riri cheese': '/images/solo 8pcs riri cheese ₱130.jpg',
    'mango cheese': '/images/solo 10pcs mango cheese roll ₱150.jpg',
    'veggie roll': '/images/solo veggie roll ₱180.jpg',
    'crabstick roll': '/images/crabstick roll ₱150.jpg',
    'crabstic roll': '/images/crabstic roll ₱150.jpg',
    'creamy cheese': '/images/creamy cheese ₱150.jpg',
    'crab cheese': '/images/crab cheese roll ₱150.jpg',
    'kani mango': '/images/kani mango ₱160.jpg',
    'mango on top': '/images/mango on top ₱150.jpg',
    'crabgo': '/images/crabgo 8pcs ₱150.jpg',
    'crab kani': '/images/crab kani 8pcs ₱250.jpg',
    '50pcs crunchy cheese': '/images/50pcs. Crunchy cheese ₱750.jpg',
    'crunchy cheese': '/images/crunchy cheese 10pcs ₱160.jpg',

    // Rice / Bowls
    'chicken torikatsu': '/images/tonkatsu with rice  ₱150 _ torikatsu with rice ₱140.jpg',
    'pork torikatsu': '/images/tonkatsu with rice  ₱150 _ torikatsu with rice ₱140.jpg',
    'chicken katsudon': '/images/tonkatsu with rice  ₱150 _ torikatsu with rice ₱140.jpg',
    'pork katsudon': '/images/tonkatsu with rice  ₱150 _ torikatsu with rice ₱140.jpg',
    'tonkatsu with salad': '/images/Tonkatsu with salad ₱160_  Torikatsu with salad ₱150.jpg',
    'torikatsu with salad': '/images/Tonkatsu with salad ₱160_  Torikatsu with salad ₱150.jpg',
    'tonkatsu': '/images/tonkatsu with rice  ₱150 _ torikatsu with rice ₱140.jpg',
    'torikatsu': '/images/tonkatsu with rice  ₱150 _ torikatsu with rice ₱140.jpg',
    'katsudon': '/images/tonkatsu with rice  ₱150 _ torikatsu with rice ₱140.jpg',

    // Specific sushi mixes
    '50pcs 3mix flavors': '/images/mix-sushi-50pcs.png',
    '70pcs mix sushi': '/images/mix-sushi-70pcs.png',
    '80pcs mix sushi': '/images/mix-sushi-80pcs.png',

    // General Fallbacks
    'california maki': '/images/california-maki.jpg',
    'kani salad': '/images/kani-salad.jpg',
    'mix kimbap': '/images/mix-kimbap.png',
    'pizza mix maki': '/images/60pcs Pizza mix maki ₱800.jpg',
    'mix maki': '/images/mix-maki.jpg',
    'mix sushi': '/images/mix-sushi.png',
  };
  const itemNameLower = item.name.toLowerCase();
  const matchedCustomImage = Object.entries(customImages).find(([key]) =>
    itemNameLower.includes(key)
  );
  const hasCustomImage = !!matchedCustomImage;
  const customImagePath = hasCustomImage ? matchedCustomImage[1] : null;

  return (
    <>
      <motion.div
        className={`menu-card ${item.stock === 0 || !available ? 'oos' : ''}`}
        initial="rest"
        whileHover="hover"
        animate="rest"
        variants={{
          rest: { y: 0, borderColor: 'var(--border)' },
          hover: { y: -5, borderColor: 'rgba(154, 174, 71, 0.35)' },
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="card-img" style={hasCustomImage ? { padding: 0 } : {}}>
          {hasCustomImage ? (
            <motion.div
              style={{ width: '100%', height: '100%', position: 'relative' }}
              variants={{
                rest: { scale: 1 },
                hover: { scale: 1.05 },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <img
                src={customImagePath}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          ) : (
            <motion.span
              className="card-cat-icon"
              variants={{
                rest: { scale: 1, rotate: 0, y: 0 },
                hover: { scale: 1.08, rotate: 4, y: -4 },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ display: 'inline-block' }}
            >
              {getCategoryIcon(item.category, 64, 'var(--red-bright)')}
            </motion.span>
          )}
          {item.stock === 0 && <div className="out-badge out">Out of Stock</div>}
          {item.stock > 0 && !available && <div className="out-badge out">Unavailable</div>}
          {item.stock > 0 && available && item.stock <= 5 && (
            <div className="out-badge low">Only {item.stock} left</div>
          )}
        </div>

        <div className="card-body">
          <div className="card-name">{item.name}</div>
          <div className="card-desc">{item.desc}</div>
          <div className="card-footer">
            <div className="card-price">
              {displayPrice}
              <span> {displayUnit}</span>
            </div>
            <motion.button
              className="add-btn"
              whileHover={
                item.stock > 0 && available
                  ? { scale: 1.1, backgroundColor: 'var(--red-bright)' }
                  : {}
              }
              whileTap={item.stock > 0 && available ? { scale: 0.9 } : {}}
              onClick={() => {
                if (item.stock === 0 || !available) return;
                if (hasVariants) {
                  setShowVariants(true);
                } else {
                  addToCart(item);
                  setIsAdded(true);
                  setTimeout(() => setIsAdded(false), 1000);
                }
              }}
              disabled={item.stock === 0 || !available}
              style={item.stock === 0 || !available ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={18} strokeWidth={3} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    +
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Variant Picker Modal */}
      <AnimatePresence>
        {showVariants && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay variant-picker-overlay open"
            onClick={() => setShowVariants(false)}
            style={{ zIndex: 1000 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal variant-picker-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '1.3rem',
                  color: 'var(--cream)',
                  marginBottom: '6px',
                }}
              >
                {item.name}
              </h3>
              <p
                className="variant-picker-subtitle"
                style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '20px' }}
              >
                Select your preferred size:
              </p>

              <div
                className="variant-list"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '18px',
                }}
              >
                {item.variants.map((v, i) => (
                  <motion.div
                    key={i}
                    whileHover={{
                      scale: 1.02,
                      backgroundColor: 'rgba(154, 174, 71, 0.1)',
                      borderColor: 'var(--red)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="variant-option"
                    onClick={() => {
                      addToCart(item, v);
                      setShowVariants(false);
                      setIsAdded(true);
                      setTimeout(() => setIsAdded(false), 1000);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      color: 'var(--cream)',
                      fontFamily: '"DM Sans", sans-serif',
                    }}
                  >
                    <span
                      className="variant-label"
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {v.label}
                    </span>
                    <span
                      className="variant-price"
                      style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: 'var(--red-bright)',
                      }}
                    >
                      ₱{v.price}
                    </span>
                  </motion.div>
                ))}
              </div>

              <button
                className="btn-cancel"
                onClick={() => setShowVariants(false)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
