import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } catch (_) {}
  }

  async function persist(items) {
    setFavorites(items);
    await AsyncStorage.setItem('@eletrohub:favorites', JSON.stringify(items));
  }

  function toggle(product) {
    const exists = favorites.find(f => f.id === product.id);
    if (exists) {
      persist(favorites.filter(f => f.id !== product.id));
    } else {
      persist([...favorites, product]);
    }
  }

  function isFavorite(id) {
    return favorites.some(f => f.id === id);
  }

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
