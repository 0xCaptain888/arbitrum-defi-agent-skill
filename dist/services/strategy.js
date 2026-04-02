"use strict";
/**
 * Strategy Engine — Cross-protocol yield comparison and DeFi strategy recommendations.
 *
 * This is the core differentiator: it aggregates data across GMX, Aave, and DEXs
 * to produce actionable insights, not just raw data.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findYieldOpportunities = findYieldOpportunities;
exports.analyzePortfolioRisk = analyzePortfolioRisk;
exports.getStrategyRecommendation = getStrategyRecommendation;
const aave = __importStar(require("./aave"));
const gmx = __importStar(require("./gmx"));
const wallet = __importStar(require("./wallet"));
/**
 * Scan for the best yield opportunities across Arbitrum protocols
 */
async function findYieldOpportunities() {
    const opportunities = [];
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
    }
    catch (err) {
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
            }
            catch {
                // Skip markets that fail
            }
        }
    }
    catch {
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
/**
 * Comprehensive cross-protocol risk assessment for a wallet
 */
async function analyzePortfolioRisk(address) {
    // Fetch all data in parallel
    const [portfolioData, aaveHealth, aavePositions, gmxPositions] = await Promise.all([
        wallet.getPortfolio(address).catch(() => null),
        aave.getAccountHealth(address).catch(() => null),
        aave.getDetailedPositions(address).catch(() => []),
        gmx.getAccountPositions(address).catch(() => []),
    ]);
    const recommendations = [];
    // Calculate wallet value (rough — using known token values)
    let totalValueUsd = 0;
    const ethValue = portfolioData ? Number(portfolioData.eth.formatted) * 3000 : 0; // rough ETH price
    totalValueUsd += ethValue;
    const tokenAllocations = (portfolioData?.tokens || []).map((t) => {
        // Rough value estimate
        const valueUsd = Number(t.formatted) * (t.symbol === "USDC" || t.symbol === "USDT" || t.symbol === "DAI" ? 1 : 0);
        totalValueUsd += valueUsd;
        return { symbol: t.symbol, valueUsd };
    });
    // Aave exposure
    let aaveExposure = null;
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
    let gmxExposure = null;
    if (gmxPositions.length > 0) {
        const totalSizeUsd = gmxPositions.reduce((s, p) => s + p.sizeInUsd, 0);
        const maxLeverage = Math.max(...gmxPositions.map((p) => p.estimatedLeverage));
        gmxExposure = {
            positionCount: gmxPositions.length,
            totalSizeUsd,
            maxLeverage,
            positions: gmxPositions,
        };
        if (maxLeverage > 20) {
            recommendations.push(`GMX position with ${maxLeverage.toFixed(1)}x leverage detected. Extremely high liquidation risk.`);
        }
        else if (maxLeverage > 10) {
            recommendations.push(`GMX position with ${maxLeverage.toFixed(1)}x leverage. High liquidation risk in volatile markets.`);
        }
        if (totalSizeUsd > totalValueUsd * 3) {
            recommendations.push(`Total GMX notional ($${(totalSizeUsd / 1000).toFixed(0)}K) is ${(totalSizeUsd / totalValueUsd).toFixed(1)}x wallet value. Consider reducing exposure.`);
        }
    }
    // Overall risk
    let overallRisk = "LOW";
    if (aaveHealth?.riskLevel === "CRITICAL" || aaveHealth?.riskLevel === "LIQUIDATABLE") {
        overallRisk = "CRITICAL";
    }
    else if (aaveHealth?.riskLevel === "HIGH" ||
        (gmxExposure && gmxExposure.maxLeverage > 15)) {
        overallRisk = "HIGH";
    }
    else if (aaveHealth?.riskLevel === "MODERATE" ||
        (gmxExposure && gmxExposure.maxLeverage > 5)) {
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
async function getStrategyRecommendation(address) {
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
        recommendations.push(`Top yield opportunity: ${best.apy.toFixed(2)}% APY on ${best.asset} via ${best.protocol} (${best.risk} risk).`);
    }
    return {
        riskProfile: risk.overallRisk,
        currentState,
        recommendations,
        yieldOpportunities: suitableYields.slice(0, 5),
    };
}
//# sourceMappingURL=strategy.js.map