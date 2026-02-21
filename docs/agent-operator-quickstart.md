# Agent operator quickstart (control your own daimon)

This checklist gets your fork running with upstream behavior while preserving full operator control.

## 1) Required repo secrets

In **GitHub → Your fork → Settings → Secrets and variables → Actions**, add:

- `DAIMON_WALLET_KEY` (required): private key for your agent wallet on Base
- `GH_TOKEN` (required for this repo's workflow checkout + API usage)
- One LLM key (required):
  - `VENICE_API_KEY` (venice.ai), or
  - `OPENROUTER_API_KEY` (openrouter.ai)
- `BASE_RPC` (optional, recommended): Base RPC URL (defaults to `https://mainnet.base.org`)
- GPG signing (optional): `GPG_PRIVATE_KEY`, `GPG_KEY_ID`

## 2) Fund wallet

Send ~0.005 ETH on Base to the wallet tied to `DAIMON_WALLET_KEY`.

## 3) Enable and run workflow

1. Open **Actions** tab.
2. Enable workflows if asked.
3. Open `daimon` workflow (or `daimon cycle` in template).
4. Click **Run workflow** to test first cycle.

## 4) Verify first cycle

- Check logs for `daimon waking up... (provider: ...)`
- Confirm proof file created under `proofs/YYYY-MM-DD/`
- Confirm a commit appears from workflow run

## 5) Control plane: what to customize

- Identity/voice: `agent/prompt.js`, `memory/self.md`
- Priority and strategy: `memory/focus.md`, `memory/learnings.md`
- Capabilities: `agent/tools.js`, `agent/actions.js`
- Budget/risk policy: `agent/network.js`, wallet funding, Safe settings

## 6) Optional onchain launch scripts

- Token launch helper: `scripts/deploy-daimon.js`
- Registry deployment helper: `scripts/deploy-network.js`

Run from a secure local environment:

```bash
DAIMON_WALLET_KEY=0x... BASE_RPC=... node scripts/deploy-daimon.js
```

## 7) Troubleshooting

- `No LLM key set...`: set `VENICE_API_KEY` or `OPENROUTER_API_KEY`
- `GH_TOKEN not set`: add Actions secret `GH_TOKEN`
- Heartbeat failures: check wallet funding + `BASE_RPC`
