/**
 * Demo script — Showcases all agent capabilities using real Arbitrum data.
 *
 * Usage: npx tsx scripts/demo.ts
 * No PRIVATE_KEY needed (read-only operations).
 */

import dotenv from "dotenv";
dotenv.config();

import * as wallet from "../src/services/wallet";
import * as swap from "../src/services/swap";
import * as gmx from "../src/services/gmx";
import * as aave from "../src/services/aave";
import * as strategy from "../src/services/strategy";

// Well-known Arbitrum addresses for demo
const DEMO_WALLET = "0x489ee077994B6658eAfA855C308275EAd8097C4A" as const; // GMX treasury

function separator(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}\n`);
}

async function main() {
  console.log("Arbitrum DeFi Strategist Agent — Demo\n");
  console.log("All data is fetched LIVE from Arbitrum One.\n");

  // 1. Portfolio
  separator("1. WALLET PORTFOLIO");
  try {
    const portfolio = await wallet.getPortfolio(DEMO_WALLET);
    console.log(`Address: ${portfolio.address}`);
    console.log(`ETH Balance: ${portfolio.eth.formatted} ETH`);
    console.log(`Tokens with balance: ${portfolio.tokens.length}`);
    for (const t of portfolio.tokens.slice(0, 5)) {
      console.log(`  ${(t as any).symbol}: ${(t as any).formatted}`);
    }
  } catch (err: any) {
    console.log(`Portfolio fetch: ${err.message}`);
  }

  // 2. Multi-DEX Quote Comparison
  separator("2. MULTI-DEX SWAP QUOTE (1 WETH → USDC)");
  try {
    const quote = await swap.getBestQuote("WETH", "USDC", "1");
    console.log(`Best DEX: ${quote.bestDex}`);
    console.log(`Best output: ${quote.bestAmountOut} USDC`);
    console.log(`Price difference across DEXs: ${quote.priceDifferencePercent}%`);
    console.log(`Recommendation: ${quote.recommendation}`);
    console.log(`\nAll quotes:`);
    for (const q of quote.quotes) {
      console.log(`  ${q.dex}: ${q.amountOutFormatted} USDC (price: ${q.effectivePrice.toFixed(2)})`);
    }
  } catch (err: any) {
    console.log(`Quote fetch: ${err.message}`);
  }

  // 3. GMX V2 Markets
  separator("3. GMX V2 PERPETUAL MARKETS");
  try {
    const markets = await gmx.getMarkets();
    console.log(`Total markets: ${markets.length}\n`);
    for (const m of markets.slice(0, 5)) {
      console.log(`  ${m.label}`);
      console.log(`    Market Token: ${m.marketToken}`);
    }

    // Analyze first market
    if (markets.length > 0) {
      console.log(`\n--- Deep Analysis: ${markets[0].label} ---`);
      const analysis = await gmx.analyzeMarket(markets[0].marketToken);
      console.log(`  Long OI:  $${(analysis.longOpenInterestUsd / 1e6).toFixed(2)}M`);
      console.log(`  Short OI: $${(analysis.shortOpenInterestUsd / 1e6).toFixed(2)}M`);
      console.log(`  Imbalance: ${analysis.imbalanceRatio}% (${analysis.dominantSide})`);
      console.log(`  Signal: ${analysis.signal}`);
      console.log(`  Analysis: ${analysis.analysis}`);
    }
  } catch (err: any) {
    console.log(`GMX fetch: ${err.message}`);
  }

  // 4. Aave V3
  separator("4. AAVE V3 RESERVE OVERVIEW (Top 5 by Supply APY)");
  try {
    const reserves = await aave.getReserveOverview();
    const sorted = reserves.sort((a, b) => b.supplyApy - a.supplyApy).slice(0, 5);
    for (const r of sorted) {
      console.log(`  ${r.symbol.padEnd(8)} Supply APY: ${r.supplyApy.toFixed(2).padStart(6)}%  Borrow APY: ${r.borrowApy.toFixed(2).padStart(6)}%  Utilization: ${r.utilization.toFixed(1)}%`);
    }
  } catch (err: any) {
    console.log(`Aave fetch: ${err.message}`);
  }

  // 5. Yield Opportunities
  separator("5. CROSS-PROTOCOL YIELD OPPORTUNITIES");
  try {
    const yields = await strategy.findYieldOpportunities();
    console.log(yields.summary);
    console.log(`\nTop opportunities:`);
    for (const y of yields.opportunities.slice(0, 5)) {
      console.log(`  [${y.risk}] ${y.protocol} — ${y.asset}: ${y.apy.toFixed(2)}% APY`);
      console.log(`    ${y.description}`);
    }
  } catch (err: any) {
    console.log(`Yield scan: ${err.message}`);
  }

  // 6. Portfolio Risk
  separator("6. PORTFOLIO RISK ASSESSMENT");
  try {
    const risk = await strategy.analyzePortfolioRisk(DEMO_WALLET);
    console.log(`Overall Risk: ${risk.overallRisk}`);
    console.log(`Total Value: ~$${risk.totalValueUsd.toFixed(0)}`);
    if (risk.aaveExposure) {
      console.log(`Aave: $${risk.aaveExposure.totalCollateralUsd.toFixed(0)} collateral, HF: ${risk.aaveExposure.healthFactor.toFixed(2)}`);
    }
    if (risk.gmxExposure) {
      console.log(`GMX: ${risk.gmxExposure.positionCount} positions, $${risk.gmxExposure.totalSizeUsd.toFixed(0)} notional`);
    }
    console.log(`\nRecommendations:`);
    for (const r of risk.recommendations) {
      console.log(`  • ${r}`);
    }
  } catch (err: any) {
    console.log(`Risk analysis: ${err.message}`);
  }

  separator("DEMO COMPLETE");
  console.log("All data was fetched live from Arbitrum One mainnet.");
  console.log("To run the agent server: npm run dev");
}

main().catch(console.error);
