// ── Contract addresses & minimal ABI fragments ──
// All addresses are for Arbitrum One unless noted otherwise.

// ─── Uniswap V3 ───
export const UNISWAP_V3 = {
  factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984" as `0x${string}`,
  quoterV2: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e" as `0x${string}`,
  swapRouter02: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45" as `0x${string}`,
};

// ─── GMX V2 (Arbitrum flagship perpetuals protocol) ───
export const GMX_V2 = {
  reader: "0xf60becbba223EEA9495Da3f606753867eC10d139" as `0x${string}`,
  dataStore: "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8" as `0x${string}`,
  eventEmitter: "0xC8ee91A54287DB53897056e12D9819156D3822Fb" as `0x${string}`,
  orderHandler: "0x352f684ab9e97a6321a13CF03A61316B681D9fD2" as `0x${string}`,
  depositVault: "0xF89e77e8Dc11691C9e8757e84aaFbCD8A67d7A55" as `0x${string}`,
  withdrawalVault: "0x0628D46b5D145f183AdB6Ef1f2c97eD1C4701C55" as `0x${string}`,
};

// ─── Camelot DEX (Arbitrum-native DEX) ───
export const CAMELOT = {
  router: "0xc873fEcbd354f5A56E00E710B90EF4201db2448d" as `0x${string}`,
  factory: "0x1a3c9B1d2F0529D97f2afC5136Cc23e58f1FD35B" as `0x${string}`,
  quoterV2: "0x0524E833cCD057e4d7A296e3aaAb9f7675964Ce1" as `0x${string}`,
};

// ─── Aave V3 (Lending on Arbitrum) ───
export const AAVE_V3 = {
  pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD" as `0x${string}`,
  poolDataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654" as `0x${string}`,
  oracle: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7" as `0x${string}`,
};

// ─── ERC-8004 Identity Registry ───
export const IDENTITY_REGISTRY = {
  arbitrumOne: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as `0x${string}`,
  arbitrumSepolia: "0x8004A818BFB912233c491871b3d84c89A494BD9e" as `0x${string}`,
};

// ══════════════════════════════════════════════════════
//  ABI FRAGMENTS
// ══════════════════════════════════════════════════════

export const ERC20_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }] },
] as const;

// ─── Uniswap V3 QuoterV2 ───
export const QUOTER_V2_ABI = [
  {
    type: "function", name: "quoteExactInputSingle", stateMutability: "nonpayable",
    inputs: [{ name: "params", type: "tuple", components: [
      { name: "tokenIn", type: "address" }, { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" }, { name: "fee", type: "uint24" },
      { name: "sqrtPriceLimitX96", type: "uint160" },
    ]}],
    outputs: [
      { name: "amountOut", type: "uint256" }, { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" }, { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

// ─── Uniswap V3 SwapRouter02 ───
export const SWAP_ROUTER_ABI = [
  {
    type: "function", name: "exactInputSingle", stateMutability: "payable",
    inputs: [{ name: "params", type: "tuple", components: [
      { name: "tokenIn", type: "address" }, { name: "tokenOut", type: "address" },
      { name: "fee", type: "uint24" }, { name: "recipient", type: "address" },
      { name: "amountIn", type: "uint256" }, { name: "amountOutMinimum", type: "uint256" },
      { name: "sqrtPriceLimitX96", type: "uint160" },
    ]}],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

// ─── GMX V2 Reader ───
export const GMX_READER_ABI = [
  {
    type: "function", name: "getMarkets", stateMutability: "view",
    inputs: [{ name: "dataStore", type: "address" }, { name: "start", type: "uint256" }, { name: "end", type: "uint256" }],
    outputs: [{ name: "", type: "tuple[]", components: [
      { name: "marketToken", type: "address" }, { name: "indexToken", type: "address" },
      { name: "longToken", type: "address" }, { name: "shortToken", type: "address" },
    ]}],
  },
  {
    type: "function", name: "getMarketTokenPrice", stateMutability: "view",
    inputs: [
      { name: "dataStore", type: "address" }, { name: "market", type: "tuple", components: [
        { name: "marketToken", type: "address" }, { name: "indexToken", type: "address" },
        { name: "longToken", type: "address" }, { name: "shortToken", type: "address" },
      ]},
      { name: "indexTokenPrice", type: "tuple", components: [{ name: "min", type: "uint256" }, { name: "max", type: "uint256" }] },
      { name: "longTokenPrice", type: "tuple", components: [{ name: "min", type: "uint256" }, { name: "max", type: "uint256" }] },
      { name: "shortTokenPrice", type: "tuple", components: [{ name: "min", type: "uint256" }, { name: "max", type: "uint256" }] },
      { name: "pnlFactorType", type: "bytes32" },
      { name: "maximize", type: "bool" },
    ],
    outputs: [{ name: "", type: "int256" }, { name: "", type: "tuple", components: [
      { name: "poolValue", type: "int256" }, { name: "longPnl", type: "int256" },
      { name: "shortPnl", type: "int256" }, { name: "netPnl", type: "int256" },
      { name: "longTokenAmount", type: "uint256" }, { name: "shortTokenAmount", type: "uint256" },
      { name: "longTokenUsd", type: "uint256" }, { name: "shortTokenUsd", type: "uint256" },
      { name: "totalBorrowingFees", type: "uint256" }, { name: "borrowingFeePoolFactor", type: "uint256" },
      { name: "impactPoolAmount", type: "uint256" },
    ]}],
  },
  {
    type: "function", name: "getAccountPositions", stateMutability: "view",
    inputs: [
      { name: "dataStore", type: "address" }, { name: "account", type: "address" },
      { name: "start", type: "uint256" }, { name: "end", type: "uint256" },
    ],
    outputs: [{ name: "", type: "tuple[]", components: [
      { name: "addresses", type: "tuple", components: [
        { name: "account", type: "address" }, { name: "market", type: "address" },
        { name: "collateralToken", type: "address" },
      ]},
      { name: "numbers", type: "tuple", components: [
        { name: "sizeInUsd", type: "uint256" }, { name: "sizeInTokens", type: "uint256" },
        { name: "collateralAmount", type: "uint256" }, { name: "borrowingFactor", type: "uint256" },
        { name: "fundingFeeAmountPerSize", type: "uint256" }, { name: "longTokenClaimableFundingAmountPerSize", type: "uint256" },
        { name: "shortTokenClaimableFundingAmountPerSize", type: "uint256" },
        { name: "increasedAtBlock", type: "uint256" }, { name: "decreasedAtBlock", type: "uint256" },
        { name: "increasedAtTime", type: "uint256" }, { name: "decreasedAtTime", type: "uint256" },
      ]},
      { name: "flags", type: "tuple", components: [{ name: "isLong", type: "bool" }] },
    ]}],
  },
] as const;

// ─── GMX V2 DataStore (for reading funding rates, OI, etc.) ───
export const GMX_DATASTORE_ABI = [
  { type: "function", name: "getUint", stateMutability: "view", inputs: [{ name: "key", type: "bytes32" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "getInt", stateMutability: "view", inputs: [{ name: "key", type: "bytes32" }], outputs: [{ name: "", type: "int256" }] },
  { type: "function", name: "getAddress", stateMutability: "view", inputs: [{ name: "key", type: "bytes32" }], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "getBool", stateMutability: "view", inputs: [{ name: "key", type: "bytes32" }], outputs: [{ name: "", type: "bool" }] },
] as const;

// ─── Aave V3 Pool ───
export const AAVE_POOL_ABI = [
  {
    type: "function", name: "getUserAccountData", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
  },
  {
    type: "function", name: "getReservesList", stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
] as const;

// ─── Aave V3 Pool Data Provider ───
export const AAVE_DATA_PROVIDER_ABI = [
  {
    type: "function", name: "getUserReserveData", stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }, { name: "user", type: "address" }],
    outputs: [
      { name: "currentATokenBalance", type: "uint256" },
      { name: "currentStableDebt", type: "uint256" },
      { name: "currentVariableDebt", type: "uint256" },
      { name: "principalStableDebt", type: "uint256" },
      { name: "scaledVariableDebt", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "stableRateLastUpdated", type: "uint40" },
      { name: "usageAsCollateralEnabled", type: "bool" },
    ],
  },
  {
    type: "function", name: "getReserveData", stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      { name: "unbacked", type: "uint256" },
      { name: "accruedToTreasuryScaled", type: "uint256" },
      { name: "totalAToken", type: "uint256" },
      { name: "totalStableDebt", type: "uint256" },
      { name: "totalVariableDebt", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "variableBorrowRate", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "averageStableBorrowRate", type: "uint256" },
      { name: "liquidityIndex", type: "uint256" },
      { name: "variableBorrowIndex", type: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40" },
    ],
  },
  {
    type: "function", name: "getReserveConfigurationData", stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [
      { name: "decimals", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "liquidationThreshold", type: "uint256" },
      { name: "liquidationBonus", type: "uint256" },
      { name: "reserveFactor", type: "uint256" },
      { name: "usageAsCollateralEnabled", type: "bool" },
      { name: "borrowingEnabled", type: "bool" },
      { name: "stableBorrowRateEnabled", type: "bool" },
      { name: "isActive", type: "bool" },
      { name: "isFrozen", type: "bool" },
    ],
  },
] as const;

// ─── Aave V3 Oracle ───
export const AAVE_ORACLE_ABI = [
  {
    type: "function", name: "getAssetPrice", stateMutability: "view",
    inputs: [{ name: "asset", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "getAssetsPrices", stateMutability: "view",
    inputs: [{ name: "assets", type: "address[]" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
] as const;

// ─── Camelot V3 Quoter ───
export const CAMELOT_QUOTER_ABI = [
  {
    type: "function", name: "quoteExactInputSingle", stateMutability: "nonpayable",
    inputs: [
      { name: "tokenIn", type: "address" }, { name: "tokenOut", type: "address" },
      { name: "amountIn", type: "uint256" }, { name: "limitSqrtPrice", type: "uint160" },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "fee", type: "uint16" },
    ],
  },
] as const;

// ─── ERC-8004 Identity Registry ───
export const IDENTITY_REGISTRY_ABI = [
  { type: "function", name: "register", stateMutability: "nonpayable", inputs: [{ name: "agentURI", type: "string" }], outputs: [{ name: "agentId", type: "uint256" }] },
  { type: "function", name: "setAgentURI", stateMutability: "nonpayable", inputs: [{ name: "agentId", type: "uint256" }, { name: "newURI", type: "string" }], outputs: [] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "tokenId", type: "uint256", indexed: true }] },
] as const;
