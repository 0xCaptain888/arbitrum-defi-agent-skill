"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arbSepolia = exports.arbitrumOne = void 0;
const chains_1 = require("viem/chains");
exports.arbitrumOne = {
    ...chains_1.arbitrum,
    rpcUrls: {
        ...chains_1.arbitrum.rpcUrls,
        default: {
            http: [process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc"],
        },
    },
};
exports.arbSepolia = {
    ...chains_1.arbitrumSepolia,
    rpcUrls: {
        ...chains_1.arbitrumSepolia.rpcUrls,
        default: {
            http: [
                process.env.ARBITRUM_SEPOLIA_RPC_URL ||
                    "https://sepolia-rollup.arbitrum.io/rpc",
            ],
        },
    },
};
//# sourceMappingURL=chains.js.map