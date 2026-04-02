/**
 * Agent Tool Definitions — The AI-facing interface.
 *
 * Each tool has a name, description, JSON Schema parameters, and a handler.
 * This follows a structure compatible with A2A protocol and OpenAI function calling.
 */
export interface ToolDef {
    name: string;
    description: string;
    category: string;
    parameters: Record<string, any>;
    handler: (params: any) => Promise<any>;
}
export declare const tools: ToolDef[];
export declare function getTool(name: string): ToolDef | undefined;
export declare function getToolsByCategory(category: string): ToolDef[];
//# sourceMappingURL=tools.d.ts.map