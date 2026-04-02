/**
 * ERC-8004 Identity Registry Service — Agent registration on Arbitrum.
 */

import { type Address } from "viem";
import { getPublicClient, getWalletClient } from "../utils/client";
import { arbSepolia, arbitrumOne } from "../config/chains";
import { IDENTITY_REGISTRY, IDENTITY_REGISTRY_ABI } from "../config/contracts";

/**
 * Register an agent on the ERC-8004 Identity Registry (Arbitrum Sepolia by default)
 */
export async function registerAgent(
  agentURI: string,
  useMainnet: boolean = false,
) {
  const chain = useMainnet ? arbitrumOne : arbSepolia;
  const registryAddress = useMainnet
    ? IDENTITY_REGISTRY.arbitrumOne
    : IDENTITY_REGISTRY.arbitrumSepolia;

  const wallet = getWalletClient(chain);
  const client = getPublicClient(chain);

  const txHash = await wallet.writeContract({
    address: registryAddress,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "register",
    args: [agentURI],
  });

  const receipt = await client.waitForTransactionReceipt({ hash: txHash });

  // Parse Transfer event to get agentId (tokenId)
  let agentId: string | null = null;
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
export async function setAgentURI(
  agentId: bigint,
  newURI: string,
  useMainnet: boolean = false,
) {
  const chain = useMainnet ? arbitrumOne : arbSepolia;
  const registryAddress = useMainnet
    ? IDENTITY_REGISTRY.arbitrumOne
    : IDENTITY_REGISTRY.arbitrumSepolia;

  const wallet = getWalletClient(chain);
  const client = getPublicClient(chain);

  const txHash = await wallet.writeContract({
    address: registryAddress,
    abi: IDENTITY_REGISTRY_ABI,
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
export async function getAgentInfo(
  agentId: bigint,
  useMainnet: boolean = false,
) {
  const chain = useMainnet ? arbitrumOne : arbSepolia;
  const registryAddress = useMainnet
    ? IDENTITY_REGISTRY.arbitrumOne
    : IDENTITY_REGISTRY.arbitrumSepolia;

  const client = getPublicClient(chain);

  const [owner, uri] = await Promise.all([
    client.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "ownerOf",
      args: [agentId],
    }),
    client.readContract({
      address: registryAddress,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: "tokenURI",
      args: [agentId],
    }),
  ]);

  return {
    agentId: agentId.toString(),
    owner: owner as Address,
    uri: uri as string,
    chain: useMainnet ? "Arbitrum One" : "Arbitrum Sepolia",
  };
}
