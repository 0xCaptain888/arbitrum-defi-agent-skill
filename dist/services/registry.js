"use strict";
/**
 * ERC-8004 Identity Registry Service — Agent registration on Arbitrum.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgent = registerAgent;
exports.setAgentURI = setAgentURI;
exports.getAgentInfo = getAgentInfo;
const client_1 = require("../utils/client");
const chains_1 = require("../config/chains");
const contracts_1 = require("../config/contracts");
/**
 * Register an agent on the ERC-8004 Identity Registry (Arbitrum Sepolia by default)
 */
async function registerAgent(agentURI, useMainnet = false) {
    const chain = useMainnet ? chains_1.arbitrumOne : chains_1.arbSepolia;
    const registryAddress = useMainnet
        ? contracts_1.IDENTITY_REGISTRY.arbitrumOne
        : contracts_1.IDENTITY_REGISTRY.arbitrumSepolia;
    const wallet = (0, client_1.getWalletClient)(chain);
    const client = (0, client_1.getPublicClient)(chain);
    const txHash = await wallet.writeContract({
        address: registryAddress,
        abi: contracts_1.IDENTITY_REGISTRY_ABI,
        functionName: "register",
        args: [agentURI],
    });
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    // Parse Transfer event to get agentId (tokenId)
    let agentId = null;
    for (const log of receipt.logs) {
        if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
            // Transfer(from, to, tokenId) — tokenId is topics[3]
            if (log.topics[3]) {
                agentId = BigInt(log.topics[3]).toString();
            }
        }
    }
    return {
        status: receipt.status === "success" ? "SUCCESS" : "FAILED",
        txHash,
        agentId,
        registryAddress,
        chain: useMainnet ? "Arbitrum One" : "Arbitrum Sepolia",
        blockNumber: receipt.blockNumber.toString(),
        explorerUrl: useMainnet
            ? `https://arbiscan.io/tx/${txHash}`
            : `https://sepolia.arbiscan.io/tx/${txHash}`,
    };
}
/**
 * Update agent URI
 */
async function setAgentURI(agentId, newURI, useMainnet = false) {
    const chain = useMainnet ? chains_1.arbitrumOne : chains_1.arbSepolia;
    const registryAddress = useMainnet
        ? contracts_1.IDENTITY_REGISTRY.arbitrumOne
        : contracts_1.IDENTITY_REGISTRY.arbitrumSepolia;
    const wallet = (0, client_1.getWalletClient)(chain);
    const client = (0, client_1.getPublicClient)(chain);
    const txHash = await wallet.writeContract({
        address: registryAddress,
        abi: contracts_1.IDENTITY_REGISTRY_ABI,
        functionName: "setAgentURI",
        args: [agentId, newURI],
    });
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    return {
        status: receipt.status === "success" ? "SUCCESS" : "FAILED",
        txHash,
        agentId: agentId.toString(),
        newURI,
        explorerUrl: useMainnet
            ? `https://arbiscan.io/tx/${txHash}`
            : `https://sepolia.arbiscan.io/tx/${txHash}`,
    };
}
/**
 * Get agent info from registry
 */
async function getAgentInfo(agentId, useMainnet = false) {
    const chain = useMainnet ? chains_1.arbitrumOne : chains_1.arbSepolia;
    const registryAddress = useMainnet
        ? contracts_1.IDENTITY_REGISTRY.arbitrumOne
        : contracts_1.IDENTITY_REGISTRY.arbitrumSepolia;
    const client = (0, client_1.getPublicClient)(chain);
    const [owner, uri] = await Promise.all([
        client.readContract({
            address: registryAddress,
            abi: contracts_1.IDENTITY_REGISTRY_ABI,
            functionName: "ownerOf",
            args: [agentId],
        }),
        client.readContract({
            address: registryAddress,
            abi: contracts_1.IDENTITY_REGISTRY_ABI,
            functionName: "tokenURI",
            args: [agentId],
        }),
    ]);
    return {
        agentId: agentId.toString(),
        owner: owner,
        uri: uri,
        chain: useMainnet ? "Arbitrum One" : "Arbitrum Sepolia",
    };
}
//# sourceMappingURL=registry.js.map