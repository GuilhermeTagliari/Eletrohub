import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAddress } from '../context/AddressContext';
import { useTheme } from '../context/ThemeContext';
import SwipeableModal from '../components/SwipeableModal';

const TIPOS = ['Casa', 'Trabalho', 'Outro'];

async function buscarCEP(cep) {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  const data = await res.json();
  if (data.erro) return null;
  return data;
}

function formatarCEP(v) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

export default function AddressScreen({ navigation }) {
  const { colors } = useTheme();
  const { addresses, selected, addAddress, removeAddress, selectAddress } = useAddress();
  const [modal, setModal] = useState(false);

  // Campos do formulário
  const [apelido, setApelido] = useState('Casa');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepErro, setCepErro] = useState('');

  const s = makeStyles(colors);

  function resetForm() {
    setCep(''); setRua(''); setNumero(''); setComplemento('');
    setBairro(''); setCidade(''); setEstado('');
    setApelido('Casa'); setCepErro('');
  }

  async function handleCepChange(value) {
    const formatted = formatarCEP(value);
    setCep(formatted);
    setCepErro('');

    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      setLoadingCep(true);
      setRua(''); setBairro(''); setCidade(''); setEstado('');
      try {
        const data = await buscarCEP(digits);
        if (data) {
          setRua(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setEstado(data.uf || '');
          setCepErro('');
        } else {
          setCepErro('CEP não encontrado. Preencha manualmente.');
        }
      } catch (_) {
        setCepErro('Erro ao buscar CEP. Preencha manualmente.');
      } finally {
        setLoadingCep(false);
      }
    }
  }

  function handleAdd() {
    if (!rua.trim() || !numero.trim() || !cidade.trim() || !estado.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha Rua, Número, Cidade e Estado.');
      return;
    }
    addAddress({ apelido, cep, rua, numero, complemento, bairro, cidade, estado });
    setModal(false);
    resetForm();
  }

  function handleRemove(id, ap) {
    Alert.alert('Remover endereço', `Remover "${ap}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeAddress(id) },
    ]);
  }

  function getAddressLine(item) {
    const parts = [item.rua, item.numero, item.complemento].filter(Boolean).join(', ');
    return `${parts} — ${item.cidade}/${item.estado}`;
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Endereços</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {addresses.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="location-outline" size={52} color={colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Nenhum endereço</Text>
          <Text style={s.emptyText}>Adicione um endereço de entrega.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => setModal(true)}>
            <Text style={s.emptyBtnText}>Adicionar endereço</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSel = selected?.id === item.id;
            return (
              <TouchableOpacity
                style={[s.card, isSel && s.cardSelected]}
                onPress={() => selectAddress(item.id)}
                activeOpacity={0.85}
              >
                <View style={[s.cardIconBox, isSel && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons
                    name={item.apelido === 'Trabalho' ? 'business-outline' : item.apelido === 'Outro' ? 'location-outline' : 'home-outline'}
                    size={20}
                    color={isSel ? '#fff' : colors.text}
                  />
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.cardApelido, isSel && { color: '#fff' }]}>{item.apelido}</Text>
                  <Text style={[s.cardAddr, isSel && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={2}>
                    {getAddressLine(item)}
                  </Text>
                  {item.cep ? (
                    <Text style={[s.cardCep, isSel && { color: 'rgba(255,255,255,0.6)' }]}>CEP {item.cep}</Text>
                  ) : null}
                </View>
                <View style={s.cardRight}>
                  {isSel && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                  <TouchableOpacity onPress={() => handleRemove(item.id, item.apelido)} style={s.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={isSel ? 'rgba(255,255,255,0.7)' : colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Modal novo endereço */}
      <SwipeableModal visible={modal} onClose={() => { setModal(false); resetForm(); }} style={{ backgroundColor: colors.surface, maxHeight: '92%' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Novo Endereço</Text>
            <TouchableOpacity onPress={() => { setModal(false); resetForm(); }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ paddingHorizontal: 20 }}>
              {/* Tipo */}
              <Text style={s.label}>Tipo</Text>
              <View style={s.tipoRow}>
                {TIPOS.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.tipoBtn, apelido === t && s.tipoBtnActive]}
                    onPress={() => setApelido(t)}
                  >
                    <Ionicons
                      name={t === 'Casa' ? 'home-outline' : t === 'Trabalho' ? 'business-outline' : 'location-outline'}
                      size={14}
                      color={apelido === t ? colors.primaryText : colors.textSecondary}
                    />
                    <Text style={[s.tipoText, apelido === t && s.tipoTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* CEP com busca automática */}
              <Text style={s.label}>CEP</Text>
              <View style={s.cepRow}>
                <View style={[s.inputWrapper, cepErro && s.inputError, cep.length === 9 && !cepErro && !loadingCep && s.inputSuccess]}>
                  <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                  <TextInput
                    style={s.inputFlex}
                    value={cep}
                    onChangeText={handleCepChange}
                    placeholder="00000-000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={9}
                  />
                  {loadingCep && <ActivityIndicator size="small" color={colors.info} />}
                  {!loadingCep && cep.length === 9 && !cepErro && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  )}
                </View>
              </View>
              {cepErro ? (
                <Text style={s.cepErroText}>{cepErro}</Text>
              ) : cep.length < 9 ? (
                <Text style={s.cepHint}>Digite o CEP para preencher automaticamente</Text>
              ) : null}

              {/* Rua */}
              <Text style={s.label}>Rua / Avenida <Text style={s.req}>*</Text></Text>
              <TextInput
                style={s.input}
                value={rua}
                onChangeText={setRua}
                placeholder="Ex: Rua das Flores"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />

              {/* Número e Complemento lado a lado */}
              <View style={s.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Número <Text style={s.req}>*</Text></Text>
                  <TextInput
                    style={s.input}
                    value={numero}
                    onChangeText={setNumero}
                    placeholder="123"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1.5 }}>
                  <Text style={s.label}>Complemento</Text>
                  <TextInput
                    style={s.input}
                    value={complemento}
                    onChangeText={setComplemento}
                    placeholder="Apto 13, Casa B..."
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Bairro */}
              <Text style={s.label}>Bairro</Text>
              <TextInput
                style={s.input}
                value={bairro}
                onChangeText={setBairro}
                placeholder="Ex: Centro"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />

              {/* Cidade e Estado */}
              <View style={s.rowFields}>
                <View style={{ flex: 2 }}>
                  <Text style={s.label}>Cidade <Text style={s.req}>*</Text></Text>
                  <TextInput
                    style={s.input}
                    value={cidade}
                    onChangeText={setCidade}
                    placeholder="Ex: São Paulo"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>UF <Text style={s.req}>*</Text></Text>
                  <TextInput
                    style={s.input}
                    value={estado}
                    onChangeText={v => setEstado(v.toUpperCase().slice(0, 2))}
                    placeholder="SP"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                </View>
              </View>

              <TouchableOpacity style={s.btnSalvar} onPress={handleAdd}>
                <Ionicons name="checkmark" size={18} color={colors.primaryText} />
                <Text style={s.btnText}>Salvar Endereço</Text>
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
        </KeyboardAvoidingView>
      </SwipeableModal>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { width: 36 },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
    addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 12 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: colors.border, gap: 12 },
    cardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    cardIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1 },
    cardApelido: { fontSize: 14, fontWeight: '700', color: colors.text },
    cardAddr: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
    cardCep: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
    cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deleteBtn: { padding: 4 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
    emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    emptyBtn: { marginTop: 8, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    emptyBtnText: { color: colors.primaryText, fontSize: 15, fontWeight: '700' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, paddingTop: 4 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
    tipoRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    tipoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderStrong },
    tipoBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tipoText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    tipoTextActive: { color: colors.primaryText },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 14 },
    req: { color: colors.danger },
    cepRow: { flexDirection: 'row', gap: 10 },
    inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.inputBg },
    inputError: { borderColor: colors.danger, backgroundColor: colors.danger + '08' },
    inputSuccess: { borderColor: colors.success, backgroundColor: colors.success + '08' },
    inputFlex: { flex: 1, fontSize: 15, color: colors.text, letterSpacing: 1 },
    cepErroText: { fontSize: 12, color: colors.danger, marginTop: 5 },
    cepHint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    input: { borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, backgroundColor: colors.inputBg },
    rowFields: { flexDirection: 'row', alignItems: 'flex-start' },
    btnSalvar: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 8 },
    btnText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  });
}
