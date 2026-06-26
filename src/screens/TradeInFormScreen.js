import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useTradeIn } from '../context/TradeInContext';
import { formatBRL } from '../utils/formatters';

const FAIXAS_IDADE = [
  { valor: '<1',  label: 'Menos de 1 ano' },
  { valor: '1-3', label: '1 a 3 anos' },
  { valor: '3-5', label: '3 a 5 anos' },
  { valor: '5-8', label: '5 a 8 anos' },
  { valor: '>8',  label: 'Mais de 8 anos' },
];

const ESTADOS_DECLARADOS = [
  { valor: 'perfeito',       label: 'Funcionando perfeitamente', icon: 'checkmark-circle', cor: '#22c55e' },
  { valor: 'defeitos_leves', label: 'Funcionando com defeitos leves', icon: 'warning',        cor: '#f59e0b' },
  { valor: 'nao_funciona',   label: 'Não funciona',             icon: 'close-circle',    cor: '#ef4444' },
];

export default function TradeInFormScreen({ navigation, route }) {
  const { produtoCategoria, onConfirmar } = route.params || {};
  const { colors } = useTheme();
  const {
    form, tabelas, tabelasLoading, tabelasErro,
    categoriasDisponiveis, atualizarCampo, adicionarFoto, removerFoto,
  } = useTradeIn();
  const s = makeStyles(colors);

  const [expandCategorias, setExpandCategorias] = useState(false);

  async function pickFoto() {
    if (form.fotos.length >= 6) {
      Alert.alert('Máximo de fotos', 'Você pode enviar até 6 fotos.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos acessar sua galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.75, allowsMultipleSelection: false });
    if (!result.canceled) adicionarFoto(result.assets[0].uri);
  }

  async function tirarFoto() {
    if (form.fotos.length >= 6) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos acessar sua câmera.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75, allowsEditing: false });
    if (!result.canceled) adicionarFoto(result.assets[0].uri);
  }

  function handleConfirmar() {
    if (!form.categoria) { Alert.alert('Campo obrigatório', 'Selecione a categoria do aparelho.'); return; }
    if (!form.idadeFaixa) { Alert.alert('Campo obrigatório', 'Selecione a faixa de idade.'); return; }
    if (!form.estadoDeclarado) { Alert.alert('Campo obrigatório', 'Informe o estado do aparelho.'); return; }
    if (form.fotos.length < 3) { Alert.alert('Fotos insuficientes', 'Envie pelo menos 3 fotos (frente, etiqueta e detalhe).'); return; }
    if (form.recusado) { Alert.alert('Trade-in indisponível', form.motivo_recusa); return; }
    if (onConfirmar) onConfirmar(form.valorEstimado);
    navigation.goBack();
  }

  if (tabelasLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={s.loadingText}>Carregando tabelas de avaliação...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tabelasErro) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loading}>
          <Ionicons name="wifi-outline" size={48} color={colors.danger} />
          <Text style={s.loadingText}>Não foi possível carregar as tabelas de avaliação.</Text>
          <Text style={[s.loadingText, { fontSize: 12, color: colors.textMuted }]}>{tabelasErro}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Dados do aparelho usado</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Aviso sobre estimativa */}
        <View style={s.noticeBanner}>
          <Ionicons name="information-circle-outline" size={16} color={colors.info} />
          <Text style={s.noticeText}>
            O valor de abatimento é uma estimativa sujeita a confirmação na entrega.
          </Text>
        </View>

        {/* Categoria */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Categoria do aparelho *</Text>
          <TouchableOpacity style={s.picker} onPress={() => setExpandCategorias(v => !v)}>
            <Ionicons name="cube-outline" size={18} color={colors.textMuted} style={s.pickerIcon} />
            <Text style={[s.pickerText, !form.categoria && { color: colors.textMuted }]}>
              {form.categoria || 'Selecione a categoria'}
            </Text>
            <Ionicons name={expandCategorias ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
          </TouchableOpacity>
          {expandCategorias && (
            <View style={s.dropdown}>
              {categoriasDisponiveis.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={s.dropItem}
                  onPress={() => { atualizarCampo('categoria', cat); setExpandCategorias(false); }}
                >
                  <Text style={[s.dropText, form.categoria === cat && { color: colors.primary, fontWeight: '700' }]}>
                    {cat}
                  </Text>
                  {form.categoria === cat && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Marca e modelo */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Marca e modelo</Text>
          <View style={s.row}>
            <View style={[s.inputWrapper, { flex: 1, marginRight: 8 }]}>
              <TextInput
                style={s.input}
                value={form.marca}
                onChangeText={v => atualizarCampo('marca', v)}
                placeholder="Marca (ex: Brastemp)"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={[s.inputWrapper, { flex: 1.5 }]}>
              <TextInput
                style={s.input}
                value={form.modelo}
                onChangeText={v => atualizarCampo('modelo', v)}
                placeholder="Modelo (ex: BRM44HD)"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Faixa de idade */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Idade aproximada *</Text>
          <View style={s.chipGroup}>
            {FAIXAS_IDADE.map(op => (
              <TouchableOpacity
                key={op.valor}
                style={[s.chip, form.idadeFaixa === op.valor && s.chipAtivo]}
                onPress={() => atualizarCampo('idadeFaixa', op.valor)}
              >
                <Text style={[s.chipText, form.idadeFaixa === op.valor && s.chipTextAtivo]}>
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estado declarado */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Estado do aparelho *</Text>
          {ESTADOS_DECLARADOS.map(op => (
            <TouchableOpacity
              key={op.valor}
              style={[s.estadoCard, form.estadoDeclarado === op.valor && { borderColor: op.cor, backgroundColor: op.cor + '14' }]}
              onPress={() => atualizarCampo('estadoDeclarado', op.valor)}
            >
              <Ionicons name={op.icon} size={22} color={form.estadoDeclarado === op.valor ? op.cor : colors.textMuted} />
              <Text style={[s.estadoLabel, form.estadoDeclarado === op.valor && { color: op.cor, fontWeight: '700' }]}>
                {op.label}
              </Text>
              {form.estadoDeclarado === op.valor && (
                <Ionicons name="checkmark-circle" size={18} color={op.cor} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Fotos */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Fotos ({form.fotos.length}/6) — mínimo 3 *</Text>
          <Text style={s.sectionSub}>Envie: frente, etiqueta de identificação e detalhe de qualquer dano.</Text>
          <View style={s.fotosGrid}>
            {form.fotos.map((uri, i) => (
              <View key={i} style={s.fotoThumb}>
                <Image source={{ uri }} style={s.fotoImg} resizeMode="cover" />
                <TouchableOpacity style={s.fotoRemove} onPress={() => removerFoto(i)}>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
            {form.fotos.length < 6 && (
              <View style={s.fotoAddGroup}>
                <TouchableOpacity style={s.fotoAddBtn} onPress={tirarFoto}>
                  <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
                  <Text style={s.fotoAddText}>Câmera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.fotoAddBtn} onPress={pickFoto}>
                  <Ionicons name="images-outline" size={22} color={colors.textMuted} />
                  <Text style={s.fotoAddText}>Galeria</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Estimativa */}
        {form.categoria && form.idadeFaixa && form.estadoDeclarado && (
          <View style={[s.estimativaCard, form.recusado ? s.estimativaRecusada : s.estimativaOk]}>
            {form.recusado ? (
              <>
                <Ionicons name="close-circle" size={24} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.estimativaLabel, { color: colors.danger }]}>Trade-in indisponível</Text>
                  <Text style={s.estimativaSub}>{form.motivo_recusa}</Text>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="pricetag" size={24} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.estimativaLabel, { color: colors.success }]}>Abatimento estimado</Text>
                  <Text style={s.estimativaValor}>{formatBRL(form.valorEstimado)}</Text>
                  <Text style={s.estimativaSub}>Sujeito a confirmação na entrega</Text>
                </View>
              </>
            )}
          </View>
        )}

      </ScrollView>

      {/* Botão confirmar */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btnConfirmar, (form.recusado || !form.categoria) && { opacity: 0.4 }]}
          onPress={handleConfirmar}
          disabled={form.recusado || !form.categoria}
        >
          <Text style={s.btnConfirmarText}>
            {form.valorEstimado > 0 ? `Usar abatimento de ${formatBRL(form.valorEstimado)}` : 'Confirmar dados'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    loadingText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 36 },
    title: { fontSize: 17, fontWeight: '800', color: colors.text },

    content: { padding: 16, gap: 0 },

    noticeBanner: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: colors.info + '18', borderRadius: 10,
      padding: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.info + '40',
    },
    noticeText: { flex: 1, fontSize: 12, color: colors.info, lineHeight: 17 },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 10 },
    sectionSub: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },

    picker: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      backgroundColor: colors.inputBg, paddingHorizontal: 14, paddingVertical: 13,
    },
    pickerIcon: { marginRight: 10 },
    pickerText: { flex: 1, fontSize: 15, color: colors.text },
    dropdown: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
      marginTop: 6, backgroundColor: colors.surface, overflow: 'hidden',
    },
    dropItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dropText: { fontSize: 14, color: colors.text },

    row: { flexDirection: 'row' },
    inputWrapper: {
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      backgroundColor: colors.inputBg, paddingHorizontal: 14,
    },
    input: { paddingVertical: 13, fontSize: 15, color: colors.text },

    chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    chipTextAtivo: { color: colors.primaryText },

    estadoCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
      backgroundColor: colors.surface, padding: 14, marginBottom: 8,
    },
    estadoLabel: { fontSize: 14, color: colors.text, flexShrink: 1 },

    fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    fotoThumb: {
      width: 88, height: 88, borderRadius: 10, overflow: 'hidden', position: 'relative',
    },
    fotoImg: { width: '100%', height: '100%' },
    fotoRemove: {
      position: 'absolute', top: 4, right: 4,
      backgroundColor: '#fff', borderRadius: 10,
    },
    fotoAddGroup: { flexDirection: 'row', gap: 8 },
    fotoAddBtn: {
      width: 88, height: 88, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', gap: 4,
      backgroundColor: colors.surface,
    },
    fotoAddText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

    estimativaCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 14, padding: 16, marginBottom: 8,
      borderWidth: 1.5,
    },
    estimativaOk: { backgroundColor: '#22c55e14', borderColor: '#22c55e55' },
    estimativaRecusada: { backgroundColor: '#ef444414', borderColor: '#ef444455' },
    estimativaLabel: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
    estimativaValor: { fontSize: 22, fontWeight: '800', color: '#22c55e', marginBottom: 2 },
    estimativaSub: { fontSize: 11, color: colors.textMuted },

    footer: {
      padding: 16, backgroundColor: colors.surface,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    btnConfirmar: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 15, alignItems: 'center',
    },
    btnConfirmarText: { color: colors.primaryText, fontSize: 16, fontWeight: '800' },
  });
}
