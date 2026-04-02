/**
 * Strategy Engine — Cross-protocol yield comparison and DeFi strategy recommendations.
 *
 * This is the core differentiator: it aggregates data across GMX, Aave, and DEXs
 * to produce actionable insights, not just raw data.
 */
import { type Address } from "viem";
import * as aave from "./aave";
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
export declare function findYieldOpportunities(): Promise<{
    opportunities: YieldOpportunity[];
    summary: string;
}>;
export interface PortfolioRiskReport {
    address: Address;
    totalValueUsd: number;
    walletAllocation: {
        eth: number;
        tokens: {
            symbol: string;
            valueUsd: number;
        }[];
    };
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
export declare function analyzePortfolioRisk(address: Address): Promise<PortfolioRiskReport>;
/**
 * Generate a holistic strategy recommendation
 */
export declare function getStrategyRecommendation(address: Address): Promise<{
    riskProfile: string;
    currentState: string;
    recommendations: string[];
    yieldOpportunities: YieldOpportunity[];
}>;
//# sourceMappingURL=strategy.d.ts.map