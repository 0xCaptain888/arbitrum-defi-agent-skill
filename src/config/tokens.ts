// ── Arbitrum One token addresses ──
export const TOKENS: Record<string, { address: `0x${string}`; decimals: number; symbol: string; name: string }> = {
  WETH: {
    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    decimals: 18,
    symbol: "WETH",
    name: "Wrapped Ether",
  },
  USDC: {
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  },
  USDT: {
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    decimals: 6,
    symbol: "USDT",
    name: "Tether USD",
  },
  ARB: {
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    decimals: 18,
    symbol: "ARB",
    name: "Arbitrum",
  },
  DAI: {
    address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    decimals: 18,
    symbol: "DAI",
    name: "Dai Stablecoin",
  },
  WBTC: {
    address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    decimals: 8,
    symbol: "WBTC",
    name: "Wrapped BTC",
  },
  GMX: {
    address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
    decimals: 18,
    symbol: "GMX",
    name: "GMX",
  },
};

// Resolve token by symbol (case-insensitive) or by address
export function resolveToken(symbolOrAddress: string) {
  const upper = symbolOrAddress.toUpperCase();
  if (TOKENS[upper]) return TOKENS[upper];

  // Search by address
  const lower = symbolOrAddress.toLowerCase();
  for (const t of Object.values(TOKENS)) {
    if (t.address.toLowerCase() === lower) return t;
  }

  return null;
}
