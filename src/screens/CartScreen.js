import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCart } from '../context/CartContext';
import { PRODUCT_IMAGE_MAP } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useCurrency, CURRENCY_OPTIONS } from '../context/CurrencyContext';
import { onTabBarScroll, TAB_BAR_INSET } from '../utils/tabBarAnim';

function adicionarDiasUteis(dias) {
  const d = new Date();
  let adicionados = 0;
  while (adicionados < dias) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) adicionados++;
  }
  return d;
}

export default function CartScreen({ navigation }) {
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const { colors, isDark } = useTheme();
  const { currency, setCurrency, formatPrice, SYMBOLS } = useCurrency();
  const [entregaTipo, setEntregaTipo] = useState('frete');
  const s = makeStyles(colors);

  function calcItemFrete(item) {
    if (item.isLocal) {
      const tipo = item.freteTipo || 'proprio';
      if (tipo === 'eletrohub') return item.freteCalculado || 19.90;
      const val = parseFloat(String(item.frete || '').replace(',', '.'));
      return isNaN(val) || val < 0 ? 0 : val;
    }
    // Backend: usa frete enriquecido pelo api.js
    if (item.frete !== undefined && item.frete !== null) {
      const val = parseFloat(String(item.frete));
      return isNaN(val) ? 19.90 : val;
    }
    return 19.90;
  }

  const freteCusto = entregaTipo === 'frete'
    ? items.reduce((sum, item) => sum + calcItemFrete(item), 0)
    : 0;
  const totalFinal = total + freteCusto;

  const dataEntrega = entregaTipo === 'frete'
    ? adicionarDiasUteis(10).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : adicionarDiasUteis(1).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  function abrirPagamento() {
    if (items.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de pagar.');
      return;
    }
    navigation.navigate('Payment', { total: totalFinal, entregaTipo });
  }

  function renderItem({ item }) {
    const priceBRL = item.convertedPrice ?? item.price ?? 0;
    // Usa o mapa como fonte autoritativa para evitar URLs antigas no carrinho
    const foto = PRODUCT_IMAGE_MAP[item.description] || item.fotos?.[0] || null;
    return (
      <View style={s.item}>
        <View style={s.thumb}>
          {foto
            ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="contain" />
            : <Ionicons name={item.isLocal ? 'storefront-outline' : 'cube-outline'} size={22} color="#fff" />}
        </View>
        <View style={s.itemInfo}>
          <Text style={s.itemName} numberOfLines={1}>{item.description || item.nome}</Text>
          <Text style={s.itemPrice}>{formatPrice(priceBRL)}</Text>
          {item.variation && <Text style={s.itemVar}>{item.variation}</Text>}
          <View style={s.qtyRow}>
            <Text style={s.qtyLabel}>QTD</Text>
            <View style={s.qtyControl}>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={s.qtyBtn}>
                <Ionicons name="remove" size={14} color={colors.text} />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={s.qtyBtn}>
                <Ionicons name="add" size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={s.removeBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <View>
          <Text style={s.title}>Carrinho</Text>
          {items.length > 0 && (
            <Text style={s.itemCount}>{items.reduce((sum, i) => sum + i.quantity, 0)} {items.length === 1 ? 'item' : 'itens'}</Text>
          )}
        </View>
        <View style={s.currencyRow}>
          {CURRENCY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[s.currencyChip, currency === opt.key && s.currencyChipActive]}
              onPress={() => setCurrency(opt.key)}
            >
              <Text style={[s.currencyText, currency === opt.key && s.currencyTextActive]}>
                {SYMBOLS[opt.key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.toggleRow}>
        {[{ key: 'local', icon: 'location-outline', label: 'Retirada local' },
          { key: 'frete', icon: 'car-outline', label: 'Frete' }].map(opt => (
          <TouchableOpacity key={opt.key} style={[s.toggleBtn, entregaTipo === opt.key && s.toggleActive]} onPress={() => setEntregaTipo(opt.key)}>
            <Ionicons name={opt.icon} size={16} color={entregaTipo === opt.key ? colors.primaryText : '#777'} />
            <Text style={[s.toggleText, entregaTipo === opt.key && s.toggleTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="bag-outline" size={64} color={colors.borderStrong} />
          <Text style={s.emptyTitle}>Carrinho vazio</Text>
          <Text style={s.emptyText}>Adicione produtos para continuar</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onScroll={e => onTabBarScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          ListFooterComponent={
            <View>
              <View style={s.shippingRow}>
                <View style={s.shippingLeft}>
                  <Ionicons
                    name={entregaTipo === 'frete' ? 'car-outline' : 'location-outline'}
                    size={16}
                    color={colors.textSecondary}
                  />
                  <View>
                    <Text style={s.shippingLabel}>
                      {entregaTipo === 'frete' ? 'Frete' : 'Retirada local'}
                    </Text>
                    <Text style={s.shippingDate}>Previsão: {dataEntrega}</Text>
                  </View>
                </View>
                <Text style={s.shippingValue}>
                  {freteCusto === 0 ? 'Grátis' : formatPrice(freteCusto)}
                </Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total</Text>
                <Text style={s.totalValue}>{formatPrice(totalFinal)}</Text>
              </View>
            </View>
          }
        />
      )}

      <View style={s.footer}>
        <TouchableOpacity style={s.btnPagamento} onPress={abrirPagamento}>
          <Ionicons name="card-outline" size={20} color={colors.primaryText} />
          <Text style={s.btnPagamentoText}>Finalizar Compra</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    itemCount: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
    currencyRow: { flexDirection: 'row', gap: 6 },
    currencyChip: {
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.borderStrong,
    },
    currencyChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    currencyText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    currencyTextActive: { color: colors.primaryText },
    toggleRow: { flexDirection: 'row', margin: 16, gap: 10 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderStrong, gap: 6 },
    toggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    toggleText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    toggleTextActive: { color: colors.primaryText },
    list: { paddingHorizontal: 16, paddingBottom: 16 },
    item: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 },
    thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
    itemPrice: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 3 },
    itemVar: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
    qtyLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.8 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    qtyNum: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center', color: colors.text },
    removeBtn: { paddingTop: 2 },
    shippingRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8,
    },
    shippingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    shippingLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    shippingDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    shippingValue: { fontSize: 13, fontWeight: '700', color: colors.text },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderTopWidth: 1.5, borderTopColor: colors.border },
    totalLabel: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
    totalValue: { fontSize: 22, fontWeight: '800', color: colors.text },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary, marginTop: 12 },
    emptyText: { fontSize: 14, color: colors.textMuted },
    footer: {
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: TAB_BAR_INSET - 16,
      backgroundColor: colors.bg,
      borderTopWidth: 1, borderTopColor: colors.border,
      alignItems: 'center',
    },
    btnPagamento: {
      backgroundColor: colors.primary, borderRadius: 16,
      paddingVertical: 17, width: '100%',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    btnPagamentoText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  });
}
