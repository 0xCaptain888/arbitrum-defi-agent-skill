/**
 * Aave V3 Service — Lending protocol analytics on Arbitrum.
 *
 * Capabilities:
 * - Account health factor & liquidation risk assessment
 * - Per-asset supply/borrow positions
 * - Reserve-level APY data (supply APY, borrow APY, utilization)
 * - Cross-account risk scoring
 */
import { type Address } from "viem";
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
export declare function getAccountHealth(account: Address): Promise<AaveAccountSummary>;
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
export declare function getDetailedPositions(account: Address): Promise<AavePositionDetail[]>;
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
export declare function getReserveOverview(): Promise<AaveReserveInfo[]>;
//# sourceMappingURL=aave.d.ts.map