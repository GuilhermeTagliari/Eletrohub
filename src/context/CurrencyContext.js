import React, { createContext, useContext, useState } from 'react';
import { formatBRL } from '../utils/formatters';

export const RATES = { BRL: 1, USD: 5.75, EUR: 6.20 };
export const SYMBOLS = { BRL: 'R$', USD: 'US$', EUR: '€' };
export const CURRENCY_OPTIONS = [
  { key: 'BRL', label: 'Real (R$)', flag: '🇧🇷' },
  { key: 'USD', label: 'Dólar (US$)', flag: '🇺🇸' },
  { key: 'EUR', label: 'Euro (€)', flag: '🇪🇺' },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('BRL');

  function formatPrice(priceBRL) {
    if (priceBRL == null || priceBRL === 0) return '—';
    if (currency === 'BRL') return formatBRL(priceBRL);
    const converted = priceBRL / RATES[currency];
    const [int, dec] = converted.toFixed(2).split('.');
    const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${SYMBOLS[currency]} ${intFormatted},${dec}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, RATES, SYMBOLS, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
