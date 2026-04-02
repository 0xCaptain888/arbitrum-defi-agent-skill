/**
 * ERC-8004 Identity Registry Service — Agent registration on Arbitrum.
 */
import { type Address } from "viem";
/**
 * Register an agent on the ERC-8004 Identity Registry (Arbitrum Sepolia by default)
 */
export declare function registerAgent(agentURI: string, useMainnet?: boolean): Promise<{
    status: string;
    txHash: any;
    agentId: string | null;
    registryAddress: `0x${string}`;
    chain: string;
    blockNumber: any;
    explorerUrl: string;
}>;
/**
 * Update agent URI
 */
export declare function setAgentURI(agentId: bigint, newURI: string, useMainnet?: boolean): Promise<{
    status: string;
    txHash: any;
    agentId: string;
    newURI: string;
    explorerUrl: string;
}>;
/**
 * Get agent info from registry
 */
export declare function getAgentInfo(agentId: bigint, useMainnet?: boolean): Promise<{
    agentId: string;
    owner: Address;
    uri: string;
    chain: string;
}>;
//# sourceMappingURL=registry.d.ts.map