"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicClient = getPublicClient;
exports.getWalletClient = getWalletClient;
exports.getAccount = getAccount;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("../config/chains");
function getPublicClient(chain = chains_1.arbitrumOne) {
    return (0, viem_1.createPublicClient)({
        chain: chain,
        transport: (0, viem_1.http)(),
    });
}
function getWalletClient(chain = chains_1.arbitrumOne) {
    const pk = process.env.PRIVATE_KEY;
    if (!pk)
        throw new Error("PRIVATE_KEY environment variable is required for write operations");
    const account = (0, accounts_1.privateKeyToAccount)(pk);
    return (0, viem_1.createWalletClient)({
        account,
        chain: chain,
        transport: (0, viem_1.http)(),
    });
}
function getAccount() {
    const pk = process.env.PRIVATE_KEY;
    if (!pk)
        throw new Error("PRIVATE_KEY environment variable is required");
    return (0, accounts_1.privateKeyToAccount)(pk);
}
//# sourceMappingURL=client.js.map