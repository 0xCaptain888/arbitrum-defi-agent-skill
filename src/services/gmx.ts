/**
 * GMX V2 Service — Deep integration with Arbitrum's flagship perpetuals protocol.
 *
 * Capabilities:
 * - List all GMX V2 markets (perps + spot)
 * - Read account positions (size, collateral, PnL direction)
 * - Analyze open interest imbalance (long vs short)
 * - Compute funding rate signals
 */

import { type Address, formatUnits, encodePacked, keccak256 } from "viem";
import { getPublicClient } from "../utils/client";
import { arbitrumOne } from "../config/chains";
import { GMX_V2, GMX_READER_ABI, GMX_DATASTORE_ABI } from "../config/contracts";
import { TOKENS } from "../config/tokens";

// ── GMX V2 DataStore key helpers ──
// GMX V2 stores all state in a generic DataStore keyed by keccak256 hashes.
// See: https://github.com/gmx-io/gmx-synthetics/blob/main/contracts/data/Keys.sol

function hashData(types: string[], values: any[]): `0x${string}` {
  return keccak256(encodePacked(types, values));
}

function openInterestKey(market: Address, collateralToken: Address, isLong: boolean): `0x${string}` {
  // keccak256(abi.encode("OPEN_INTEREST", market, collateralToken, isLong))
  const OPEN_INTEREST_PREFIX = keccak256(
    encodePacked(["string"], ["OPEN_INTEREST"])
  );
  return keccak256(
    encodePacked(
      ["bytes32", "address", "address", "bool"],
      [OPEN_INTEREST_PREFIX, market, collateralToken, isLong]
    )
  );
}

function borrowingFactorKey(market: Address, isLong: boolean): `0x${string}` {
  const BORROWING_FACTOR_PREFIX = keccak256(
    encodePacked(["string"], ["CUMULATIVE_BORROWING_FACTOR"])
  );
  return keccak256(
    encodePacked(["bytes32", "address", "bool"], [BORROWING_FACTOR_PREFIX, market, isLong])
  );
}

function fundingFeeKey(market: Address, collateralToken: Address, isLong: boolean): `0x${string}` {
  const prefix = keccak256(
    encodePacked(["string"], ["FUNDING_FEE_AMOUNT_PER_SIZE"])
  );
  return keccak256(
    encodePacked(
      ["bytes32", "address", "address", "bool"],
      [prefix, market, collateralToken, isLong]
    )
  );
}

export interface GmxMarket {
  marketToken: Address;
  indexToken: Address;
  longToken: Address;
  shortToken: Address;
  label: string;
}

// Resolve token symbol from known tokens
function tokenLabel(addr: Address): string {
  for (const t of Object.values(TOKENS)) {
    if (t.address.toLowerCase() === addr.toLowerCase()) return t.symbol;
  }
  return addr.slice(0, 8) + "...";
}

/**
 * Fetch all GMX V2 markets on Arbitrum
 */
export async function getMarkets(): Promise<GmxMarket[]> {
  const client = getPublicClient(arbitrumOne);
  try {
    const raw = await client.readContract({
      address: GMX_V2.reader,
      abi: GMX_READER_ABI,
      functionName: "getMarkets",
      args: [GMX_V2.dataStore, 0n, 100n],
    });

    return (raw as any[]).map((m: any) => ({
      marketToken: m.marketToken,
      indexToken: m.indexToken,
      longToken: m.longToken,
      shortToken: m.shortToken,
      label: `${tokenLabel(m.indexToken)}/USD [${tokenLabel(m.longToken)}-${tokenLabel(m.shortToken)}]`,
    }));
  } catch (err: any) {
    throw new Error(`Failed to fetch GMX markets: ${err.message}`);
  }
}

/**
 * Fetch open interest for a specific market (long + short sides)
 */
export async function getOpenInterest(marketToken: Address) {
  const client = getPublicClient(arbitrumOne);
  const markets = await getMarkets();
  const market = markets.find(
    (m) => m.marketToken.toLowerCase() === marketToken.toLowerCase()
  );
  if (!market) throw new Error(`Market ${marketToken} not found`);

  const [longOI, shortOI] = await Promise.all([
    client.readContract({
      address: GMX_V2.dataStore,
      abi: GMX_DATASTORE_ABI,
      functionName: "getUint",
      args: [openInterestKey(marketToken, market.longToken, true)],
    }).catch(() => 0n),
    client.readContract({
      address: GMX_V2.dataStore,
      abi: GMX_DATASTORE_ABI,
      functionName: "getUint",
      args: [openInterestKey(marketToken, market.shortToken, false)],
    }).catch(() => 0n),
  ]);

  const longUsd = Number(formatUnits(longOI as bigint, 30));
  const shortUsd = Number(formatUnits(shortOI as bigint, 30));
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
export async function getBorrowingInfo(marketToken: Address) {
  const client = getPublicClient(arbitrumOne);
  const markets = await getMarkets();
  const market = markets.find(
    (m) => m.marketToken.toLowerCase() === marketToken.toLowerCase()
  );
  if (!market) throw new Error(`Market ${marketToken} not found`);

  const [longBF, shortBF] = await Promise.all([
    client.readContract({
      address: GMX_V2.dataStore,
      abi: GMX_DATASTORE_ABI,
      functionName: "getUint",
      args: [borrowingFactorKey(marketToken, true)],
    }).catch(() => 0n),
    client.readContract({
      address: GMX_V2.dataStore,
      abi: GMX_DATASTORE_ABI,
      functionName: "getUint",
      args: [borrowingFactorKey(marketToken, false)],
    }).catch(() => 0n),
  ]);

  return {
    market: market.label,
    longCumulativeBorrowingFactor: formatUnits(longBF as bigint, 30),
    shortCumulativeBorrowingFactor: formatUnits(shortBF as bigint, 30),
  };
}

/**
 * Fetch all positions for an account on GMX V2
 */
export async function getAccountPositions(account: Address) {
  const client = getPublicClient(arbitrumOne);
  try {
    const raw = await client.readContract({
      address: GMX_V2.reader,
      abi: GMX_READER_ABI,
      functionName: "getAccountPositions",
      args: [GMX_V2.dataStore, account, 0n, 50n],
    });

    return (raw as any[]).map((p: any) => {
      const sizeUsd = Number(formatUnits(p.numbers.sizeInUsd, 30));
      const collateral = Number(formatUnits(p.numbers.collateralAmount, 18)); // approximate
      const leverage = collateral > 0 ? sizeUsd / collateral : 0;

      return {
        market: p.addresses.market,
        collateralToken: p.addresses.collateralToken,
        isLong: p.flags.isLong,
        sizeInUsd: sizeUsd,
        sizeInTokens: formatUnits(p.numbers.sizeInTokens, 18),
        collateralAmount: formatUnits(p.numbers.collateralAmount, 18),
        estimatedLeverage: Math.round(leverage * 100) / 100,
        openedAtBlock: p.numbers.increasedAtBlock.toString(),
        openedAtTime: new Date(Number(p.numbers.increasedAtTime) * 1000).toISOString(),
      };
    });
  } catch (err: any) {
    throw new Error(`Failed to fetch GMX positions: ${err.message}`);
  }
}

/**
 * Comprehensive market analysis: OI + borrowing + signal
 */
export async function analyzeMarket(marketToken: Address) {
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

function generateMarketAnalysis(oi: Awaited<ReturnType<typeof getOpenInterest>>) {
  const lines: string[] = [];

  if (oi.totalOpenInterestUsd > 1_000_000_000) {
    lines.push(`High total OI ($${(oi.totalOpenInterestUsd / 1e9).toFixed(2)}B) — active market with deep liquidity.`);
  } else if (oi.totalOpenInterestUsd > 100_000_000) {
    lines.push(`Moderate OI ($${(oi.totalOpenInterestUsd / 1e6).toFixed(0)}M) — healthy market activity.`);
  } else {
    lines.push(`Low OI ($${(oi.totalOpenInterestUsd / 1e6).toFixed(1)}M) — thin market, higher slippage risk.`);
  }

  if (Math.abs(oi.imbalanceRatio) > 30) {
    lines.push(`Significant ${oi.dominantSide} skew (${oi.imbalanceRatio.toFixed(1)}%) — elevated funding costs for ${oi.dominantSide.toLowerCase()}s, opportunity for contrarian positioning.`);
  } else if (Math.abs(oi.imbalanceRatio) > 15) {
    lines.push(`Moderate ${oi.dominantSide} lean — watch for funding rate adjustments.`);
  } else {
    lines.push("Balanced open interest — no strong directional bias from positioning.");
  }

  return lines.join(" ");
}
