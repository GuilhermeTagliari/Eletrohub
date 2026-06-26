import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRatings } from '../context/RatingsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Stars from '../components/Stars';

const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'];

export default function RateSellerScreen({ route, navigation }) {
  const { sellerKey, sellerName } = route.params;
  const { addSellerRating, getSellerRatings } = useRatings();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const s = makeStyles(colors);

  const existing = getSellerRatings(sellerKey);
  const alreadyRated = existing.some(r => r.userName === (user?.name || 'Usuário'));

  function handleEnviar() {
    if (stars === 0) { Alert.alert('Selecione', 'Escolha uma nota de 1 a 5 estrelas.'); return; }
    if (alreadyRated) { Alert.alert('Já avaliado', 'Você já avaliou este vendedor.'); return; }
    setLoading(true);
    setTimeout(() => {
      addSellerRating(sellerKey, { stars, comment, userName: user?.name || 'Usuário' });
      setLoading(false);
      Alert.alert('Avaliação enviada!', 'Obrigado pelo feedback.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 800);
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Avaliar vendedor</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          <View style={s.sellerBox}>
            <View style={s.sellerIcon}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
            <View>
              <Text style={s.sellerLabel}>Vendedor</Text>
              <Text style={s.sellerName}>{sellerName || 'Vendedor'}</Text>
            </View>
          </View>

          {alreadyRated ? (
            <View style={s.alreadyCard}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={s.alreadyTitle}>Você já avaliou este vendedor</Text>
              <Text style={s.alreadySub}>Obrigado pelo seu feedback!</Text>
            </View>
          ) : (
            <>
              <View style={s.card}>
                <Text style={s.cardTitle}>Como você avalia este vendedor?</Text>
                <Stars rating={stars} size={44} onChange={setStars} color="#ffa502" />
                {stars > 0 && <Text style={s.ratingLabel}>{LABELS[stars]}</Text>}
              </View>

              <View style={s.card}>
                <Text style={s.cardTitle}>Deixe um comentário (opcional)</Text>
                <TextInput
                  style={s.textArea}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Conte sua experiência com o vendedor..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={300}
                />
                <Text style={s.counter}>{comment.length}/300</Text>
              </View>

              <TouchableOpacity
                style={[s.btnEnviar, stars === 0 && s.btnDisabled]}
                onPress={handleEnviar}
                disabled={loading || stars === 0}
              >
                {loading ? <ActivityIndicator color={colors.primaryText} /> : (
                  <>
                    <Ionicons name="star" size={18} color={stars === 0 ? colors.textMuted : colors.primaryText} />
                    <Text style={[s.btnText, stars === 0 && { color: colors.textMuted }]}>Enviar avaliação</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
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
    content: { padding: 20, gap: 16 },
    sellerBox: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    },
    sellerIcon: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: colors.info, alignItems: 'center', justifyContent: 'center',
    },
    sellerLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    sellerName: { fontSize: 16, fontWeight: '700', color: colors.text },
    alreadyCard: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 32,
      alignItems: 'center', gap: 12,
    },
    alreadyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
    alreadySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 16, alignItems: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
    ratingLabel: { fontSize: 18, fontWeight: '800', color: colors.warning, marginTop: -4 },
    textArea: {
      width: '100%', borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
      color: colors.text, backgroundColor: colors.inputBg, minHeight: 100,
    },
    counter: { alignSelf: 'flex-end', fontSize: 11, color: colors.textMuted },
    btnEnviar: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    btnDisabled: { backgroundColor: colors.surfaceSecondary },
    btnText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  });
}
