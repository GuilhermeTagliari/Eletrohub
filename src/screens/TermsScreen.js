import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const SECTIONS = [
  {
    titulo: '1. Aceitação dos Termos',
    texto: 'Ao criar uma conta ou utilizar o aplicativo EletroHub, você concorda com estes Termos de Uso. Se não concordar com qualquer parte destes termos, você não deve usar o aplicativo.\n\nEstes termos constituem um acordo legal entre você e o EletroHub. Recomendamos que você os leia com atenção.',
  },
  {
    titulo: '2. Descrição do Serviço',
    texto: 'O EletroHub é uma plataforma de marketplace voltada para a compra e venda de produtos eletrônicos. O aplicativo permite que usuários:\n\n• Naveguem e comprem produtos eletrônicos;\n• Anunciem produtos para venda;\n• Gerenciem pedidos, favoritos e endereços;\n• Avaliem produtos e vendedores;\n• Troquem mensagens sobre negociações.',
  },
  {
    titulo: '3. Cadastro e Conta',
    texto: 'Para utilizar os recursos completos do EletroHub, você deve criar uma conta com informações verdadeiras e atualizadas. Você é responsável por:\n\n• Manter a confidencialidade da sua senha;\n• Todas as atividades realizadas com sua conta;\n• Notificar imediatamente o suporte em caso de uso não autorizado.\n\nReservamo-nos o direito de suspender ou encerrar contas que violem estes termos.',
  },
  {
    titulo: '4. Regras de Uso',
    texto: 'Ao usar o EletroHub, você concorda em não:\n\n• Publicar informações falsas ou enganosas;\n• Anunciar produtos falsificados, ilegais ou proibidos;\n• Usar o aplicativo para atividades fraudulentas;\n• Violar direitos de propriedade intelectual;\n• Tentar acessar sistemas ou dados de outros usuários;\n• Praticar qualquer forma de discriminação ou assédio;\n• Realizar spam ou comunicações não solicitadas.',
  },
  {
    titulo: '5. Anúncios e Vendas',
    texto: 'Os vendedores são responsáveis pela veracidade das informações dos produtos anunciados. O EletroHub não se responsabiliza por:\n\n• A qualidade ou funcionamento dos produtos anunciados;\n• Divergências entre a descrição e o produto entregue;\n• Negociações realizadas fora da plataforma.\n\nAnúncios que violem nossas políticas poderão ser removidos sem aviso prévio.',
  },
  {
    titulo: '6. Pagamentos',
    texto: 'Todas as transações são processadas por gateways de pagamento certificados e seguros. O EletroHub não armazena dados de cartão de crédito ou débito.\n\nO reembolso em caso de cancelamento será processado conforme a política de reembolso do meio de pagamento utilizado, em prazo de até 10 dias úteis.',
  },
  {
    titulo: '7. Propriedade Intelectual',
    texto: 'Todo o conteúdo do aplicativo EletroHub, incluindo design, logotipo, textos, imagens e código-fonte, é protegido por direitos autorais e demais direitos de propriedade intelectual.\n\nÉ vedada a reprodução, distribuição ou modificação de qualquer elemento do aplicativo sem autorização prévia e expressa do EletroHub.',
  },
  {
    titulo: '8. Limitação de Responsabilidade',
    texto: 'O EletroHub não garante a disponibilidade ininterrupta do serviço e não se responsabiliza por danos decorrentes de falhas técnicas, ataques cibernéticos ou eventos fora do nosso controle.\n\nEm nenhuma circunstância nossa responsabilidade excederá o valor pago pelo usuário na transação específica que originou o dano.',
  },
  {
    titulo: '9. Alterações nos Termos',
    texto: 'Podemos modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor após notificação dentro do aplicativo. O uso continuado do EletroHub após a notificação constitui aceitação dos novos termos.',
  },
  {
    titulo: '10. Disposições Gerais',
    texto: 'Estes Termos de Uso são regidos pela legislação brasileira. Qualquer disputa será submetida ao foro da comarca de domicílio do usuário.\n\nSe alguma cláusula destes termos for considerada inválida, as demais permanecerão em pleno vigor.\n\nDúvidas: termos@eletrohub.com.br',
  },
];

export default function TermsScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Termos de Uso</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.metaCard}>
          <Ionicons name="document-text-outline" size={28} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={s.metaTitle}>EletroHub — Termos de Uso</Text>
            <Text style={s.metaDate}>Última atualização: Junho de 2025</Text>
          </View>
        </View>

        <Text style={s.intro}>
          Bem-vindo ao EletroHub. Antes de usar nosso aplicativo, leia atentamente estes Termos de Uso. Eles estabelecem as regras e condições para a utilização da nossa plataforma.
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
