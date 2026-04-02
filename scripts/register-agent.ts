/**
 * Register agent on ERC-8004 Identity Registry (Arbitrum Sepolia)
 *
 * Usage: PRIVATE_KEY=0x... npx tsx scripts/register-agent.ts [agentURI]
 */

import dotenv from "dotenv";
dotenv.config();

import { registerAgent } from "../src/services/registry";

async function main() {
  const agentURI =
    process.argv[2] ||
    "https://raw.githubusercontent.com/0xCaptain888/arbitrum-defi-agent-skill/main/agent-registration.json";

  console.log("Registering agent on Arbitrum Sepolia ERC-8004 Identity Registry...");
  console.log(`Agent URI: ${agentURI}\n`);

  try {
    const result = await registerAgent(agentURI, false);

    console.log("Registration result:");
    console.log(`  Status:    ${result.status}`);
    console.log(`  Agent ID:  ${result.agentId}`);
    console.log(`  TX Hash:   ${result.txHash}`);
    console.log(`  Chain:     ${result.chain}`);
    console.log(`  Explorer:  ${result.explorerUrl}`);
    console.log(`\nSave this Agent ID — you will need it for the submission form.`);
  } catch (err: any) {
    console.error("Registration failed:", err.message);
    process.exit(1);
  }
}

main();
