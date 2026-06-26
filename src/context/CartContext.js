import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:cart');
      if (stored) setItems(JSON.parse(stored));
    } catch (_) {}
  }

  async function persist(newItems) {
    setItems(newItems);
    await AsyncStorage.setItem('@eletrohub:cart', JSON.stringify(newItems));
  }

  function addToCart(product) {
    const existing = items.find((i) => i.id === product.id);
    if (existing) {
      persist(
        items.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      persist([...items, { ...product, quantity: 1 }]);
    }
  }

  function removeFromCart(id) {
    persist(items.filter((i) => i.id !== id));
  }

  function updateQuantity(id, quantity) {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      persist(items.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  }

  function clearCart() {
    persist([]);
  }

  const total = items.reduce(
    (sum, i) => sum + (i.convertedPrice ?? i.price ?? 0) * i.quantity,
    0
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
