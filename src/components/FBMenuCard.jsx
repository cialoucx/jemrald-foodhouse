import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { getCategoryIcon } from './JapaneseIcons';
import { Check, Image as ImageIcon } from 'lucide-react';

export default function FBMenuCard({ item, available = true }) {
  const { addToCart } = useCart();
  const [showVariants, setShowVariants] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const hasVariants = item.variants && item.variants.length > 0;
  const hasMultipleVariants = item.variants && item.variants.length > 1;

  const lowestPrice = hasMultipleVariants
    ? Math.min(...item.variants.map((v) => v.price))
    : hasVariants
      ? item.variants[0].price
      : item.price;

  const customImages = {
    // Specific combos
    '50pcs california maki and 18pcs harumaki salad': '/images/california-maki-harumaki-salad-combo.jpg',
    '50pcs california maki & 18pcs harumaki salad': '/images/california-maki-harumaki-salad-combo.jpg',
    'california maki & 18pcs harumaki salad': '/images/california-maki-harumaki-salad-combo.jpg',
    'california maki and 18pcs harumaki salad': '/images/california-maki-harumaki-salad-combo.jpg',
    '50pcs mix maki and 18pcs harumaki salad': '/images/50pcs California maki and 18pcs Harumaki salad ₱1k.jpg',
    '50pcs mix maki & 18pcs harumaki salad': '/images/50pcs California maki and 18pcs Harumaki salad ₱1k.jpg',
    '30pcs crabgo and 30pcs california maki': '/images/30pcs Crabgo and 30pcs california maki ₱950.jpg',
    '30pcs crabgo & 30pcs california maki': '/images/30pcs Crabgo and 30pcs california maki ₱950.jpg',

    // Set promos
    'set a': '/images/set a.jpg',
    'set b': '/images/set-b-promo.jpg',
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
    '50pcs cheesy overload california maki': '/images/10pcs cheesy overload california maki ₱170.jpg',
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
    'mix maki with dedication': '/images/80pcs. mix maki ₱1k.jpg',
    '100pcs mix maki': '/images/100pcs. Mix maki ₱1350.jpg',
    'all flavors mix': '/images/all-flavors-mix.jpg',
    'bundle (all flavors)': '/images/bundle-all-flavors.jpg',
    'bundle': '/images/bundle-all-flavors.jpg',

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
  const hasCustomImage = !!item.imageUrl || !!matchedCustomImage;
  const customImagePath = item.imageUrl || (hasCustomImage ? matchedCustomImage[1] : null);

  return (
    <>
      <div className={`fb-menu-card ${item.stock === 0 || !available ? 'oos' : ''}`}>
        <div className="fb-card-img-wrapper" style={{ background: hasCustomImage ? '#ffffff' : '#f1f5f9' }}>
          {hasCustomImage ? (
            <img
              src={customImagePath}
              alt={item.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sibling = e.currentTarget.nextSibling;
                if (sibling) sibling.style.display = 'flex';
                e.currentTarget.parentElement.style.backgroundColor = '#f1f5f9';
              }}
            />
          ) : null}
          <div
            className="fb-card-placeholder"
            style={{
              display: hasCustomImage ? 'none' : 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon size={32} strokeWidth={1.5} style={{ color: '#94a3b8' }} />
          </div>
          
          {item.stock === 0 && <div className="fb-card-oos-overlay">Out of Stock</div>}
          {item.stock > 0 && !available && <div className="fb-card-oos-overlay">Unavailable</div>}
          {item.stock > 0 && available && item.stock <= 5 && (
            <div className="fb-card-low-overlay">Only {item.stock} left</div>
          )}
        </div>

        <div className="fb-card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1, minWidth: 0 }}>
            <div className="fb-card-name">{item.name}</div>
            {item.desc && <div className="fb-card-desc">{item.desc}</div>}
            <div className="fb-card-price" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {hasMultipleVariants ? `From ₱${lowestPrice}` : `₱${lowestPrice}`}
              {!hasMultipleVariants && hasVariants && (
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}> · {item.variants[0].label.replace('pcs', ' pcs')}</span>
              )}
            </div>
          </div>

          <button
            className={`fb-add-btn ${(item.stock === 0 || !available) ? 'oos-btn' : ''}`}
            onClick={() => {
              if (item.stock === 0 || !available) return;
              if (hasMultipleVariants) {
                setSelectedVariant(item.variants[0]);
                setShowVariants(true);
              } else if (hasVariants) {
                addToCart(item, item.variants[0]);
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 1000);
              } else {
                addToCart(item);
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 1000);
              }
            }}
            disabled={item.stock === 0 || !available}
            aria-label={`Add ${item.name} to cart`}
          >
            <AnimatePresence mode="wait">
              {isAdded ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Check size={16} strokeWidth={3} />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  +
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Variant Picker Bottom Sheet */}
      <AnimatePresence>
        {showVariants && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay variant-picker-overlay open"
            onClick={() => setShowVariants(false)}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#ffffff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px 20px',
                boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.15)',
                color: '#1e293b',
                fontFamily: '"DM Sans", sans-serif',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  borderRadius: '2px',
                  background: '#e2e8f0',
                  margin: '0 auto 16px auto',
                }}
              />
              <h3
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '1.25rem',
                  color: '#0f172a',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                {item.name}
              </h3>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  marginBottom: '20px',
                }}
              >
                Select your preferred size:
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '24px',
                }}
              >
                {item.variants.map((v, i) => {
                  const isSelected = selectedVariant && selectedVariant.label === v.label;
                  return (
                    <motion.div
                      key={i}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        background: isSelected ? 'rgba(198, 40, 57, 0.05)' : '#ffffff',
                        border: `1.5px solid ${isSelected ? '#C62839' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        padding: '16px 20px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? '#C62839' : '#1e140f',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontFamily: '"Outfit", sans-serif',
                        }}
                      >
                        {v.label}
                      </span>
                      <span
                        style={{
                          fontFamily: '"Outfit", sans-serif',
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: isSelected ? '#C62839' : '#1e140f',
                        }}
                      >
                        ₱{v.price}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  if (selectedVariant) {
                    addToCart(item, selectedVariant);
                    setShowVariants(false);
                    setIsAdded(true);
                    setTimeout(() => setIsAdded(false), 1000);
                  }
                }}
                style={{
                  background: '#C62839',
                  border: 'none',
                  color: '#ffffff',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: '"Outfit", sans-serif',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 4px 12px rgba(198, 40, 57, 0.2)',
                }}
              >
                Add to cart · ₱{selectedVariant ? selectedVariant.price : 0}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
