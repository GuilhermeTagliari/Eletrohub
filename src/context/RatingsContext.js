import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RatingsContext = createContext(null);

export function RatingsProvider({ children }) {
  const [ratings, setRatings] = useState({});
  const [sellerRatings, setSellerRatings] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:ratings');
      if (stored) setRatings(JSON.parse(stored));
      const sellers = await AsyncStorage.getItem('@eletrohub:sellerRatings');
      if (sellers) setSellerRatings(JSON.parse(sellers));
    } catch (_) {}
  }

  async function persist(data) {
    setRatings(data);
    await AsyncStorage.setItem('@eletrohub:ratings', JSON.stringify(data));
  }

  function addRating(productId, { stars, comment, userName }) {
    const key = String(productId);
    const existing = ratings[key] || [];
    const newRating = {
      id: Date.now(),
      stars,
      comment,
      userName,
      date: new Date().toLocaleDateString('pt-BR'),
    };
    persist({ ...ratings, [key]: [newRating, ...existing] });
  }

  function getRatings(productId) {
    return ratings[String(productId)] || [];
  }

  function getAverage(productId) {
    const list = getRatings(productId);
    if (!list.length) return 0;
    return list.reduce((s, r) => s + r.stars, 0) / list.length;
  }

  function addSellerRating(sellerKey, { stars, comment, userName }) {
    const key = String(sellerKey);
    const existing = sellerRatings[key] || [];
    const newRating = {
      id: Date.now(),
      stars,
      comment,
      userName,
      date: new Date().toLocaleDateString('pt-BR'),
    };
    const updated = { ...sellerRatings, [key]: [newRating, ...existing] };
    setSellerRatings(updated);
    AsyncStorage.setItem('@eletrohub:sellerRatings', JSON.stringify(updated));
  }

  function getSellerRatings(sellerKey) {
    return sellerRatings[String(sellerKey)] || [];
  }

  function getSellerAverage(sellerKey) {
    const list = getSellerRatings(sellerKey);
    if (!list.length) return 0;
    return list.reduce((s, r) => s + r.stars, 0) / list.length;
  }

  return (
    <RatingsContext.Provider value={{ addRating, getRatings, getAverage, addSellerRating, getSellerRatings, getSellerAverage }}>
      {children}
    </RatingsContext.Provider>
  );
}

export function useRatings() {
  return useContext(RatingsContext);
}
