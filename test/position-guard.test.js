import test from 'node:test';
import assert from 'node:assert/strict';
import { planRepayment } from '../src/modules/position-guard.js';
import { createApp } from '../src/server.js';

const now = 1800000000000;
const snapshot = { adjustedCollateralUsd: '114000000', debtUsd: '100000000', observedAt: now };
const policy = { triggerBps: 12000, targetBps: 15000, budgetUsd: '30000000', maxRepayUsd: '25000000', maxSnapshotAgeMs: 60000 };
const plan = (s = {}, p = {}) => planRepayment({ ...snapshot, ...s }, { ...policy, ...p }, now);

test('calculates a repayment that reaches the target', () => {
  const result = plan();
  assert.equal(result.repayUsd, '24000000');
  assert.equal(result.targetReachable, true);
  assert.equal(result.remainingBudgetUsd, '6000000');
  assert.equal(result.execution, 'disabled');
});
test('honors budget and per-action cap without claiming protection', () => {
  assert.equal(plan({}, { budgetUsd: '5000000' }).repayUsd, '5000000');
  assert.equal(plan({}, { maxRepayUsd: '1000000' }).targetReachable, false);
  assert.equal(plan({}, { budgetUsd: '0' }).action, 'blocked');
});
test('does not act on healthy or debt-free positions', () => {
  assert.equal(plan({ adjustedCollateralUsd: '120000000' }).action, 'hold');
  assert.equal(plan({ debtUsd: '0' }).reason, 'no-debt');
});
test('rounds repayment up and caps at outstanding debt', () => {
  assert.equal(plan({ adjustedCollateralUsd: '1', debtUsd: '3' }).repayUsd, '3');
  assert.equal(plan({ adjustedCollateralUsd: '0' }, { budgetUsd: '200000000', maxRepayUsd: '200000000' }).repayUsd, snapshot.debtUsd);
});
test('rejects stale, future, malformed or negative inputs', () => {
  for (const s of [{ observedAt: now - 60001 }, { observedAt: now + 1 }, { debtUsd: '-1' }, { debtUsd: 100 }, { debtUsd: '1.5' }]) {
    assert.throws(() => plan(s));
  }
  assert.throws(() => plan({}, { targetBps: 11000 }));
  assert.throws(() => plan({}, { maxSnapshotAgeMs: 0 }));
});
test('HTTP API handles valid and invalid requests', async () => {
  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await (await fetch(`${base}/health`)).json()).execution, 'disabled');
    const response = await fetch(`${base}/v1/position-guard/plan`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ snapshot: { ...snapshot, observedAt: Date.now() }, policy })
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).repayUsd, '24000000');
    assert.equal((await fetch(`${base}/v1/position-guard/plan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
