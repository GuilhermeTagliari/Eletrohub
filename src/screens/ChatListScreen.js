import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';

export default function ChatListScreen({ navigation }) {
  const { chats: rawChats, getAllChats } = useChat();
  const { colors } = useTheme();
  // useMemo com rawChats como dep garante re-render quando novas mensagens chegam
  const chats = useMemo(() => getAllChats(), [rawChats]);
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Mensagens</Text>
        <View style={{ width: 36 }} />
      </View>

      {chats.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="chatbubble-outline" size={52} color={colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Nenhuma conversa</Text>
          <Text style={s.emptyText}>Toque em "Falar com vendedor" em um produto para iniciar.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={c => c.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.chatItem}
              onPress={() => navigation.navigate('Chat', { chatId: item.id })}
              activeOpacity={0.8}
            >
              <View style={s.avatar}>
                <Ionicons name="storefront" size={22} color="#fff" />
              </View>
              <View style={s.chatInfo}>
                <Text style={s.chatSeller} numberOfLines={1}>{item.sellerName || 'Vendedor'}</Text>
                <Text style={s.chatProduct} numberOfLines={1}>{item.productName}</Text>
                <Text style={s.chatLast} numberOfLines={1}>{item.lastMessage || 'Iniciar conversa'}</Text>
              </View>
              <View style={s.chatRight}>
                <Text style={s.chatTime}>{item.lastTime || ''}</Text>
                {item.unread > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 36 },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    list: { paddingBottom: 20 },
    chatItem: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingVertical: 16,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    chatInfo: { flex: 1 },
    chatSeller: { fontSize: 15, fontWeight: '700', color: colors.text },
    chatProduct: { fontSize: 12, color: colors.info, marginTop: 1 },
    chatLast: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
    chatRight: { alignItems: 'flex-end', gap: 6 },
    chatTime: { fontSize: 11, color: colors.textMuted },
    badge: { backgroundColor: colors.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
    emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  });
}
