import { type Address } from "viem";
import { type SupportedChain } from "../config/chains";
export declare function getEthBalance(address: Address, chain?: SupportedChain): Promise<{
    raw: any;
    formatted: string;
    symbol: string;
}>;
export declare function getTokenBalance(walletAddress: Address, tokenAddress: Address, chain?: SupportedChain): Promise<{
    raw: any;
    formatted: string;
    symbol: any;
    name: any;
    decimals: any;
    tokenAddress: `0x${string}`;
}>;
export declare function getPortfolio(address: Address, chain?: SupportedChain): Promise<{
    address: `0x${string}`;
    eth: {
        raw: any;
        formatted: string;
        symbol: string;
    };
    tokens: ({
        raw: any;
        formatted: string;
        symbol: any;
        name: any;
        decimals: any;
        tokenAddress: `0x${string}`;
    } | null)[];
}>;
//# sourceMappingURL=wallet.d.ts.map