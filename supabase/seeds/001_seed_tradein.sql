-- ============================================================
-- Seeds de depreciação trade-in — VALORES PLACEHOLDER
-- ADMIN DEVE REVISAR ANTES DE IR PARA PRODUÇÃO
-- ============================================================

-- Fatores de idade (multiplicadores decrescentes)
INSERT INTO tradein_fatores_idade (faixa, fator) VALUES
  ('<1',  0.850),
  ('1-3', 0.700),
  ('3-5', 0.550),
  ('5-8', 0.400),
  ('>8',  0.200)
ON CONFLICT (faixa) DO UPDATE SET fator = EXCLUDED.fator, updated_at = NOW();

-- Fatores de estado declarado
INSERT INTO tradein_fatores_estado (estado, fator) VALUES
  ('perfeito',        1.000),
  ('defeitos_leves',  0.700),
  ('nao_funciona',    0.300)
ON CONFLICT (estado) DO UPDATE SET fator = EXCLUDED.fator, updated_at = NOW();

-- Valor base por categoria (BRL — aparelho em bom estado, ~3 anos)
-- ATENÇÃO: estes são valores ilustrativos para testes
INSERT INTO tradein_base_categoria (categoria, valor_base) VALUES
  ('Geladeira',        1200.00),
  ('Freezer',           800.00),
  ('Lavadora',          900.00),
  ('Secadora',          700.00),
  ('Lava e Seca',      1400.00),
  ('Fogão',             400.00),
  ('Forno Elétrico',    300.00),
  ('Micro-ondas',       250.00),
  ('Ar Condicionado',  1000.00),
  ('Televisão',         600.00),
  ('Notebook',         1500.00),
  ('Smartphone',        800.00),
  ('Tablet',            500.00),
  ('Outros',            200.00)
ON CONFLICT (categoria) DO UPDATE SET valor_base = EXCLUDED.valor_base, updated_at = NOW();

-- Threshold inicial
INSERT INTO tradein_thresholds (abatimento_minimo, abatimento_maximo, idade_maxima_anos)
VALUES (50.00, NULL, 10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seeds de serviços de instalação — PREÇOS PLACEHOLDER
-- ============================================================
INSERT INTO servicos_instalacao (categoria, complexidade, preco, custo_real, agendamento_separado, disponivel_zona_terceiro, descricao) VALUES
  ('Geladeira',    'baixa',  80.00,  40.00, false, true,  'Posicionar, nivelar e orientar tempo de espera para ligar.'),
  ('Freezer',      'baixa',  80.00,  40.00, false, true,  'Posicionar e nivelar.'),
  ('Lavadora',     'media', 150.00,  70.00, false, true,  'Conexão de água e dreno; depende de ponto hidráulico existente.'),
  ('Secadora',     'media', 130.00,  60.00, false, true,  'Conexão elétrica e duto de ventilação.'),
  ('Lava e Seca',  'media', 160.00,  75.00, false, true,  'Conexão de água, dreno e elétrica.'),
  ('Fogão',        'media', 120.00,  55.00, false, true,  'Conexão de gás e teste de vazamento; técnico habilitado.'),
  ('Ar Condicionado', 'alta', 350.00, 180.00, true, false, 'Furação, suporte, vácuo e carga de gás. Pode exigir agendamento separado.')
ON CONFLICT (categoria) DO UPDATE
  SET preco = EXCLUDED.preco,
      custo_real = EXCLUDED.custo_real,
      descricao = EXCLUDED.descricao,
      updated_at = NOW();
