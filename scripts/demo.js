import { planRepayment } from '../src/modules/position-guard.js';

console.log('ChainPilot / Position Guard — synthetic example, no funds move');
console.log(JSON.stringify(planRepayment({
  adjustedCollateralUsd: '114000000',
  debtUsd: '100000000',
  observedAt: Date.now()
}, {
  triggerBps: 12000,
  targetBps: 15000,
  budgetUsd: '30000000',
  maxRepayUsd: '25000000',
  maxSnapshotAgeMs: 60000
}), null, 2));
