import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    // Try to load from localStorage for persistence
    const saved = localStorage.getItem('jemrald_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem('jemrald_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, variantInfo = null) => {
    let isVariant = variantInfo !== null;
    let targetId = item.id;
    let targetName = isVariant ? `${item.name} (${variantInfo.label})` : item.name;
    let targetPrice = isVariant ? variantInfo.price : item.price;
    let cartKey = isVariant ? `${item.id}-${variantInfo.label}` : `${item.id}-base`;

    const existingIndex = cart.findIndex((c) => c.cartKey === cartKey);

    if (existingIndex > -1) {
      if (cart[existingIndex].qty >= item.stock) {
        showToast('Cannot add more than available stock', true);
        return;
      }

      const newCart = [...cart];
      newCart[existingIndex].qty += 1;
      setCart(newCart);
      showToast(`Added another ${targetName} to cart.`);
    } else {
      setCart((prevCart) => [
        ...prevCart,
        {
          id: targetId,
          cartKey,
          name: targetName,
          price: targetPrice,
          qty: 1,
          category: item.category,
        },
      ]);
      showToast(`Added ${targetName} to cart!`);
    }
  };

  const changeQty = (cartKey, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((c) => {
          if (c.cartKey === cartKey) {
            const newQty = c.qty + delta;
            return { ...c, qty: newQty };
          }
          return c;
        })
        .filter((c) => c.qty > 0);
    });
  };

  const clearCart = () => setCart([]);

  const toggleCart = () => setIsCartOpen((prev) => !prev);
  const closeCart = () => setIsCartOpen(false);
  const openCart = () => setIsCartOpen(true);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        changeQty,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        toggleCart,
        closeCart,
        openCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
