// IP da máquina na rede Wi-Fi — atualizar se trocar de rede
const HOST = '192.168.18.101';

// Google OAuth — crie em console.cloud.google.com → APIs e Serviços → Credenciais
// Tipo: ID do cliente OAuth → Aplicativo da Web
// URI de redirecionamento autorizado: https://auth.expo.io/@seu-usuario-expo/eletrohub
export const GOOGLE_WEB_CLIENT_ID = '1091180194811-bq9uicjdliqrm86nmd3dpq8pupo7pn1f.apps.googleusercontent.com';

export const AUTH_BASE_URL = `http://${HOST}:8900`;
export const PRODUCT_BASE_URL = `http://${HOST}:8000`;
export const MARKETPLACE_BASE_URL = `http://${HOST}:8200`;

// IDs de produtos cadastrados no banco do product-service
export const PRODUCT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CATEGORIAS = [
  'Geladeira',
  'Fogão',
  'Micro-ondas',
  'Lavadora',
  'Secadora',
  'Ar Condicionado',
  'Televisão',
  'Notebook',
  'Smartphone',
  'Tablet',
  'Outros',
];
