import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTradeIn } from '../context/TradeInContext';
import { useLogistics } from '../context/LogisticsContext';
import { formatBRL } from '../utils/formatters';
import { criarPedido } from '../services/logisticsAPI';
import { navigationRef } from '../navigation/AppNavigator';

export default function TradeInCheckoutScreen({ route, navigation }) {
  const { produto } = route.params;
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const {
    form: tradeInForm, ativarTradeIn, resetTradeIn,
    formularioValido, salvarSolicitacao,
  } = useTradeIn();
  const {
    cep, zona, cepLoading, cepErro, temCobertura,
    servicoSelecionado, precoFrete, precoInstalacao, agendamentoSeparado,
    validarCep, selecionarInstalacaoPorCategoria,
  } = useLogistics();

  const [cepInput, setCepInput] = useState('');
  const [queroInstalacao, setQueroInstalacao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const s = useMemo(() => makeStyles(colors), [colors]);

  const produtoCategoria = produto?.categoria || produto?.brand || '';
  const valorProduto = produto?.convertedPrice || produto?.price || 0;

  // Ao confirmar o CEP, busca serviço de instalação da categoria
  useEffect(() => {
    if (temCobertura && produtoCategoria) {
      selecionarInstalacaoPorCategoria(produtoCategoria);
    }
  }, [temCobertura, produtoCategoria]);

  // Totais calculados
  const valorAbatimento = tradeInForm.ativo && !tradeInForm.recusado ? tradeInForm.valorEstimado : 0;
  const valorInstalacaoFinal = queroInstalacao ? precoInstalacao : 0;
  const valorFreteFinal = temCobertura ? precoFrete : 0;
  const totalPagar = valorProduto + valorInstalacaoFinal + valorFreteFinal - valorAbatimento;

  function handleCepChange(text) {
    const num = text.replace(/\D/g, '').slice(0, 8);
    const formatado = num.length > 5 ? `${num.slice(0, 5)}-${num.slice(5)}` : num;
    setCepInput(formatado);
    if (num.length === 8) validarCep(num);
  }

  async function handleFinalizar() {
    if (!user) { Alert.alert('Login necessário', 'Faça login para finalizar a compra.'); return; }
    if (!formularioValido()) {
      Alert.alert('Trade-in incompleto', 'Complete os dados do aparelho (mínimo 3 fotos obrigatórias).');
      return;
    }

    setSalvando(true);
    try {
      const pedido = await criarPedido({
        compradorUserId: user.id,
        lojistaId: null,
        produtoId: String(produto?.id),
        produtoNome: produto?.description || produto?.nome,
        produtoCategoria,
        valorProdutoNovo: valorProduto,
        valorInstalacao: valorInstalacaoFinal,
        valorFrete: valorFreteFinal,
        valorAbatimentoTradeIn: valorAbatimento,
        comissaoPct: 10,
        cepEntrega: cep || null,
        zonaEntrega: zona?.tipo || null,
        servicoInstalacaoId: queroInstalacao ? servicoSelecionado?.id : null,
      });

      if (tradeInForm.ativo && !tradeInForm.recusado) {
        await salvarSolicitacao({ pedidoId: pedido.id, compradorUserId: user.id });
      }

      resetTradeIn();
      Alert.alert(
        'Pedido criado!',
        `Pedido #${pedido.id.slice(0, 8).toUpperCase()} registrado com sucesso.\n\nTotal a pagar: ${formatBRL(totalPagar)}`,
        [{ text: 'OK', onPress: () => navigationRef.navigate('Profile', { screen: 'MyOrders' }) }]
      );
    } catch (e) {
      Alert.alert('Erro', `Não foi possível finalizar o pedido.\n${e.message}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Fechar pedido</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Produto */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Produto</Text>
          <View style={s.productRow}>
            <View style={[s.productIcon, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="cube-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.productName} numberOfLines={2}>
                {produto?.description || produto?.nome}
              </Text>
              {!!produtoCategoria && <Text style={s.productSub}>{produtoCategoria}</Text>}
            </View>
            <Text style={s.productPrice}>{formatBRL(valorProduto)}</Text>
          </View>
        </View>

        {/* CEP e cobertura */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Entrega</Text>
          <Text style={s.fieldLabel}>CEP de entrega</Text>
          <View style={s.cepRow}>
            <View style={[s.inputWrapper, { flex: 1 }]}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={cepInput}
                onChangeText={handleCepChange}
                placeholder="00000-000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={9}
              />
            </View>
            {cepLoading && <ActivityIndicator style={{ marginLeft: 10 }} color={colors.primary} />}
          </View>
          {cepErro && <Text style={s.errorText}>{cepErro}</Text>}
          {temCobertura === false && (
            <View style={s.alertBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={s.alertText}>
                CEP fora da área de cobertura (RS, SC, PR). Entrega, instalação e trade-in não disponíveis.
              </Text>
            </View>
          )}
          {temCobertura === true && zona && (
            <View style={s.successBanner}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={s.successText}>
                {zona.nome} — {zona.tipo === 'frota_propria' ? 'Frota própria (entrega + instalação na mesma visita)' : 'Transportadora parceira'}
              </Text>
            </View>
          )}
        </View>

        {/* Instalação */}
        {temCobertura && servicoSelecionado && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Instalação</Text>
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleLabel}>Instalar {servicoSelecionado.categoria}</Text>
                <Text style={s.toggleSub}>{servicoSelecionado.descricao}</Text>
                {agendamentoSeparado && (
                  <View style={s.agendamentoBadge}>
                    <Ionicons name="calendar-outline" size={12} color={colors.warning} />
                    <Text style={s.agendamentoBadgeText}>Pode exigir agendamento separado</Text>
                  </View>
                )}
              </View>
              <View style={s.toggleRight}>
                <Text style={s.togglePrice}>{formatBRL(precoInstalacao)}</Text>
                <TouchableOpacity
                  style={[s.toggle, queroInstalacao && s.toggleAtivo]}
                  onPress={() => setQueroInstalacao(v => !v)}
                >
                  <View style={[s.toggleKnob, queroInstalacao && s.toggleKnobAtivo]} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Trade-in */}
        {temCobertura && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Trade-in</Text>
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleLabel}>Tenho um(a) {produtoCategoria || 'aparelho'} usado(a) pra trocar</Text>
                <Text style={s.toggleSub}>Abata o valor do usado no preço do novo</Text>
              </View>
              <TouchableOpacity
                style={[s.toggle, tradeInForm.ativo && s.toggleAtivo]}
                onPress={() => ativarTradeIn(!tradeInForm.ativo)}
              >
                <View style={[s.toggleKnob, tradeInForm.ativo && s.toggleKnobAtivo]} />
              </TouchableOpacity>
            </View>

            {tradeInForm.ativo && (
              <TouchableOpacity
                style={s.tradeInEditBtn}
                onPress={() => navigation.navigate('TradeInForm', {
                  produtoCategoria,
                  onConfirmar: () => {},
                })}
              >
                {tradeInForm.valorEstimado > 0 ? (
                  <>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.tradeInEditLabel, { color: colors.success }]}>
                        Abatimento estimado: {formatBRL(tradeInForm.valorEstimado)}
                      </Text>
                      {tradeInForm.categoria && (
                        <Text style={s.tradeInEditSub}>
                          {tradeInForm.categoria} · {tradeInForm.idadeFaixa} anos · {tradeInForm.fotos.length} foto(s)
                        </Text>
                      )}
                    </View>
                    <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                  </>
                ) : tradeInForm.recusado ? (
                  <>
                    <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                    <Text style={[s.tradeInEditLabel, { color: colors.danger, flex: 1 }]}>
                      Trade-in indisponível para este item
                    </Text>
                    <Ionicons name="create-outline" size={18} color={colors.textMuted} />
                  </>
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={[s.tradeInEditLabel, { color: colors.primary, flex: 1 }]}>
                      Preencher dados do aparelho usado
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Resumo financeiro */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Resumo</Text>
          <ResumoLinha label="Produto" valor={valorProduto} colors={colors} />
          {queroInstalacao && valorInstalacaoFinal > 0 && (
            <ResumoLinha
              label={`Instalação (${servicoSelecionado?.categoria || ''})`}
              valor={valorInstalacaoFinal}
              colors={colors}
            />
          )}
          {temCobertura && valorFreteFinal > 0 && (
            <ResumoLinha label={`Frete (${zona?.nome || ''})`} valor={valorFreteFinal} colors={colors} />
          )}
          {valorAbatimento > 0 && (
            <ResumoLinha
              label="(−) Abatimento trade-in"
              valor={-valorAbatimento}
              colors={colors}
              destaque
            />
          )}
          <View style={s.resumoDivider} />
          <View style={s.resumoTotal}>
            <Text style={s.resumoTotalLabel}>Total a pagar agora</Text>
            <Text style={s.resumoTotalValor}>{formatBRL(Math.max(0, totalPagar))}</Text>
          </View>
          {valorAbatimento > 0 && (
            <Text style={s.resumoAviso}>
              * Abatimento de trade-in estimado — valor final confirmado na entrega
            </Text>
          )}
        </View>

      </ScrollView>

      {/* Botão finalizar */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btnFinalizar, salvando && { opacity: 0.6 }]}
          onPress={handleFinalizar}
          disabled={salvando}
        >
          {salvando
            ? <ActivityIndicator color={colors.primaryText} />
            : <Text style={s.btnFinalizarText}>Finalizar pedido · {formatBRL(Math.max(0, totalPagar))}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ResumoLinha({ label, valor, colors, destaque }) {
  const s2 = {
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    label: { fontSize: 14, color: destaque ? colors.success : colors.textSecondary },
    valor: { fontSize: 14, fontWeight: '700', color: destaque ? colors.success : colors.text },
  };
  return (
    <View style={s2.row}>
      <Text style={s2.label}>{label}</Text>
      <Text style={s2.valor}>{formatBRL(Math.abs(valor))}</Text>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 36 },
    title: { fontSize: 17, fontWeight: '800', color: colors.text },
    content: { padding: 16, gap: 0, paddingBottom: 20 },

    card: {
      backgroundColor: colors.surface, borderRadius: 16,
      padding: 18, marginBottom: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 11, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14,
    },

    productRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    productIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    productName: { fontSize: 14, fontWeight: '700', color: colors.text, flexShrink: 1 },
    productSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    productPrice: { fontSize: 16, fontWeight: '800', color: colors.text },

    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    cepRow: { flexDirection: 'row', alignItems: 'center' },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12,
      backgroundColor: colors.inputBg, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 6 },

    alertBanner: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: colors.warning + '18', borderRadius: 10,
      padding: 10, marginTop: 10, borderWidth: 1, borderColor: colors.warning + '44',
    },
    alertText: { flex: 1, fontSize: 12, color: colors.warning, lineHeight: 17 },
    successBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.success + '14', borderRadius: 10,
      padding: 10, marginTop: 10, borderWidth: 1, borderColor: colors.success + '44',
    },
    successText: { flex: 1, fontSize: 12, color: colors.success, lineHeight: 17 },

    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    toggleSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
    toggleRight: { alignItems: 'flex-end', gap: 6 },
    togglePrice: { fontSize: 13, fontWeight: '700', color: colors.text },
    toggle: {
      width: 46, height: 26, borderRadius: 13,
      backgroundColor: colors.border, padding: 2,
    },
    toggleAtivo: { backgroundColor: colors.primary },
    toggleKnob: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: '#fff', shadowOpacity: 0.2, shadowRadius: 2,
    },
    toggleKnobAtivo: { transform: [{ translateX: 20 }] },

    agendamentoBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.warning + '18', borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3, marginTop: 6, alignSelf: 'flex-start',
    },
    agendamentoBadgeText: { fontSize: 11, color: colors.warning, fontWeight: '600' },

    tradeInEditBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.bg, borderRadius: 12, padding: 12,
      marginTop: 12, borderWidth: 1.5, borderColor: colors.border,
    },
    tradeInEditLabel: { fontSize: 13, fontWeight: '700' },
    tradeInEditSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

    resumoDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    resumoTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    resumoTotalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
    resumoTotalValor: { fontSize: 20, fontWeight: '800', color: colors.primary },
    resumoAviso: { fontSize: 11, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' },

    footer: {
      padding: 16, backgroundColor: colors.surface,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    btnFinalizar: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 16, alignItems: 'center',
    },
    btnFinalizarText: { color: colors.primaryText, fontSize: 16, fontWeight: '800' },
  });
}
