/**
 * Agent HTTP Endpoint — A2A-compatible agent server.
 *
 * Routes:
 *   GET  /health       — Health check
 *   GET  /agent.json   — Agent Card (A2A discovery)
 *   GET  /tools        — List all available tools
 *   POST /execute      — Execute a tool: { tool: string, params: object }
 */
export declare function createServer(): import("express-serve-static-core").Express;
//# sourceMappingURL=endpoint.d.ts.map