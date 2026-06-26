import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNotifications } from '../context/NotificationsContext';
import { useTheme } from '../context/ThemeContext';
import { TAB_BAR_INSET, onTabBarScroll } from '../utils/tabBarAnim';

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

const TYPE_ICONS = {
  order:   { icon: 'bag-check-outline',     color: '#34c759' },
  promo:   { icon: 'pricetag-outline',      color: '#ff9f0a' },
  chat:    { icon: 'chatbubble-outline',    color: '#007aff' },
  payment: { icon: 'card-outline',          color: '#5ac8fa' },
  default: { icon: 'notifications-outline', color: '#aaa'    },
};

function resolveType(data) {
  if (data?.type) return TYPE_ICONS[data.type] || TYPE_ICONS.default;
  return TYPE_ICONS.default;
}

export default function NotificationsScreen({ navigation }) {
  const { notifs, markAllRead, clearAll } = useNotifications();
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);

  useEffect(() => {
    markAllRead();
  }, []);

  function renderItem({ item }) {
    const { icon, color } = resolveType(item.data);
    return (
      <View style={[s.card, !item.read && s.cardUnread]}>
        <View style={[s.iconBox, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={s.content}>
          {item.title ? <Text style={s.cardTitle}>{item.title}</Text> : null}
          <Text style={s.cardText}>{item.body}</Text>
          <Text style={s.time}>{timeAgo(item.receivedAt)}</Text>
        </View>
        {!item.read && <View style={s.dot} />}
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Notificações</Text>
        {notifs.length > 0 ? (
          <TouchableOpacity onPress={clearAll} style={s.clearBtn}>
            <Text style={s.clearText}>Limpar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      {notifs.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="notifications-off-outline" size={56} color={colors.textMuted} />
          <Text style={s.emptyTitle}>Sem notificações</Text>
          <Text style={s.emptyText}>As notificações recebidas aparecem aqui.</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onScroll={e => onTabBarScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
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
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 36, justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    clearBtn: { paddingHorizontal: 4, paddingVertical: 4 },
    clearText: { fontSize: 14, fontWeight: '600', color: '#ff4757' },
    list: { padding: 16, gap: 10, paddingBottom: TAB_BAR_INSET + 8 },
    card: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      backgroundColor: colors.surface, borderRadius: 14, padding: 14,
      shadowColor: '#000', shadowOpacity: 0.06,
      shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
    },
    cardUnread: { borderLeftWidth: 3, borderLeftColor: '#007aff' },
    iconBox: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    content: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
    cardText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    time: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    dot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: '#007aff', marginTop: 5, flexShrink: 0,
    },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  });
}
