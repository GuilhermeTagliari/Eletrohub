import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRatings } from '../context/RatingsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { showToast } from '../utils/toast';
import Stars from '../components/Stars';

const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'];

export default function RateProductScreen({ route, navigation }) {
  // Seller mode: receives sellerKey + sellerName
  const { sellerKey, sellerName } = route.params;
  const { addSellerRating } = useRatings();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const s = makeStyles(colors);

  function handleEnviar() {
    if (stars === 0) { showToast('Escolha uma nota de 1 a 5 estrelas', 'error'); return; }
    setLoading(true);
    setTimeout(() => {
      addSellerRating(sellerKey, { stars, comment, userName: user?.name || 'Usuário' });
      setLoading(false);
      showToast('Avaliação enviada! Obrigado pelo feedback.');
      navigation.goBack();
    }, 700);
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
          <View style={s.productBox}>
            <View style={s.productIcon}>
              <Ionicons name="storefront-outline" size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sellerLabel}>Vendedor</Text>
              <Text style={s.productName}>{sellerName || 'Vendedor'}</Text>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Como foi sua experiência com este vendedor?</Text>
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
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={s.counter}>{comment.length}/500</Text>
          </View>

          <TouchableOpacity style={[s.btnEnviar, stars === 0 && s.btnDisabled]} onPress={handleEnviar} disabled={loading || stars === 0}>
            {loading ? <ActivityIndicator color={colors.primaryText} /> : (
              <>
                <Ionicons name="star" size={18} color={stars === 0 ? colors.textMuted : colors.primaryText} />
                <Text style={[s.btnText, stars === 0 && { color: colors.textMuted }]}>Enviar avaliação</Text>
              </>
            )}
          </TouchableOpacity>
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
    productBox: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    },
    productIcon: {
      width: 52, height: 52, borderRadius: 12,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    sellerLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
    productName: { fontSize: 15, fontWeight: '700', color: colors.text },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 16, alignItems: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
    ratingLabel: { fontSize: 18, fontWeight: '800', color: '#f59e0b', marginTop: -4 },
    textArea: {
      width: '100%', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
      color: colors.text, backgroundColor: colors.surfaceSecondary, minHeight: 120,
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
