import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TAB_BAR_INSET } from '../utils/tabBarAnim';
import { mascaraDoc, validarDoc } from '../utils/cpf';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);

  const [nome, setNome] = useState(user?.name || '');
  const [foto, setFoto] = useState(user?.photo || null);
  const [docType, setDocType] = useState(user?.docType || 'cpf');
  const [doc, setDoc] = useState(user?.docType === 'cnpj' ? (user?.cnpj || '') : (user?.cpf || ''));
  const [loading, setLoading] = useState(false);

  const docMaxLen = docType === 'cnpj' ? 18 : 14;
  const docPlaceholder = docType === 'cnpj' ? '00.000.000/0001-00' : '000.000.000-00';
  const docCompleto = docType === 'cnpj' ? doc.length === 18 : doc.length === 14;
  const docValido = docCompleto && validarDoc(doc, docType);

  const initials = nome
    ? nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  async function escolherFoto() {
    Alert.alert('Foto de perfil', 'Escolha uma opção', [
      {
        text: 'Câmera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão negada', 'Precisamos acessar sua câmera.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.8, allowsEditing: true, aspect: [1, 1],
          });
          if (!result.canceled) setFoto(result.assets[0].uri);
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permissão negada', 'Precisamos acessar sua galeria.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            quality: 0.8, allowsEditing: true, aspect: [1, 1],
          });
          if (!result.canceled) setFoto(result.assets[0].uri);
        },
      },
      {
        text: 'Remover foto',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Remover foto', 'Tem certeza?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: () => setFoto(null) },
          ]);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        name: nome.trim(),
        photo: foto,
        docType,
        cpf: docType === 'cpf' ? doc.trim() : (user?.cpf || ''),
        cnpj: docType === 'cnpj' ? doc.trim() : (user?.cnpj || ''),
      });
      Alert.alert('Sucesso', 'Perfil atualizado!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (_) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSalvar} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={colors.text} />
            : <Text style={styles.saveText}>Salvar</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={escolherFoto} activeOpacity={0.85}>
              {foto ? (
                <Image source={{ uri: foto }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.initials}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={escolherFoto} style={styles.changePhotoBtn}>
              <Text style={styles.changePhotoText}>Alterar foto de perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Campos */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Informações pessoais</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nome completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#ccc"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrapper, styles.inputDisabled]}>
                <Ionicons name="mail-outline" size={18} color="#ccc" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: '#bbb' }]}
                  value={user?.email || ''}
                  editable={false}
                />
              </View>
              <Text style={styles.hint}>O email não pode ser alterado.</Text>
            </View>

            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.label}>Documento fiscal</Text>

              {/* Toggle CPF / CNPJ */}
              <View style={styles.docToggle}>
                {['cpf', 'cnpj'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.docToggleBtn, docType === type && styles.docToggleBtnActive]}
                    onPress={() => { setDocType(type); setDoc(''); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={type === 'cpf' ? 'person-outline' : 'business-outline'}
                      size={14}
                      color={docType === type ? '#fff' : '#888'}
                    />
                    <Text style={[styles.docToggleText, docType === type && styles.docToggleTextActive]}>
                      {type === 'cpf' ? 'CPF  (Pessoa Física)' : 'CNPJ  (Pessoa Jurídica)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[
                styles.inputWrapper,
                docCompleto && (docValido ? styles.inputValid : styles.inputInvalid),
              ]}>
                <Ionicons name="id-card-outline" size={18} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={doc}
                  onChangeText={v => setDoc(mascaraDoc(v, docType))}
                  placeholder={docPlaceholder}
                  placeholderTextColor="#ccc"
                  keyboardType="numeric"
                  maxLength={docMaxLen}
                />
                {docCompleto && (
                  <Ionicons
                    name={docValido ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={docValido ? '#2ed573' : '#ff4757'}
                  />
                )}
              </View>
              <Text style={styles.hint}>
                {docType === 'cpf'
                  ? 'CPF usado para identificação como comprador e vendedor.'
                  : 'CNPJ usado para identificação como loja/empresa vendedora.'}
              </Text>
            </View>
          </View>

          {/* Redefinir senha */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Segurança</Text>
            <TouchableOpacity
              style={styles.securityItem}
              onPress={() => navigation.navigate('ResetPassword')}
              activeOpacity={0.7}
            >
              <View style={styles.securityLeft}>
                <View style={styles.securityIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
                </View>
                <View>
                  <Text style={styles.securityLabel}>Redefinir senha</Text>
                  <Text style={styles.securitySub}>Altere sua senha de acesso</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
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
    backBtn: { width: 36, justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    saveText: { fontSize: 15, fontWeight: '700', color: colors.text },
    content: { padding: 20, paddingBottom: TAB_BAR_INSET + 16 },

    avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 8 },
    avatarWrapper: { position: 'relative', marginBottom: 12 },
    avatarImg: { width: 96, height: 96, borderRadius: 48 },
    avatarPlaceholder: {
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    initials: { color: colors.primaryText, fontSize: 32, fontWeight: '800' },
    cameraBadge: {
      position: 'absolute', bottom: 2, right: 2,
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2.5, borderColor: colors.bg,
    },
    changePhotoBtn: { paddingVertical: 4 },
    changePhotoText: { fontSize: 14, fontWeight: '600', color: colors.text },

    form: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 20,
      marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16,
    },
    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      backgroundColor: colors.inputBg, paddingHorizontal: 14,
    },
    inputDisabled: { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
    inputValid: { borderColor: colors.success },
    inputInvalid: { borderColor: colors.danger },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.text },
    hint: { fontSize: 11, color: colors.textMuted, marginTop: 5 },

    docToggle: { flexDirection: 'row', gap: 8, marginBottom: 10, marginTop: 6 },
    docToggleBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceSecondary,
    },
    docToggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    docToggleText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
    docToggleTextActive: { color: colors.primaryText },

    securityItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    securityLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    securityIcon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center',
    },
    securityLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    securitySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });
}
