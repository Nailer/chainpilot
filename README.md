# ChainPilot

A modular onchain assistant for BNB Chain. Position Guard is its first module: monitor a lending position and propose a bounded debt repayment when risk increases.

**Status: local planning prototype.** No deployed agent, ERC-8004 identity, marketplace listing, wallet integration, scheduler, or transaction execution exists yet. This repository alone does not meet the campaign requirements. No liquidation protection or financial return is guaranteed.

## Run locally

Node.js 22 or later; no third-party dependencies.

```sh
npm test
npm run demo
npm start
```

The demo uses synthetic values and moves no funds. The HTTP server binds to `127.0.0.1:3001`.

- `GET /health`: implementation status.
- `POST /v1/position-guard/plan`: accepts `{ snapshot, policy }` as JSON. See `scripts/demo.js` for the input fields.

## First module: Position Guard

Given liquidation-threshold-adjusted collateral, debt, a trigger, target, budget and per-action cap, the planner estimates a repayment. Amounts are integer strings in USD micro-units (1 USD = 1,000,000), **not token units**. It rejects stale snapshots and invalid policies. An insufficient budget is reported explicitly.

This calculation assumes repayment leaves collateral unchanged and reduces aggregate debt by the stated USD amount. Real execution needs verified protocol-specific accounting, current prices, accrued debt, market selection, token decimals, gas and simulation. Never treat the planner output as transaction calldata or an authorization to spend.

## Intended product

Users choose the position, thresholds, permitted repayment asset, spending cap and expiry. The agent watches the position, proposes or executes an authorized repayment, and records a verifiable receipt. Execution limits must be enforced onchain before any autonomous spending is enabled.

Future modules may include Portfolio Watch, Yield Watch and Rebalancing. These are roadmap ideas, not implemented features. Position Guard uses deterministic financial rules; no LLM is currently integrated. A future natural-language layer must not override execution constraints.

## Campaign identity — pending

| Field | Current value |
| --- | --- |
| Name | ChainPilot |
| Initial category | Health factor |
| Intended development network | BSC testnet, chain 97 |
| Campaign/owner wallet | Not configured |
| ERC-8004 registry ID | Not registered |
| Agent card and live endpoint | Not deployed |
| Marketplace | HelloFugu proposed; integration pending |

Do not invent an agent ID or submit a placeholder as a registered identity. Add the actual owner, registry ID, chain, public endpoint and listing link once confirmed.

## Next milestones

- [ ] Verify lending protocol testnet support and read live positions.
- [ ] Implement and test bounded repayment authorization, simulation, execution and receipts.
- [ ] Deploy a reachable service and publish a resolvable agent card.
- [ ] Register an ERC-8004 identity owned by the campaign wallet; publish ID and chain here.
- [ ] Complete campaign registration before qualifying campaign activity; resolve registration/listing order with organizers if necessary.
- [ ] List on a shortlisted marketplace and connect its actual hiring lifecycle to the service.
- [ ] Obtain three completed hires from independent wallets neither owned nor funded by the builder.
- [ ] Complete at least five legitimate category-consistent onchain actions across three separate days.
- [ ] Complete the participant's separate three-agent/two-marketplace hiring requirement.

Keep endpoint probes, protocol receipts and marketplace hires separately identifiable. Simulations, local tests, approvals and fabricated activity are not qualifying execution.

## References

- [Official Set and Earn campaign rules](https://www.bnbchain.org/en/hackathons/smart-money-era-set-and-earn)
- [HelloFugu listing flow](https://app.hellofugu.xyz/list)
- [TermiX documentation](https://docs.termix.ai/aacp/overview)

Never commit wallet keys, seed phrases, credentials or personal registration details. This prototype has not been audited.
