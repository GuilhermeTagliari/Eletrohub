import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatBRL } from '../utils/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enviarNotificacao } from '../utils/notifications';

const ChatContext = createContext(null);

// IDs de seed (1001-1004) e backend (1-99) são itens de demo.
// IDs gerados com Date.now() são itens reais criados por usuários.
function isRealUserItem(productId) {
  const str = String(productId);
  if (!str.startsWith('local-')) return false;
  const num = parseInt(str.replace('local-', ''), 10);
  return !isNaN(num) && num > 10000;
}

export function ChatProvider({ children }) {
  const [chats, setChats] = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const stored = await AsyncStorage.getItem('@eletrohub:chats');
      if (stored) setChats(JSON.parse(stored));
    } catch (_) {}
  }

  async function persist(data) {
    setChats(data);
    await AsyncStorage.setItem('@eletrohub:chats', JSON.stringify(data));
  }

  function sendMessage(chatId, { text, fromMe, productName, productId, sellerName, type, offerPrice, senderId, isRealItem, imageUri, replyTo }) {
    const existing = chats[chatId] || {
      id: chatId, productId, productName, sellerName,
      messages: [], unread: 0,
      isRealItem: isRealItem ?? isRealUserItem(productId),
    };
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const msg = {
      id: Date.now(), text: text || '', fromMe, senderId: senderId || null,
      time: now, type: type || 'text', offerPrice,
      imageUri: imageUri || null,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, fromMe: replyTo.fromMe, type: replyTo.type, imageUri: replyTo.imageUri } : null,
    };

    const updated = {
      ...existing,
      messages: [...existing.messages, msg],
      lastMessage: type === 'offer' ? `Oferta: ${formatBRL(Number(offerPrice))}` : text,
      lastTime: now,
      unread: fromMe ? existing.unread : existing.unread + 1,
    };
    const newChats = { ...chats, [chatId]: updated };
    persist(newChats);

    // Auto-resposta apenas para itens de demo (seed/backend), nunca para itens reais
    const shouldAutoReply = fromMe && !updated.isRealItem;
    if (shouldAutoReply) {
      setTimeout(() => {
        let reply, replyType = 'text', replyExtra = {};

        if (type === 'image') {
          reply = 'Boa foto! 📷 Pode me falar mais sobre o produto?';
        } else if (type === 'offer') {
          const aceita = Math.random() > 0.4;
          if (aceita) {
            reply = `Aceitei sua oferta de ${formatBRL(Number(offerPrice))}! Pode finalizar a compra. 🤝`;
            replyExtra = { offerStatus: 'accepted', offerPrice };
          } else {
            reply = `Não consigo aceitar ${formatBRL(Number(offerPrice))}. O menor que posso fazer é um desconto de 5%. 😅`;
            replyExtra = { offerStatus: 'rejected', offerPrice };
          }
        } else {
          const replies = [
            'Olá! Produto ainda disponível. 😊',
            'Sim, pode comprar! Envio rápido.',
            'Aceitamos oferta. Qual o seu melhor preço?',
            'Produto em ótimo estado, como na foto!',
            'Entrego ou pode retirar pessoalmente.',
          ];
          reply = replies[Math.floor(Math.random() * replies.length)];
        }

        const replyMsg = {
          id: Date.now() + 1, text: reply, fromMe: false, senderId: 'bot',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: replyType, ...replyExtra,
        };
        setChats(prev => {
          const chat = prev[chatId] || updated;
          const n = { ...chat, messages: [...chat.messages, replyMsg], lastMessage: reply, lastTime: replyMsg.time, unread: (chat.unread || 0) + 1 };
          const d = { ...prev, [chatId]: n };
          AsyncStorage.setItem('@eletrohub:chats', JSON.stringify(d));
          return d;
        });
        const seller = existing.sellerName || 'Vendedor';
        enviarNotificacao(
          `💬 ${seller}`,
          reply.length > 60 ? reply.slice(0, 57) + '...' : reply,
          { chatId, screen: 'Chat' }
        );
      }, 1500);
    }
  }

  function getChat(chatId) {
    return chats[chatId] || null;
  }

  function getAllChats() {
    return Object.values(chats).sort((a, b) => (b.lastTime || '') > (a.lastTime || '') ? 1 : -1);
  }

  function totalUnread() {
    return Object.values(chats).reduce((s, c) => s + (c.unread || 0), 0);
  }

  function markAllRead() {
    const updated = {};
    Object.entries(chats).forEach(([id, chat]) => {
      updated[id] = { ...chat, unread: 0 };
    });
    persist(updated);
  }

  return (
    <ChatContext.Provider value={{ chats, sendMessage, getChat, getAllChats, totalUnread, markAllRead }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
