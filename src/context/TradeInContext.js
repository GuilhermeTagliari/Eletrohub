import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  // fetchTabelasDepreciacao,  // reativar quando Supabase estiver configurado
  calcularValorEstimado,
  idadeExcedeMaximo,
  criarSolicitacaoTradeIn,
} from '../services/tradeInAPI';

const TradeInContext = createContext(null);

// Valores offline — espelham V2/V3 do banco. Usados quando o marketplace-service está inacessível.
const TABELAS_FALLBACK = {
  basePorCategoria: {
    'Geladeira': 2200, 'Geladeira Premium': 4500,
    'Freezer': 1100,
    'Lavadora': 1800, 'Lavadora Premium': 3200,
    'Secadora': 1600, 'Lava e Seca': 3000,
    'Fogão': 750, 'Fogão Premium': 1800,
    'Forno Elétrico': 500, 'Micro-ondas': 450,
    'Ar Condicionado': 2400, 'Ar Condicionado Premium': 4500,
    'Televisão': 1400, 'TV Premium': 4000,
    'Notebook': 3000, 'Notebook Premium': 8000,
    'Smartphone': 1400, 'Smartphone Premium': 5800,
    'Tablet': 1100, 'Tablet Premium': 4200,
    'Outros': 300,
  },
  fatoreIdade:  { '<1': 0.88, '1-3': 0.75, '3-5': 0.56, '5-8': 0.38, '>8': 0.18 },
  fatoresEstado: { perfeito: 1.0, defeitos_leves: 0.65, nao_funciona: 0.25 },
  thresholds: { abatimentoMinimo: 100, idadeMaximaAnos: 10 },
};

const ESTADO_INICIAL = {
  ativo: false,            // toggle ligado?
  categoria: '',
  marca: '',
  modelo: '',
  idadeFaixa: '',          // '<1' | '1-3' | '3-5' | '5-8' | '>8'
  estadoDeclarado: '',     // 'perfeito' | 'defeitos_leves' | 'nao_funciona'
  fotos: [],               // URIs locais das fotos
  valorEstimado: 0,
  recusado: false,         // true se aparelho exceder limites
  motivo_recusa: '',
};

export function TradeInProvider({ children }) {
  const [tabelas, setTabelas] = useState(TABELAS_FALLBACK);
  const [tabelasLoading, setTabelasLoading] = useState(false);
  const [tabelasErro, setTabelasErro] = useState(null);
  const [form, setForm] = useState(ESTADO_INICIAL);

  // Tabelas são carregadas do TABELAS_FALLBACK acima (valores atualizados jun/2025).
  // Quando Supabase estiver configurado, descomentar o fetch abaixo:
  // useEffect(() => {
  //   fetchTabelasDepreciacao().then(t => { if (t) setTabelas(t); }).catch(() => {});
  // }, []);

  // Recalcula o valor estimado sempre que os campos relevantes mudam
  useEffect(() => {
    if (!tabelas || !form.ativo) return;
    if (!form.categoria || !form.idadeFaixa || !form.estadoDeclarado) {
      setForm(f => ({ ...f, valorEstimado: 0, recusado: false, motivo_recusa: '' }));
      return;
    }

    if (idadeExcedeMaximo(form.idadeFaixa, tabelas.thresholds)) {
      setForm(f => ({
        ...f, valorEstimado: 0, recusado: true,
        motivo_recusa: `Aparelhos com mais de ${tabelas.thresholds.idade_maxima_anos} anos não são aceitos no trade-in.`,
      }));
      return;
    }

    const estimado = calcularValorEstimado(
      { categoria: form.categoria, idadeFaixa: form.idadeFaixa, estadoDeclarado: form.estadoDeclarado },
      tabelas
    );

    if (estimado <= 0) {
      setForm(f => ({
        ...f, valorEstimado: 0, recusado: true,
        motivo_recusa: `Valor estimado abaixo do mínimo (R$ ${tabelas.thresholds.abatimento_minimo?.toFixed(2)}). Trade-in não disponível para este aparelho.`,
      }));
    } else {
      setForm(f => ({ ...f, valorEstimado: estimado, recusado: false, motivo_recusa: '' }));
    }
  }, [tabelas, form.ativo, form.categoria, form.idadeFaixa, form.estadoDeclarado]);

  const ativarTradeIn = useCallback((ativo) => {
    setForm(f => ({ ...f, ativo }));
    if (!ativo) resetTradeIn();
  }, []);

  const atualizarCampo = useCallback((campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
  }, []);

  const adicionarFoto = useCallback((uri) => {
    setForm(f => ({ ...f, fotos: [...f.fotos, uri] }));
  }, []);

  const removerFoto = useCallback((index) => {
    setForm(f => ({ ...f, fotos: f.fotos.filter((_, i) => i !== index) }));
  }, []);

  const resetTradeIn = useCallback(() => {
    setForm(ESTADO_INICIAL);
  }, []);

  // Valida se o formulário está completo para prosseguir
  const formularioValido = useCallback(() => {
    if (!form.ativo) return true;
    return (
      form.categoria &&
      form.idadeFaixa &&
      form.estadoDeclarado &&
      form.fotos.length >= 3 &&
      !form.recusado
    );
  }, [form]);

  // Persiste a solicitação no Supabase (chamado após confirmar checkout)
  const salvarSolicitacao = useCallback(async ({ pedidoId, compradorUserId }) => {
    if (!form.ativo || form.recusado) return null;
    return criarSolicitacaoTradeIn({
      pedidoId,
      compradorUserId,
      categoria: form.categoria,
      marca: form.marca,
      modelo: form.modelo,
      idadeFaixa: form.idadeFaixa,
      estadoDeclarado: form.estadoDeclarado,
      fotosDeclaradas: form.fotos,
      valorEstimado: form.valorEstimado,
    });
  }, [form]);

  const categoriasDisponiveis = tabelas
    ? Object.keys(tabelas.basePorCategoria).sort()
    : [];

  return (
    <TradeInContext.Provider value={{
      form,
      tabelas,
      tabelasLoading,
      tabelasErro,
      categoriasDisponiveis,
      ativarTradeIn,
      atualizarCampo,
      adicionarFoto,
      removerFoto,
      resetTradeIn,
      formularioValido,
      salvarSolicitacao,
    }}>
      {children}
    </TradeInContext.Provider>
  );
}

export function useTradeIn() {
  return useContext(TradeInContext);
}
