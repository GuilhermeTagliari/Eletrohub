import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  {
    titulo: '1. Informações que coletamos',
    texto: 'Coletamos as informações que você nos fornece diretamente, como nome, endereço de e-mail e senha ao criar uma conta. Também coletamos informações sobre seu uso do aplicativo, como produtos visualizados, favoritos, itens no carrinho e histórico de pedidos.\n\nAlém disso, coletamos automaticamente determinadas informações técnicas, incluindo tipo de dispositivo, sistema operacional e endereço IP, para garantir o funcionamento seguro da plataforma.',
  },
  {
    titulo: '2. Como usamos suas informações',
    texto: 'Utilizamos suas informações para:\n\n• Criar e gerenciar sua conta;\n• Processar e entregar pedidos;\n• Enviar notificações sobre pedidos e promoções (somente com seu consentimento);\n• Melhorar a experiência do aplicativo;\n• Prevenir fraudes e garantir a segurança da plataforma;\n• Cumprir obrigações legais e regulatórias.',
  },
  {
    titulo: '3. Compartilhamento de dados',
    texto: 'Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing sem o seu consentimento explícito.\n\nPodemos compartilhar informações com parceiros de entrega e processadores de pagamento estritamente para a execução dos serviços contratados. Todos os parceiros estão sujeitos a obrigações contratuais de confidencialidade.',
  },
  {
    titulo: '4. Segurança dos dados',
    texto: 'Adotamos medidas técnicas e organizacionais para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia SSL/TLS para transmissão de dados e armazenamento seguro de senhas com hashing.\n\nApesar de nossos esforços, nenhum sistema de segurança é infalível. Recomendamos que você use senhas fortes e não as compartilhe.',
  },
  {
    titulo: '5. Retenção de dados',
    texto: 'Mantemos suas informações pelo tempo necessário para prestar os serviços ou conforme exigido por lei. Ao solicitar a exclusão da sua conta, seus dados pessoais serão removidos em até 30 dias, exceto aqueles que precisamos reter por obrigações legais.',
  },
  {
    titulo: '6. Seus direitos (LGPD)',
    texto: 'Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:\n\n• Confirmar a existência de tratamento de dados;\n• Acessar seus dados;\n• Corrigir dados incompletos, inexatos ou desatualizados;\n• Solicitar a anonimização, bloqueio ou exclusão de dados;\n• Revogar o consentimento a qualquer momento;\n• Solicitar a portabilidade dos dados.\n\nPara exercer esses direitos, entre em contato pelo e-mail privacidade@eletrohub.com.br.',
  },
  {
    titulo: '7. Cookies e tecnologias similares',
    texto: 'Utilizamos tecnologias de armazenamento local (como AsyncStorage no aplicativo) para manter sua sessão ativa e salvar preferências como tema e histórico de busca. Esses dados são armazenados apenas no seu dispositivo e não são transmitidos para nossos servidores.',
  },
  {
    titulo: '8. Alterações nesta política',
    texto: 'Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por meio de aviso no aplicativo ou por e-mail. O uso continuado do EletroHub após as alterações constitui aceitação da nova política.',
  },
  {
    titulo: '9. Contato',
    texto: 'Se tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados pessoais, entre em contato:\n\nEletroHub — Encarregado de Dados (DPO)\nE-mail: privacidade@eletrohub.com.br\nResponsável: Equipe EletroHub',
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Política de Privacidade</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.metaCard}>
          <Ionicons name="shield-checkmark-outline" size={28} color={colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={s.metaTitle}>EletroHub — Política de Privacidade</Text>
            <Text style={s.metaDate}>Última atualização: Junho de 2025</Text>
          </View>
        </View>

        <Text style={s.intro}>
          A sua privacidade é importante para nós. Esta política descreve como o EletroHub coleta, usa e protege suas informações pessoais de acordo com a legislação brasileira, incluindo a Lei Geral de Proteção de Dados (LGPD).
        </Text>

        {SECTIONS.map(sec => (
          <View key={sec.titulo} style={s.section}>
            <Text style={s.sectionTitle}>{sec.titulo}</Text>
            <Text style={s.sectionText}>{sec.texto}</Text>
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
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    content: { padding: 16 },
    metaCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16,
    },
    metaTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    metaDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    intro: {
      fontSize: 14, color: colors.textSecondary, lineHeight: 22,
      marginBottom: 20, paddingHorizontal: 4,
    },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
    sectionText: { fontSize: 13, color: colors.textSecondary, lineHeight: 21 },
  });
}
