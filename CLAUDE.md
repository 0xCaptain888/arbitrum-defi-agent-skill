# Arbitrum DeFi Strategist — Project Context

This is a Claude Code skill that enables AI agents to deeply interact with the Arbitrum DeFi ecosystem.

## Architecture

```
Agent Endpoint (Express.js)
    └── Tool Definitions (src/agent/tools.ts)
         ├── wallet    → ETH & ERC-20 portfolio queries
         ├── swap      → Multi-DEX aggregation (Uniswap V3 + Camelot)
         ├── gmx       → GMX V2 perpetuals (markets, OI, funding, positions)
         ├── aave      → Aave V3 lending (health, positions, reserves)
         ├── strategy   → Cross-protocol yield & risk engine
         └── registry  → ERC-8004 agent identity
```

## Key Design Decisions

- **viem** for all blockchain interaction (not ethers.js)
- **Services layer** separated from tools layer for testability
- **Multi-DEX quoting** with parallel fetches across fee tiers
- **GMX V2 DataStore** key hashing for direct state reads
- **Aave V3 RAY math** properly handled for APY calculations
- **Strategy engine** aggregates cross-protocol data for actionable insights

## Important Notes

- GMX V2 uses a DataStore pattern — all state is stored as key-value pairs
- Aave V3 rates are in RAY format (1e27), need conversion
- QuoterV2 functions are not marked `view` — use `simulateContract`
- Camelot uses Algebra-style concentrated liquidity (no fee tiers)
