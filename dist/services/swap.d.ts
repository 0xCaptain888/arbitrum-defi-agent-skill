/**
 * Price & Swap Service — Multi-DEX price aggregation on Arbitrum.
 *
 * Compares quotes from Uniswap V3 and Camelot to find best execution.
 */
import { type Address } from "viem";
export interface SwapQuote {
    dex: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    amountOutFormatted: string;
    effectivePrice: number;
    gasEstimate?: string;
}
/**
 * Get a swap quote from Uniswap V3
 */
export declare function getUniswapQuote(tokenInAddr: Address, tokenOutAddr: Address, amountIn: bigint, fee?: number): Promise<SwapQuote | null>;
/**
 * Get a swap quote from Camelot
 */
export declare function getCamelotQuote(tokenInAddr: Address, tokenOutAddr: Address, amountIn: bigint): Promise<SwapQuote | null>;
export interface AggregatedQuote {
    tokenIn: {
        symbol: string;
        address: Address;
    };
    tokenOut: {
        symbol: string;
        address: Address;
    };
    amountIn: string;
    quotes: SwapQuote[];
    bestDex: string;
    bestAmountOut: string;
    priceDifferencePercent: number;
    recommendation: string;
}
/**
 * Aggregate quotes across DEXs and recommend best execution
 */
export declare function getBestQuote(tokenInSymbol: string, tokenOutSymbol: string, amountInHuman: string): Promise<AggregatedQuote>;
/**
 * Execute a swap via Uniswap V3 SwapRouter02
 */
export declare function executeSwap(tokenInSymbol: string, tokenOutSymbol: string, amountInHuman: string, slippageBps?: number): Promise<{
    status: string;
    txHash: any;
    blockNumber: any;
    gasUsed: any;
    quote: {
        amountIn: string;
        expectedOut: string;
        minOut: string;
        slippageBps: number;
    };
}>;
//# sourceMappingURL=swap.d.ts.map