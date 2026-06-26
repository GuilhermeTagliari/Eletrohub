import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const s = makeStyles(colors);

  const sections = [
    {
      title: 'Aparência',
      items: [
        {
          icon: isDark ? 'moon' : 'sunny',
          label: 'Modo escuro',
          right: <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#ddd', true: '#555' }} thumbColor={isDark ? '#fff' : '#fff'} />,
        },
      ],
    },
    {
      title: 'Conta',
      items: [
        { icon: 'person-outline', label: 'Editar perfil', onPress: () => navigation.navigate('EditProfile') },
        { icon: 'location-outline', label: 'Meus endereços', onPress: () => navigation.navigate('Addresses') },
        { icon: 'lock-closed-outline', label: 'Redefinir senha', onPress: () => navigation.navigate('ResetPassword') },
        { icon: 'shield-checkmark-outline', label: 'Verificação de loja', onPress: () => navigation.navigate('Verification') },
      ],
    },
    {
      title: 'Suporte',
      items: [
        { icon: 'help-circle-outline', label: 'Central de ajuda', onPress: () => navigation.navigate('HelpCenter') },
        { icon: 'shield-outline', label: 'Política de privacidade', onPress: () => navigation.navigate('PrivacyPolicy') },
        { icon: 'document-text-outline', label: 'Termos de uso', onPress: () => navigation.navigate('Terms') },
      ],
    },
    {
      title: 'Sobre',
      items: [
        { icon: 'flash-outline', label: 'EletroHub', right: <Text style={s.version}>v1.0.0</Text> },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Configurações</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {sections.map(sec => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <View style={s.sectionCard}>
              {sec.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.item, idx < sec.items.length - 1 && s.itemBorder]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                  activeOpacity={item.onPress ? 0.7 : 1}
                >
                  <View style={s.itemLeft}>
                    <View style={s.iconBox}>
                      <Ionicons name={item.icon} size={20} color={colors.text} />
                    </View>
                    <Text style={s.itemLabel}>{item.label}</Text>
                  </View>
                  {item.right
                    ? item.right
                    : item.onPress
                      ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
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
    content: { padding: 16 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
    sectionCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
    item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15 },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    itemLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
    version: { fontSize: 13, color: colors.textMuted },
  });
}
