// XOF currency formatting utilities
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

export function formatCurrencyCompact(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M XOF`;
  } else if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}K XOF`;
  }
  
  return `${numAmount.toLocaleString('pt-PT')} XOF`;
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, ''));
}