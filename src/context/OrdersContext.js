import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatBRL } from '../utils/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enviarNotificacao } from '../utils/notifications';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:orders');
      if (stored) setOrders(JSON.parse(stored));
    } catch (_) {}
  }

  async function persist(data) {
    setOrders(data);
    await AsyncStorage.setItem('@eletrohub:orders', JSON.stringify(data));
  }

  function addOrder({ items, total, entregaTipo, metodo }) {
    const primeiroItem = items[0] || {};
    const order = {
      id: Date.now(),
      productName: primeiroItem.description || primeiroItem.nome || 'Produto',
      brand: primeiroItem.brand || '',
      isLocal: primeiroItem.isLocal || false,
      items,
      total,
      value: `${formatBRL(total)}`,
      variation: primeiroItem.variation || '',
      quantity: items.reduce((s, i) => s + i.quantity, 0),
      deliveryType: entregaTipo === 'frete' ? 'Frete' : 'Local',
      daysToArrive: entregaTipo === 'frete' ? 10 : 1,
      metodo,
      statusIndex: 0,
      createdAt: Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
    };
    persist([order, ...orders]);
    enviarNotificacao(
      '✅ Pedido confirmado!',
      `${order.productName} · ${order.value}. ${order.deliveryType === 'Frete' ? 'Entrega em ~' + order.daysToArrive + ' dias úteis.' : 'Retirada local disponível.'}`,
      { screen: 'MyOrders' }
    );
    return order;
  }

  function setOrderStatus(id, statusIndex) {
    persist(orders.map(o => o.id === id ? { ...o, statusIndex, manualStatus: true } : o));
  }

  return (
    <OrdersContext.Provider value={{ orders, addOrder, setOrderStatus }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
