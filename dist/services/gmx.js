"use strict";
/**
 * GMX V2 Service — Deep integration with Arbitrum's flagship perpetuals protocol.
 *
 * Capabilities:
 * - List all GMX V2 markets (perps + spot)
 * - Read account positions (size, collateral, PnL direction)
 * - Analyze open interest imbalance (long vs short)
 * - Compute funding rate signals
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarkets = getMarkets;
exports.getOpenInterest = getOpenInterest;
exports.getBorrowingInfo = getBorrowingInfo;
exports.getAccountPositions = getAccountPositions;
exports.analyzeMarket = analyzeMarket;
const viem_1 = require("viem");
const client_1 = require("../utils/client");
const chains_1 = require("../config/chains");
const contracts_1 = require("../config/contracts");
const tokens_1 = require("../config/tokens");
// ── GMX V2 DataStore key helpers ──
// GMX V2 stores all state in a generic DataStore keyed by keccak256 hashes.
// See: https://github.com/gmx-io/gmx-synthetics/blob/main/contracts/data/Keys.sol
function hashData(types, values) {
    return (0, viem_1.keccak256)((0, viem_1.encodePacked)(types, values));
}
function openInterestKey(market, collateralToken, isLong) {
    // keccak256(abi.encode("OPEN_INTEREST", market, collateralToken, isLong))
    const OPEN_INTEREST_PREFIX = (0, viem_1.keccak256)((0, viem_1.encodePacked)(["string"], ["OPEN_INTEREST"]));
    return (0, viem_1.keccak256)((0, viem_1.encodePacked)(["bytes32", "address", "address", "bool"], [OPEN_INTEREST_PREFIX, market, collateralToken, isLong]));
}
function borrowingFactorKey(market, isLong) {
    const BORROWING_FACTOR_PREFIX = (0, viem_1.keccak256)((0, viem_1.encodePacked)(["string"], ["CUMULATIVE_BORROWING_FACTOR"]));
    return (0, viem_1.keccak256)((0, viem_1.encodePacked)(["bytes32", "address", "bool"], [BORROWING_FACTOR_PREFIX, market, isLong]));
}
function fundingFeeKey(market, collateralToken, isLong) {
    const prefix = (0, viem_1.keccak256)((0, viem_1.encodePacked)(["string"], ["FUNDING_FEE_AMOUNT_PER_SIZE"]));
    return (0, viem_1.keccak256)((0, viem_1.encodePacked)(["bytes32", "address", "address", "bool"], [prefix, market, collateralToken, isLong]));
}
// Resolve token symbol from known tokens, with on-chain fallback cache
const symbolCache = {};
function tokenLabelSync(addr) {
    const lower = addr.toLowerCase();
    for (const t of Object.values(tokens_1.TOKENS)) {
        if (t.address.toLowerCase() === lower)
            return t.symbol;
    }
    if (symbolCache[lower])
        return symbolCache[lower];
    return addr.slice(0, 8) + "...";
}
async function resolveSymbol(addr, client) {
    const lower = addr.toLowerCase();
    for (const t of Object.values(tokens_1.TOKENS)) {
        if (t.address.toLowerCase() === lower)
            return t.symbol;
    }
    if (symbolCache[lower])
        return symbolCache[lower];
    try {
        const sym = await client.readContract({ address: addr, abi: contracts_1.ERC20_ABI, functionName: "symbol" });
        symbolCache[lower] = sym;
        return sym;
    }
    catch {
        return addr.slice(0, 8) + "...";
    }
}
// Cache markets to avoid redundant RPC calls
let marketsCache = null;
let marketsCacheTime = 0;
const CACHE_TTL = 60_000; // 60 seconds
/**
 * Fetch all GMX V2 markets on Arbitrum (cached)
 */
async function getMarkets() {
    if (marketsCache && Date.now() - marketsCacheTime < CACHE_TTL) {
        return marketsCache;
    }
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    try {
        const raw = await client.readContract({
            address: contracts_1.GMX_V2.reader,
            abi: contracts_1.GMX_READER_ABI,
            functionName: "getMarkets",
            args: [contracts_1.GMX_V2.dataStore, 0n, 100n],
        });
        // Collect unique token addresses for batch symbol resolution
        const uniqueAddrs = new Set();
        for (const m of raw) {
            uniqueAddrs.add(m.indexToken.toLowerCase());
            uniqueAddrs.add(m.longToken.toLowerCase());
            uniqueAddrs.add(m.shortToken.toLowerCase());
        }
        // Resolve unknown symbols in parallel
        const unknowns = [...uniqueAddrs].filter(a => {
            for (const t of Object.values(tokens_1.TOKENS)) {
                if (t.address.toLowerCase() === a)
                    return false;
            }
            return !symbolCache[a];
        });
        await Promise.all(unknowns.map(a => resolveSymbol(a, client)));
        const result = raw.map((m) => ({
            marketToken: m.marketToken,
            indexToken: m.indexToken,
            longToken: m.longToken,
            shortToken: m.shortToken,
            label: `${tokenLabelSync(m.indexToken)}/USD [${tokenLabelSync(m.longToken)}-${tokenLabelSync(m.shortToken)}]`,
        }));
        marketsCache = result;
        marketsCacheTime = Date.now();
        return result;
    }
    catch (err) {
        throw new Error(`Failed to fetch GMX markets: ${err.message}`);
    }
}
/**
 * Fetch open interest for a specific market (long + short sides)
 */
async function getOpenInterest(marketToken) {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    const markets = await getMarkets();
    const market = markets.find((m) => m.marketToken.toLowerCase() === marketToken.toLowerCase());
    if (!market)
        throw new Error(`Market ${marketToken} not found`);
    const [longOI, shortOI] = await Promise.all([
        client.readContract({
            address: contracts_1.GMX_V2.dataStore,
            abi: contracts_1.GMX_DATASTORE_ABI,
            functionName: "getUint",
            args: [openInterestKey(marketToken, market.longToken, true)],
        }).catch(() => 0n),
        client.readContract({
            address: contracts_1.GMX_V2.dataStore,
            abi: contracts_1.GMX_DATASTORE_ABI,
            functionName: "getUint",
            args: [openInterestKey(marketToken, market.shortToken, false)],
        }).catch(() => 0n),
    ]);
    const longUsd = Number((0, viem_1.formatUnits)(longOI, 30));
    const shortUsd = Number((0, viem_1.formatUnits)(shortOI, 30));
    const total = longUsd + shortUsd;
    const imbalanceRatio = total > 0 ? (longUsd - shortUsd) / total : 0;
    return {
        market: market.label,
        marketToken,
        longOpenInterestUsd: longUsd,
        shortOpenInterestUsd: shortUsd,
        totalOpenInterestUsd: total,
        imbalanceRatio: Math.round(imbalanceRatio * 10000) / 100, // percentage
        dominantSide: longUsd > shortUsd ? "LONG" : shortUsd > longUsd ? "SHORT" : "BALANCED",
        signal: Math.abs(imbalanceRatio) > 0.3
            ? `High imbalance (${Math.abs(imbalanceRatio * 100).toFixed(1)}%) — funding likely favors ${longUsd > shortUsd ? "shorts" : "longs"}`
            : "Balanced OI — no strong funding signal",
    };
}
/**
 * Fetch borrowing rates for a market
 */
async function getBorrowingInfo(marketToken) {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    const markets = await getMarkets();
    const market = markets.find((m) => m.marketToken.toLowerCase() === marketToken.toLowerCase());
    if (!market)
        throw new Error(`Market ${marketToken} not found`);
    const [longBF, shortBF] = await Promise.all([
        client.readContract({
            address: contracts_1.GMX_V2.dataStore,
            abi: contracts_1.GMX_DATASTORE_ABI,
            functionName: "getUint",
            args: [borrowingFactorKey(marketToken, true)],
        }).catch(() => 0n),
        client.readContract({
            address: contracts_1.GMX_V2.dataStore,
            abi: contracts_1.GMX_DATASTORE_ABI,
            functionName: "getUint",
            args: [borrowingFactorKey(marketToken, false)],
        }).catch(() => 0n),
    ]);
    return {
        market: market.label,
        longCumulativeBorrowingFactor: (0, viem_1.formatUnits)(longBF, 30),
        shortCumulativeBorrowingFactor: (0, viem_1.formatUnits)(shortBF, 30),
    };
}
/**
 * Fetch all positions for an account on GMX V2
 */
async function getAccountPositions(account) {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    try {
        const raw = await client.readContract({
            address: contracts_1.GMX_V2.reader,
            abi: contracts_1.GMX_READER_ABI,
            functionName: "getAccountPositions",
            args: [contracts_1.GMX_V2.dataStore, account, 0n, 50n],
        });
        return raw.map((p) => {
            const sizeUsd = Number((0, viem_1.formatUnits)(p.numbers.sizeInUsd, 30));
            const collateral = Number((0, viem_1.formatUnits)(p.numbers.collateralAmount, 18)); // approximate
            const leverage = collateral > 0 ? sizeUsd / collateral : 0;
            return {
                market: p.addresses.market,
                collateralToken: p.addresses.collateralToken,
                isLong: p.flags.isLong,
                sizeInUsd: sizeUsd,
                sizeInTokens: (0, viem_1.formatUnits)(p.numbers.sizeInTokens, 18),
                collateralAmount: (0, viem_1.formatUnits)(p.numbers.collateralAmount, 18),
                estimatedLeverage: Math.round(leverage * 100) / 100,
                openedAtBlock: p.numbers.increasedAtBlock.toString(),
                openedAtTime: new Date(Number(p.numbers.increasedAtTime) * 1000).toISOString(),
            };
        });
    }
    catch (err) {
        throw new Error(`Failed to fetch GMX positions: ${err.message}`);
    }
}
/**
 * Comprehensive market analysis: OI + borrowing + signal
 */
async function analyzeMarket(marketToken) {
    const [oi, borrowing] = await Promise.all([
        getOpenInterest(marketToken),
        getBorrowingInfo(marketToken),
    ]);
    return {
        ...oi,
        borrowing,
        analysis: generateMarketAnalysis(oi),
    };
}
function generateMarketAnalysis(oi) {
    const lines = [];
    if (oi.totalOpenInterestUsd > 1_000_000_000) {
        lines.push(`High total OI ($${(oi.totalOpenInterestUsd / 1e9).toFixed(2)}B) — active market with deep liquidity.`);
    }
    else if (oi.totalOpenInterestUsd > 100_000_000) {
        lines.push(`Moderate OI ($${(oi.totalOpenInterestUsd / 1e6).toFixed(0)}M) — healthy market activity.`);
    }
    else {
        lines.push(`Low OI ($${(oi.totalOpenInterestUsd / 1e6).toFixed(1)}M) — thin market, higher slippage risk.`);
    }
    if (Math.abs(oi.imbalanceRatio) > 30) {
        lines.push(`Significant ${oi.dominantSide} skew (${oi.imbalanceRatio.toFixed(1)}%) — elevated funding costs for ${oi.dominantSide.toLowerCase()}s, opportunity for contrarian positioning.`);
    }
    else if (Math.abs(oi.imbalanceRatio) > 15) {
        lines.push(`Moderate ${oi.dominantSide} lean — watch for funding rate adjustments.`);
    }
    else {
        lines.push("Balanced open interest — no strong directional bias from positioning.");
    }
    return lines.join(" ");
}
//# sourceMappingURL=gmx.js.map