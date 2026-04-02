/**
 * Agent Tool Definitions — The AI-facing interface.
 *
 * Each tool has a name, description, JSON Schema parameters, and a handler.
 * This follows a structure compatible with A2A protocol and OpenAI function calling.
 */

import { type Address } from "viem";
import * as walletService from "../services/wallet";
import * as swapService from "../services/swap";
import * as gmxService from "../services/gmx";
import * as aaveService from "../services/aave";
import * as strategyService from "../services/strategy";
import * as registryService from "../services/registry";

export interface ToolDef {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

export const tools: ToolDef[] = [
  // ── Wallet ──
  {
    name: "get_portfolio",
    description: "Get complete portfolio overview for a wallet on Arbitrum: ETH balance + all ERC-20 token balances. Returns non-zero balances only.",
    category: "wallet",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address (0x...)" },
      },
      required: ["address"],
    },
    handler: async (params) => walletService.getPortfolio(params.address as Address),
  },

  // ── DEX / Swap ──
  {
    name: "get_best_swap_quote",
    description: "Compare swap quotes across Uniswap V3 and Camelot DEX on Arbitrum. Returns the best execution venue with price comparison. Supports tokens: WETH, USDC, USDT, ARB, DAI, WBTC, GMX.",
    category: "dex",
    parameters: {
      type: "object",
      properties: {
        tokenIn: { type: "string", description: "Input token symbol (e.g. 'WETH')" },
        tokenOut: { type: "string", description: "Output token symbol (e.g. 'USDC')" },
        amountIn: { type: "string", description: "Amount to swap in human-readable format (e.g. '1.5')" },
      },
      required: ["tokenIn", "tokenOut", "amountIn"],
    },
    handler: async (params) =>
      swapService.getBestQuote(params.tokenIn, params.tokenOut, params.amountIn),
  },
  {
    name: "execute_swap",
    description: "Execute a token swap on Uniswap V3 on Arbitrum. Requires PRIVATE_KEY. Gets quote, handles approval, and executes. Use get_best_swap_quote first to preview.",
    category: "dex",
    parameters: {
      type: "object",
      properties: {
        tokenIn: { type: "string", description: "Input token symbol" },
        tokenOut: { type: "string", description: "Output token symbol" },
        amountIn: { type: "string", description: "Amount to swap" },
        slippageBps: { type: "number", description: "Slippage tolerance in basis points (default 50 = 0.5%)" },
      },
      required: ["tokenIn", "tokenOut", "amountIn"],
    },
    handler: async (params) =>
      swapService.executeSwap(params.tokenIn, params.tokenOut, params.amountIn, params.slippageBps),
  },

  // ── GMX V2 Perpetuals ──
  {
    name: "gmx_list_markets",
    description: "List all GMX V2 perpetual and spot markets on Arbitrum. Returns market tokens, index tokens, and collateral tokens.",
    category: "gmx",
    parameters: { type: "object", properties: {} },
    handler: async () => gmxService.getMarkets(),
  },
  {
    name: "gmx_analyze_market",
    description: "Deep analysis of a GMX V2 market: open interest (long vs short), OI imbalance ratio, borrowing rates, and funding rate signals. Identifies contrarian trading opportunities.",
    category: "gmx",
    parameters: {
      type: "object",
      properties: {
        marketToken: { type: "string", description: "GMX market token address" },
      },
      required: ["marketToken"],
    },
    handler: async (params) => gmxService.analyzeMarket(params.marketToken as Address),
  },
  {
    name: "gmx_get_positions",
    description: "Fetch all open GMX V2 perpetual positions for a wallet. Returns position size, collateral, leverage, and direction.",
    category: "gmx",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address" },
      },
      required: ["address"],
    },
    handler: async (params) => gmxService.getAccountPositions(params.address as Address),
  },

  // ── Aave V3 Lending ──
  {
    name: "aave_account_health",
    description: "Get Aave V3 account health on Arbitrum: total collateral, total debt, health factor, liquidation threshold, and risk assessment with actionable analysis.",
    category: "aave",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address" },
      },
      required: ["address"],
    },
    handler: async (params) => aaveService.getAccountHealth(params.address as Address),
  },
  {
    name: "aave_detailed_positions",
    description: "Get per-asset breakdown of Aave V3 positions: supplied amounts, borrowed amounts, APYs, and collateral usage for each asset.",
    category: "aave",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address" },
      },
      required: ["address"],
    },
    handler: async (params) => aaveService.getDetailedPositions(params.address as Address),
  },
  {
    name: "aave_reserve_overview",
    description: "Overview of all Aave V3 reserves on Arbitrum: supply APY, borrow APY, utilization rate, LTV, and prices. Use for yield comparison.",
    category: "aave",
    parameters: { type: "object", properties: {} },
    handler: async () => aaveService.getReserveOverview(),
  },

  // ── Strategy Engine ──
  {
    name: "find_yield_opportunities",
    description: "Scan all Arbitrum DeFi protocols (Aave V3, GMX V2) for the best yield opportunities. Returns ranked list with APY, risk level, and descriptions.",
    category: "strategy",
    parameters: { type: "object", properties: {} },
    handler: async () => strategyService.findYieldOpportunities(),
  },
  {
    name: "analyze_portfolio_risk",
    description: "Comprehensive cross-protocol risk assessment: analyzes wallet holdings, Aave health factor, GMX leverage, concentration risk, and generates actionable recommendations.",
    category: "strategy",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address to analyze" },
      },
      required: ["address"],
    },
    handler: async (params) => strategyService.analyzePortfolioRisk(params.address as Address),
  },
  {
    name: "get_strategy_recommendation",
    description: "Holistic DeFi strategy recommendation combining portfolio risk analysis with yield opportunities. Provides personalized advice based on current positions and risk profile.",
    category: "strategy",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Wallet address" },
      },
      required: ["address"],
    },
    handler: async (params) => strategyService.getStrategyRecommendation(params.address as Address),
  },

  // ── ERC-8004 Registry ──
  {
    name: "register_agent",
    description: "Register this agent on the Arbitrum ERC-8004 Identity Registry. Mints an Agent NFT with a metadata URI. Uses Sepolia testnet by default.",
    category: "registry",
    parameters: {
      type: "object",
      properties: {
        agentURI: { type: "string", description: "URI pointing to agent metadata JSON" },
        useMainnet: { type: "boolean", description: "Use Arbitrum One instead of Sepolia (default false)" },
      },
      required: ["agentURI"],
    },
    handler: async (params) =>
      registryService.registerAgent(params.agentURI, params.useMainnet ?? false),
  },
  {
    name: "get_agent_info",
    description: "Look up an agent's registration on the ERC-8004 Identity Registry by agent ID.",
    category: "registry",
    parameters: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Agent ID (token ID)" },
        useMainnet: { type: "boolean", description: "Use Arbitrum One instead of Sepolia" },
      },
      required: ["agentId"],
    },
    handler: async (params) =>
      registryService.getAgentInfo(BigInt(params.agentId), params.useMainnet ?? false),
  },
];

export function getTool(name: string): ToolDef | undefined {
  return tools.find((t) => t.name === name);
}

export function getToolsByCategory(category: string): ToolDef[] {
  return tools.filter((t) => t.category === category);
}
