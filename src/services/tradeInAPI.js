import { MARKETPLACE_BASE_URL } from '../config';

// ─── Tabelas de depreciação ───────────────────────────────────────────────────

// Busca de uma vez todas as tabelas de depreciação e thresholds
export async function fetchTabelasDepreciacao() {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/tradein/tabelas`);
  if (!res.ok) throw new Error('Erro ao buscar tabelas de depreciação');
  const data = await res.json();
  return {
    basePorCategoria: data.basePorCategoria || {},
    fatoreIdade:      data.fatoresIdade      || {},
    fatoresEstado:    data.fatoresEstado     || {},
    thresholds:       data.thresholds        || { abatimento_minimo: 50, idade_maxima_anos: 10 },
  };
}

// Calcula o valor estimado de abatimento localmente (após buscar as tabelas)
export function calcularValorEstimado({ categoria, idadeFaixa, estadoDeclarado }, tabelas) {
  const base    = tabelas.basePorCategoria[categoria] ?? 0;
  const fIdade  = tabelas.fatoreIdade[idadeFaixa]     ?? 0;
  const fEstado = tabelas.fatoresEstado[estadoDeclarado] ?? 0;
  const estimado = Number(base) * Number(fIdade) * Number(fEstado);
  const minimo   = Number(tabelas.thresholds?.abatimentoMinimo ?? tabelas.thresholds?.abatimento_minimo ?? 50);
  return estimado < minimo ? 0 : Math.round(estimado * 100) / 100;
}

export function idadeExcedeMaximo(idadeFaixa, thresholds) {
  const limite = thresholds?.idadeMaximaAnos ?? thresholds?.idade_maxima_anos ?? 10;
  return idadeFaixa === '>8' && limite <= 8;
}

// ─── CRUD de solicitações de trade-in ─────────────────────────────────────────

export async function criarSolicitacaoTradeIn({
  pedidoId, compradorUserId, categoria, marca, modelo,
  idadeFaixa, estadoDeclarado, fotosDeclaradas, valorEstimado,
}) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/tradein/solicitacoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pedidoId: pedidoId || null,
      compradorUserId,
      categoria,
      marca: marca || null,
      modelo: modelo || null,
      idadeFaixa,
      estadoDeclarado,
      fotosDeclaradas: fotosDeclaradas || [],
      valorEstimado,
    }),
  });
  if (!res.ok) throw new Error('Erro ao criar solicitação de trade-in');
  return res.json();
}

export async function confirmarTradeIn(solicitacaoId, { valorConfirmado, avaliadorId, laudo }) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/tradein/solicitacoes/${solicitacaoId}/confirmar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valorConfirmado, avaliadorUserId: avaliadorId, laudo }),
  });
  if (!res.ok) throw new Error('Erro ao confirmar trade-in');
  return res.json();
}

export async function registrarDivergenciaTradeIn(solicitacaoId, novoValor) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/tradein/solicitacoes/${solicitacaoId}/divergencia`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ novoValor }),
  });
  if (!res.ok) throw new Error('Erro ao registrar divergência');
  return res.json();
}

export async function compradorAceitouDivergencia(solicitacaoId, { diferenca, pixTxid }) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/tradein/solicitacoes/${solicitacaoId}/aceitar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ diferenca, pixTxid: pixTxid || null }),
  });
  if (!res.ok) throw new Error('Erro ao aceitar trade-in');
}

export async function compradorRecusouDivergencia(solicitacaoId) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/tradein/solicitacoes/${solicitacaoId}/recusar`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Erro ao recusar trade-in');
}
