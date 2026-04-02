/**
 * GMX V2 Service — Deep integration with Arbitrum's flagship perpetuals protocol.
 *
 * Capabilities:
 * - List all GMX V2 markets (perps + spot)
 * - Read account positions (size, collateral, PnL direction)
 * - Analyze open interest imbalance (long vs short)
 * - Compute funding rate signals
 */
import { type Address } from "viem";
export interface GmxMarket {
    marketToken: Address;
    indexToken: Address;
    longToken: Address;
    shortToken: Address;
    label: string;
}
/**
 * Fetch all GMX V2 markets on Arbitrum (cached)
 */
export declare function getMarkets(): Promise<GmxMarket[]>;
/**
 * Fetch open interest for a specific market (long + short sides)
 */
export declare function getOpenInterest(marketToken: Address): Promise<{
    market: string;
    marketToken: `0x${string}`;
    longOpenInterestUsd: number;
    shortOpenInterestUsd: number;
    totalOpenInterestUsd: number;
    imbalanceRatio: number;
    dominantSide: string;
    signal: string;
}>;
/**
 * Fetch borrowing rates for a market
 */
export declare function getBorrowingInfo(marketToken: Address): Promise<{
    market: string;
    longCumulativeBorrowingFactor: string;
    shortCumulativeBorrowingFactor: string;
}>;
/**
 * Fetch all positions for an account on GMX V2
 */
export declare function getAccountPositions(account: Address): Promise<{
    market: any;
    collateralToken: any;
    isLong: any;
    sizeInUsd: number;
    sizeInTokens: string;
    collateralAmount: string;
    estimatedLeverage: number;
    openedAtBlock: any;
    openedAtTime: string;
}[]>;
/**
 * Comprehensive market analysis: OI + borrowing + signal
 */
export declare function analyzeMarket(marketToken: Address): Promise<{
    borrowing: {
        market: string;
        longCumulativeBorrowingFactor: string;
        shortCumulativeBorrowingFactor: string;
    };
    analysis: string;
    market: string;
    marketToken: `0x${string}`;
    longOpenInterestUsd: number;
    shortOpenInterestUsd: number;
    totalOpenInterestUsd: number;
    imbalanceRatio: number;
    dominantSide: string;
    signal: string;
}>;
//# sourceMappingURL=gmx.d.ts.map