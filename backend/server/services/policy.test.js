import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './policy.js';

const policy = {
  per_purchase_limit: 50, monthly_limit: 200, approval_threshold: 30,
  allowed_categories: ['office supplies', 'stationery'], expires_at: '2030-01-01',
};

test('small purchase is approved', () => {
  assert.equal(evaluate(policy, { amount: 10, category: 'stationery' }).decision, 'APPROVE');
});
test('above threshold needs approval', () => {
  assert.equal(evaluate(policy, { amount: 40, category: 'stationery' }).decision, 'NEEDS_APPROVAL');
});
test('above per-purchase limit is blocked', () => {
  assert.equal(evaluate(policy, { amount: 80, category: 'stationery' }).decision, 'BLOCK');
});
test('wrong category is blocked', () => {
  assert.equal(evaluate(policy, { amount: 10, category: 'electronics' }).decision, 'BLOCK');
});
test('monthly cap is blocked', () => {
  assert.equal(evaluate(policy, { amount: 20, category: 'stationery' }, 190).decision, 'BLOCK');
});