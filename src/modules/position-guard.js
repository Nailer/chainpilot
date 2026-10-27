/** Pure planning only. Values are USD micro-units, never token base units.
 * adjustedCollateralUsd must already use the protocol's liquidation thresholds.
 * It must NOT be calculated using borrowing collateral factors as a substitute.
 */
export function planRepayment(snapshot, policy, now = Date.now()) {
  const amount = (value, name) => {
    if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,59})$/.test(value)) {
      throw new Error(`${name} must be a nonnegative integer string`);
    }
    return BigInt(value);
  };
  if (!snapshot || !policy) throw new Error('snapshot and policy are required');
  const collateral = amount(snapshot.adjustedCollateralUsd, 'adjustedCollateralUsd');
  const debt = amount(snapshot.debtUsd, 'debtUsd');
  const budget = amount(policy.budgetUsd, 'budgetUsd');
  const cap = amount(policy.maxRepayUsd, 'maxRepayUsd');
  const { triggerBps, targetBps, maxSnapshotAgeMs } = policy;
  if (!Number.isSafeInteger(triggerBps) || triggerBps <= 10000 ||
      !Number.isSafeInteger(targetBps) || targetBps <= triggerBps) {
    throw new Error('targetBps must exceed triggerBps, and triggerBps must exceed 10000');
  }
  if (!Number.isSafeInteger(now) || !Number.isSafeInteger(snapshot.observedAt) ||
      !Number.isSafeInteger(maxSnapshotAgeMs) || maxSnapshotAgeMs <= 0 ||
      snapshot.observedAt > now || now - snapshot.observedAt > maxSnapshotAgeMs) {
    throw new Error('snapshot is stale or has an invalid timestamp');
  }
  const base = { module: 'position-guard', execution: 'disabled', unit: 'usd-micros' };
  if (debt === 0n) return { ...base, action: 'hold', reason: 'no-debt', repayUsd: '0' };
  if (collateral * 10000n >= debt * BigInt(triggerBps)) {
    return { ...base, action: 'hold', reason: 'above-trigger', repayUsd: '0' };
  }
  // Floor maximum remaining debt so the required repayment rounds upward.
  const required = debt - collateral * 10000n / BigInt(targetBps);
  const repay = [required, budget, cap, debt].reduce((a, b) => a < b ? a : b);
  return {
    ...base,
    action: repay === 0n ? 'blocked' : 'repay-proposal',
    reason: repay === 0n ? 'no-spending-capacity' : 'below-trigger',
    requiredRepayUsd: required.toString(),
    repayUsd: repay.toString(),
    targetReachable: repay >= required,
    remainingBudgetUsd: (budget - repay).toString(),
    warning: 'Aggregate estimate only; requires protocol reads, token conversion, simulation and authorization before execution.'
  };
}
