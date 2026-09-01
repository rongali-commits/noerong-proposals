export type ItemInput = {
  description: string;
  detail: string;
  quantity: number;
  rate: number;
  discount: number;
};

export type ProposalTotals = {
  lineTotals: number[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  tax: number;
  total: number;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineTotal(item: ItemInput): number {
  const gross = item.quantity * item.rate;
  const discounted = gross * (1 - item.discount / 100);
  return round2(discounted);
}

export function computeTotals(
  items: ItemInput[],
  proposalDiscount: number,
  taxRate: number,
): ProposalTotals {
  const lineTotals = items.map(lineTotal);
  const subtotal = round2(lineTotals.reduce((sum, lt) => sum + lt, 0));
  const discountAmount = round2(Math.min(Math.max(proposalDiscount, 0), subtotal));
  const taxableAmount = round2(subtotal - discountAmount);
  const tax = round2(taxableAmount * taxRate / 100);
  const total = round2(taxableAmount + tax);
  return { lineTotals, subtotal, discountAmount, taxableAmount, tax, total };
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
