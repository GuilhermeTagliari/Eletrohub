import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ADMIN_EMAIL = 'guilherme.merctagli29@gmail.com';
const STORAGE_KEY = '@eletrohub:verification';

export const SEAL_TYPES = {
  oficial: { id: 'oficial', label: 'Loja Oficial', icon: 'shield-checkmark', color: '#2c7be5', desc: 'Marca verificada e autenticada pelo EletroHub' },
  verificada: { id: 'verificada', label: 'Vendedor Verificado', icon: 'checkmark-circle', color: '#22c55e', desc: 'Identidade e documentos confirmados' },
  premium: { id: 'premium', label: 'Vendedor Premium', icon: 'star', color: '#f59e0b', desc: 'Alto desempenho em vendas e avaliações' },
  parceira: { id: 'parceira', label: 'Marca Parceira', icon: 'diamond', color: '#a855f7', desc: 'Parceiro comercial oficial EletroHub' },
};

// Milestone thresholds used by getSellerBadge / getBuyerBadge across the app
export const SELLER_LEVELS = [
  { count: 0,  label: 'Nenhum',          icon: null,               color: null },
  { count: 1,  label: 'Vendedor Ativo',  icon: 'checkmark-circle', color: '#22c55e' },
  { count: 3,  label: 'Experiente',      icon: 'ribbon',           color: '#2c7be5' },
  { count: 10, label: 'Top Vendedor',    icon: 'trophy',           color: '#ef4444' },
  { count: 30, label: 'Vendedor Elite',  icon: 'shield-checkmark', color: '#f59e0b' },
];

export const BUYER_LEVELS = [
  { count: 0,  label: 'Nenhum',              icon: null,               color: null },
  { count: 1,  label: 'Comprador Verificado',icon: 'shield-checkmark', color: '#22c55e' },
  { count: 5,  label: 'Comprador Fiel',      icon: 'heart',            color: '#2c7be5' },
  { count: 20, label: 'Comprador Frequente', icon: 'star',             color: '#ef4444' },
  { count: 50, label: 'Comprador Premium',   icon: 'diamond',          color: '#f59e0b' },
];

const VerificationContext = createContext(null);

export function VerificationProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch (_) {}
  }

  async function persist(updated) {
    setData(updated);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (_) {}
  }

  function getKey() { return user?.email || user?.id || 'anon'; }

  function getMyStatus() {
    return data[getKey()] || {
      status: 'none', sealType: null, submittedAt: null, storeInfo: null,
      sellerBadgeCount: null, buyerBadgeCount: null,
    };
  }

  // Returns override count for seller badge (null = no override, use real data)
  function getSellerBadgeOverride() {
    const s = getMyStatus();
    return s.sellerBadgeCount ?? null;
  }

  // Returns override count for buyer badge (null = no override, use real data)
  function getBuyerBadgeOverride() {
    const s = getMyStatus();
    return s.buyerBadgeCount ?? null;
  }

  async function submitVerification(storeInfo) {
    const key = getKey();
    await persist({
      ...data,
      [key]: { ...data[key], status: 'pending', sealType: null, submittedAt: new Date().toISOString(), storeInfo },
    });
  }

  // ─── Admin-only actions ───────────────────────────────────────────────────

  async function adminSetSeal(sealType) {
    if (user?.email !== ADMIN_EMAIL) return;
    const key = getKey();
    await persist({
      ...data,
      [key]: { ...data[key], status: sealType ? 'approved' : 'none', sealType: sealType || null, approvedAt: new Date().toISOString() },
    });
  }

  async function adminSetSellerBadge(count) {
    if (user?.email !== ADMIN_EMAIL) return;
    const key = getKey();
    await persist({ ...data, [key]: { ...data[key], sellerBadgeCount: count } });
  }

  async function adminSetBuyerBadge(count) {
    if (user?.email !== ADMIN_EMAIL) return;
    const key = getKey();
    await persist({ ...data, [key]: { ...data[key], buyerBadgeCount: count } });
  }

  async function adminResetAll() {
    if (user?.email !== ADMIN_EMAIL) return;
    const key = getKey();
    const updated = { ...data };
    delete updated[key];
    await persist(updated);
  }

  async function cancelRequest() {
    const key = getKey();
    const updated = { ...data };
    delete updated[key];
    await persist(updated);
  }

  function getStoreProfile() {
    return data[getKey()]?.storeProfile || null;
  }

  async function updateStoreProfile(profile) {
    const key = getKey();
    await persist({ ...data, [key]: { ...data[key], storeProfile: profile } });
  }

  return (
    <VerificationContext.Provider value={{
      isAdmin: user?.email === ADMIN_EMAIL,
      getMyStatus,
      getSellerBadgeOverride,
      getBuyerBadgeOverride,
      submitVerification,
      cancelRequest,
      adminSetSeal,
      adminSetSellerBadge,
      adminSetBuyerBadge,
      adminResetAll,
      getStoreProfile,
      updateStoreProfile,
    }}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification() {
  return useContext(VerificationContext);
}
