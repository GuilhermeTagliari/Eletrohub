import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyItemsContext = createContext(null);

export function MyItemsProvider({ children }) {
  const [myItems, setMyItems] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:myitems');
      const parsed = stored ? JSON.parse(stored) : [];

      if (parsed.length > 0) {
        setMyItems(parsed);
        return;
      }

      const seeded = await AsyncStorage.getItem('@eletrohub:myitems_seeded');
      if (seeded) return;

      {
        const expira7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const expira3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        const seed = [
          {
            id: 1001, nome: 'iPhone 14 128GB', categoria: 'Smartphone',
            preco: '4500,00', fotos: [], descricao: 'Seminovo, ótimo estado.',
            emPromocao: true, desconto: 15, promocaoExpira: expira7,
            sold: 2, vendido: false, condicao: 'Seminovo',
          },
          {
            id: 1002, nome: 'Galaxy S23 256GB', categoria: 'Smartphone',
            preco: '3800,00', fotos: [], descricao: 'Completo com caixa.',
            emPromocao: true, desconto: 20, promocaoExpira: expira3,
            sold: 1, vendido: false, condicao: 'Novo',
          },
          {
            id: 1003, nome: 'Notebook Dell Inspiron 15', categoria: 'Notebook',
            preco: '2800,00', fotos: [], descricao: 'Intel i5, 8GB RAM, SSD 256GB.',
            emPromocao: true, desconto: 10, promocaoExpira: expira7,
            sold: 0, vendido: false, condicao: 'Usado',
          },
          {
            id: 1004, nome: 'Smart TV LG 55"', categoria: 'TV',
            preco: '2200,00', fotos: [], descricao: '4K UHD, 55 polegadas.',
            emPromocao: false, desconto: 0, sold: 3, vendido: false, condicao: 'Novo',
          },
        ];
        await AsyncStorage.setItem('@eletrohub:myitems', JSON.stringify(seed));
        await AsyncStorage.setItem('@eletrohub:myitems_seeded', '1');
        setMyItems(seed);
      }
    } catch (_) {}
  }

  async function persist(items) {
    setMyItems(items);
    await AsyncStorage.setItem('@eletrohub:myitems', JSON.stringify(items));
  }

  function addItem(item) {
    const newItem = { ...item, id: Date.now(), sold: 0, vendido: false };
    persist([newItem, ...myItems]);
    return newItem;
  }

  function removeItem(id) {
    persist(myItems.filter(i => i.id !== id));
  }

  function marcarVendido(id) {
    persist(myItems.map(i => i.id === id ? { ...i, vendido: !i.vendido } : i));
  }

  // Chamado ao confirmar pagamento — sempre seta vendido: true e incrementa sold
  function registrarVenda(id) {
    persist(myItems.map(i =>
      i.id === id ? { ...i, vendido: true, sold: (i.sold || 0) + 1 } : i
    ));
  }

  function promoverItem(id, desconto, duracaoDias) {
    const expira = new Date();
    expira.setDate(expira.getDate() + duracaoDias);
    persist(myItems.map(i =>
      i.id === id
        ? { ...i, emPromocao: true, desconto: Number(desconto), promocaoExpira: expira.toISOString() }
        : i
    ));
  }

  function removerPromocao(id) {
    persist(myItems.map(i =>
      i.id === id ? { ...i, emPromocao: false, promocaoExpira: null } : i
    ));
  }

  function updateItem(id, changes) {
    persist(myItems.map(i => i.id === id ? { ...i, ...changes } : i));
  }

  return (
    <MyItemsContext.Provider value={{ myItems, addItem, updateItem, removeItem, marcarVendido, registrarVenda, promoverItem, removerPromocao }}>
      {children}
    </MyItemsContext.Provider>
  );
}

export function useMyItems() {
  return useContext(MyItemsContext);
}
