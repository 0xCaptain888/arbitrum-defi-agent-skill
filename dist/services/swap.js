"use strict";
/**
 * Price & Swap Service — Multi-DEX price aggregation on Arbitrum.
 *
 * Compares quotes from Uniswap V3 and Camelot to find best execution.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniswapQuote = getUniswapQuote;
exports.getCamelotQuote = getCamelotQuote;
exports.getBestQuote = getBestQuote;
exports.executeSwap = executeSwap;
const viem_1 = require("viem");
const client_1 = require("../utils/client");
const chains_1 = require("../config/chains");
const contracts_1 = require("../config/contracts");
const tokens_1 = require("../config/tokens");
/**
 * Get a swap quote from Uniswap V3
 */
async function getUniswapQuote(tokenInAddr, tokenOutAddr, amountIn, fee = 3000) {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    try {
        const result = await client.simulateContract({
            address: contracts_1.UNISWAP_V3.quoterV2,
            abi: contracts_1.QUOTER_V2_ABI,
            functionName: "quoteExactInputSingle",
            args: [{
                    tokenIn: tokenInAddr,
                    tokenOut: tokenOutAddr,
                    amountIn,
                    fee,
                    sqrtPriceLimitX96: 0n,
                }],
        });
        const [amountOut, , , gasEstimate] = result.result;
        // Get decimals for formatting
        const outDecimals = await client.readContract({
            address: tokenOutAddr, abi: contracts_1.ERC20_ABI, functionName: "decimals",
        });
        const inDecimals = await client.readContract({
            address: tokenInAddr, abi: contracts_1.ERC20_ABI, functionName: "decimals",
        });
        const amountInNum = Number((0, viem_1.formatUnits)(amountIn, inDecimals));
        const amountOutNum = Number((0, viem_1.formatUnits)(amountOut, outDecimals));
        return {
            dex: "Uniswap V3",
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            amountIn: (0, viem_1.formatUnits)(amountIn, inDecimals),
            amountOut: amountOut.toString(),
            amountOutFormatted: (0, viem_1.formatUnits)(amountOut, outDecimals),
            effectivePrice: amountInNum > 0 ? amountOutNum / amountInNum : 0,
            gasEstimate: gasEstimate.toString(),
        };
    }
    catch {
        return null;
    }
}
/**
 * Get a swap quote from Camelot
 */
async function getCamelotQuote(tokenInAddr, tokenOutAddr, amountIn) {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    try {
        const result = await client.simulateContract({
            address: contracts_1.CAMELOT.quoterV2,
            abi: contracts_1.CAMELOT_QUOTER_ABI,
            functionName: "quoteExactInputSingle",
            args: [tokenInAddr, tokenOutAddr, amountIn, 0n],
        });
        const [amountOut] = result.result;
        const outDecimals = await client.readContract({
            address: tokenOutAddr, abi: contracts_1.ERC20_ABI, functionName: "decimals",
        });
        const inDecimals = await client.readContract({
            address: tokenInAddr, abi: contracts_1.ERC20_ABI, functionName: "decimals",
        });
        const amountInNum = Number((0, viem_1.formatUnits)(amountIn, inDecimals));
        const amountOutNum = Number((0, viem_1.formatUnits)(amountOut, outDecimals));
        return {
            dex: "Camelot",
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            amountIn: (0, viem_1.formatUnits)(amountIn, inDecimals),
            amountOut: amountOut.toString(),
            amountOutFormatted: (0, viem_1.formatUnits)(amountOut, outDecimals),
            effectivePrice: amountInNum > 0 ? amountOutNum / amountInNum : 0,
        };
    }
    catch {
        return null;
    }
}
/**
 * Aggregate quotes across DEXs and recommend best execution
 */
async function getBestQuote(tokenInSymbol, tokenOutSymbol, amountInHuman) {
    const tokenIn = (0, tokens_1.resolveToken)(tokenInSymbol);
    const tokenOut = (0, tokens_1.resolveToken)(tokenOutSymbol);
    if (!tokenIn)
        throw new Error(`Unknown token: ${tokenInSymbol}`);
    if (!tokenOut)
        throw new Error(`Unknown token: ${tokenOutSymbol}`);
    const amountIn = (0, viem_1.parseUnits)(amountInHuman, tokenIn.decimals);
    // Fetch quotes from both DEXs in parallel, try multiple fee tiers on Uniswap
    const [uni500, uni3000, uni10000, camelot] = await Promise.all([
        getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 500),
        getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 3000),
        getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 10000),
        getCamelotQuote(tokenIn.address, tokenOut.address, amountIn),
    ]);
    const quotes = [uni500, uni3000, uni10000, camelot].filter((q) => q !== null);
    if (quotes.length === 0) {
        throw new Error(`No quotes available for ${tokenInSymbol} -> ${tokenOutSymbol}`);
    }
    // Sort by best output (highest amountOut)
    quotes.sort((a, b) => Number(BigInt(b.amountOut) - BigInt(a.amountOut)));
    const best = quotes[0];
    const worst = quotes[quotes.length - 1];
    const bestOut = Number(best.amountOutFormatted);
    const worstOut = Number(worst.amountOutFormatted);
    const priceDiff = worstOut > 0 ? ((bestOut - worstOut) / worstOut) * 100 : 0;
    let recommendation;
    if (quotes.length === 1) {
        recommendation = `Only ${best.dex} has liquidity for this pair. Execute there.`;
    }
    else if (priceDiff < 0.1) {
        recommendation = `Quotes are nearly identical across DEXs (<0.1% difference). Use ${best.dex} for marginal advantage.`;
    }
    else if (priceDiff < 1) {
        recommendation = `${best.dex} offers ${priceDiff.toFixed(2)}% better execution. Recommended for this trade.`;
    }
    else {
        recommendation = `Significant price difference (${priceDiff.toFixed(2)}%). ${best.dex} is clearly the best venue. The spread may indicate thin liquidity on the worse venue.`;
    }
    return {
        tokenIn: { symbol: tokenIn.symbol, address: tokenIn.address },
        tokenOut: { symbol: tokenOut.symbol, address: tokenOut.address },
        amountIn: amountInHuman,
        quotes,
        bestDex: best.dex,
        bestAmountOut: best.amountOutFormatted,
        priceDifferencePercent: Math.round(priceDiff * 100) / 100,
        recommendation,
    };
}
/**
 * Execute a swap via Uniswap V3 SwapRouter02
 */
async function executeSwap(tokenInSymbol, tokenOutSymbol, amountInHuman, slippageBps = 50) {
    const tokenIn = (0, tokens_1.resolveToken)(tokenInSymbol);
    const tokenOut = (0, tokens_1.resolveToken)(tokenOutSymbol);
    if (!tokenIn)
        throw new Error(`Unknown token: ${tokenInSymbol}`);
    if (!tokenOut)
        throw new Error(`Unknown token: ${tokenOutSymbol}`);
    const amountIn = (0, viem_1.parseUnits)(amountInHuman, tokenIn.decimals);
    const account = (0, client_1.getAccount)();
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    const wallet = (0, client_1.getWalletClient)(chains_1.arbitrumOne);
    // Get quote first
    const quote = await getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 3000);
    if (!quote)
        throw new Error("Failed to get swap quote");
    const amountOutMin = BigInt(quote.amountOut) * BigInt(10000 - slippageBps) / 10000n;
    // Check & set allowance
    const allowance = await client.readContract({
        address: tokenIn.address,
        abi: contracts_1.ERC20_ABI,
        functionName: "allowance",
        args: [account.address, contracts_1.UNISWAP_V3.swapRouter02],
    });
    if (allowance < amountIn) {
        const approveTx = await wallet.writeContract({
            address: tokenIn.address,
            abi: contracts_1.ERC20_ABI,
            functionName: "approve",
            args: [contracts_1.UNISWAP_V3.swapRouter02, amountIn],
        });
        await client.waitForTransactionReceipt({ hash: approveTx });
    }
    // Execute swap
    const txHash = await wallet.writeContract({
        address: contracts_1.UNISWAP_V3.swapRouter02,
        abi: contracts_1.SWAP_ROUTER_ABI,
        functionName: "exactInputSingle",
        args: [{
                tokenIn: tokenIn.address,
                tokenOut: tokenOut.address,
                fee: 3000,
                recipient: account.address,
                amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0n,
            }],
    });
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    return {
        status: receipt.status === "success" ? "SUCCESS" : "FAILED",
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        quote: {
            amountIn: amountInHuman + " " + tokenIn.symbol,
            expectedOut: quote.amountOutFormatted + " " + tokenOut.symbol,
            minOut: (0, viem_1.formatUnits)(amountOutMin, tokenOut.decimals) + " " + tokenOut.symbol,
            slippageBps,
        },
    };
}
//# sourceMappingURL=swap.js.map