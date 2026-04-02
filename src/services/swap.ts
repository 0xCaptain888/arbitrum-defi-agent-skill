/**
 * Price & Swap Service — Multi-DEX price aggregation on Arbitrum.
 *
 * Compares quotes from Uniswap V3 and Camelot to find best execution.
 */

import { type Address, formatUnits, parseUnits } from "viem";
import { getPublicClient, getWalletClient, getAccount } from "../utils/client";
import { arbitrumOne } from "../config/chains";
import {
  UNISWAP_V3, CAMELOT,
  QUOTER_V2_ABI, CAMELOT_QUOTER_ABI,
  SWAP_ROUTER_ABI, ERC20_ABI,
} from "../config/contracts";
import { resolveToken, TOKENS } from "../config/tokens";

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
export async function getUniswapQuote(
  tokenInAddr: Address,
  tokenOutAddr: Address,
  amountIn: bigint,
  fee: number = 3000,
): Promise<SwapQuote | null> {
  const client = getPublicClient(arbitrumOne);
  try {
    const result = await client.simulateContract({
      address: UNISWAP_V3.quoterV2,
      abi: QUOTER_V2_ABI,
      functionName: "quoteExactInputSingle",
      args: [{
        tokenIn: tokenInAddr,
        tokenOut: tokenOutAddr,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0n,
      }],
    });

    const [amountOut, , , gasEstimate] = result.result as [bigint, bigint, number, bigint];

    // Get decimals for formatting
    const outDecimals = await client.readContract({
      address: tokenOutAddr, abi: ERC20_ABI, functionName: "decimals",
    });
    const inDecimals = await client.readContract({
      address: tokenInAddr, abi: ERC20_ABI, functionName: "decimals",
    });

    const amountInNum = Number(formatUnits(amountIn, inDecimals));
    const amountOutNum = Number(formatUnits(amountOut, outDecimals));

    return {
      dex: "Uniswap V3",
      tokenIn: tokenInAddr,
      tokenOut: tokenOutAddr,
      amountIn: formatUnits(amountIn, inDecimals),
      amountOut: amountOut.toString(),
      amountOutFormatted: formatUnits(amountOut, outDecimals),
      effectivePrice: amountInNum > 0 ? amountOutNum / amountInNum : 0,
      gasEstimate: gasEstimate.toString(),
    };
  } catch {
    return null;
  }
}

/**
 * Get a swap quote from Camelot
 */
export async function getCamelotQuote(
  tokenInAddr: Address,
  tokenOutAddr: Address,
  amountIn: bigint,
): Promise<SwapQuote | null> {
  const client = getPublicClient(arbitrumOne);
  try {
    const result = await client.simulateContract({
      address: CAMELOT.quoterV2,
      abi: CAMELOT_QUOTER_ABI,
      functionName: "quoteExactInputSingle",
      args: [tokenInAddr, tokenOutAddr, amountIn, 0n],
    });

    const [amountOut] = result.result as [bigint, number];

    const outDecimals = await client.readContract({
      address: tokenOutAddr, abi: ERC20_ABI, functionName: "decimals",
    });
    const inDecimals = await client.readContract({
      address: tokenInAddr, abi: ERC20_ABI, functionName: "decimals",
    });

    const amountInNum = Number(formatUnits(amountIn, inDecimals));
    const amountOutNum = Number(formatUnits(amountOut, outDecimals));

    return {
      dex: "Camelot",
      tokenIn: tokenInAddr,
      tokenOut: tokenOutAddr,
      amountIn: formatUnits(amountIn, inDecimals),
      amountOut: amountOut.toString(),
      amountOutFormatted: formatUnits(amountOut, outDecimals),
      effectivePrice: amountInNum > 0 ? amountOutNum / amountInNum : 0,
    };
  } catch {
    return null;
  }
}

export interface AggregatedQuote {
  tokenIn: { symbol: string; address: Address };
  tokenOut: { symbol: string; address: Address };
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
export async function getBestQuote(
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountInHuman: string,
): Promise<AggregatedQuote> {
  const tokenIn = resolveToken(tokenInSymbol);
  const tokenOut = resolveToken(tokenOutSymbol);
  if (!tokenIn) throw new Error(`Unknown token: ${tokenInSymbol}`);
  if (!tokenOut) throw new Error(`Unknown token: ${tokenOutSymbol}`);

  const amountIn = parseUnits(amountInHuman, tokenIn.decimals);

  // Fetch quotes from both DEXs in parallel, try multiple fee tiers on Uniswap
  const [uni500, uni3000, uni10000, camelot] = await Promise.all([
    getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 500),
    getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 3000),
    getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 10000),
    getCamelotQuote(tokenIn.address, tokenOut.address, amountIn),
  ]);

  const quotes = [uni500, uni3000, uni10000, camelot].filter(
    (q): q is SwapQuote => q !== null
  );

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

  let recommendation: string;
  if (quotes.length === 1) {
    recommendation = `Only ${best.dex} has liquidity for this pair. Execute there.`;
  } else if (priceDiff < 0.1) {
    recommendation = `Quotes are nearly identical across DEXs (<0.1% difference). Use ${best.dex} for marginal advantage.`;
  } else if (priceDiff < 1) {
    recommendation = `${best.dex} offers ${priceDiff.toFixed(2)}% better execution. Recommended for this trade.`;
  } else {
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
export async function executeSwap(
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountInHuman: string,
  slippageBps: number = 50, // 0.5% default
) {
  const tokenIn = resolveToken(tokenInSymbol);
  const tokenOut = resolveToken(tokenOutSymbol);
  if (!tokenIn) throw new Error(`Unknown token: ${tokenInSymbol}`);
  if (!tokenOut) throw new Error(`Unknown token: ${tokenOutSymbol}`);

  const amountIn = parseUnits(amountInHuman, tokenIn.decimals);
  const account = getAccount();
  const client = getPublicClient(arbitrumOne);
  const wallet = getWalletClient(arbitrumOne);

  // Get quote first
  const quote = await getUniswapQuote(tokenIn.address, tokenOut.address, amountIn, 3000);
  if (!quote) throw new Error("Failed to get swap quote");

  const amountOutMin = BigInt(quote.amountOut) * BigInt(10000 - slippageBps) / 10000n;

  // Check & set allowance
  const allowance = await client.readContract({
    address: tokenIn.address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, UNISWAP_V3.swapRouter02],
  });

  if ((allowance as bigint) < amountIn) {
    const approveTx = await wallet.writeContract({
      address: tokenIn.address,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [UNISWAP_V3.swapRouter02, amountIn],
    });
    await client.waitForTransactionReceipt({ hash: approveTx });
  }

  // Execute swap
  const txHash = await wallet.writeContract({
    address: UNISWAP_V3.swapRouter02,
    abi: SWAP_ROUTER_ABI,
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
      minOut: formatUnits(amountOutMin, tokenOut.decimals) + " " + tokenOut.symbol,
      slippageBps,
    },
  };
}
