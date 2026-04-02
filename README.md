# Arbitrum DeFi Strategist Agent

> AI agent skill for multi-protocol DeFi analysis and execution on Arbitrum.
> Built for the [ArbiLink Agentic Bounty](https://www.notion.so/arbitrumfoundation/ArbiLink-Challenge-Agentic-Bounty-32c90457c3268012b69efd3a5ee7ea46) challenge.

## What This Does

This is not a simple balance checker. It's a **cross-protocol DeFi intelligence agent** that deeply integrates with Arbitrum-native protocols to provide actionable analysis and execution.

### Protocol Integrations

| Protocol | Capabilities |
|----------|-------------|
| **GMX V2** | Market listing, open interest analysis, long/short imbalance detection, funding rate signals, position monitoring, borrowing factor tracking |
| **Aave V3** | Health factor monitoring, liquidation risk assessment, per-asset position breakdown, reserve APY comparison, utilization tracking |
| **Uniswap V3** | Multi-fee-tier quoting (500/3000/10000 bps), swap execution with slippage protection |
| **Camelot** | Swap quoting for cross-DEX price comparison |
| **ERC-8004** | Agent identity registration on Arbitrum Identity Registry |

### Strategy Engine

The core differentiator — a cross-protocol analysis layer that:

- **Yield Scanner**: Finds best yields across Aave lending APYs and GMX funding rate opportunities
- **Portfolio Risk Assessment**: Analyzes wallet holdings + Aave health factor + GMX leverage + concentration risk
- **Strategy Recommendations**: Generates personalized advice based on current positions, risk profile, and available opportunities

## 14 Agent Tools

| Tool | Description |
|------|-------------|
| `get_portfolio` | Wallet balance overview (ETH + all ERC-20) |
| `get_best_swap_quote` | Multi-DEX quote comparison (Uniswap V3 + Camelot) |
| `execute_swap` | Execute swap with approval handling |
| `gmx_list_markets` | All GMX V2 perpetual/spot markets |
| `gmx_analyze_market` | Deep market analysis: OI, funding signals, borrowing |
| `gmx_get_positions` | Account perpetual positions |
| `aave_account_health` | Health factor + risk assessment |
| `aave_detailed_positions` | Per-asset supply/borrow breakdown |
| `aave_reserve_overview` | All reserve APYs and utilization |
| `find_yield_opportunities` | Cross-protocol yield scanner |
| `analyze_portfolio_risk` | Multi-protocol risk assessment |
| `get_strategy_recommendation` | Personalized DeFi strategy |
| `register_agent` | ERC-8004 identity registration |
| `get_agent_info` | Query agent registry |

## Quick Start

### Install Dependencies

```bash
npm install
```

### As a Claude Code Skill

```bash
# Add to your Claude Code project
claude skill add ./SKILL.md
```

### As a Standalone Agent Server

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY (only needed for write operations)

# Run the agent server
npm run dev

# Server starts at http://localhost:3000
# GET  /health      — Health check
# GET  /agent.json  — Agent Card (A2A discovery)
# GET  /tools       — List all 14 tools
# POST /execute     — Run a tool
```

### Run the Demo

```bash
# Fetches live data from Arbitrum One — no private key needed
npx tsx scripts/demo.ts
```

<details>
<summary><b>Demo Output (live data from Arbitrum One)</b></summary>

```
════════════════════════════════════════════════════════════
  1. WALLET PORTFOLIO (GMX Treasury)
════════════════════════════════════════════════════════════
Address: 0x489ee077994B6658eAfA855C308275EAd8097C4A
  WETH: 6.575 · USDC: 21,772.22 · USDT: 2,716.62
  DAI: 5,183.41 · WBTC: 6.742

════════════════════════════════════════════════════════════
  2. MULTI-DEX SWAP QUOTE (1 WETH → USDC)
════════════════════════════════════════════════════════════
  Uniswap V3 (500bps): 2,054.99 USDC  ← Best
  Camelot:              2,053.41 USDC
  Uniswap V3 (3000):   2,052.78 USDC
  Uniswap V3 (10000):  2,026.77 USDC
  Price spread: 1.39% → "Uniswap V3 is clearly the best venue."

════════════════════════════════════════════════════════════
  3. GMX V2 MARKETS (100 markets, top 5 shown)
════════════════════════════════════════════════════════════
  BTC/USD [WBTC-USDC]   · WETH/USD [WETH-USDC]
  SOL/USD [SOL-USDC]    · LINK/USD [LINK-USDC]  · ARB/USD [ARB-USDC]

  Deep Analysis — BTC/USD:
    Long OI: $X.XXM  Short OI: $X.XXM
    Imbalance signal + borrowing factor tracking

════════════════════════════════════════════════════════════
  4. AAVE V3 RESERVE OVERVIEW (Top 5 by Supply APY)
════════════════════════════════════════════════════════════
  DAI    Supply: 1.92%  Borrow: 3.83%  Utilization: 67.6%
  USDC   Supply: 1.81%  Borrow: 6.52%  Utilization: 56.8%
  WETH   Supply: 1.66%  Borrow: 2.32%  Utilization: 84.4%
  USDT   Supply: 1.53%  Borrow: 2.78%  Utilization: 61.6%

════════════════════════════════════════════════════════════
  5. CROSS-PROTOCOL YIELD OPPORTUNITIES
════════════════════════════════════════════════════════════
  [LOW]  Aave V3 — DAI:  1.92% APY (Utilization 67.6%)
  [LOW]  Aave V3 — USDC: 1.81% APY (Utilization 56.8%)
  [LOW]  Aave V3 — WETH: 1.66% APY (Utilization 84.4%)

════════════════════════════════════════════════════════════
  6. PORTFOLIO RISK ASSESSMENT
════════════════════════════════════════════════════════════
  Overall Risk: LOW · Total Value: ~$21,772
  "No significant risk factors detected."
```

</details>

### Example API Call

```bash
# Get best swap quote across DEXs
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_best_swap_quote", "params": {"tokenIn": "WETH", "tokenOut": "USDC", "amountIn": "1"}}'

# Analyze GMX market
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "gmx_analyze_market", "params": {"marketToken": "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336"}}'

# Full portfolio risk assessment
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "analyze_portfolio_risk", "params": {"address": "0x..."}}'
```

## ERC-8004 Agent Registration

**Agent ID: 165** — Registered on Arbitrum Sepolia Identity Registry.

- **Registry**: [`0x8004A818BFB912233c491871b3d84c89A494BD9e`](https://sepolia.arbiscan.io/address/0x8004A818BFB912233c491871b3d84c89A494BD9e)
- **TX**: [`0xcd92b197...`](https://sepolia.arbiscan.io/tx/0xcd92b197c6ce647552bb8debd19a9a2d47d5679b8d0615bc42505dae87d85e86)

```bash
# Register your own agent on Arbitrum Sepolia
PRIVATE_KEY=0x... npx tsx scripts/register-agent.ts https://raw.githubusercontent.com/0xCaptain888/arbitrum-defi-agent-skill/main/agent-registration.json
```

The registration mints an Agent NFT on the Identity Registry and returns your Agent ID.

## Live Public Endpoint

The agent is deployed and accessible at:

```
https://k4h7wl2q.mule.page/
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/agent.json` | GET | Agent Card (A2A discovery) |
| `/tools` | GET | List all 14 tools |
| `/execute` | POST | Run any tool |

Try it:
```bash
curl https://k4h7wl2q.mule.page/health
curl -X POST https://k4h7wl2q.mule.page/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_best_swap_quote", "params": {"tokenIn": "WETH", "tokenOut": "USDC", "amountIn": "1"}}'
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                Agent HTTP Endpoint               │
│         (Express.js — A2A compatible)            │
├─────────────────────────────────────────────────┤
│                  Tool Layer                       │
│   14 tools with JSON Schema parameter defs       │
├──────────┬──────────┬───────────┬───────────────┤
│  Wallet  │   DEX    │  GMX V2   │   Aave V3     │
│ Service  │ Service  │  Service  │   Service     │
│          │(Uni+Cam) │           │               │
├──────────┴──────────┴───────────┴───────────────┤
│              Strategy Engine                      │
│   Yield optimization · Risk assessment            │
│   Cross-protocol analysis · Recommendations       │
├─────────────────────────────────────────────────┤
│              viem (Arbitrum One)                  │
└─────────────────────────────────────────────────┘
```

## Tech Stack

- **TypeScript** + Node.js
- **viem** for blockchain interaction
- **Express.js** for HTTP endpoint
- **GMX V2** Reader + DataStore direct reads
- **Aave V3** Pool + DataProvider + Oracle
- **Uniswap V3** QuoterV2 + SwapRouter02
- **Camelot** QuoterV2
- **ERC-8004** Identity Registry

## Why This Is Different

1. **Multi-protocol depth** — Not just "read balance." Deep integration with GMX V2's DataStore pattern for OI and funding analysis, Aave V3's RAY math for accurate APY, and multi-DEX aggregation.

2. **Strategy layer** — Goes beyond raw data. Cross-protocol yield comparison, risk scoring, and personalized recommendations.

3. **Arbitrum-native** — Prioritizes Arbitrum ecosystem protocols (GMX, Camelot) rather than generic EVM tools.

4. **A2A compatible** — Agent Card endpoint, tool discovery, and structured execution interface ready for agent-to-agent communication.

## License

MIT
