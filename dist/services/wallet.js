"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEthBalance = getEthBalance;
exports.getTokenBalance = getTokenBalance;
exports.getPortfolio = getPortfolio;
const viem_1 = require("viem");
const client_1 = require("../utils/client");
const chains_1 = require("../config/chains");
const contracts_1 = require("../config/contracts");
const tokens_1 = require("../config/tokens");
async function getEthBalance(address, chain = chains_1.arbitrumOne) {
    const client = (0, client_1.getPublicClient)(chain);
    const balance = await client.getBalance({ address });
    return { raw: balance.toString(), formatted: (0, viem_1.formatEther)(balance), symbol: "ETH" };
}
async function getTokenBalance(walletAddress, tokenAddress, chain = chains_1.arbitrumOne) {
    const client = (0, client_1.getPublicClient)(chain);
    const [balance, decimals, symbol, name] = await Promise.all([
        client.readContract({ address: tokenAddress, abi: contracts_1.ERC20_ABI, functionName: "balanceOf", args: [walletAddress] }),
        client.readContract({ address: tokenAddress, abi: contracts_1.ERC20_ABI, functionName: "decimals" }),
        client.readContract({ address: tokenAddress, abi: contracts_1.ERC20_ABI, functionName: "symbol" }),
        client.readContract({ address: tokenAddress, abi: contracts_1.ERC20_ABI, functionName: "name" }),
    ]);
    return { raw: balance.toString(), formatted: (0, viem_1.formatUnits)(balance, decimals), symbol, name, decimals, tokenAddress };
}
async function getPortfolio(address, chain = chains_1.arbitrumOne) {
    const ethBalance = await getEthBalance(address, chain);
    const tokenPromises = Object.values(tokens_1.TOKENS).map(async (token) => {
        try {
            return await getTokenBalance(address, token.address, chain);
        }
        catch {
            return null;
        }
    });
    const tokenResults = await Promise.all(tokenPromises);
    const tokens = tokenResults.filter((t) => t !== null && BigInt(t.raw) > 0n);
    return { address, eth: ethBalance, tokens };
}
//# sourceMappingURL=wallet.js.map