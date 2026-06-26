import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  useVerification, SEAL_TYPES, SELLER_LEVELS, BUYER_LEVELS,
} from '../context/VerificationContext';
import { showToast } from '../utils/toast';

const ACCOUNT_TYPES = ['Loja', 'Marca', 'Revendedor', 'Fabricante'];

// ─── Admin section component ─────────────────────────────────────────────────
function AdminSection({ title, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={adm.section}>
      <TouchableOpacity style={adm.sectionHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <Ionicons name={icon} size={15} color="#f59e0b" />
        <Text style={adm.sectionTitle}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#f59e0b" />
      </TouchableOpacity>
      {open && <View style={adm.sectionBody}>{children}</View>}
    </View>
  );
}

const adm = StyleSheet.create({
  section: { marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  sectionTitle: { flex: 1, fontSize: 12, fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBody: { gap: 8, marginTop: 4 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function VerificationScreen({ navigation }) {
  const { colors } = useTheme();
  const {
    isAdmin, getMyStatus,
    submitVerification, cancelRequest,
    adminSetSeal, adminSetSellerBadge, adminSetBuyerBadge, adminResetAll,
  } = useVerification();
  const s = makeStyles(colors);

  const status = getMyStatus();
  const [loading, setLoading] = useState(false);

  // Form
  const [nomeLoja, setNomeLoja] = useState(status.storeInfo?.nomeLoja || '');
  const [cnpj, setCnpj] = useState(status.storeInfo?.cnpj || '');
  const [site, setSite] = useState(status.storeInfo?.site || '');
  const [tipoIdx, setTipoIdx] = useState(Math.max(0, ACCOUNT_TYPES.indexOf(status.storeInfo?.tipo)));
  const [sobre, setSobre] = useState(status.storeInfo?.sobre || '');

  const currentSeal = status.sealType ? SEAL_TYPES[status.sealType] : null;
  const currentSeller = status.sellerBadgeCount ?? null;
  const currentBuyer = status.buyerBadgeCount ?? null;

  async function handleSubmit() {
    if (!nomeLoja.trim()) { showToast('Informe o nome da loja', 'error'); return; }
    if (!cnpj.trim()) { showToast('Informe o CNPJ', 'error'); return; }
    setLoading(true);
    await submitVerification({ nomeLoja: nomeLoja.trim(), cnpj: cnpj.trim(), site: site.trim(), tipo: ACCOUNT_TYPES[tipoIdx], sobre: sobre.trim() });
    setLoading(false);
    showToast('Solicitação enviada! Em análise.', 'success');
  }

  async function handleCancel() {
    Alert.alert('Cancelar solicitação', 'Deseja retirar sua solicitação?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', style: 'destructive', onPress: async () => { await cancelRequest(); showToast('Solicitação cancelada', 'info'); } },
    ]);
  }

  async function handleAdminSeal(sealId) {
    const already = status.sealType === sealId && status.status === 'approved';
    await adminSetSeal(already ? null : sealId);
    showToast(already ? 'Selo removido' : `"${SEAL_TYPES[sealId].label}" ativado!`, already ? 'info' : 'success');
  }

  async function handleAdminSellerBadge(count) {
    const already = currentSeller === count;
    await adminSetSellerBadge(already ? null : count);
    const level = SELLER_LEVELS.find(l => l.count === count);
    showToast(already ? 'Badge de vendedor removido' : `Badge "${level?.label}" ativado!`, already ? 'info' : 'success');
  }

  async function handleAdminBuyerBadge(count) {
    const already = currentBuyer === count;
    await adminSetBuyerBadge(already ? null : count);
    const level = BUYER_LEVELS.find(l => l.count === count);
    showToast(already ? 'Badge de comprador removido' : `Badge "${level?.label}" ativado!`, already ? 'info' : 'success');
  }

  async function handleResetAll() {
    Alert.alert('Resetar tudo', 'Remove todos os selos e badges do admin. Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resetar', style: 'destructive', onPress: async () => { await adminResetAll(); showToast('Tudo resetado', 'info'); } },
    ]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Verificação</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── Admin panel ── */}
        {isAdmin && (
          <View style={s.adminCard}>
            <View style={s.adminTitleRow}>
              <View style={s.adminIconBox}>
                <Ionicons name="construct" size={16} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.adminTitle}>Painel de Demonstração</Text>
                <Text style={s.adminSub}>Ative qualquer recurso instantaneamente para apresentação</Text>
              </View>
            </View>

            {/* Selos de verificação */}
            <AdminSection title="Selos de verificação" icon="shield-checkmark-outline">
              {Object.values(SEAL_TYPES).map(seal => {
                const active = status.sealType === seal.id && status.status === 'approved';
                return (
                  <TouchableOpacity
                    key={seal.id}
                    style={[s.adminRow, { borderColor: active ? seal.color : colors.border, backgroundColor: active ? seal.color + '18' : colors.surfaceSecondary }]}
                    onPress={() => handleAdminSeal(seal.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={seal.icon} size={20} color={seal.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.adminRowLabel, { color: active ? seal.color : colors.text }]}>{seal.label}</Text>
                      <Text style={s.adminRowDesc}>{seal.desc}</Text>
                    </View>
                    <View style={[s.adminToggle, active && { backgroundColor: seal.color }]}>
                      {active && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </AdminSection>

            {/* Badge de vendedor */}
            <AdminSection title="Badge de vendedor" icon="storefront-outline">
              <View style={s.chipRow}>
                {SELLER_LEVELS.filter(l => l.count > 0).map(level => {
                  const active = currentSeller === level.count;
                  return (
                    <TouchableOpacity
                      key={level.count}
                      style={[s.chip, active && { backgroundColor: level.color, borderColor: level.color }]}
                      onPress={() => handleAdminSellerBadge(level.count)}
                      activeOpacity={0.75}
                    >
                      {level.icon && <Ionicons name={level.icon} size={13} color={active ? '#fff' : level.color} />}
                      <Text style={[s.chipText, active && { color: '#fff' }]}>{level.label}</Text>
                    </TouchableOpacity>
                  );
                })}
                {currentSeller !== null && (
                  <TouchableOpacity style={[s.chip, { borderColor: colors.danger }]} onPress={() => handleAdminSellerBadge(currentSeller)}>
                    <Ionicons name="close" size={13} color={colors.danger} />
                    <Text style={[s.chipText, { color: colors.danger }]}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
            </AdminSection>

            {/* Badge de comprador */}
            <AdminSection title="Badge de comprador" icon="bag-outline">
              <View style={s.chipRow}>
                {BUYER_LEVELS.filter(l => l.count > 0).map(level => {
                  const active = currentBuyer === level.count;
                  return (
                    <TouchableOpacity
                      key={level.count}
                      style={[s.chip, active && { backgroundColor: level.color, borderColor: level.color }]}
                      onPress={() => handleAdminBuyerBadge(level.count)}
                      activeOpacity={0.75}
                    >
                      {level.icon && <Ionicons name={level.icon} size={13} color={active ? '#fff' : level.color} />}
                      <Text style={[s.chipText, active && { color: '#fff' }]}>{level.label}</Text>
                    </TouchableOpacity>
                  );
                })}
                {currentBuyer !== null && (
                  <TouchableOpacity style={[s.chip, { borderColor: colors.danger }]} onPress={() => handleAdminBuyerBadge(currentBuyer)}>
                    <Ionicons name="close" size={13} color={colors.danger} />
                    <Text style={[s.chipText, { color: colors.danger }]}>Remover</Text>
                  </TouchableOpacity>
                )}
              </View>
            </AdminSection>

            {/* Estado atual resumido */}
            <View style={s.adminSummary}>
              <Text style={s.adminSummaryTitle}>Estado atual</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryKey}>Selo:</Text>
                {currentSeal ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name={currentSeal.icon} size={13} color={currentSeal.color} />
                    <Text style={[s.summaryVal, { color: currentSeal.color }]}>{currentSeal.label}</Text>
                  </View>
                ) : <Text style={s.summaryValMuted}>Nenhum</Text>}
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryKey}>Vendedor:</Text>
                {currentSeller !== null
                  ? <Text style={s.summaryVal}>{SELLER_LEVELS.find(l => l.count === currentSeller)?.label || '—'}</Text>
                  : <Text style={s.summaryValMuted}>Real (baseado em vendas)</Text>}
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryKey}>Comprador:</Text>
                {currentBuyer !== null
                  ? <Text style={s.summaryVal}>{BUYER_LEVELS.find(l => l.count === currentBuyer)?.label || '—'}</Text>
                  : <Text style={s.summaryValMuted}>Real (baseado em pedidos)</Text>}
              </View>
            </View>

            <TouchableOpacity style={s.resetBtn} onPress={handleResetAll}>
              <Ionicons name="refresh-outline" size={15} color={colors.danger} />
              <Text style={s.resetText}>Resetar tudo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status aprovado */}
        {status.status === 'approved' && currentSeal && (
          <View style={[s.statusCard, { borderColor: currentSeal.color + '55', backgroundColor: currentSeal.color + '0d' }]}>
            <Ionicons name={currentSeal.icon} size={32} color={currentSeal.color} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusTitle, { color: currentSeal.color }]}>Verificação aprovada</Text>
              <Text style={s.statusSub}>{currentSeal.label} — {currentSeal.desc}</Text>
            </View>
          </View>
        )}

        {/* Status pendente */}
        {status.status === 'pending' && (
          <View style={[s.statusCard, { borderColor: '#f59e0b55', backgroundColor: '#f59e0b0d' }]}>
            <Ionicons name="time-outline" size={32} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusTitle, { color: '#f59e0b' }]}>Em análise</Text>
              <Text style={s.statusSub}>Sua solicitação foi enviada e está sendo revisada. Prazo: até 5 dias úteis.</Text>
            </View>
          </View>
        )}

        {/* Info selos */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>O que é a verificação de loja?</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            {Object.values(SEAL_TYPES).map(seal => (
              <View key={seal.id} style={s.sealInfo}>
                <Ionicons name={seal.icon} size={20} color={seal.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.sealName, { color: seal.color }]}>{seal.label}</Text>
                  <Text style={s.sealDesc}>{seal.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Formulário de solicitação */}
        {(status.status === 'none' || status.status === 'rejected') && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>Solicitar verificação</Text>
            <Text style={s.formSub}>Preencha os dados abaixo. Nossa equipe irá analisar e entrar em contato.</Text>

            <Text style={s.label}>Nome da loja *</Text>
            <TextInput style={s.input} value={nomeLoja} onChangeText={setNomeLoja} placeholder="Ex: TechStore Brasil" placeholderTextColor={colors.textMuted} />

            <Text style={s.label}>CNPJ *</Text>
            <TextInput style={s.input} value={cnpj} onChangeText={setCnpj} placeholder="00.000.000/0001-00" placeholderTextColor={colors.textMuted} keyboardType="numeric" />

            <Text style={s.label}>Site (opcional)</Text>
            <TextInput style={s.input} value={site} onChangeText={setSite} placeholder="https://sujaloja.com.br" placeholderTextColor={colors.textMuted} autoCapitalize="none" />

            <Text style={s.label}>Tipo de conta</Text>
            <View style={s.typeRow}>
              {ACCOUNT_TYPES.map((t, i) => (
                <TouchableOpacity
                  key={t}
                  style={[s.typeBtn, tipoIdx === i && { backgroundColor: colors.primary }]}
                  onPress={() => setTipoIdx(i)}
                >
                  <Text style={[s.typeBtnText, tipoIdx === i && { color: colors.primaryText }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Sobre a loja</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={sobre}
              onChangeText={setSobre}
              placeholder="Descreva sua loja, produtos e diferenciais..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <Ionicons name="send-outline" size={18} color="#fff" />
                  <Text style={s.submitText}>Enviar solicitação</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {status.status === 'pending' && (
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
            <Text style={s.cancelText}>Cancelar solicitação</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: colors.text },
    content: { padding: 16, gap: 16 },

    adminCard: {
      backgroundColor: '#f59e0b0a', borderRadius: 18,
      padding: 16, borderWidth: 1.5, borderColor: '#f59e0b44',
    },
    adminTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
    adminIconBox: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: '#f59e0b22', alignItems: 'center', justifyContent: 'center',
    },
    adminTitle: { fontSize: 14, fontWeight: '800', color: '#f59e0b' },
    adminSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

    adminRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderWidth: 1.5, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12,
    },
    adminRowLabel: { fontSize: 14, fontWeight: '700' },
    adminRowDesc: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    adminToggle: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 1.5, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

    adminSummary: {
      marginTop: 14, backgroundColor: colors.bg,
      borderRadius: 12, padding: 12, gap: 6,
    },
    adminSummaryTitle: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryKey: { fontSize: 12, color: colors.textMuted, width: 80 },
    summaryVal: { fontSize: 12, fontWeight: '700', color: colors.text },
    summaryValMuted: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },

    resetBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      marginTop: 14, paddingVertical: 10,
      borderWidth: 1, borderColor: colors.danger + '44', borderRadius: 10,
    },
    resetText: { fontSize: 13, color: colors.danger, fontWeight: '600' },

    statusCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 16, padding: 18, borderWidth: 1.5,
    },
    statusTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
    statusSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

    infoCard: {
      backgroundColor: colors.surface, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: colors.border,
    },
    infoTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    sealInfo: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    sealName: { fontSize: 13, fontWeight: '700' },
    sealDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },

    formCard: {
      backgroundColor: colors.surface, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: colors.border, gap: 4,
    },
    formTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
    formSub: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 8 },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 10 },
    input: {
      backgroundColor: colors.inputBg, borderRadius: 12,
      borderWidth: 1, borderColor: colors.inputBorder,
      paddingHorizontal: 14, paddingVertical: 11,
      fontSize: 14, color: colors.text, marginTop: 6,
    },
    textarea: { height: 100, paddingTop: 12 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    typeBtn: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    typeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    submitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: '#2c7be5', borderRadius: 14, paddingVertical: 14, marginTop: 18,
    },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    cancelBtn: {
      alignItems: 'center', paddingVertical: 12,
      borderWidth: 1, borderColor: colors.danger + '44',
      borderRadius: 14, backgroundColor: colors.danger + '0d',
    },
    cancelText: { fontSize: 14, color: colors.danger, fontWeight: '600' },
  });
}
