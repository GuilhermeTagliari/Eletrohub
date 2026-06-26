import { MARKETPLACE_BASE_URL } from '../config';

// ─── Validação de CEP e zona de cobertura ─────────────────────────────────────

// Retorna a zona de cobertura para um CEP, ou null se sem cobertura / não encontrado.
export async function buscarZonaPorCep(cep) {
  const cepNum = cep.replace(/\D/g, '');
  if (cepNum.length !== 8) throw new Error('CEP inválido');

  const res = await fetch(`${MARKETPLACE_BASE_URL}/logistics/cobertura/${cepNum}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Erro ao verificar CEP');
  return res.json();
}

export async function cepTemCobertura(cep) {
  try {
    const zona = await buscarZonaPorCep(cep);
    return zona !== null;
  } catch {
    return false;
  }
}

// ─── Serviços de instalação ───────────────────────────────────────────────────

export async function fetchServicosInstalacao() {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/logistics/instalacao`);
  if (!res.ok) throw new Error('Erro ao buscar serviços de instalação');
  return res.json();
}

export async function fetchServicoInstalacaoPorCategoria(categoria, zonaType) {
  const res = await fetch(
    `${MARKETPLACE_BASE_URL}/logistics/instalacao/${encodeURIComponent(categoria)}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Erro ao buscar serviço de instalação');
  const servico = await res.json();

  // Se a zona for de terceiro e o serviço não estiver disponível para terceiros, descarta
  if (zonaType === 'terceiro' && servico.disponivelZonaTerceiro === false) return null;
  return servico;
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export async function criarPedido({
  compradorUserId,
  lojistaId,
  produtoId,
  produtoNome,
  produtoCategoria,
  valorProdutoNovo,
  valorInstalacao,
  valorFrete,
  valorAbatimentoTradeIn,
  comissaoPct,
  cepEntrega,
  zonaEntrega,
  servicoInstalacaoId,
}) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compradorUserId,
      lojistaId: lojistaId || null,
      produtoId: produtoId || null,
      produtoNome: produtoNome || null,
      produtoCategoria: produtoCategoria || null,
      valorProdutoNovo,
      valorInstalacao: valorInstalacao || 0,
      valorFrete: valorFrete || 0,
      valorAbatimentoTradeIn: valorAbatimentoTradeIn || 0,
      comissaoPct: comissaoPct || 10,
      cepEntrega: cepEntrega || null,
      zonaEntrega: zonaEntrega || null,
      servicoInstalacaoId: servicoInstalacaoId || null,
    }),
  });
  if (!res.ok) throw new Error('Erro ao criar pedido');
  return res.json();
}

export async function buscarPedidosPorComprador(compradorUserId) {
  const res = await fetch(
    `${MARKETPLACE_BASE_URL}/orders?compradorUserId=${encodeURIComponent(compradorUserId)}`
  );
  if (!res.ok) throw new Error('Erro ao buscar pedidos');
  return res.json();
}

export async function buscarPedidoPorId(id) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/orders/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Erro ao buscar pedido');
  return res.json();
}

export async function atualizarStatusPedido(id, status) {
  const res = await fetch(`${MARKETPLACE_BASE_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar status do pedido');
  return res.json();
}
