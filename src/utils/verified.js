// Official/verified seller brands (manual verification system)
// In production this would come from the backend
const VERIFIED_BRANDS = new Set([
  'Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Google', 'OnePlus',
  'LG', 'Sony', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer',
]);

export function isVerifiedSeller(sellerKey) {
  return VERIFIED_BRANDS.has(sellerKey);
}

export function getVerifiedLabel(sellerKey) {
  if (!isVerifiedSeller(sellerKey)) return null;
  return { label: 'Loja Oficial', icon: 'checkmark-shield', color: '#2c7be5' };
}
