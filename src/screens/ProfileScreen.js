import React, { useCallback } from 'react';
import { onTabBarScroll, TAB_BAR_INSET } from '../utils/tabBarAnim';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useMyItems } from '../context/MyItemsContext';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrdersContext';
import { useVerification, SEAL_TYPES } from '../context/VerificationContext';

function getSellerBadge(n) {
  if (n >= 30) return { label: 'Vendedor Elite', icon: 'shield-checkmark', color: '#f59e0b' };
  if (n >= 10) return { label: 'Top Vendedor', icon: 'trophy', color: '#ef4444' };
  if (n >= 3)  return { label: 'Experiente', icon: 'ribbon', color: '#2c7be5' };
  if (n >= 1)  return { label: 'Vendedor Ativo', icon: 'checkmark-circle', color: '#22c55e' };
  return null;
}

function getBuyerBadge(n) {
  if (n >= 50) return { label: 'Comprador Premium', icon: 'diamond', color: '#f59e0b' };
  if (n >= 20) return { label: 'Comprador Frequente', icon: 'star', color: '#ef4444' };
  if (n >= 5)  return { label: 'Comprador Fiel', icon: 'heart', color: '#2c7be5' };
  if (n >= 1)  return { label: 'Comprador Verificado', icon: 'shield-checkmark', color: '#22c55e' };
  return null;
}

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { myItems } = useMyItems();
  const { items: cartItems } = useCart();
  const { markAllRead } = useChat();
  const { colors, isDark } = useTheme();
  const { orders } = useOrders();
  const { getMyStatus, getSellerBadgeOverride, getBuyerBadgeOverride } = useVerification();

  useFocusEffect(useCallback(() => {
    markAllRead();
  }, []));
  const s = makeStyles(colors);

  function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const verStatus = getMyStatus();
  const storeSeal = verStatus.status === 'approved' && verStatus.sealType ? SEAL_TYPES[verStatus.sealType] : null;

  const sellerOverride = getSellerBadgeOverride();
  const buyerOverride = getBuyerBadgeOverride();
  const soldCount = sellerOverride ?? myItems.filter(i => i.vendido).length;
  const ordersCount = buyerOverride ?? orders.length;
  const sellerBadge = getSellerBadge(soldCount);
  const buyerBadge = getBuyerBadge(ordersCount);

  const menuItems = [
    {
      icon: 'storefront-outline', label: 'Minha loja', badge: myItems.length,
      onPress: () => navigation.navigate('SellerProfile', { sellerKey: user?.email || 'eu', sellerName: user?.name || 'Minha Loja', isLocal: true }),
    },
    { icon: 'list-outline', label: 'Gerenciar anúncios', onPress: () => navigation.navigate('MyItems') },
    { icon: 'calendar-outline', label: 'Meus Pedidos', onPress: () => navigation.navigate('MyOrders') },
    { icon: 'chatbubble-outline', label: 'Mensagens', onPress: () => navigation.navigate('ChatList') },
    { icon: 'notifications-outline', label: 'Notificações', onPress: () => navigation.navigate('Notifications') },
    { icon: 'settings-outline', label: 'Configurações', onPress: () => navigation.navigate('Settings') },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <Text style={s.title}>Conta</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={e => onTabBarScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* Avatar e info */}
        <View style={s.profileCard}>
          <View style={s.avatarWrapper}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={s.avatarImg} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.initials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={s.profileInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.userName}>{user?.name || 'Usuário'}</Text>
              {storeSeal && <Ionicons name={storeSeal.icon} size={16} color={storeSeal.color} />}
            </View>
            {storeSeal && (
              <View style={[s.profileBadge, { backgroundColor: storeSeal.color + '18', marginTop: 2, alignSelf: 'flex-start' }]}>
                <Ionicons name={storeSeal.icon} size={10} color={storeSeal.color} />
                <Text style={[s.profileBadgeText, { color: storeSeal.color }]}>{storeSeal.label}</Text>
              </View>
            )}
            <Text style={s.userEmail}>{user?.email || ''}</Text>
            {(user?.cpf || user?.cnpj) && (
              <View style={s.docRow}>
                <Ionicons name="id-card-outline" size={12} color={colors.textMuted} />
                <Text style={s.docText}>
                  {user.docType === 'cnpj' && user.cnpj
                    ? `CNPJ: ${user.cnpj}`
                    : user.cpf
                      ? `CPF: ${'•'.repeat(3)}.${user.cpf.slice(4, 7)}.${user.cpf.slice(8, 11)}-${user.cpf.slice(12)}`
                      : ''}
                </Text>
              </View>
            )}
            <View style={s.badgesRow}>
              {sellerBadge && (
                <View style={[s.profileBadge, { backgroundColor: sellerBadge.color + '22' }]}>
                  <Ionicons name={sellerBadge.icon} size={11} color={sellerBadge.color} />
                  <Text style={[s.profileBadgeText, { color: sellerBadge.color }]}>{sellerBadge.label}</Text>
                </View>
              )}
              {buyerBadge && (
                <View style={[s.profileBadge, { backgroundColor: buyerBadge.color + '22' }]}>
                  <Ionicons name={buyerBadge.icon} size={11} color={buyerBadge.color} />
                  <Text style={[s.profileBadgeText, { color: buyerBadge.color }]}>{buyerBadge.label}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{myItems.length}</Text>
            <Text style={s.statLabel}>Anúncios</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{cartItems.length}</Text>
            <Text style={s.statLabel}>No carrinho</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statNum}>{orders.length}</Text>
            <Text style={s.statLabel}>Pedidos</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menu}>
          <Text style={s.menuSection}>Atividade</Text>
          {menuItems.map((item, idx) => (
            <TouchableOpacity key={idx} style={s.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <View style={s.menuLeft}>
                <View style={s.menuIconBox}>
                  <Ionicons name={item.icon} size={20} color={colors.text} />
                </View>
                <Text style={s.menuLabel}>{item.label}</Text>
              </View>
              <View style={s.menuRight}>
                {item.badge > 0 && (
                  <View style={s.menuBadge}>
                    <Text style={s.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={s.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: TAB_BAR_INSET + 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: 20, paddingVertical: 16,
      backgroundColor: colors.bg,
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    profileCard: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12,
      borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border,
    },
    avatarWrapper: { position: 'relative' },
    avatarImg: { width: 64, height: 64, borderRadius: 32 },
    avatar: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    initials: { color: colors.primaryText, fontSize: 22, fontWeight: '800' },
    profileInfo: { flex: 1, marginLeft: 4 },
    userName: { fontSize: 18, fontWeight: '700', color: colors.text },
    userEmail: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
    docRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    docText: { fontSize: 11, color: colors.textMuted },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    profileBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    profileBadgeText: { fontSize: 10, fontWeight: '700' },
    statsRow: {
      flexDirection: 'row', backgroundColor: colors.surface,
      marginHorizontal: 16, marginBottom: 20, borderRadius: 16,
      paddingVertical: 16, borderWidth: 1, borderColor: colors.border,
    },
    stat: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
    statDivider: { width: 1, backgroundColor: colors.border },
    menu: {
      backgroundColor: colors.surface, marginHorizontal: 16,
      borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border,
      marginBottom: 16,
    },
    menuSection: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
      textTransform: 'uppercase', letterSpacing: 0.8,
    },
    menuItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 15,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    menuIconBox: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center',
    },
    menuLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
    menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    menuBadge: {
      backgroundColor: colors.primary, borderRadius: 10,
      paddingHorizontal: 7, paddingVertical: 2,
    },
    menuBadgeText: { color: colors.primaryText, fontSize: 11, fontWeight: '700' },
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginHorizontal: 16, padding: 15, borderRadius: 14,
      borderWidth: 1.5, borderColor: colors.danger + '44',
      backgroundColor: colors.danger + '11',
    },
    logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  });
}
