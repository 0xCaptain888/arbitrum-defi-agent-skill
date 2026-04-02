"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const endpoint_1 = require("./agent/endpoint");
const PORT = parseInt(process.env.PORT || "3000", 10);
const app = (0, endpoint_1.createServer)();
app.listen(PORT, "0.0.0.0", () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║       Arbitrum DeFi Strategist Agent v1.0.0              ║
╠══════════════════════════════════════════════════════════╣
║  Protocols: GMX V2 · Aave V3 · Uniswap V3 · Camelot    ║
║  Chain:     Arbitrum One                                 ║
║  Registry:  ERC-8004 Identity                            ║
╠══════════════════════════════════════════════════════════╣
║  Endpoints:                                              ║
║    GET  /health      — Health check                      ║
║    GET  /agent.json  — Agent Card                        ║
║    GET  /tools       — List capabilities                 ║
║    POST /execute     — Run a tool                        ║
╠══════════════════════════════════════════════════════════╣
║  Server: http://localhost:${String(PORT).padEnd(5)}                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
//# sourceMappingURL=index.js.map