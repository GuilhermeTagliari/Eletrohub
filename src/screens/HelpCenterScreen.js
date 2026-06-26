import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const FAQS = [
  {
    categoria: 'Compras',
    itens: [
      {
        q: 'Como faço um pedido?',
        a: 'Navegue pelos produtos, adicione ao carrinho e finalize o pagamento na tela de Carrinho. Você pode acompanhar seus pedidos em Perfil → Meus Pedidos.',
      },
      {
        q: 'Posso cancelar um pedido?',
        a: 'Pedidos podem ser cancelados em até 24 horas após a confirmação. Acesse Meus Pedidos e toque em "Cancelar" no pedido desejado.',
      },
      {
        q: 'Quais formas de pagamento são aceitas?',
        a: 'Aceitamos Pix, cartão de crédito (até 12x) e cartão de débito. Todas as transações são protegidas por criptografia.',
      },
    ],
  },
  {
    categoria: 'Entregas',
    itens: [
      {
        q: 'Qual o prazo de entrega?',
        a: 'O prazo varia de acordo com a sua localização. Em geral, entregas para capitais levam de 3 a 5 dias úteis, e para o interior de 5 a 10 dias úteis.',
      },
      {
        q: 'Como rastrear meu pedido?',
        a: 'Após o envio, você receberá o código de rastreio por e-mail. Também é possível acompanhar em Meus Pedidos dentro do app.',
      },
      {
        q: 'O frete é grátis?',
        a: 'Pedidos acima de R$ 299,00 têm frete grátis para todo o Brasil. Para valores abaixo, o frete é calculado conforme seu CEP.',
      },
    ],
  },
  {
    categoria: 'Conta e Segurança',
    itens: [
      {
        q: 'Como altero minha senha?',
        a: 'Acesse Configurações → Redefinir senha. Você receberá um e-mail com as instruções para criar uma nova senha.',
      },
      {
        q: 'Meus dados estão seguros?',
        a: 'Sim. Utilizamos criptografia de ponta a ponta e nunca compartilhamos seus dados pessoais com terceiros sem o seu consentimento.',
      },
      {
        q: 'Como excluo minha conta?',
        a: 'Para solicitar a exclusão da sua conta, entre em contato com nosso suporte pelo e-mail suporte@eletrohub.com.br. O prazo para exclusão completa é de até 30 dias.',
      },
    ],
  },
  {
    categoria: 'Anúncios',
    itens: [
      {
        q: 'Como anuncio um produto?',
        a: 'Acesse Perfil → Meus Anúncios e toque no botão "+". Preencha as informações do produto (nome, preço, categoria) e publique.',
      },
      {
        q: 'Posso vender qualquer produto?',
        a: 'Apenas produtos eletrônicos são permitidos. Produtos falsificados, com origem duvidosa ou que violem direitos autorais serão removidos.',
      },
    ],
  },
];

export default function HelpCenterScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [abertos, setAbertos] = useState({});

  function toggle(key) {
    setAbertos(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Central de Ajuda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <Ionicons name="help-buoy-outline" size={32} color={colors.primaryText} />
          </View>
          <Text style={s.bannerTitle}>Como podemos ajudar?</Text>
          <Text style={s.bannerSub}>Encontre respostas para as dúvidas mais comuns</Text>
        </View>

        {/* Contato rápido */}
        <View style={s.contactRow}>
          <TouchableOpacity style={s.contactCard}>
            <Ionicons name="mail-outline" size={22} color={colors.info} />
            <Text style={s.contactLabel}>E-mail</Text>
            <Text style={s.contactValue}>suporte@eletrohub.com.br</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.success} />
            <Text style={s.contactLabel}>Chat</Text>
            <Text style={s.contactValue}>Seg–Sex, 9h–18h</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        {FAQS.map(grupo => (
          <View key={grupo.categoria} style={s.grupo}>
            <Text style={s.grupoTitulo}>{grupo.categoria}</Text>
            <View style={s.grupoCard}>
              {grupo.itens.map((item, idx) => {
                const key = `${grupo.categoria}-${idx}`;
                const aberto = !!abertos[key];
                return (
                  <View key={key}>
                    <TouchableOpacity
                      style={[s.faqItem, idx < grupo.itens.length - 1 && !aberto && s.faqBorder]}
                      onPress={() => toggle(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.faqQ}>{item.q}</Text>
                      <Ionicons
                        name={aberto ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                    {aberto && (
                      <View style={[s.faqAnswer, idx < grupo.itens.length - 1 && s.faqBorder]}>
                        <Text style={s.faqA}>{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
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
    banner: {
      backgroundColor: colors.primary, borderRadius: 20, padding: 24,
      alignItems: 'center', marginBottom: 20,
    },
    bannerIcon: {
      width: 60, height: 60, borderRadius: 30,
      backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
    },
    bannerTitle: { fontSize: 20, fontWeight: '800', color: colors.primaryText, marginBottom: 6 },
    bannerSub: { fontSize: 13, color: colors.primaryText + 'cc', textAlign: 'center' },
    contactRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    contactCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border,
    },
    contactLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    contactValue: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
    grupo: { marginBottom: 20 },
    grupoTitulo: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4,
    },
    grupoCard: {
      backgroundColor: colors.surface, borderRadius: 16,
      overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    },
    faqItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 15,
    },
    faqBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, paddingRight: 12 },
    faqAnswer: { paddingHorizontal: 16, paddingBottom: 14 },
    faqA: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  });
}
