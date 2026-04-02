/**
 * Aave V3 Service — Lending protocol analytics on Arbitrum.
 *
 * Capabilities:
 * - Account health factor & liquidation risk assessment
 * - Per-asset supply/borrow positions
 * - Reserve-level APY data (supply APY, borrow APY, utilization)
 * - Cross-account risk scoring
 */

import { type Address, formatUnits } from "viem";
import { getPublicClient } from "../utils/client";
import { arbitrumOne } from "../config/chains";
import {
  AAVE_V3,
  AAVE_POOL_ABI,
  AAVE_DATA_PROVIDER_ABI,
  AAVE_ORACLE_ABI,
  ERC20_ABI,
} from "../config/contracts";
import { TOKENS } from "../config/tokens";

const RAY = 10n ** 27n; // Aave uses RAY (1e27) for rates
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

function rayToPercent(ray: bigint): number {
  return Number(ray * 10000n / RAY) / 100; // percentage with 2 decimal precision
}

function rayToApy(ray: bigint): number {
  // Convert per-second rate to APY: ((1 + rate/SECONDS)^SECONDS - 1) * 100
  // Simplified: rate * SECONDS / RAY * 100 ≈ APR, close enough for display
  const apr = Number(ray) / 1e27 * SECONDS_PER_YEAR * 100;
  return Math.round(apr * 100) / 100;
}

export interface AaveAccountSummary {
  address: Address;
  totalCollateralUsd: number;
  totalDebtUsd: number;
  availableBorrowsUsd: number;
  ltvPercent: number;
  liquidationThresholdPercent: number;
  healthFactor: number;
  riskLevel: "SAFE" | "MODERATE" | "HIGH" | "CRITICAL" | "LIQUIDATABLE";
  riskAnalysis: string;
}

/**
 * Get comprehensive account health data from Aave V3
 */
export async function getAccountHealth(account: Address): Promise<AaveAccountSummary> {
  const client = getPublicClient(arbitrumOne);

  const data = await client.readContract({
    address: AAVE_V3.pool,
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    args: [account],
  });

  // Aave returns values in base currency units (USD with 8 decimals)
  const totalCollateralUsd = Number(formatUnits(data[0], 8));
  const totalDebtUsd = Number(formatUnits(data[1], 8));
  const availableBorrowsUsd = Number(formatUnits(data[2], 8));
  const ltvPercent = Number(data[4]) / 100;
  const liquidationThresholdPercent = Number(data[3]) / 100;
  const healthFactor = Number(formatUnits(data[5], 18));

  let riskLevel: AaveAccountSummary["riskLevel"];
  let riskAnalysis: string;

  if (totalDebtUsd === 0) {
    riskLevel = "SAFE";
    riskAnalysis = "No active borrows. Account is not at risk.";
  } else if (healthFactor > 2) {
    riskLevel = "SAFE";
    riskAnalysis = `Health factor ${healthFactor.toFixed(2)} is well above 1.0. Liquidation unlikely unless major market move.`;
  } else if (healthFactor > 1.5) {
    riskLevel = "MODERATE";
    riskAnalysis = `Health factor ${healthFactor.toFixed(2)}. Position is healthy but should be monitored. A ${((1 - 1 / healthFactor) * 100).toFixed(0)}% collateral drop would trigger liquidation.`;
  } else if (healthFactor > 1.1) {
    riskLevel = "HIGH";
    riskAnalysis = `Health factor ${healthFactor.toFixed(2)} is dangerously close to liquidation. Only ${((healthFactor - 1) * 100).toFixed(1)}% buffer remaining. Consider adding collateral or repaying debt immediately.`;
  } else if (healthFactor > 1.0) {
    riskLevel = "CRITICAL";
    riskAnalysis = `CRITICAL: Health factor ${healthFactor.toFixed(4)} — liquidation imminent. Less than ${((healthFactor - 1) * 100).toFixed(2)}% buffer. Take action NOW.`;
  } else {
    riskLevel = "LIQUIDATABLE";
    riskAnalysis = `LIQUIDATABLE: Health factor ${healthFactor.toFixed(4)} is below 1.0. This position can be liquidated at any time.`;
  }

  return {
    address: account,
    totalCollateralUsd,
    totalDebtUsd,
    availableBorrowsUsd,
    ltvPercent,
    liquidationThresholdPercent,
    healthFactor,
    riskLevel,
    riskAnalysis,
  };
}

export interface AavePositionDetail {
  asset: string;
  symbol: string;
  supplied: number;
  suppliedUsd: number;
  borrowed: number;
  borrowedUsd: number;
  supplyApy: number;
  borrowApy: number;
  usedAsCollateral: boolean;
  priceUsd: number;
}

/**
 * Get detailed per-asset position data for an account
 */
export async function getDetailedPositions(account: Address): Promise<AavePositionDetail[]> {
  const client = getPublicClient(arbitrumOne);

  // Get reserve list
  const reserves = await client.readContract({
    address: AAVE_V3.pool,
    abi: AAVE_POOL_ABI,
    functionName: "getReservesList",
  });

  // Batch fetch prices
  const prices = await client.readContract({
    address: AAVE_V3.oracle,
    abi: AAVE_ORACLE_ABI,
    functionName: "getAssetsPrices",
    args: [reserves as Address[]],
  });

  // Fetch user reserve data + reserve data for each asset in parallel
  const results: AavePositionDetail[] = [];

  const batchSize = 5; // Avoid rate limiting
  for (let i = 0; i < (reserves as Address[]).length; i += batchSize) {
    const batch = (reserves as Address[]).slice(i, i + batchSize);
    const batchPrices = (prices as bigint[]).slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (asset, j) => {
        try {
          const [userData, reserveData, decimals, symbol] = await Promise.all([
            client.readContract({
              address: AAVE_V3.poolDataProvider,
              abi: AAVE_DATA_PROVIDER_ABI,
              functionName: "getUserReserveData",
              args: [asset, account],
            }),
            client.readContract({
              address: AAVE_V3.poolDataProvider,
              abi: AAVE_DATA_PROVIDER_ABI,
              functionName: "getReserveData",
              args: [asset],
            }),
            client.readContract({ address: asset, abi: ERC20_ABI, functionName: "decimals" }),
            client.readContract({ address: asset, abi: ERC20_ABI, functionName: "symbol" }),
          ]);

          const priceUsd = Number(batchPrices[j]) / 1e8;
          const supplied = Number(formatUnits(userData[0], decimals));
          const borrowed = Number(formatUnits(userData[2], decimals)); // variable debt
          const supplyApy = rayToApy(reserveData[5]);
          const borrowApy = rayToApy(reserveData[6]);

          if (supplied === 0 && borrowed === 0) return null;

          return {
            asset,
            symbol: symbol as string,
            supplied,
            suppliedUsd: supplied * priceUsd,
            borrowed,
            borrowedUsd: borrowed * priceUsd,
            supplyApy,
            borrowApy,
            usedAsCollateral: userData[8] as boolean,
            priceUsd,
          };
        } catch {
          return null;
        }
      })
    );

    results.push(...(batchResults.filter((r) => r !== null) as AavePositionDetail[]));
  }

  return results;
}

export interface AaveReserveInfo {
  asset: Address;
  symbol: string;
  supplyApy: number;
  borrowApy: number;
  totalSupplied: number;
  totalBorrowed: number;
  utilization: number;
  ltv: number;
  liquidationThreshold: number;
  priceUsd: number;
}

/**
 * Get all reserve APYs and utilization — for yield comparison
 */
export async function getReserveOverview(): Promise<AaveReserveInfo[]> {
  const client = getPublicClient(arbitrumOne);

  const reserves = await client.readContract({
    address: AAVE_V3.pool,
    abi: AAVE_POOL_ABI,
    functionName: "getReservesList",
  });

  const prices = await client.readContract({
    address: AAVE_V3.oracle,
    abi: AAVE_ORACLE_ABI,
    functionName: "getAssetsPrices",
    args: [reserves as Address[]],
  });

  const results: AaveReserveInfo[] = [];

  for (let i = 0; i < (reserves as Address[]).length; i++) {
    const asset = (reserves as Address[])[i];
    try {
      const [reserveData, configData, decimals, symbol] = await Promise.all([
        client.readContract({
          address: AAVE_V3.poolDataProvider,
          abi: AAVE_DATA_PROVIDER_ABI,
          functionName: "getReserveData",
          args: [asset],
        }),
        client.readContract({
          address: AAVE_V3.poolDataProvider,
          abi: AAVE_DATA_PROVIDER_ABI,
          functionName: "getReserveConfigurationData",
          args: [asset],
        }),
        client.readContract({ address: asset, abi: ERC20_ABI, functionName: "decimals" }),
        client.readContract({ address: asset, abi: ERC20_ABI, functionName: "symbol" }),
      ]);

      const priceUsd = Number((prices as bigint[])[i]) / 1e8;
      const totalSupplied = Number(formatUnits(reserveData[2], decimals));
      const totalBorrowed = Number(formatUnits(reserveData[4], decimals)); // variable debt
      const utilization = totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0;

      results.push({
        asset,
        symbol: symbol as string,
        supplyApy: rayToApy(reserveData[5]),
        borrowApy: rayToApy(reserveData[6]),
        totalSupplied,
        totalBorrowed,
        utilization: Math.round(utilization * 100) / 100,
        ltv: Number(configData[1]) / 100,
        liquidationThreshold: Number(configData[2]) / 100,
        priceUsd,
      });
    } catch {
      // Skip assets that fail
    }
  }

  return results;
}
