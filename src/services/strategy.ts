/**
 * Strategy Engine — Cross-protocol yield comparison and DeFi strategy recommendations.
 *
 * This is the core differentiator: it aggregates data across GMX, Aave, and DEXs
 * to produce actionable insights, not just raw data.
 */

import { type Address } from "viem";
import * as aave from "./aave";
import * as gmx from "./gmx";
import * as wallet from "./wallet";

export interface YieldOpportunity {
  protocol: string;
  type: "lending" | "liquidity" | "perps_funding";
  asset: string;
  apy: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  description: string;
}

/**
 * Scan for the best yield opportunities across Arbitrum protocols
 */
export async function findYieldOpportunities(): Promise<{
  opportunities: YieldOpportunity[];
  summary: string;
}> {
  const opportunities: YieldOpportunity[] = [];

  // 1. Aave V3 supply yields
  try {
    const reserves = await aave.getReserveOverview();
    for (const r of reserves) {
      if (r.supplyApy > 0.5) { // Only show meaningful yields
        opportunities.push({
          protocol: "Aave V3",
          type: "lending",
          asset: r.symbol,
          apy: r.supplyApy,
          risk: r.supplyApy > 10 ? "MEDIUM" : "LOW",
          description: `Supply ${r.symbol} on Aave V3. Utilization: ${r.utilization.toFixed(1)}%. LTV: ${r.ltv}%.`,
        });
      }
    }
  } catch (err) {
    // Aave data may fail; continue with other protocols
  }

  // 2. GMX V2 funding rate opportunities (earn funding by taking contrarian positions)
  try {
    const markets = await gmx.getMarkets();
    // Analyze top markets for funding opportunities
    const topMarkets = markets.slice(0, 5);
    for (const market of topMarkets) {
      try {
        const oi = await gmx.getOpenInterest(market.marketToken);
        if (Math.abs(oi.imbalanceRatio) > 15) {
          const favored = oi.dominantSide === "LONG" ? "SHORT" : "LONG";
          opportunities.push({
            protocol: "GMX V2",
            type: "perps_funding",
            asset: market.label,
            apy: Math.abs(oi.imbalanceRatio) * 0.5, // rough APY estimate from funding
            risk: "HIGH",
            description: `${favored} position earns funding. OI imbalance: ${oi.imbalanceRatio.toFixed(1)}% ${oi.dominantSide} skew. ${oi.signal}`,
          });
        }
      } catch {
        // Skip markets that fail
      }
    }
  } catch {
    // GMX data may fail
  }

  // Sort by APY descending
  opportunities.sort((a, b) => b.apy - a.apy);

  // Generate summary
  const topYield = opportunities[0];
  const lendingOpps = opportunities.filter((o) => o.type === "lending");
  const fundingOpps = opportunities.filter((o) => o.type === "perps_funding");

  let summary = `Found ${opportunities.length} yield opportunities across Arbitrum protocols. `;
  if (topYield) {
    summary += `Best yield: ${topYield.apy.toFixed(2)}% APY on ${topYield.asset} via ${topYield.protocol} (${topYield.risk} risk). `;
  }
  if (lendingOpps.length > 0) {
    const avgLending = lendingOpps.reduce((s, o) => s + o.apy, 0) / lendingOpps.length;
    summary += `Avg Aave lending APY: ${avgLending.toFixed(2)}%. `;
  }
  if (fundingOpps.length > 0) {
    summary += `${fundingOpps.length} GMX markets have significant OI imbalance for funding rate plays. `;
  }

  return { opportunities, summary };
}

export interface PortfolioRiskReport {
  address: Address;
  totalValueUsd: number;
  walletAllocation: { eth: number; tokens: { symbol: string; valueUsd: number }[] };
  aaveExposure: {
    totalCollateralUsd: number;
    totalDebtUsd: number;
    healthFactor: number;
    riskLevel: string;
    positions: aave.AavePositionDetail[];
  } | null;
  gmxExposure: {
    positionCount: number;
    totalSizeUsd: number;
    maxLeverage: number;
    positions: any[];
  } | null;
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendations: string[];
}

/**
 * Comprehensive cross-protocol risk assessment for a wallet
 */
export async function analyzePortfolioRisk(address: Address): Promise<PortfolioRiskReport> {
  // Fetch all data in parallel
  const [portfolioData, aaveHealth, aavePositions, gmxPositions] = await Promise.all([
    wallet.getPortfolio(address).catch(() => null),
    aave.getAccountHealth(address).catch(() => null),
    aave.getDetailedPositions(address).catch(() => []),
    gmx.getAccountPositions(address).catch(() => []),
  ]);

  const recommendations: string[] = [];

  // Calculate wallet value (rough — using known token values)
  let totalValueUsd = 0;
  const ethValue = portfolioData ? Number(portfolioData.eth.formatted) * 3000 : 0; // rough ETH price
  totalValueUsd += ethValue;

  const tokenAllocations = (portfolioData?.tokens || []).map((t: any) => {
    // Rough value estimate
    const valueUsd = Number(t.formatted) * (t.symbol === "USDC" || t.symbol === "USDT" || t.symbol === "DAI" ? 1 : 0);
    totalValueUsd += valueUsd;
    return { symbol: t.symbol, valueUsd };
  });

  // Aave exposure
  let aaveExposure: PortfolioRiskReport["aaveExposure"] = null;
  if (aaveHealth && aaveHealth.totalCollateralUsd > 0) {
    aaveExposure = {
      totalCollateralUsd: aaveHealth.totalCollateralUsd,
      totalDebtUsd: aaveHealth.totalDebtUsd,
      healthFactor: aaveHealth.healthFactor,
      riskLevel: aaveHealth.riskLevel,
      positions: aavePositions,
    };
    totalValueUsd += aaveHealth.totalCollateralUsd;

    if (aaveHealth.riskLevel === "HIGH" || aaveHealth.riskLevel === "CRITICAL") {
      recommendations.push(`⚠ Aave health factor is ${aaveHealth.healthFactor.toFixed(2)} (${aaveHealth.riskLevel}). ${aaveHealth.riskAnalysis}`);
    }

    // Check concentration risk
    const largestPosition = aavePositions.sort((a, b) => b.suppliedUsd - a.suppliedUsd)[0];
    if (largestPosition && aaveHealth.totalCollateralUsd > 0) {
      const concentration = largestPosition.suppliedUsd / aaveHealth.totalCollateralUsd;
      if (concentration > 0.8) {
        recommendations.push(`Aave collateral is ${(concentration * 100).toFixed(0)}% concentrated in ${largestPosition.symbol}. Consider diversifying to reduce single-asset liquidation risk.`);
      }
    }
  }

  // GMX exposure
  let gmxExposure: PortfolioRiskReport["gmxExposure"] = null;
  if (gmxPositions.length > 0) {
    const totalSizeUsd = gmxPositions.reduce((s: number, p: any) => s + p.sizeInUsd, 0);
    const maxLeverage = Math.max(...gmxPositions.map((p: any) => p.estimatedLeverage));

    gmxExposure = {
      positionCount: gmxPositions.length,
      totalSizeUsd,
      maxLeverage,
      positions: gmxPositions,
    };

    if (maxLeverage > 20) {
      recommendations.push(`GMX position with ${maxLeverage.toFixed(1)}x leverage detected. Extremely high liquidation risk.`);
    } else if (maxLeverage > 10) {
      recommendations.push(`GMX position with ${maxLeverage.toFixed(1)}x leverage. High liquidation risk in volatile markets.`);
    }

    if (totalSizeUsd > totalValueUsd * 3) {
      recommendations.push(`Total GMX notional ($${(totalSizeUsd / 1000).toFixed(0)}K) is ${(totalSizeUsd / totalValueUsd).toFixed(1)}x wallet value. Consider reducing exposure.`);
    }
  }

  // Overall risk
  let overallRisk: PortfolioRiskReport["overallRisk"] = "LOW";
  if (aaveHealth?.riskLevel === "CRITICAL" || aaveHealth?.riskLevel === "LIQUIDATABLE") {
    overallRisk = "CRITICAL";
  } else if (
    aaveHealth?.riskLevel === "HIGH" ||
    (gmxExposure && gmxExposure.maxLeverage > 15)
  ) {
    overallRisk = "HIGH";
  } else if (
    aaveHealth?.riskLevel === "MODERATE" ||
    (gmxExposure && gmxExposure.maxLeverage > 5)
  ) {
    overallRisk = "MEDIUM";
  }

  if (recommendations.length === 0) {
    recommendations.push("No significant risk factors detected. Portfolio appears well-managed.");
  }

  return {
    address,
    totalValueUsd,
    walletAllocation: { eth: ethValue, tokens: tokenAllocations },
    aaveExposure,
    gmxExposure,
    overallRisk,
    recommendations,
  };
}

/**
 * Generate a holistic strategy recommendation
 */
export async function getStrategyRecommendation(address: Address): Promise<{
  riskProfile: string;
  currentState: string;
  recommendations: string[];
  yieldOpportunities: YieldOpportunity[];
}> {
  const [risk, yields] = await Promise.all([
    analyzePortfolioRisk(address),
    findYieldOpportunities(),
  ]);

  const currentState = [
    `Wallet value: ~$${risk.totalValueUsd.toFixed(0)}`,
    risk.aaveExposure
      ? `Aave: $${risk.aaveExposure.totalCollateralUsd.toFixed(0)} collateral, $${risk.aaveExposure.totalDebtUsd.toFixed(0)} debt (HF: ${risk.aaveExposure.healthFactor.toFixed(2)})`
      : "No Aave positions",
    risk.gmxExposure
      ? `GMX: ${risk.gmxExposure.positionCount} positions, $${risk.gmxExposure.totalSizeUsd.toFixed(0)} notional`
      : "No GMX positions",
  ].join(". ");

  // Filter yield opportunities by risk tolerance
  const suitableYields = yields.opportunities.filter((y) => {
    if (risk.overallRisk === "CRITICAL" || risk.overallRisk === "HIGH") {
      return y.risk === "LOW"; // Only suggest safe yields
    }
    return true;
  });

  const recommendations = [...risk.recommendations];
  if (suitableYields.length > 0) {
    const best = suitableYields[0];
    recommendations.push(
      `Top yield opportunity: ${best.apy.toFixed(2)}% APY on ${best.asset} via ${best.protocol} (${best.risk} risk).`
    );
  }

  return {
    riskProfile: risk.overallRisk,
    currentState,
    recommendations,
    yieldOpportunities: suitableYields.slice(0, 5),
  };
}
