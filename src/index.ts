import dotenv from "dotenv";
dotenv.config();

import { createServer } from "./agent/endpoint";

const PORT = parseInt(process.env.PORT || "3000", 10);
const app = createServer();

app.listen(PORT, () => {
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
