import React, { useState, useEffect } from 'react';
import { formatBRL } from '../utils/formatters';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAddress } from '../context/AddressContext';
import { useTheme } from '../context/ThemeContext';
import { useOrders } from '../context/OrdersContext';
import { useNotifications } from '../context/NotificationsContext';
import { useMyItems } from '../context/MyItemsContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatarCPF, validarCPF } from '../utils/cpf';

const TODOS_METODOS = [
  { key: 'pix', label: 'PIX', icon: 'flash', desc: 'Aprovação imediata' },
  { key: 'cartao', label: 'Cartão de crédito', icon: 'card', desc: 'Em até 12x' },
  { key: 'boleto', label: 'Boleto bancário', icon: 'document-text', desc: 'Vence em 3 dias' },
];

export default function PaymentScreen({ route, navigation }) {
  const { total, entregaTipo } = route.params;
  const { items, clearCart } = useCart();
  const { selected } = useAddress();
  const { colors } = useTheme();
  const { addOrder } = useOrders();
  const { addNotification } = useNotifications();
  const { registrarVenda } = useMyItems();
  const { currency, formatPrice } = useCurrency();
  const s = makeStyles(colors);

  // PIX só está disponível em BRL
  const metodos = currency === 'BRL' ? TODOS_METODOS : TODOS_METODOS.filter(m => m.key !== 'pix');
  const [metodo, setMetodo] = useState('pix');

  useEffect(() => {
    if (currency !== 'BRL' && metodo === 'pix') setMetodo('cartao');
  }, [currency]);
  const [cpf, setCpf] = useState('');
  const [cartaoNum, setCartaoNum] = useState('');
  const [cartaoNome, setCartaoNome] = useState('');
  const [cartaoVal, setCartaoVal] = useState('');
  const [cartaoCvv, setCartaoCvv] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [loading, setLoading] = useState(false);
  const [pago, setPago] = useState(false);

  function formatCartao(v) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatVal(v) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  }

  function validar() {
    if (!validarCPF(cpf)) { Alert.alert('CPF inválido', 'Verifique o CPF informado.'); return false; }
    if (metodo === 'cartao') {
      const num = cartaoNum.replace(/\s/g, '');
      if (num.length < 16) { Alert.alert('Cartão inválido', 'Número do cartão incompleto.'); return false; }
      if (!cartaoNome.trim()) { Alert.alert('Nome obrigatório', 'Informe o nome no cartão.'); return false; }
      if (cartaoVal.length < 5) { Alert.alert('Validade inválida', 'Informe a validade.'); return false; }
      if (cartaoCvv.length < 3) { Alert.alert('CVV inválido', 'CVV deve ter 3 dígitos.'); return false; }
    }
    return true;
  }

  function handlePagar() {
    if (!validar()) return;
    setLoading(true);
    // Captura os itens antes de limpar o carrinho
    const itensDoPedido = [...items];
    setTimeout(() => {
      addOrder({ items: itensDoPedido, total, entregaTipo, metodo });
      addNotification(
        'Pedido confirmado!',
        `Pagamento via ${metodo === 'pix' ? 'PIX' : metodo === 'boleto' ? 'Boleto' : 'Cartão'} aprovado. Total: ${formatPrice(total)}.`,
        { type: 'order' }
      );
      // Marca itens locais como vendidos
      itensDoPedido.forEach(item => {
        if (item.isLocal) {
          const rawId = parseInt(String(item.id).replace('local-', ''), 10);
          if (!isNaN(rawId)) registrarVenda(rawId);
        }
      });
      clearCart();
      setLoading(false);
      setPago(true);
    }, 2000);
  }

  if (pago) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <View style={s.successIcon}>
          <Ionicons name="checkmark" size={52} color="#fff" />
        </View>
        <Text style={s.successTitle}>Pagamento confirmado!</Text>
        <Text style={s.successSub}>Seu pedido foi realizado com sucesso.</Text>
        {metodo === 'pix' && (
          <View style={s.pixBox}>
            <Text style={s.pixLabel}>Chave PIX copiada</Text>
            <Text style={s.pixKey}>eletrohub@pagamento.com</Text>
          </View>
        )}
        {metodo === 'boleto' && (
          <View style={s.pixBox}>
            <Text style={s.pixLabel}>Código do Boleto</Text>
            <Text style={s.pixKey}>1234.5678 9012.3456 7890.1234 5 00010000012300</Text>
          </View>
        )}
        <TouchableOpacity style={s.btnHome} onPress={() => navigation.popToTop()}>
          <Text style={s.btnHomeText}>Voltar ao início</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Pagamento</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Resumo */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Resumo do pedido</Text>
          <View style={s.row}><Text style={s.rowLabel}>Entrega</Text><Text style={s.rowVal}>{entregaTipo === 'frete' ? 'Frete' : 'Retirada local'}</Text></View>
          {entregaTipo === 'frete' && (
            selected ? (
              <TouchableOpacity style={s.addressRow} onPress={() => navigation.navigate('Addresses')}>
                <Ionicons name="location" size={16} color={colors.success} />
                <Text style={s.addressText} numberOfLines={1}>
                  {selected.rua}, {selected.numero} — {selected.cidade}/{selected.estado}
                </Text>
                <Text style={s.addressChange}>Alterar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.addressEmpty} onPress={() => navigation.navigate('Addresses')}>
                <Ionicons name="location-outline" size={16} color={colors.warning} />
                <Text style={s.addressEmptyText}>Adicionar endereço de entrega</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )
          )}
          <View style={[s.row, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalVal}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* CPF */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>CPF do comprador</Text>
          <View style={[s.inputRow, cpf.length === 14 && (validarCPF(cpf) ? s.inputValid : s.inputInvalid)]}>
            <Ionicons name="id-card-outline" size={18} color={colors.textMuted} />
            <TextInput style={s.input} value={cpf} onChangeText={v => setCpf(formatarCPF(v))}
              placeholder="000.000.000-00" placeholderTextColor={colors.textMuted} keyboardType="numeric" maxLength={14} />
            {cpf.length === 14 && <Ionicons name={validarCPF(cpf) ? 'checkmark-circle' : 'close-circle'} size={18} color={validarCPF(cpf) ? colors.success : colors.danger} />}
          </View>
        </View>

        {/* Método */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Forma de pagamento</Text>
          {metodos.map(m => {
            const ativo = metodo === m.key;
            return (
              <TouchableOpacity key={m.key} style={[s.metodoBtn, ativo && s.metodoBtnActive]} onPress={() => setMetodo(m.key)}>
                <View style={[s.metodoIcon, ativo && s.metodoIconActive]}>
                  <Ionicons name={m.icon} size={20} color={ativo ? '#fff' : colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.metodoLabel, ativo && s.metodoLabelActive]}>{m.label}</Text>
                  <Text style={[s.metodoDesc, ativo && s.metodoDescActive]}>{m.desc}</Text>
                </View>
                <View style={[s.radio, ativo && s.radioActive]}>
                  {ativo && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PIX */}
        {metodo === 'pix' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Pagamento via PIX</Text>
            <View style={s.pixQR}>
              <View style={s.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={80} color={colors.textMuted} />
              </View>
              <Text style={s.pixInfo}>Chave: <Text style={{ fontWeight: '700' }}>eletrohub@pagamento.com</Text></Text>
              <Text style={s.pixInfo2}>O QR Code será gerado após confirmar.</Text>
            </View>
          </View>
        )}

        {/* Cartão */}
        {metodo === 'cartao' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Dados do cartão</Text>
            {[
              { label: 'Número do cartão', val: cartaoNum, set: v => setCartaoNum(formatCartao(v)), placeholder: '0000 0000 0000 0000', keyboard: 'numeric', maxLen: 19 },
              { label: 'Nome no cartão', val: cartaoNome, set: setCartaoNome, placeholder: 'Como aparece no cartão', caps: 'characters' },
            ].map(f => (
              <View key={f.label} style={s.field}>
                <Text style={s.label}>{f.label}</Text>
                <TextInput style={[s.inputRow, { paddingHorizontal: 14 }]} value={f.val} onChangeText={f.set}
                  placeholder={f.placeholder} placeholderTextColor={colors.textMuted}
                  keyboardType={f.keyboard || 'default'} maxLength={f.maxLen} autoCapitalize={f.caps} />
              </View>
            ))}
            <View style={s.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Validade</Text>
                <TextInput style={[s.inputRow, { paddingHorizontal: 14 }]} value={cartaoVal} onChangeText={v => setCartaoVal(formatVal(v))}
                  placeholder="MM/AA" placeholderTextColor={colors.textMuted} keyboardType="numeric" maxLength={5} />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>CVV</Text>
                <TextInput style={[s.inputRow, { paddingHorizontal: 14 }]} value={cartaoCvv} onChangeText={v => setCartaoCvv(v.replace(/\D/g, '').slice(0, 3))}
                  placeholder="000" placeholderTextColor={colors.textMuted} keyboardType="numeric" maxLength={3} secureTextEntry />
              </View>
            </View>
            <View style={s.field}>
              <Text style={s.label}>Parcelas</Text>
              <View style={s.parcelasRow}>
                {['1', '3', '6', '12'].map(p => (
                  <TouchableOpacity key={p} style={[s.parcelaBtn, parcelas === p && s.parcelaBtnActive]} onPress={() => setParcelas(p)}>
                    <Text style={[s.parcelaText, parcelas === p && s.parcelaTextActive]}>{p}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Boleto */}
        {metodo === 'boleto' && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Boleto bancário</Text>
            <View style={s.boletoInfo}>
              <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
              <Text style={s.boletoText}>O boleto será gerado após confirmar. Vencimento em 3 dias úteis. Após o pagamento, pode levar até 3 dias para compensar.</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnPagar} onPress={handlePagar} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="shield-checkmark" size={18} color={colors.primaryText} />
              <Text style={s.btnPagarText}>
                {metodo === 'pix' ? 'Gerar PIX' : metodo === 'boleto' ? 'Gerar Boleto' : `Pagar ${formatPrice(total)}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    content: { padding: 16, gap: 14 },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    rowLabel: { fontSize: 14, color: colors.textSecondary },
    rowVal: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
    totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    totalVal: { fontSize: 20, fontWeight: '800', color: colors.text },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 13, backgroundColor: colors.inputBg,
    },
    inputValid: { borderColor: colors.success },
    inputInvalid: { borderColor: colors.danger },
    input: { flex: 1, fontSize: 15, color: colors.text },
    metodoBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      padding: 14, borderRadius: 12, marginBottom: 10,
      borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSecondary,
    },
    metodoBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    metodoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.1)', alignItems: 'center', justifyContent: 'center' },
    metodoIconActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    metodoLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    metodoLabelActive: { color: '#fff' },
    metodoDesc: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
    metodoDescActive: { color: 'rgba(255,255,255,0.75)' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: '#fff' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
    pixQR: { alignItems: 'center', gap: 12, paddingVertical: 16 },
    qrPlaceholder: { width: 140, height: 140, backgroundColor: colors.surfaceSecondary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.borderStrong, borderStyle: 'dashed' },
    pixInfo: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
    pixInfo2: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    rowFields: { flexDirection: 'row' },
    parcelasRow: { flexDirection: 'row', gap: 10 },
    parcelaBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center' },
    parcelaBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    parcelaText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    parcelaTextActive: { color: colors.primaryText },
    boletoInfo: { flexDirection: 'row', gap: 12, backgroundColor: colors.surfaceSecondary, borderRadius: 10, padding: 14 },
    boletoText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
    addressRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.surfaceSecondary, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, marginTop: 4,
    },
    addressText: { flex: 1, fontSize: 13, color: colors.textSecondary },
    addressChange: { fontSize: 12, fontWeight: '700', color: colors.info },
    addressEmpty: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.warning + '11', borderRadius: 10, borderWidth: 1,
      borderColor: colors.warning + '44', paddingHorizontal: 12, paddingVertical: 10, marginTop: 4,
    },
    addressEmptyText: { flex: 1, fontSize: 13, color: colors.warning, fontWeight: '600' },
    footer: { padding: 16, paddingBottom: 24, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    btnPagar: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    btnPagarText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
    successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
    successSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    pixBox: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, width: '100%', marginBottom: 24 },
    pixLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
    pixKey: { fontSize: 13, fontWeight: '600', color: colors.text },
    btnHome: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40 },
    btnHomeText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  });
}
