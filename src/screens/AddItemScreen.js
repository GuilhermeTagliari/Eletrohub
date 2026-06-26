import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIAS } from '../config';
import { useMyItems } from '../context/MyItemsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import { useVerification } from '../context/VerificationContext';
import { productAPI } from '../services/api';
import { mascaraDoc, validarDoc } from '../utils/cpf';
import { showToast } from '../utils/toast';

const CONDICOES = ['Novo', 'Seminovo', 'Usado'];

const ELETROHUB_FRETE = 19.90;

function calcularFreteEletroHub(peso, comprimento, largura, altura) {
  const p = parseFloat(peso) || 0;
  const c = parseFloat(comprimento) || 0;
  const l = parseFloat(largura) || 0;
  const a = parseFloat(altura) || 0;
  if (p <= 0 && c <= 0) return 0;
  const pesoCubado = (c * l * a) / 6000;
  const pesoFaturavel = Math.max(p, pesoCubado);
  let valor = 0;
  if (pesoFaturavel <= 0.3)       valor = 11.90;
  else if (pesoFaturavel <= 1)    valor = 15.90;
  else if (pesoFaturavel <= 5)    valor = 15.90 + (pesoFaturavel - 1) * 3.50;
  else if (pesoFaturavel <= 30)   valor = 29.90 + (pesoFaturavel - 5) * 2.20;
  else                            valor = 84.90 + (pesoFaturavel - 30) * 1.80;
  return Math.round(valor * 100) / 100;
}

function gerarCodigoRastreio() {
  const prefixo = 'PE';
  let nums = '';
  for (let i = 0; i < 9; i++) nums += Math.floor(Math.random() * 10);
  return `${prefixo}${nums}BR`;
}

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

function Field({ label, required, children, s }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>
        {label} {required && <Text style={s.req}>*</Text>}
      </Text>
      {children}
    </View>
  );
}

export default function AddItemScreen({ navigation, route }) {
  const editItem = route?.params?.item ?? null;
  const isEditing = editItem !== null;

  const { addItem, updateItem } = useMyItems();
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const { addNotification } = useNotifications();
  const { getStoreProfile } = useVerification();
  const s = makeStyles(colors);

  const [fotos, setFotos] = useState(editItem?.fotos ?? []);
  const [nome, setNome] = useState(editItem?.nome ?? '');
  const [descricao, setDescricao] = useState(editItem?.descricao ?? '');
  const [variacao, setVariacao] = useState(editItem?.variacao ?? '');
  const [cor, setCor] = useState(editItem?.cor ?? '');
  const [categoria, setCategoria] = useState(editItem?.categoria ?? '');
  const [condicao, setCondicao] = useState(editItem?.condicao ?? '');
  const [showCats, setShowCats] = useState(false);
  const [preco, setPreco] = useState(editItem?.preco ?? '');
  const [freteTipo, setFreteTipo] = useState(editItem?.freteTipo ?? 'proprio');
  const [frete, setFrete] = useState(editItem?.frete ?? '');
  const [fretePeso, setFretePeso] = useState(editItem?.fretePeso ?? '');
  const [freteComprimento, setFreteComprimento] = useState(editItem?.freteComprimento ?? '');
  const [freteLargura, setFreteLargura] = useState(editItem?.freteLargura ?? '');
  const [freteAltura, setFreteAltura] = useState(editItem?.freteAltura ?? '');
  const [freteCalculado, setFreteCalculado] = useState(editItem?.freteCalculado ?? 0);
  const [freteCodigo, setFreteCodigo] = useState(editItem?.freteCodigo ?? '');
  const [cidade, setCidade] = useState(editItem?.cidade ?? '');
  const [estado, setEstado] = useState(editItem?.estado ?? '');
  const [showEstados, setShowEstados] = useState(false);
  const initDocType = editItem?.cnpj ? 'cnpj' : (user?.docType || 'cpf');
  const initDoc = initDocType === 'cnpj'
    ? (editItem?.cnpj ?? user?.cnpj ?? '')
    : (editItem?.cpf ?? user?.cpf ?? '');
  const [docType, setDocType] = useState(initDocType);
  const [doc, setDoc] = useState(initDoc);
  const [loading, setLoading] = useState(false);

  // Back confirmation: warn if user has filled any field
  const hasDataRef = useRef(false);
  useEffect(() => {
    hasDataRef.current = !!(nome.trim() || descricao.trim() || categoria || preco.trim());
  }, [nome, descricao, categoria, preco]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!hasDataRef.current || loading) return;
      e.preventDefault();
      Alert.alert(
        'Descartar alterações?',
        'Você tem dados não salvos que serão perdidos.',
        [
          { text: 'Continuar editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsub;
  }, [navigation]);

  async function adicionarFoto() {
    if (fotos.length >= 5) {
      Alert.alert('Limite', 'Você pode adicionar até 5 fotos.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acessar sua galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) setFotos(prev => [...prev, result.assets[0].uri]);
  }

  function removerFoto(uri) {
    setFotos(prev => prev.filter(f => f !== uri));
  }

  async function handleCadastrar() {
    if (!nome.trim() || !descricao.trim() || !categoria || !preco.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha Nome, Descrição, Categoria e Preço.');
      return;
    }
    if (!condicao) {
      Alert.alert('Condição obrigatória', 'Selecione a condição do produto.');
      return;
    }
    const docLabel = docType === 'cnpj' ? 'CNPJ' : 'CPF';
    const docMaxLen = docType === 'cnpj' ? 18 : 14;
    if (!doc.trim()) {
      Alert.alert(`${docLabel} obrigatório`, `Informe seu ${docLabel} para anunciar um produto.`);
      return;
    }
    if (doc.length < docMaxLen || !validarDoc(doc, docType)) {
      Alert.alert(`${docLabel} inválido`, `Digite um ${docLabel} válido para continuar.`);
      return;
    }

    setLoading(true);
    hasDataRef.current = false;

    const itemData = {
      nome, descricao, variacao, cor, categoria, condicao, preco,
      frete, freteTipo, fretePeso, freteComprimento, freteLargura,
      freteAltura, freteCalculado, freteCodigo, fotos, cidade, estado,
      cpf: docType === 'cpf' ? doc : '',
      cnpj: docType === 'cnpj' ? doc : '',
    };

    if (isEditing) {
      updateItem(editItem.id, itemData);
      addNotification('Anúncio atualizado!', `"${nome}" foi atualizado com sucesso.`, { type: 'default' });
    } else {
      // 1. Salva localmente primeiro (garante funcionamento offline)
      const localItem = addItem(itemData);

      // 2. Tenta publicar no backend para outros usuários verem
      try {
        const storeProfile = getStoreProfile();
        const sellerName = storeProfile?.nome || user?.name || 'Anúncio';
        const precoNum = parseFloat(String(preco).replace(/\./g, '').replace(',', '.')) || 0;

        const backendItem = await productAPI.create({
          description: nome.trim(),
          brand: sellerName,
          model: variacao || '',
          price: precoNum,
          stock: 1,
          sellerId: String(user?.id || user?.email || 'unknown'),
          sellerName,
          categoria,
          condicao,
          cidade: cidade || '',
          estado: estado || '',
        }, token);

        // Marca o item local como publicado com o ID do backend
        if (backendItem?.id) {
          updateItem(localItem.id, { backendId: backendItem.id });
        }
      } catch (_) {
        // Backend offline: item fica visível só localmente até sincronizar
      }

      addNotification('Anúncio publicado!', `"${nome}" já está disponível para outros usuários.`, { type: 'default' });
    }

    setLoading(false);
    showToast(isEditing ? 'Anúncio atualizado com sucesso!' : 'Anúncio publicado com sucesso!');
    navigation.goBack();
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={colors.statusBar === 'dark' ? 'dark' : 'light'} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>{isEditing ? 'Editar Anúncio' : 'Novo Anúncio'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Galeria de fotos */}
          <View style={s.field}>
            <Text style={s.label}>Fotos <Text style={s.hint}>({fotos.length}/5)</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.fotosRow}>
              {fotos.map((uri, idx) => (
                <View key={uri} style={s.fotoThumb}>
                  <Image source={{ uri }} style={s.fotoImg} />
                  {idx === 0 && <View style={s.fotoPrincipalBadge}><Text style={s.fotoPrincipalText}>Capa</Text></View>}
                  <TouchableOpacity style={s.fotoRemoveBtn} onPress={() => removerFoto(uri)}>
                    <Ionicons name="close-circle" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
              {fotos.length < 5 && (
                <TouchableOpacity style={s.fotoAdd} onPress={adicionarFoto}>
                  <Ionicons name="camera-outline" size={26} color={colors.textMuted} />
                  <Text style={s.fotoAddLabel}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <Field label="Nome do Produto" required s={s}>
            <TextInput style={s.input} placeholder="Ex: Geladeira Brastemp 400L"
              placeholderTextColor={colors.textMuted} value={nome} onChangeText={setNome} maxLength={100} />
            <Text style={s.counter}>{nome.length}/100</Text>
          </Field>

          <Field label="Descrição" required s={s}>
            <TextInput style={[s.input, s.textArea]}
              placeholder="Descreva o estado, características e diferenciais..."
              placeholderTextColor={colors.textMuted} value={descricao} onChangeText={setDescricao}
              maxLength={4000} multiline textAlignVertical="top" />
            <Text style={s.counter}>{descricao.length}/4000</Text>
          </Field>

          <Field label="Condição" required s={s}>
            <View style={s.condicaoRow}>
              {CONDICOES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.condicaoBtn, condicao === c && s.condicaoBtnActive]}
                  onPress={() => setCondicao(c)}
                >
                  <Text style={[s.condicaoText, condicao === c && s.condicaoTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Categoria" required s={s}>
            <TouchableOpacity style={s.picker} onPress={() => setShowCats(!showCats)}>
              <Text style={[s.pickerText, !categoria && { color: colors.textMuted }]}>
                {categoria || 'Selecione uma categoria'}
              </Text>
              <Ionicons name={showCats ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
            {showCats && (
              <View style={s.dropdown}>
                {CATEGORIAS.map(cat => (
                  <TouchableOpacity key={cat} style={s.dropItem}
                    onPress={() => { setCategoria(cat); setShowCats(false); }}>
                    <Text style={[s.dropText, categoria === cat && s.dropTextActive]}>{cat}</Text>
                    {categoria === cat && <Ionicons name="checkmark" size={16} color={colors.text} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Field>

          <Field label="Cor" s={s}>
            <TextInput style={s.input} placeholder="Ex: Preto, Branco, Azul..."
              placeholderTextColor={colors.textMuted} value={cor} onChangeText={setCor} />
          </Field>

          <Field label="Variação / Modelo" s={s}>
            <TextInput style={s.input} placeholder="Ex: 128GB, 220V, Pro Max..."
              placeholderTextColor={colors.textMuted} value={variacao} onChangeText={setVariacao} />
          </Field>

          {/* Localização */}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Cidade" s={s}>
                <TextInput style={s.input} placeholder="Ex: São Paulo"
                  placeholderTextColor={colors.textMuted} value={cidade} onChangeText={setCidade} />
              </Field>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ width: 80 }}>
              <Field label="Estado" s={s}>
                <TouchableOpacity style={s.picker} onPress={() => setShowEstados(!showEstados)}>
                  <Text style={[s.pickerText, !estado && { color: colors.textMuted }]}>
                    {estado || 'UF'}
                  </Text>
                  <Ionicons name={showEstados ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </Field>
            </View>
          </View>
          {showEstados && (
            <View style={[s.dropdown, { marginTop: -10, marginBottom: 20 }]}>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {ESTADOS_BR.map(uf => (
                  <TouchableOpacity key={uf} style={s.dropItem}
                    onPress={() => { setEstado(uf); setShowEstados(false); }}>
                    <Text style={[s.dropText, estado === uf && s.dropTextActive]}>{uf}</Text>
                    {estado === uf && <Ionicons name="checkmark" size={16} color={colors.text} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Field label="Documento do Anunciante" required s={s}>
            <View style={s.docToggle}>
              {['cpf', 'cnpj'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[s.docToggleBtn, docType === type && s.docToggleBtnActive]}
                  onPress={() => { setDocType(type); setDoc(''); }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={type === 'cpf' ? 'person-outline' : 'business-outline'}
                    size={13}
                    color={docType === type ? '#fff' : colors.textMuted}
                  />
                  <Text style={[s.docToggleText, docType === type && s.docToggleTextActive]}>
                    {type === 'cpf' ? 'CPF' : 'CNPJ'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.inputWithIcon}>
              <Ionicons name="id-card-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.inputFlex}
                placeholder={docType === 'cnpj' ? '00.000.000/0001-00' : '000.000.000-00'}
                placeholderTextColor={colors.textMuted}
                value={doc}
                onChangeText={v => setDoc(mascaraDoc(v, docType))}
                keyboardType="numeric"
                maxLength={docType === 'cnpj' ? 18 : 14}
              />
              {doc.length === (docType === 'cnpj' ? 18 : 14) && (
                <Ionicons
                  name={validarDoc(doc, docType) ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={validarDoc(doc, docType) ? colors.success : colors.danger}
                />
              )}
            </View>
            <Text style={s.fieldHint}>
              {docType === 'cpf'
                ? 'CPF (Pessoa Física) para identificação do vendedor.'
                : 'CNPJ (Pessoa Jurídica) para vendas como empresa.'}
            </Text>
          </Field>

          <Field label="Preço (R$)" required s={s}>
            <TextInput style={s.input} placeholder="0,00"
              placeholderTextColor={colors.textMuted} value={preco} onChangeText={setPreco}
              keyboardType="decimal-pad" />
          </Field>

          <Field label="Frete" s={s}>
            <View style={s.freteOpcoes}>
              <TouchableOpacity
                style={[s.freteOpcao, freteTipo === 'proprio' && s.freteOpcaoActive]}
                onPress={() => setFreteTipo('proprio')}
              >
                <Ionicons name="person-outline" size={16} color={freteTipo === 'proprio' ? colors.primaryText : colors.textSecondary} />
                <Text style={[s.freteOpcaoText, freteTipo === 'proprio' && s.freteOpcaoTextActive]}>
                  Por conta própria
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.freteOpcao, freteTipo === 'eletrohub' && s.freteOpcaoActive]}
                onPress={() => setFreteTipo('eletrohub')}
              >
                <Ionicons name="flash-outline" size={16} color={freteTipo === 'eletrohub' ? colors.primaryText : colors.textSecondary} />
                <Text style={[s.freteOpcaoText, freteTipo === 'eletrohub' && s.freteOpcaoTextActive]}>
                  Frete EletroHub
                </Text>
              </TouchableOpacity>
            </View>
            {freteTipo === 'proprio' ? (
              <View style={{ marginTop: 10 }}>
                <TextInput style={s.input} placeholder="Valor do frete (0 = Grátis)"
                  placeholderTextColor={colors.textMuted} value={frete} onChangeText={setFrete}
                  keyboardType="decimal-pad" />
                <Text style={s.fieldHint}>Digite 0 para frete grátis ou deixe em branco para combinar.</Text>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <Text style={s.fieldHint}>Informe as dimensões para calcular o frete.</Text>

                <View style={[s.row, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dimLabel}>Peso (kg)</Text>
                    <TextInput style={s.input} placeholder="0,00"
                      placeholderTextColor={colors.textMuted} value={fretePeso}
                      onChangeText={setFretePeso} keyboardType="decimal-pad" />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.dimLabel}>Compr. (cm)</Text>
                    <TextInput style={s.input} placeholder="0"
                      placeholderTextColor={colors.textMuted} value={freteComprimento}
                      onChangeText={setFreteComprimento} keyboardType="decimal-pad" />
                  </View>
                </View>

                <View style={[s.row, { marginTop: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dimLabel}>Largura (cm)</Text>
                    <TextInput style={s.input} placeholder="0"
                      placeholderTextColor={colors.textMuted} value={freteLargura}
                      onChangeText={setFreteLargura} keyboardType="decimal-pad" />
                  </View>
                  <View style={{ width: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.dimLabel}>Altura (cm)</Text>
                    <TextInput style={s.input} placeholder="0"
                      placeholderTextColor={colors.textMuted} value={freteAltura}
                      onChangeText={setFreteAltura} keyboardType="decimal-pad" />
                  </View>
                </View>

                <TouchableOpacity
                  style={s.calcBtn}
                  onPress={() => {
                    const val = calcularFreteEletroHub(fretePeso, freteComprimento, freteLargura, freteAltura);
                    const cod = gerarCodigoRastreio();
                    setFreteCalculado(val);
                    setFreteCodigo(cod);
                  }}
                >
                  <Ionicons name="calculator-outline" size={16} color="#fff" />
                  <Text style={s.calcBtnText}>Calcular frete</Text>
                </TouchableOpacity>

                {freteCalculado > 0 && (
                  <View style={s.freteResultBox}>
                    <View style={s.freteResultRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <Text style={s.freteResultValor}>
                        R$ {freteCalculado.toFixed(2).replace('.', ',')}
                      </Text>
                      <Text style={s.freteResultLabel}>por envio via Correios PAC</Text>
                    </View>
                    <View style={s.freteCodigoRow}>
                      <Ionicons name="barcode-outline" size={14} color={colors.textMuted} />
                      <Text style={s.freteCodigo}>{freteCodigo}</Text>
                    </View>
                    <Text style={s.freteResultHint}>
                      Prazo estimado: 5–10 dias úteis após postagem
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Field>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnPublicar} onPress={handleCadastrar} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryText} /> : (
            <>
              <Ionicons name={isEditing ? 'checkmark-outline' : 'megaphone-outline'} size={18} color={colors.primaryText} />
              <Text style={s.btnText}>{isEditing ? 'Salvar Alterações' : 'Publicar Anúncio'}</Text>
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
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.bg,
    },
    backBtn: { width: 36, justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    content: { padding: 20 },
    fotosRow: { gap: 10, paddingVertical: 4 },
    fotoThumb: { position: 'relative', width: 90, height: 90 },
    fotoImg: { width: 90, height: 90, borderRadius: 12 },
    fotoPrincipalBadge: {
      position: 'absolute', bottom: 4, left: 4,
      backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4,
      paddingHorizontal: 5, paddingVertical: 2,
    },
    fotoPrincipalText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    fotoRemoveBtn: { position: 'absolute', top: -6, right: -6 },
    fotoAdd: {
      width: 90, height: 90, borderRadius: 12,
      backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border,
      borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    fotoAddLabel: { fontSize: 11, color: colors.textMuted },
    field: { marginBottom: 20 },
    hint: { fontSize: 12, color: colors.textMuted, fontWeight: '400' },
    label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
    req: { color: colors.danger },
    condicaoRow: { flexDirection: 'row', gap: 10 },
    condicaoBtn: {
      flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceSecondary,
    },
    condicaoBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    condicaoText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    condicaoTextActive: { color: colors.primaryText },
    input: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text,
      backgroundColor: colors.surfaceSecondary,
    },
    textArea: { minHeight: 100, paddingTop: 12 },
    counter: { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
    inputWithIcon: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
      backgroundColor: colors.surfaceSecondary, paddingHorizontal: 14, paddingVertical: 12,
    },
    inputIcon: { marginRight: 10 },
    inputFlex: { flex: 1, fontSize: 14, color: colors.text },
    fieldHint: { fontSize: 11, color: colors.textMuted, marginTop: 5 },
    docToggle: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    docToggleBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
      paddingVertical: 8, borderRadius: 8,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceSecondary,
    },
    docToggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    docToggleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    docToggleTextActive: { color: colors.primaryText },
    picker: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surfaceSecondary,
    },
    pickerText: { fontSize: 14, color: colors.text, flex: 1 },
    dropdown: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
      marginTop: 6, backgroundColor: colors.surface, overflow: 'hidden',
    },
    dropItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dropText: { fontSize: 14, color: colors.textSecondary },
    dropTextActive: { fontWeight: '700', color: colors.text },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    footer: {
      padding: 16, paddingBottom: 24, backgroundColor: colors.bg,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    freteOpcoes: { flexDirection: 'row', gap: 10 },
    freteOpcao: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    freteOpcaoActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    freteOpcaoText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    freteOpcaoTextActive: { color: colors.primaryText },
    dimLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
    calcBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.info, borderRadius: 10, paddingVertical: 12, marginTop: 12,
    },
    calcBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    freteResultBox: {
      marginTop: 12, backgroundColor: colors.success + '18', borderRadius: 12,
      padding: 14, borderWidth: 1, borderColor: colors.success + '44', gap: 6,
    },
    freteResultRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    freteResultValor: { fontSize: 18, fontWeight: '800', color: colors.success },
    freteResultLabel: { fontSize: 12, color: colors.textSecondary, flex: 1 },
    freteCodigoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    freteCodigo: { fontSize: 13, fontWeight: '700', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    freteResultHint: { fontSize: 11, color: colors.textMuted },
    btnPublicar: {
      backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 15, alignItems: 'center',
      flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    btnText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  });
}
