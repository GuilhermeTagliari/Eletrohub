# Relatório de Avaliação do Projeto
**Disciplina:** Projeto, Design e Engenharia de Processos — Paradigma de Linguagem de Programação  
**Data de Entrega:** 29/06/2026  
**Professores:** Augusto Kruger Ortolan / Luciano Rodrigo Ferretto

---

## 1. Nome do Aplicativo

**EletroHub**

---

## 2. Logo do Aplicativo

> *(Inserir imagem da logo do EletroHub aqui)*

---

## 3. Integrantes do Grupo

| Nome | RA | Papel |
|---|---|---|
| Guilherme Tagliari | 1134870 | Frontend |
| Arthur | 1137711 | Backend |
| Lorenzo | 1134869 | Backend |
| Naubert | 1138130 | UI/UX (Figma) |
| Léo | [RA] | Frontend |
| JR | 1134269 | Integração Frontend/Backend |

---

## 4. Explicação do Tema do Aplicativo

O **EletroHub** é um marketplace multi-vendedor de eletrodomésticos e eletrônicos, voltado para venda e revenda de produtos novos e usados. A plataforma conecta lojistas e vendedores independentes a compradores, operando predominantemente nas regiões Sul do Brasil (RS, SC, PR).

**Por que esse tema?**  
O setor de eletrodomésticos movimenta bilhões de reais por ano no Brasil, com alto volume de revenda informal. O EletroHub propõe organizar esse mercado com dois diferenciais competitivos:

1. **Trade-in integrado:** o comprador entrega o aparelho usado como parte do pagamento do novo, com abatimento calculado automaticamente por tabelas configuráveis de depreciação (categoria, idade e estado do aparelho).
2. **Logística regional:** entrega + instalação + coleta do usado na mesma viagem, com frota própria cobrindo RS, SC e PR. Usuários dessas regiões têm frete grátis no sistema EletroHub.

A relevância do tema está na digitalização de um processo que hoje é feito de forma desorganizada, além de criar uma plataforma que gera receita para a empresa por comissão, taxa de trade-in e margem logística.

---

## 5. Explicação das Funcionalidades do Aplicativo

### 5.1 Área do Cliente

| Funcionalidade | Descrição |
|---|---|
| **Login** | Autenticação com e-mail e senha via JWT. Mantém sessão com AsyncStorage. |
| **Cadastro** | Criação de conta com nome, e-mail e senha. |
| **Onboarding** | Tela de boas-vindas para novos usuários. |
| **Home / Lista de Produtos** | Exibe produtos do backend com filtros por categoria (Geladeira, Fogão, Smartphone, etc.), busca por texto, seções de recomendados, vistos recentemente e em promoção. Suporta pull-to-refresh. |
| **Detalhe do Produto** | Exibe descrição, preço (em BRL/USD/EUR), informações do vendedor, frete calculado por CEP/estado, chat com vendedor e entrada para Trade-in + Instalação EletroHub. |
| **Carrinho** | Adiciona, remove e ajusta quantidade de produtos. Mostra subtotal por produto e total geral. |
| **Checkout / Pagamento** | Resumo do pedido com trade-in aplicado como desconto. Seleção de método de pagamento: Cartão de Crédito, PIX (apenas BRL), Boleto. Mostra total na moeda selecionada (BRL/USD/EUR). |
| **Trade-in** | Formulário para declarar aparelho usado (categoria, marca, modelo, idade, estado e 3 fotos). Calcula estimativa de abatimento automaticamente por tabelas de depreciação configuráveis. |
| **Histórico de Pedidos** | Lista todos os pedidos do usuário com status, data e valor. |
| **Favoritos** | Salva e gerencia produtos favoritos localmente. |
| **Perfil do Usuário** | Exibe nome, e-mail, endereços cadastrados e opções de configuração. |
| **Endereços** | Cadastra e seleciona endereço de entrega. O estado do endereço determina elegibilidade ao frete grátis (RS/SC/PR). |
| **Chat** | Comunicação direta entre comprador e vendedor por produto. |
| **Notificações** | Central de notificações do usuário. |
| **Busca** | Pesquisa por nome, marca ou categoria de produto. |
| **Avaliações** | Avaliação de produto e vendedor após compra realizada. |
| **Tema claro/escuro** | Suporte completo a dark mode e light mode. |
| **Moeda** | Exibição de preços em BRL, USD ou EUR com conversão em tempo real via currency-service. |

### 5.2 Área do Vendedor

| Funcionalidade | Descrição |
|---|---|
| **Meus Anúncios** | Lista e gerencia produtos anunciados pelo vendedor. |
| **Adicionar Produto** | Cadastro de novo produto com fotos, categoria, preço, condição e tipo de frete. |
| **Editar Loja** | Configuração do perfil da loja/vendedor. |
| **Promoções** | Ativa desconto percentual com data de expiração nos produtos. |

---

## 6. Descrição Técnica do Front-End

### Tecnologia Principal
- **React Native 0.81.5** com **Expo ~54.0.0**
- **JavaScript (ES2024)**

### Arquitetura
O projeto segue o padrão de **Context API + Hooks** para gerenciamento de estado global, sem Redux. Cada domínio tem seu próprio contexto:

```
src/
├── components/       # Componentes reutilizáveis (ProductCard, SkeletonCard, Toast, Stars...)
├── context/          # 13 contextos: AuthContext, CartContext, FavoritesContext,
│                     # ThemeContext, CurrencyContext, TradeInContext, LogisticsContext,
│                     # OrdersContext, AddressContext, NotificationsContext...
├── navigation/       # AppNavigator.js — stack + bottom tabs + navigationRef global
├── screens/          # 30+ telas
├── services/         # api.js, tradeInAPI.js, logisticsAPI.js
├── theme.js          # lightColors e darkColors
├── config.js         # URLs dos microservices (HOST, ports)
└── utils/            # formatters.js, tabBarAnim.js
```

### Principais Bibliotecas

| Biblioteca | Versão | Finalidade |
|---|---|---|
| expo | ~54.0.0 | Plataforma de desenvolvimento React Native |
| react-navigation/native | ^7.2.5 | Navegação entre telas |
| react-navigation/bottom-tabs | ^7.3.12 | Barra de navegação inferior |
| react-navigation/native-stack | ^7.3.12 | Stack de navegação |
| @expo/vector-icons | ^15.0.3 | Ícones (Ionicons) |
| @react-native-async-storage | 2.2.0 | Persistência local (token, histórico) |
| expo-image-picker | ~17.0.11 | Seleção de fotos para trade-in e anúncios |
| expo-notifications | ~0.32.17 | Notificações push |
| expo-auth-session | ~7.0.11 | OAuth (Google) |
| react-native-gesture-handler | ~2.28.0 | Gestos e swipe |
| react-native-safe-area-context | ~5.6.0 | Safe area em iOS/Android |

### Boas Práticas Aplicadas
- **Componentes reutilizáveis:** `ProductCard`, `SkeletonCard`, `SwipeableModal`, `Toast`, `Stars`
- **Lazy loading:** skeleton durante carregamento de produtos
- **Otimização:** `useMemo`, `useCallback` para evitar re-renders desnecessários
- **Navegação centralizada:** `navigationRef` para navegação fora de componentes React
- **Tratamento de erros:** try/catch em todas as chamadas de API com fallback visual
- **Tema dinâmico:** `ThemeContext` com `StyleSheet.create` reativo a mudanças de tema
- **Offline-first:** `TABELAS_FALLBACK` no TradeInContext garante funcionamento sem backend

---

## 7. Descrição Técnica do Back-End

### Tecnologias Utilizadas
- **Java 17** + **Spring Boot 4.0.6**
- **Spring Cloud** (Eureka, Config Server, Gateway, OpenFeign, Load Balancer)
- **Spring Security** + **JWT** para autenticação
- **PostgreSQL** como banco de dados (um banco por serviço)
- **Flyway** para migrations automáticas
- **Resilience4j** para Circuit Breaker
- **Spring Cache (Caffeine)** para caching
- **Spring Boot Actuator** para monitoramento

### Como a Segurança foi Aplicada

A segurança é implementada em duas camadas:

1. **auth-service:** gera tokens JWT após autenticação. O token contém o e-mail, ID e tipo do usuário (Common/Admin). Usa `BCryptPasswordEncoder` para hash de senhas.

2. **gateway-service:** intercepta todas as requisições para rotas `/ws/**` e valida o token JWT antes de redirecionar ao microserviço destino. Rotas sem `/ws/` são públicas.

```
Requisição → Gateway (8765)
  ├── /auth/**      → auth-service (público)
  ├── /products/**  → product-service (público)
  ├── /currency/**  → currency-service (público)
  ├── /greeting/**  → greeting-service (público)
  └── /ws/**        → [valida JWT] → serviço destino
```

### Conexão com Banco de Dados

Cada microserviço possui seu próprio banco PostgreSQL (Database per Service Pattern). As migrations são gerenciadas automaticamente pelo Flyway na inicialização.

| Serviço | Banco | Tabelas principais |
|---|---|---|
| auth-service | db_user | tb_user |
| product-service | bd_product | tb_product |
| currency-service | db_currency | tb_currency |
| marketplace-service | bd_marketplace | tb_tradein_*, tb_zona_cep, tb_servico_instalacao, tb_pedido |

### Principais Dependências (pom.xml)

| Dependência | Finalidade |
|---|---|
| spring-boot-starter-web | API REST |
| spring-boot-starter-security | Segurança e filtros JWT |
| spring-boot-starter-data-jpa | ORM com Hibernate |
| spring-cloud-starter-netflix-eureka-client | Registro no Eureka |
| spring-cloud-starter-openfeign | Comunicação entre serviços (HTTP declarativo) |
| spring-cloud-starter-loadbalancer | Balanceamento de carga |
| resilience4j-spring-boot3 | Circuit Breaker e Retry |
| spring-boot-starter-cache + caffeine | Cache em memória |
| flyway-core | Migrations de banco de dados |
| postgresql | Driver JDBC PostgreSQL |
| spring-boot-starter-actuator | Endpoints de saúde (/actuator/health) |
| jjwt | Geração e validação de tokens JWT |

---

### Documentação dos Endpoints

#### auth-service (porta 8900)

**POST /auth/signup** — Cadastro de novo usuário

```bash
curl -X POST http://localhost:8900/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Guilherme Tagliari",
    "email": "guilherme@email.com",
    "password": "senha123"
  }'
```

**POST /auth/signin** — Login e geração de token JWT

```bash
curl -X POST http://localhost:8900/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guilherme@email.com",
    "password": "senha123"
  }'
```

Resposta:
```json
{
  "id": 1,
  "name": "Guilherme Tagliari",
  "email": "guilherme@email.com",
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

#### currency-service (porta 8100)

**GET /currency/convert** — Conversão de moeda em tempo real (Banco Central do Brasil)

```bash
curl -X GET "http://localhost:8100/currency/convert?source=USD&target=BRL"
```

Resposta:
```json
{
  "sourceCurrency": "USD",
  "targetCurrency": "BRL",
  "conversionRate": 5.82,
  "environment": "Currency Service running on port 8100 - Banco Central do Brasil"
}
```

---

#### product-service (porta 8000)

**GET /products** — Lista todos os produtos (com busca opcional)

```bash
curl -X GET "http://localhost:8000/products"

# Com busca:
curl -X GET "http://localhost:8000/products?q=samsung"
```

**GET /products/{id}** — Detalhe de um produto com preço convertido

```bash
curl -X GET "http://localhost:8000/products/1?targetCurrency=BRL"
```

Resposta:
```json
{
  "id": 1,
  "description": "Galaxy S24 256GB",
  "brand": "Samsung",
  "model": "S24",
  "currency": "USD",
  "price": 849.99,
  "stock": 10,
  "convertedPrice": 4945.94,
  "environment": "product-service:8000",
  "targetCurrency": "BRL"
}
```

**POST /products** — Cadastro de novo produto (vendedor publica anúncio)

```bash
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -d '{
    "description": "iPhone 15 128GB",
    "brand": "Apple",
    "model": "15",
    "price": 799.99,
    "stock": 5,
    "categoria": "Smartphone",
    "condicao": "Novo",
    "cidade": "Porto Alegre",
    "estado": "RS"
  }'
```

**PUT /ws/product/{id}** — Edição de produto (protegido por JWT)

```bash
curl -X PUT http://localhost:8000/ws/product/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "description": "iPhone 15 128GB - Lacrado",
    "price": 749.99,
    "stock": 3
  }'
```

**DELETE /ws/product/{id}** — Remoção de produto (protegido por JWT)

```bash
curl -X DELETE http://localhost:8000/ws/product/1 \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

#### order-service (porta 8300) — Gestão de Pedidos

Consome product-service (via Feign + Load Balancer) e currency-service para montar e converter pedidos. Protegido via JWT no gateway.

**POST /ws/orders** — Cria um novo pedido

```bash
curl -X POST http://localhost:8300/ws/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "compradorUserId": 1,
    "produtoId": 3,
    "targetCurrency": "BRL"
  }'
```

Resposta:
```json
{
  "id": 1,
  "compradorUserId": 1,
  "produtoId": 3,
  "descricao": "Galaxy S24 256GB - Samsung",
  "precoOriginal": 849.99,
  "moedaOriginal": "USD",
  "precoEmBrl": 4945.94,
  "status": "pendente",
  "criadoEm": "2026-06-25T20:38:00"
}
```

**GET /ws/orders/BRL** — Lista todos os pedidos com preços em BRL

```bash
curl -X GET http://localhost:8300/ws/orders/BRL \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**GET /ws/orders?compradorUserId=1** — Pedidos de um comprador específico

```bash
curl -X GET "http://localhost:8300/ws/orders?compradorUserId=1" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

#### marketplace-service (porta 8200) — Trade-in, Logística e Pedidos EletroHub

**GET /tradein/tabelas** — Busca tabelas de depreciação para cálculo de trade-in

```bash
curl -X GET http://localhost:8200/tradein/tabelas
```

**POST /tradein/solicitacoes** — Registra solicitação de trade-in

```bash
curl -X POST http://localhost:8200/tradein/solicitacoes \
  -H "Content-Type: application/json" \
  -d '{
    "compradorUserId": "1",
    "categoria": "Smartphone Premium",
    "marca": "Apple",
    "modelo": "iPhone 14 Pro",
    "idadeFaixa": "1-3",
    "estadoDeclarado": "perfeito",
    "valorEstimado": 4350.00
  }'
```

**GET /logistics/cobertura/{cep}** — Verifica cobertura logística por CEP

```bash
curl -X GET http://localhost:8200/logistics/cobertura/90040060
```

**POST /orders** — Cria pedido

```bash
curl -X POST http://localhost:8200/orders \
  -H "Content-Type: application/json" \
  -d '{
    "compradorUserId": "1",
    "produtoId": "3",
    "valorProdutoNovo": 4939.25,
    "valorFrete": 0.00,
    "valorInstalacao": 150.00,
    "valorAbatimentoTradeIn": 4350.00,
    "metodoPagamento": "pix"
  }'
```

---

#### greeting-service (porta 8080) — Microsserviço de Saudação

Microsserviço de demonstração da arquitetura Spring Cloud. Stateless (sem banco de dados), registrado no Eureka e configurado via config-service. A mensagem de saudação e o nome padrão são externalizados em `application.properties` e sobrescritíveis por perfil ou Config Server.

**GET /greeting** — Retorna mensagem de saudação configurável

```bash
# Sem parâmetro — usa nome padrão "Mundo"
curl -X GET http://localhost:8080/greeting

# Com nome customizado
curl -X GET "http://localhost:8080/greeting?name=EletroHub"
```

Resposta:
```
Ola EletroHub!!!
```

**GET /actuator/health** — Health check do serviço

```bash
curl -X GET http://localhost:8080/actuator/health
```

Resposta:
```json
{ "status": "UP" }
```

---

#### config-service (porta 8888) — Servidor de Configuração Centralizada

Implementa o **Spring Cloud Config Server** com perfil `native` (configurações armazenadas no classpath em `resources/configs/{application}`). Todos os microserviços importam suas configurações deste serviço na inicialização via `spring.config.import=optional:configserver:http://localhost:8888/`.

**GET /{application}/{profile}** — Retorna a configuração de um microserviço

```bash
# Configuração do greeting-service no perfil padrão
curl -X GET http://localhost:8888/greeting-service/default

# Configuração com perfil específico (ex: fr)
curl -X GET http://localhost:8888/greeting-service/fr
```

Resposta:
```json
{
  "name": "greeting-service",
  "profiles": ["default"],
  "propertySources": [
    {
      "name": "classpath:/configs/greeting-service/application.properties",
      "source": {
        "greeting-service.greeting": "Ola",
        "greeting-service.default-name": "Mundo"
      }
    }
  ]
}
```

**GET /actuator/health** — Health check

```bash
curl -X GET http://localhost:8888/actuator/health
```

---

## 8. Contribuição de Cada Integrante

| Integrante | RA | Papel | Contribuições |
|---|---|---|---|
| **Guilherme Tagliari** | 1134870 | Frontend | Desenvolvimento completo do frontend em React Native: 30+ telas, 13 contextos de estado global, sistema de navegação por abas e stack, tema claro/escuro, carrinho de compras, pagamento multi-moeda, chat, favoritos, avaliações, notificações e tela de trade-in com cálculo automático de depreciação. |
| **Arthur** | 1137711 | Backend | Implementação do auth-service (Spring Security + JWT, cadastro e login de usuários, geração e validação de tokens) e do product-service (cadastro, listagem, busca e gerenciamento de produtos com Flyway e PostgreSQL). Configuração inicial do Eureka Discovery e Spring Cloud. |
| **Lorenzo** | 1134869 | Backend | Implementação do currency-service (conversão de moedas BRL/USD/EUR via API externa com cache Caffeine e circuit breaker Resilience4j), do order-service (criação e histórico de pedidos) e do gateway-service (roteamento, filtros JWT e balanceamento de carga via Spring Cloud Gateway). |
| **Naubert** | 1138130 | UI/UX (Figma) | Criação do protótipo de alta fidelidade no Figma: identidade visual, paleta de cores, tipografia, iconografia e componentes reutilizáveis (cards de produto, botões, modais). Entrega de todas as telas navegáveis para guiar o desenvolvimento frontend. |
| **Léo** | [RA] | Frontend | Desenvolvimento das telas de perfil do usuário, edição de perfil, configurações, central de ajuda, política de privacidade, termos de uso, onboarding e tela de redefinição de senha. Implementação dos contextos de endereço e verificação de conta. |
| **JR** | 1134269 | Integração Frontend/Backend | Responsável pela camada de serviços do frontend (api.js, logisticsAPI.js, tradeInAPI.js), mapeamento de endpoints, configuração de headers JWT, tratamento de erros HTTP e testes de integração entre o app React Native e os microsserviços Java. |

---

## 9. Link do Repositório do Front-End

> https://github.com/GuilhermeTagliari/Eletrohub
---

## 10. Link do Repositório do Back-End

> https://github.com/arthurmarcolin/microservices-java
