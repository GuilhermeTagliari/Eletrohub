import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GOOGLE_WEB_CLIENT_ID } from '../config';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ENDPOINTS = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function RegisterScreen({ navigation }) {
  const { register, login, loginWithGoogle, loginWithApple } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'eletrohub' });
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
      redirectUri,
    },
    GOOGLE_ENDPOINTS,
  );

  useEffect(() => {
    if (response?.type === 'success') {
      fetchGoogleUser(response.params?.access_token);
    } else if (response?.type === 'error') {
      Alert.alert('Erro Google', 'Não foi possível autenticar com Google.');
    }
  }, [response]);

  async function fetchGoogleUser(accessToken) {
    if (!accessToken) return;
    setGoogleLoading(true);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const info = await res.json();
      await loginWithGoogle({ id: info.sub, name: info.name, email: info.email, photo: info.picture });
    } catch {
      Alert.alert('Erro', 'Não foi possível concluir o login com Google.');
    } finally {
      setGoogleLoading(false);
    }
  }

  function handleGoogleLogin() {
    if (!GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID.startsWith('COLE_SEU')) {
      Alert.alert('Configuração pendente', 'Adicione seu Google Client ID em src/config.js.');
      return;
    }
    promptAsync();
  }

  async function handleAppleLogin() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await loginWithApple(credential);
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') {
        Alert.alert('Erro', 'Não foi possível entrar com Apple ID.');
      }
    }
  }

  async function handleRegister() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const fullName = sobrenome.trim()
      ? `${nome.trim()} ${sobrenome.trim()}`
      : nome.trim();

    setLoading(true);
    try {
      await register(fullName, email.trim(), senha);
      await login(email.trim(), senha);
    } catch (err) {
      Alert.alert('Erro ao cadastrar', err.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Text style={styles.title}>Crie sua conta</Text>
          </View>

          <View style={styles.logoBox}>
            <Text style={styles.logoName}>Eletro<Text style={styles.logoBold}>Hub</Text></Text>
            <Text style={styles.logoSub}>marketplace de eletrônicos</Text>
          </View>

          <Text style={styles.headline}>Compre e venda eletrodomésticos</Text>
          <Text style={styles.subtext}>
            Participe do <Text style={styles.bold}>EletroHub</Text> para anunciar,{'\n'}
            negociar e encontrar ótimas ofertas.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={colors.textMuted}
              value={nome}
              onChangeText={setNome}
            />
            <TextInput
              style={styles.input}
              placeholder="Sobrenome"
              placeholderTextColor={colors.textMuted}
              value={sobrenome}
              onChangeText={setSobrenome}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Senha"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showSenha}
                value={senha}
                onChangeText={setSenha}
              />
              <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={styles.eye}>
                <Ionicons name={showSenha ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.primaryText} />
                : <Text style={styles.btnPrimaryText}>Confirmar</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={!request || googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.textSecondary} size="small" />
            ) : (
              <>
                <Text style={styles.googleLetter}>G</Text>
                <Text style={styles.googleBtnText}>Continuar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={10}
              style={styles.appleBtn}
              onPress={handleAppleLogin}
            />
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchText}>
              Já tem conta? <Text style={styles.link}>Faça o Login</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    container: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 32 },
    header: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    logoBox: { alignItems: 'center', justifyContent: 'center', marginVertical: 20, paddingVertical: 8 },
    logoName: { fontSize: 40, fontWeight: '300', color: colors.text, letterSpacing: -1 },
    logoBold: { fontWeight: '900' },
    logoSub: { fontSize: 11, color: colors.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
    headline: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 },
    subtext: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    bold: { fontWeight: '700', color: colors.text },
    form: { gap: 12 },
    input: {
      borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8,
      paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.text,
      backgroundColor: colors.inputBg,
    },
    passwordRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8,
      backgroundColor: colors.inputBg,
    },
    passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.text },
    eye: { paddingHorizontal: 12 },
    btnPrimary: {
      backgroundColor: colors.primary, borderRadius: 8,
      paddingVertical: 15, alignItems: 'center', marginTop: 4,
    },
    btnPrimaryText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
    dividerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 14,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
    googleBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
      paddingVertical: 13, backgroundColor: colors.surface, marginBottom: 12,
    },
    googleLetter: { fontSize: 18, fontWeight: '800', color: '#DB4437' },
    googleBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
    appleBtn: { height: 48, marginBottom: 12 },
    switchText: { textAlign: 'center', fontSize: 14, color: colors.textSecondary, marginTop: 16 },
    link: { color: colors.text, fontWeight: '700' },
  });
}
