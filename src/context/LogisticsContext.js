import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  buscarZonaPorCep,
  fetchServicosInstalacao,
  fetchServicoInstalacaoPorCategoria,
} from '../services/logisticsAPI';

const LogisticsContext = createContext(null);

export function LogisticsProvider({ children }) {
  const [cep, setCep] = useState('');
  const [zona, setZona] = useState(null);        // resultado de buscarZonaPorCep
  const [cepLoading, setCepLoading] = useState(false);
  const [cepErro, setCepErro] = useState(null);
  const [temCobertura, setTemCobertura] = useState(null);  // null = não verificado

  const [servicosInstalacao, setServicosInstalacao] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);

  // Valida o CEP e busca a zona de cobertura
  const validarCep = useCallback(async (novoCep) => {
    const cepNum = novoCep.replace(/\D/g, '');
    setCep(cepNum);
    setCepErro(null);
    setZona(null);
    setTemCobertura(null);

    if (cepNum.length !== 8) return;

    setCepLoading(true);
    try {
      const zonaEncontrada = await buscarZonaPorCep(cepNum);
      setZona(zonaEncontrada);
      setTemCobertura(zonaEncontrada !== null);
    } catch (e) {
      setCepErro(e.message);
      setTemCobertura(false);
    } finally {
      setCepLoading(false);
    }
  }, []);

  // Carrega catálogo de instalação (para a tela de checkout)
  const carregarServicosInstalacao = useCallback(async () => {
    try {
      const lista = await fetchServicosInstalacao();
      setServicosInstalacao(lista);
    } catch { /* falha silenciosa — UI deve tratar */ }
  }, []);

  // Busca o serviço de instalação para a categoria do produto sendo comprado
  const selecionarInstalacaoPorCategoria = useCallback(async (categoria) => {
    if (!zona) { setServicoSelecionado(null); return; }
    try {
      const servico = await fetchServicoInstalacaoPorCategoria(categoria, zona.tipo);
      setServicoSelecionado(servico);
    } catch {
      setServicoSelecionado(null);
    }
  }, [zona]);

  const limparLogistica = useCallback(() => {
    setCep('');
    setZona(null);
    setTemCobertura(null);
    setCepErro(null);
    setServicoSelecionado(null);
  }, []);

  const precisaInstalacao = servicoSelecionado !== null;
  const precoFrete = zona?.preco_frete ?? 0;
  const precoInstalacao = servicoSelecionado?.preco ?? 0;
  const agendamentoSeparado = servicoSelecionado?.agendamento_separado ?? false;

  return (
    <LogisticsContext.Provider value={{
      cep,
      zona,
      cepLoading,
      cepErro,
      temCobertura,
      servicosInstalacao,
      servicoSelecionado,
      precisaInstalacao,
      precoFrete,
      precoInstalacao,
      agendamentoSeparado,
      validarCep,
      carregarServicosInstalacao,
      selecionarInstalacaoPorCategoria,
      limparLogistica,
    }}>
      {children}
    </LogisticsContext.Provider>
  );
}

export function useLogistics() {
  return useContext(LogisticsContext);
}
