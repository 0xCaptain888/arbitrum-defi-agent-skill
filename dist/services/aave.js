"use strict";
/**
 * Aave V3 Service — Lending protocol analytics on Arbitrum.
 *
 * Capabilities:
 * - Account health factor & liquidation risk assessment
 * - Per-asset supply/borrow positions
 * - Reserve-level APY data (supply APY, borrow APY, utilization)
 * - Cross-account risk scoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountHealth = getAccountHealth;
exports.getDetailedPositions = getDetailedPositions;
exports.getReserveOverview = getReserveOverview;
const viem_1 = require("viem");
const client_1 = require("../utils/client");
const chains_1 = require("../config/chains");
const contracts_1 = require("../config/contracts");
const RAY = 10n ** 27n; // Aave uses RAY (1e27) for rates
const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
function rayToPercent(ray) {
    return Number(ray * 10000n / RAY) / 100; // percentage with 2 decimal precision
}
function rayToApy(ray) {
    // Aave liquidityRate / variableBorrowRate are already annualised rates in RAY.
    // APY ≈ (1 + APR/n)^n − 1 where n = compounding periods.
    // For simplicity we compound per-second (Aave accrues every second).
    const apr = Number(ray) / 1e27; // annual rate as decimal
    // Compound per-second for true APY
    const apy = Math.pow(1 + apr / SECONDS_PER_YEAR, SECONDS_PER_YEAR) - 1;
    return Math.round(apy * 10000) / 100; // percentage with 2 decimals
}
/**
 * Get comprehensive account health data from Aave V3
 */
async function getAccountHealth(account) {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    const data = await client.readContract({
        address: contracts_1.AAVE_V3.pool,
        abi: contracts_1.AAVE_POOL_ABI,
        functionName: "getUserAccountData",
        args: [account],
    });
    // Aave returns values in base currency units (USD with 8 decimals)
    const totalCollateralUsd = Number((0, viem_1.formatUnits)(data[0], 8));
    const totalDebtUsd = Number((0, viem_1.formatUnits)(data[1], 8));
    const availableBorrowsUsd = Number((0, viem_1.formatUnits)(data[2], 8));
    const ltvPercent = Number(data[4]) / 100;
    const liquidationThresholdPercent = Number(data[3]) / 100;
    const healthFactor = Number((0, viem_1.formatUnits)(data[5], 18));
    let riskLevel;
    let riskAnalysis;
    if (totalDebtUsd === 0) {
        riskLevel = "SAFE";
        riskAnalysis = "No active borrows. Account is not at risk.";
    }
    else if (healthFactor > 2) {
        riskLevel = "SAFE";
        riskAnalysis = `Health factor ${healthFactor.toFixed(2)} is well above 1.0. Liquidation unlikely unless major market move.`;
    }
    else if (healthFactor > 1.5) {
        riskLevel = "MODERATE";
        riskAnalysis = `Health factor ${healthFactor.toFixed(2)}. Position is healthy but should be monitored. A ${((1 - 1 / healthFactor) * 100).toFixed(0)}% collateral drop would trigger liquidation.`;
    }
    else if (healthFactor > 1.1) {
        riskLevel = "HIGH";
        riskAnalysis = `Health factor ${healthFactor.toFixed(2)} is dangerously close to liquidation. Only ${((healthFactor - 1) * 100).toFixed(1)}% buffer remaining. Consider adding collateral or repaying debt immediately.`;
    }
    else if (healthFactor > 1.0) {
        riskLevel = "CRITICAL";
        riskAnalysis = `CRITICAL: Health factor ${healthFactor.toFixed(4)} — liquidation imminent. Less than ${((healthFactor - 1) * 100).toFixed(2)}% buffer. Take action NOW.`;
    }
    else {
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
/**
 * Get detailed per-asset position data for an account
 */
async function getDetailedPositions(account) {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    // Get reserve list
    const reserves = await client.readContract({
        address: contracts_1.AAVE_V3.pool,
        abi: contracts_1.AAVE_POOL_ABI,
        functionName: "getReservesList",
    });
    // Batch fetch prices
    const prices = await client.readContract({
        address: contracts_1.AAVE_V3.oracle,
        abi: contracts_1.AAVE_ORACLE_ABI,
        functionName: "getAssetsPrices",
        args: [reserves],
    });
    // Fetch user reserve data + reserve data for each asset in parallel
    const results = [];
    const batchSize = 5; // Avoid rate limiting
    for (let i = 0; i < reserves.length; i += batchSize) {
        const batch = reserves.slice(i, i + batchSize);
        const batchPrices = prices.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (asset, j) => {
            try {
                const [userData, reserveData, decimals, symbol] = await Promise.all([
                    client.readContract({
                        address: contracts_1.AAVE_V3.poolDataProvider,
                        abi: contracts_1.AAVE_DATA_PROVIDER_ABI,
                        functionName: "getUserReserveData",
                        args: [asset, account],
                    }),
                    client.readContract({
                        address: contracts_1.AAVE_V3.poolDataProvider,
                        abi: contracts_1.AAVE_DATA_PROVIDER_ABI,
                        functionName: "getReserveData",
                        args: [asset],
                    }),
                    client.readContract({ address: asset, abi: contracts_1.ERC20_ABI, functionName: "decimals" }),
                    client.readContract({ address: asset, abi: contracts_1.ERC20_ABI, functionName: "symbol" }),
                ]);
                const priceUsd = Number(batchPrices[j]) / 1e8;
                const supplied = Number((0, viem_1.formatUnits)(userData[0], decimals));
                const borrowed = Number((0, viem_1.formatUnits)(userData[2], decimals)); // variable debt
                const supplyApy = rayToApy(reserveData[5]);
                const borrowApy = rayToApy(reserveData[6]);
                if (supplied === 0 && borrowed === 0)
                    return null;
                return {
                    asset,
                    symbol: symbol,
                    supplied,
                    suppliedUsd: supplied * priceUsd,
                    borrowed,
                    borrowedUsd: borrowed * priceUsd,
                    supplyApy,
                    borrowApy,
                    usedAsCollateral: userData[8],
                    priceUsd,
                };
            }
            catch {
                return null;
            }
        }));
        results.push(...batchResults.filter((r) => r !== null));
    }
    return results;
}
/**
 * Get all reserve APYs and utilization — for yield comparison
 */
async function getReserveOverview() {
    const client = (0, client_1.getPublicClient)(chains_1.arbitrumOne);
    const reserves = await client.readContract({
        address: contracts_1.AAVE_V3.pool,
        abi: contracts_1.AAVE_POOL_ABI,
        functionName: "getReservesList",
    });
    const prices = await client.readContract({
        address: contracts_1.AAVE_V3.oracle,
        abi: contracts_1.AAVE_ORACLE_ABI,
        functionName: "getAssetsPrices",
        args: [reserves],
    });
    const results = [];
    for (let i = 0; i < reserves.length; i++) {
        const asset = reserves[i];
        try {
            const [reserveData, configData, decimals, symbol] = await Promise.all([
                client.readContract({
                    address: contracts_1.AAVE_V3.poolDataProvider,
                    abi: contracts_1.AAVE_DATA_PROVIDER_ABI,
                    functionName: "getReserveData",
                    args: [asset],
                }),
                client.readContract({
                    address: contracts_1.AAVE_V3.poolDataProvider,
                    abi: contracts_1.AAVE_DATA_PROVIDER_ABI,
                    functionName: "getReserveConfigurationData",
                    args: [asset],
                }),
                client.readContract({ address: asset, abi: contracts_1.ERC20_ABI, functionName: "decimals" }),
                client.readContract({ address: asset, abi: contracts_1.ERC20_ABI, functionName: "symbol" }),
            ]);
            const priceUsd = Number(prices[i]) / 1e8;
            const totalSupplied = Number((0, viem_1.formatUnits)(reserveData[2], decimals));
            const totalBorrowed = Number((0, viem_1.formatUnits)(reserveData[4], decimals)); // variable debt
            const utilization = totalSupplied > 0 ? (totalBorrowed / totalSupplied) * 100 : 0;
            results.push({
                asset,
                symbol: symbol,
                supplyApy: rayToApy(reserveData[5]),
                borrowApy: rayToApy(reserveData[6]),
                totalSupplied,
                totalBorrowed,
                utilization: Math.round(utilization * 100) / 100,
                ltv: Number(configData[1]) / 100,
                liquidationThreshold: Number(configData[2]) / 100,
                priceUsd,
            });
        }
        catch {
            // Skip assets that fail
        }
    }
    return results;
}
//# sourceMappingURL=aave.js.map