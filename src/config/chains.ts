import { defineChain } from "viem";
import { arbitrum, arbitrumSepolia } from "viem/chains";

export const arbitrumOne = {
  ...arbitrum,
  rpcUrls: {
    ...arbitrum.rpcUrls,
    default: {
      http: [process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc"],
    },
  },
};

export const arbSepolia = {
  ...arbitrumSepolia,
  rpcUrls: {
    ...arbitrumSepolia.rpcUrls,
    default: {
      http: [
        process.env.ARBITRUM_SEPOLIA_RPC_URL ||
          "https://sepolia-rollup.arbitrum.io/rpc",
      ],
    },
  },
};

export type SupportedChain = typeof arbitrumOne | typeof arbSepolia;
