import { AUTH_BASE_URL, PRODUCT_BASE_URL, PRODUCT_IDS } from '../config';

const PRODUCT_IMAGE_MAP = {
  'iPhone 15 128GB':
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-pink?wid=1144&hei=1144&fmt=jpeg&qlt=90',
  'iPhone 15 Pro 256GB':
    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=1144&hei=1144&fmt=jpeg&qlt=90',
  'Galaxy S24 256GB':
    'https://images.samsung.com/is/image/samsung/p6pim/br/2401/gallery/br-galaxy-s24-s921-sm-s921blbbbri-thumb-539573236?$650_519_PNG$',
  'Galaxy S24 Ultra 512GB':
    'https://images.samsung.com/is/image/samsung/p6pim/br/2401/gallery/br-galaxy-s24-ultra-s928-sm-s928bzgbbri-thumb-539574124?$650_519_PNG$',
  'Moto G84 5G 256GB':
    'https://motorolabr.vtexassets.com/arquivos/ids/158282/Moto_G84_5G_Marshmallow_Blue_PDP_Image.png',
  'Moto Edge 40 256GB':
    'https://motorolabr.vtexassets.com/arquivos/ids/157484/moto_edge_40_black.png',
  'Redmi Note 13 Pro 256GB':
    'https://i01.appmifile.com/webfile/globalimg/products/pc/redmi-note-13-pro/section2.png',
  'Redmi 13C 128GB':
    'https://i02.appmifile.com/webfile/globalimg/products/pc/redmi-13c/section2.png',
  'Pixel 8 128GB':
    'https://lh3.googleusercontent.com/Rk6LSFK43hF62TGHLqPQg3mlHJPNbzXA3IVIJcaE5EFf8zw3EEdWMFkSDFLPlIqVoW0b3vSNVzM',
  'Pixel 8 Pro 256GB':
    'https://lh3.googleusercontent.com/o2MK_kHC3sK4MywFQqQIZ0VzLPBllzv6HE8c7vA_Cv4OxkzD5Hm9xyOW3k7cLrV_pC8_5oMJp4',
  'OnePlus 12 512GB':
    'https://oasis.opstatics.com/content/dam/oasis/page/2023/in/oneplus-12/specs-img/oneplus-12-img.png',
  'Galaxy A55 5G 128GB':
    'https://images.samsung.com/is/image/samsung/p6pim/br/2404/gallery/br-galaxy-a55-5g-sm-a556-thumb-542096820?$650_519_PNG$',
};

function enrichProductImages(p) {
  if (!p.fotos?.length && !p.foto) {
    const url = PRODUCT_IMAGE_MAP[p.description];
    if (url) p.fotos = [url];
  }
  return p;
}

// ─── Auth Service (porta 8900) ───────────────────────────────────────────────

export const authAPI = {
  signup: async (name, email, password) => {
    const res = await fetch(`${AUTH_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Erro ao criar conta');
    try { return JSON.parse(text); } catch { return text; }
  },

  signin: async (email, password) => {
    const res = await fetch(`${AUTH_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || 'Email ou senha inválidos');
    return JSON.parse(text); // { user: {id, name, email, type}, token }
  },
};

// ─── Product Service (porta 8000) ────────────────────────────────────────────

export const productAPI = {
  getById: async (id, token = null) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(
      `${PRODUCT_BASE_URL}/products/${id}?targetCurrency=BRL`,
      { headers }
    );
    if (!res.ok) throw new Error(`Produto ${id} não encontrado`);
    const p = await res.json();
    return enrichProductImages(p);
  },

  getAll: async (token = null) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${PRODUCT_BASE_URL}/products`, { headers });
    if (!res.ok) throw new Error('Erro ao buscar produtos');
    const list = await res.json();
    return list.map(p => {
      if (!p.convertedPrice || p.convertedPrice < 0) p.convertedPrice = p.price > 0 ? p.price : 0;
      if (p.convertedPrice < 0) p.convertedPrice = 0;
      if (p.price < 0) p.price = 0;
      if (!p.categoria) p.categoria = 'Smartphone';
      return enrichProductImages(p);
    });
  },

  search: async (query, token = null) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(
      `${PRODUCT_BASE_URL}/products?q=${encodeURIComponent(query)}`,
      { headers }
    );
    if (!res.ok) return [];
    const list = await res.json();
    return list.map(p => {
      if (!p.convertedPrice || p.convertedPrice < 0) p.convertedPrice = p.price > 0 ? p.price : 0;
      if (p.convertedPrice < 0) p.convertedPrice = 0;
      if (!p.categoria) p.categoria = 'Smartphone';
      return enrichProductImages(p);
    });
  },

  create: async (productData, token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${PRODUCT_BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || 'Erro ao publicar anúncio');
    }
    return res.json();
  },
};

// ─── Dados mockados (sem endpoint no backend) ─────────────────────────────────

export const mockOrders = [
  {
    id: 1,
    productName: 'iPhone 15 128GB',
    brand: 'Apple',
    value: 'R$ 4.245,00',
    variation: '128GB - Preto',
    quantity: 1,
    deliveryType: 'Frete',
    daysToArrive: 7,
    imageColor: '#1a1a1a',
  },
  {
    id: 2,
    productName: 'Galaxy S24 256GB',
    brand: 'Samsung',
    value: 'R$ 4.558,00',
    variation: '256GB - Branco',
    quantity: 1,
    deliveryType: 'Local',
    daysToArrive: 2,
    imageColor: '#333',
  },
];

export const mockNotifications = [
  { id: 1, text: 'Seu pedido foi confirmado! Entrega em 7 dias.' },
  { id: 2, text: 'Novo produto disponível: Galaxy S24 Ultra.' },
  { id: 3, text: 'Promoção: 10% de desconto em smartphones.' },
  { id: 4, text: 'Seu anúncio recebeu 5 visualizações hoje.' },
  { id: 5, text: 'Pagamento aprovado com sucesso.' },
];

export const mockMyItems = [
  { id: 101, name: 'Geladeira Brastemp 400L', sold: 3, price: 'R$ 2.800,00' },
  { id: 102, name: 'Fogão 5 Bocas Consul', sold: 1, price: 'R$ 1.200,00' },
  { id: 103, name: 'Micro-ondas 30L Electrolux', sold: 7, price: 'R$ 650,00' },
  { id: 104, name: 'Lavadora 12kg LG', sold: 2, price: 'R$ 3.100,00' },
];
