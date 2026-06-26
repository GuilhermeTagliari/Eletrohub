import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useVerification } from '../context/VerificationContext';
import { useAuth } from '../context/AuthContext';

const BANNER_PALETTES = [
  { color: '#1e3a5f', label: 'Azul escuro' },
  { color: '#1a4a2e', label: 'Verde' },
  { color: '#4a1a2e', label: 'Vinho' },
  { color: '#2e1a4a', label: 'Roxo' },
  { color: '#4a3a1a', label: 'Marrom' },
  { color: '#1a3a4a', label: 'Ciano' },
  { color: '#3a1a1a', label: 'Vermelho' },
  { color: '#111827', label: 'Preto' },
  { color: '#374151', label: 'Cinza' },
  { color: '#0f172a', label: 'Midnight' },
];

const TIPOS = ['Loja física', 'Loja virtual', 'Pessoa física', 'Empresa', 'Revendedor', 'Fabricante'];

export default function EditStoreScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { getStoreProfile, updateStoreProfile } = useVerification();
  const { user } = useAuth();
  const s = makeStyles(colors);

  const current = getStoreProfile() || {};

  const [nome, setNome] = useState(current.nome || '');
  const [foto, setFoto] = useState(current.foto || null);
  const [bannerColor, setBannerColor] = useState(current.bannerColor || '#1e3a5f');
  const [bannerImage, setBannerImage] = useState(current.bannerImage || null);
  const [tipo, setTipo] = useState(current.tipo || '');
  const [sobre, setSobre] = useState(current.sobre || '');
  const [site, setSite] = useState(current.site || '');
  const [loading, setLoading] = useState(false);
  const [showTipos, setShowTipos] = useState(false);

  const initial = (nome || 'L')[0].toUpperCase();

  async function escolherBannerImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos acessar sua galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [16, 5] });
    if (!result.canceled) setBannerImage(result.assets[0].uri);
  }

  async function escolherFoto() {
    Alert.alert('Foto da loja', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos acessar sua câmera.'); return; }
          const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
          if (!result.canceled) setFoto(result.assets[0].uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permissão negada', 'Precisamos acessar sua galeria.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
          if (!result.canceled) setFoto(result.assets[0].uri);
        },
      },
      { text: 'Remover foto', style: 'destructive', onPress: () => setFoto(null) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function handleSalvar() {
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome da loja não pode estar vazio.'); return; }
    setLoading(true);
    try {
      await updateStoreProfile({ nome: nome.trim(), foto, bannerColor, bannerImage, tipo, sobre: sobre.trim(), site: site.trim() });
      Alert.alert('Sucesso', 'Perfil da loja atualizado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Configurar Loja</Text>
        <TouchableOpacity onPress={handleSalvar} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={s.saveText}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          {/* Preview do banner */}
          <View style={[s.bannerPreview, { backgroundColor: bannerColor }]}>
            {bannerImage && <Image source={{ uri: bannerImage }} style={s.bannerImg} resizeMode="cover" />}
            <TouchableOpacity style={s.bannerEditBtn} onPress={escolherBannerImage} activeOpacity={0.8}>
              <Ionicons name="image-outline" size={15} color="#fff" />
              <Text style={s.bannerEditText}>Editar banner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.avatarWrapper} onPress={escolherFoto} activeOpacity={0.85}>
              {(foto || user?.photo) ? (
                <Image source={{ uri: foto || user.photo }} style={s.avatarImg} />
              ) : (
                <View style={[s.avatar, { backgroundColor: bannerImage ? 'rgba(0,0,0,0.4)' : bannerColor }]}>
                  <Text style={s.avatarLetter}>{initial}</Text>
                </View>
              )}
              <View style={[s.cameraBadge, { borderColor: bannerColor }]}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Cor do banner */}
          <View style={[s.form, s.formFirst]}>
            <Text style={s.sectionTitle}>Cor do banner</Text>
            <View style={s.colorsGrid}>
              {BANNER_PALETTES.map(p => (
                <TouchableOpacity
                  key={p.color}
                  style={[s.colorCircle, { backgroundColor: p.color }, bannerColor === p.color && s.colorCircleActive]}
                  onPress={() => setBannerColor(p.color)}
                >
                  {bannerColor === p.color && <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Informações da loja */}
          <View style={s.form}>
            <Text style={s.sectionTitle}>Informações</Text>

            <View style={s.field}>
              <Text style={s.label}>Nome da loja</Text>
              <View style={s.inputWrapper}>
                <Ionicons name="storefront-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Nome da sua loja"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Tipo</Text>
              <TouchableOpacity
                style={s.picker}
                onPress={() => setShowTipos(!showTipos)}
                activeOpacity={0.8}
              >
                <Ionicons name="briefcase-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
                <Text style={[s.pickerText, !tipo && { color: colors.textMuted }]}>
                  {tipo || 'Selecione o tipo'}
                </Text>
                <Ionicons name={showTipos ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {showTipos && (
                <View style={s.dropdown}>
                  {TIPOS.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={s.dropItem}
                      onPress={() => { setTipo(t); setShowTipos(false); }}
                    >
                      <Text style={[s.dropText, tipo === t && { color: colors.primary, fontWeight: '700' }]}>{t}</Text>
                      {tipo === t && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>Site / Redes sociais</Text>
              <View style={s.inputWrapper}>
                <Ionicons name="globe-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={site}
                  onChangeText={setSite}
                  placeholder="instagram.com/minhaloja"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            <View style={[s.field, { marginBottom: 0 }]}>
              <Text style={s.label}>Sobre a loja</Text>
              <TextInput
                style={s.textArea}
                value={sobre}
                onChangeText={setSobre}
                placeholder="Descreva sua loja, produtos e diferenciais..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    saveText: { fontSize: 15, fontWeight: '700', color: colors.primary },
    content: { paddingBottom: 40 },

    bannerPreview: {
      height: 150, alignItems: 'center', justifyContent: 'flex-end',
      overflow: 'hidden', paddingBottom: 0,
    },
    bannerImg: { ...StyleSheet.absoluteFillObject },
    bannerEditBtn: {
      position: 'absolute', top: 12, right: 12,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 7,
    },
    bannerEditText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    avatarWrapper: { position: 'relative', marginBottom: -36 },
    avatarImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff' },
    avatar: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: '#fff',
    },
    avatarLetter: { color: '#fff', fontSize: 28, fontWeight: '800' },
    cameraBadge: {
      position: 'absolute', bottom: 2, right: 2,
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
      borderWidth: 2,
    },

    form: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 20,
      marginHorizontal: 16, marginTop: 16, marginBottom: 0, borderWidth: 1, borderColor: colors.border,
    },
    formFirst: { marginTop: 52 },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16,
    },

    colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorCircle: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
    },
    colorCircleActive: {
      borderWidth: 3, borderColor: colors.text,
    },

    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      backgroundColor: colors.inputBg, paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text },
    picker: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      backgroundColor: colors.inputBg, paddingHorizontal: 14, paddingVertical: 13,
    },
    pickerText: { flex: 1, fontSize: 15, color: colors.text },
    dropdown: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
      marginTop: 6, backgroundColor: colors.surface, overflow: 'hidden',
    },
    dropItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dropText: { fontSize: 14, color: colors.text },
    textArea: {
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
      color: colors.text, backgroundColor: colors.inputBg, minHeight: 100,
    },
  });
}
