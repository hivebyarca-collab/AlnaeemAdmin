export type CurrencyCode = 'USD' | 'SYP';

export const SYP_PER_USD = 13_500;

export function parseUsdPrice(price: string | number): number {
  if (typeof price === 'number') return price;
  const cleaned = price.replace(/[^0-9.]/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function formatPrice(price: string | number, currency: CurrencyCode): string {
  const usd = parseUsdPrice(price);
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usd);
  }
  const syp = Math.round(usd * SYP_PER_USD);
  return `${new Intl.NumberFormat('en-US').format(syp)} ل.س`;
}
