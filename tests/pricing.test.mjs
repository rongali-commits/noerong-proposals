import assert from 'node:assert/strict';
import test from 'node:test';
import { computeTotals, lineTotal, formatCurrency } from '../src/lib/calculations.ts';

const item = (quantity, rate, discount = 0) => ({ description: 'Sample service', detail: '', quantity, rate, discount });

test('line percentage discounts are rounded before totals', () => {
  assert.equal(lineTotal(item(3, 19.99, 10)), 53.97);
  assert.equal(lineTotal(item(1, 10, 100)), 0);
});
test('proposal amount discount is applied before tax', () => {
  assert.deepEqual(computeTotals([item(2, 100, 10), item(1, 50)], 30, 10), {
    lineTotals: [180, 50], subtotal: 230, discountAmount: 30,
    taxableAmount: 200, tax: 20, total: 220,
  });
});
test('proposal discount cannot exceed subtotal or increase it', () => {
  assert.equal(computeTotals([item(1, 100)], 1000, 18).total, 0);
  assert.equal(computeTotals([item(1, 100)], -20, 0).total, 100);
});
test('empty and fractional proposals have stable totals', () => {
  assert.equal(computeTotals([], 30, 18).total, 0);
  assert.equal(computeTotals([item(1, 0.1), item(1, 0.2)], 0, 0).total, 0.3);
  assert.equal(computeTotals([item(1, 19.99)], 0, 7.5).tax, 1.5);
});
test('currency formatting keeps a useful fallback for unsupported codes', () => {
  assert.match(formatCurrency(1234.5, 'USD'), /1,234\.50/);
  assert.match(formatCurrency(12.5, 'INR'), /12\.50/);
  assert.equal(formatCurrency(12.5, 'INVALID'), 'INVALID 12.50');
});
