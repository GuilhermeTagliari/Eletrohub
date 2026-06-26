-- ============================================================
-- EletroHub — Schema principal do marketplace
-- Supabase / PostgreSQL
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- LOJISTAS (multi-vendedor)
-- ============================================================
CREATE TABLE lojistas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL UNIQUE,        -- ID do auth-service Java
  nome         TEXT NOT NULL,
  cnpj         TEXT,
  email        TEXT NOT NULL,
  telefone     TEXT,
  comissao_pct DECIMAL(5,2) NOT NULL DEFAULT 10.0,  -- take rate %
  ativo        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PEDIDOS
-- Sempre separar os componentes de valor — nunca somar e guardar
-- só o total. Isso garante relatórios de receita da plataforma.
-- ============================================================
CREATE TABLE pedidos (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_user_id        TEXT NOT NULL,
  lojista_id               UUID REFERENCES lojistas(id),

  -- Componentes do pedido (transparência no checkout)
  valor_produto_novo       DECIMAL(12,2) NOT NULL,
  valor_instalacao         DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_frete              DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_abatimento_tradein DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_total_pagar        DECIMAL(12,2) NOT NULL,

  -- Componentes de receita da plataforma (para relatórios)
  comissao_plataforma      DECIMAL(12,2) NOT NULL DEFAULT 0,
  taxa_tradein             DECIMAL(12,2) NOT NULL DEFAULT 0,
  margem_logistica         DECIMAL(12,2) NOT NULL DEFAULT 0,
  repasse_lojista          DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Produto (referência ao product-service Java)
  produto_id               TEXT,
  produto_nome             TEXT,
  produto_categoria        TEXT,

  -- Entrega
  cep_entrega              TEXT,
  zona_entrega             TEXT,   -- 'frota_propria' | 'terceiro'
  servico_instalacao_id    UUID,   -- FK para servicos_instalacao

  -- Status
  status                   TEXT NOT NULL DEFAULT 'pendente',
  -- pendente → pago → em_separacao → saiu_para_entrega
  -- → entregue_confirmado → concluido | cancelado

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRADE-IN — SOLICITAÇÕES
-- Registra a declaração do comprador e o resultado da avaliação
-- ============================================================
CREATE TABLE tradein_solicitacoes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id            UUID REFERENCES pedidos(id),
  comprador_user_id    TEXT NOT NULL,

  -- Aparelho declarado pelo comprador
  categoria            TEXT NOT NULL,
  marca                TEXT,
  modelo               TEXT,
  idade_faixa          TEXT NOT NULL,
  -- '<1' | '1-3' | '3-5' | '5-8' | '>8'
  estado_declarado     TEXT NOT NULL,
  -- 'perfeito' | 'defeitos_leves' | 'nao_funciona'
  fotos_declaradas     TEXT[],   -- URIs das fotos enviadas pelo comprador

  -- Valores
  valor_estimado       DECIMAL(12,2),  -- calculado na declaração
  valor_confirmado     DECIMAL(12,2),  -- confirmado na avaliação física
  diferenca_cobrada    DECIMAL(12,2) DEFAULT 0,  -- se valor_confirmado < valor_estimado

  -- Status do trade-in
  status               TEXT NOT NULL DEFAULT 'estimado',
  -- estimado → confirmado | divergente → aceito_pelo_comprador | recusado_pelo_comprador

  -- Avaliação física (preenchida pela equipe de campo)
  avaliador_user_id    TEXT,
  avaliacao_fotos      TEXT[],
  avaliacao_laudo      TEXT,
  avaliacao_data       TIMESTAMPTZ,
  pix_txid             TEXT,    -- ID da transação PIX se houve diferença
  pix_status           TEXT,    -- 'pendente' | 'confirmado'

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ITENS USADOS (estoque de revenda)
-- Ciclo: recebido_para_revisao → em_revisao → aprovado_revenda
--        → anunciado → vendido | reprovado
-- ============================================================
CREATE TABLE itens_usados (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tradein_id              UUID REFERENCES tradein_solicitacoes(id),

  categoria               TEXT NOT NULL,
  marca                   TEXT,
  modelo                  TEXT,

  valor_abatimento_pago   DECIMAL(12,2) NOT NULL,   -- quanto foi abatido
  valor_revenda_estimado  DECIMAL(12,2),            -- estimativa pós-revisão
  valor_revenda_real      DECIMAL(12,2),            -- preço final de venda

  status                  TEXT NOT NULL DEFAULT 'recebido_para_revisao',

  fotos_revisao           TEXT[],
  laudo_revisao           TEXT,
  revisado_por            TEXT,
  revisado_em             TIMESTAMPTZ,

  anuncio_id              TEXT,   -- ID no product-service quando publicado

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ZONAS DE CEP (configurável pelo admin — nunca hardcoded)
-- Faixas de CEP → zona de cobertura
-- ============================================================
CREATE TABLE zonas_cep (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  -- 'frota_propria' | 'terceiro' | 'sem_cobertura'
  estado      TEXT,          -- 'RS' | 'SC' | 'PR'
  cep_inicio  TEXT NOT NULL,
  cep_fim     TEXT NOT NULL,
  preco_frete DECIMAL(12,2) NOT NULL DEFAULT 0,  -- custo cobrado ao comprador
  custo_real  DECIMAL(12,2) NOT NULL DEFAULT 0,  -- custo operacional
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVIÇOS DE INSTALAÇÃO (configurável pelo admin)
-- ============================================================
CREATE TABLE servicos_instalacao (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria                TEXT NOT NULL UNIQUE,
  complexidade             TEXT NOT NULL,
  -- 'baixa' | 'media' | 'alta'
  preco                    DECIMAL(12,2) NOT NULL,
  custo_real               DECIMAL(12,2) NOT NULL DEFAULT 0,
  agendamento_separado     BOOLEAN NOT NULL DEFAULT false,
  disponivel_zona_terceiro BOOLEAN NOT NULL DEFAULT true,
  descricao                TEXT,
  ativo                    BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELAS DE DEPRECIAÇÃO TRADE-IN (configurável pelo admin)
-- ============================================================

-- Valor base por categoria (BRL, aparelho em bom estado)
CREATE TABLE tradein_base_categoria (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria  TEXT NOT NULL UNIQUE,
  valor_base DECIMAL(12,2) NOT NULL,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Multiplicador por faixa de idade
CREATE TABLE tradein_fatores_idade (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faixa      TEXT NOT NULL UNIQUE,
  -- '<1' | '1-3' | '3-5' | '5-8' | '>8'
  fator      DECIMAL(5,3) NOT NULL,  -- 0.000 a 1.000
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Multiplicador por estado declarado
CREATE TABLE tradein_fatores_estado (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estado     TEXT NOT NULL UNIQUE,
  -- 'perfeito' | 'defeitos_leves' | 'nao_funciona'
  fator      DECIMAL(5,3) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Thresholds de trade-in (uma linha — editável pelo admin)
CREATE TABLE tradein_thresholds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abatimento_minimo   DECIMAL(12,2) NOT NULL DEFAULT 50.00,
  abatimento_maximo   DECIMAL(12,2),               -- NULL = sem limite
  idade_maxima_anos   INTEGER NOT NULL DEFAULT 10,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_pedidos_comprador   ON pedidos(comprador_user_id);
CREATE INDEX idx_pedidos_lojista     ON pedidos(lojista_id);
CREATE INDEX idx_pedidos_status      ON pedidos(status);
CREATE INDEX idx_tradein_pedido      ON tradein_solicitacoes(pedido_id);
CREATE INDEX idx_tradein_comprador   ON tradein_solicitacoes(comprador_user_id);
CREATE INDEX idx_itens_usados_status ON itens_usados(status);
CREATE INDEX idx_zonas_cep_tipo      ON zonas_cep(tipo, ativo);

-- ============================================================
-- RLS (Row Level Security) — habilitar por tabela
-- Ajustar as policies conforme autenticação for integrada
-- ============================================================
ALTER TABLE pedidos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradein_solicitacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_usados           ENABLE ROW LEVEL SECURITY;

-- Policy pública temporária para desenvolvimento (REMOVER em produção)
CREATE POLICY "dev_allow_all_pedidos"
  ON pedidos FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "dev_allow_all_tradein"
  ON tradein_solicitacoes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "dev_allow_all_itens"
  ON itens_usados FOR ALL USING (true) WITH CHECK (true);
