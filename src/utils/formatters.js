/**
 * Formata um número como moeda brasileira.
 * Ex: 4567.9 → "R$ 4.567,90"  |  12533.5 → "R$ 12.533,50"
 */
export function formatBRL(value, withPrefix = true) {
  const num = typeof value === 'number'
    ? value
    : parseFloat(String(value ?? 0).replace(/\./g, '').replace(',', '.')) || 0;
  const abs = Math.max(0, isNaN(num) ? 0 : num);
  const [intPart, decPart] = abs.toFixed(2).split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return withPrefix ? `R$ ${intFormatted},${decPart}` : `${intFormatted},${decPart}`;
}
