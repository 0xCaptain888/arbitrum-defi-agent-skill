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

```bash
# Register on Arbitrum Sepolia
PRIVATE_KEY=0x... npx tsx scripts/register-agent.ts https://raw.githubusercontent.com/0xCaptain888/arbitrum-defi-agent-skill/main/agent-registration.json
```

The registration mints an Agent NFT on the [Identity Registry](https://sepolia.arbiscan.io/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) and returns your Agent ID.

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
