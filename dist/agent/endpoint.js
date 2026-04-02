"use strict";
/**
 * Agent HTTP Endpoint — A2A-compatible agent server.
 *
 * Routes:
 *   GET  /health       — Health check
 *   GET  /agent.json   — Agent Card (A2A discovery)
 *   GET  /tools        — List all available tools
 *   POST /execute      — Execute a tool: { tool: string, params: object }
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const tools_1 = require("./tools");
function createServer() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // ── Health Check ──
    app.get("/health", (_req, res) => {
        res.json({
            status: "ok",
            agent: "arbitrum-defi-strategist",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
        });
    });
    // ── Agent Card (A2A / ERC-8004 compatible) ──
    app.get("/agent.json", (_req, res) => {
        res.json({
            name: "Arbitrum DeFi Strategist",
            description: "AI agent for multi-protocol DeFi analysis and execution on Arbitrum. Deep integration with GMX V2 perpetuals, Aave V3 lending, Uniswap V3 and Camelot DEX. Provides cross-protocol yield optimization, portfolio risk assessment, and actionable strategy recommendations.",
            version: "1.0.0",
            capabilities: [
                "portfolio_analysis",
                "multi_dex_swap",
                "gmx_perpetuals",
                "aave_lending",
                "yield_optimization",
                "risk_assessment",
                "strategy_recommendation",
                "erc8004_registration",
            ],
            protocols: ["GMX V2", "Aave V3", "Uniswap V3", "Camelot"],
            chain: "Arbitrum One",
            interfaces: {
                tools: "/tools",
                execute: "/execute",
                health: "/health",
            },
            trust_models: ["erc8004_identity"],
        });
    });
    // ── List Tools ──
    app.get("/tools", (_req, res) => {
        const toolList = tools_1.tools.map((t) => ({
            name: t.name,
            description: t.description,
            category: t.category,
            parameters: t.parameters,
        }));
        res.json({ tools: toolList, count: toolList.length });
    });
    // ── Execute Tool ──
    app.post("/execute", async (req, res) => {
        const { tool: toolName, params } = req.body;
        if (!toolName) {
            return res.status(400).json({ error: "Missing 'tool' field" });
        }
        const tool = (0, tools_1.getTool)(toolName);
        if (!tool) {
            return res.status(404).json({
                error: `Unknown tool: ${toolName}`,
                available: tools_1.tools.map((t) => t.name),
            });
        }
        try {
            const startTime = Date.now();
            const result = await tool.handler(params || {});
            const durationMs = Date.now() - startTime;
            res.json({
                tool: toolName,
                result,
                meta: {
                    durationMs,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: err.message || "Tool execution failed",
                tool: toolName,
            });
        }
    });
    return app;
}
//# sourceMappingURL=endpoint.js.map