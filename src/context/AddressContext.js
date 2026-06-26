import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddressContext = createContext(null);

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const a = await AsyncStorage.getItem('@eletrohub:addresses');
      const s = await AsyncStorage.getItem('@eletrohub:selectedAddress');
      if (a) setAddresses(JSON.parse(a));
      if (s) setSelectedId(s);
    } catch (_) {}
  }

  async function persist(list, selId) {
    setAddresses(list);
    await AsyncStorage.setItem('@eletrohub:addresses', JSON.stringify(list));
    if (selId !== undefined) {
      setSelectedId(selId);
      await AsyncStorage.setItem('@eletrohub:selectedAddress', selId || '');
    }
  }

  function addAddress(addr) {
    const newAddr = { ...addr, id: String(Date.now()) };
    const list = [...addresses, newAddr];
    persist(list, addresses.length === 0 ? newAddr.id : selectedId);
  }

  function removeAddress(id) {
    const list = addresses.filter(a => a.id !== id);
    persist(list, selectedId === id ? (list[0]?.id || null) : selectedId);
  }

  function selectAddress(id) {
    setSelectedId(id);
    AsyncStorage.setItem('@eletrohub:selectedAddress', id);
  }

  const selected = addresses.find(a => a.id === selectedId) || null;

  return (
    <AddressContext.Provider value={{ addresses, selected, addAddress, removeAddress, selectAddress }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  return useContext(AddressContext);
}
