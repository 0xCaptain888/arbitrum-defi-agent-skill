#!/bin/bash
# Install the Arbitrum DeFi Strategist skill for Claude Code
set -e

echo "Installing Arbitrum DeFi Strategist Agent Skill..."

# Install dependencies
npm install

# Build TypeScript
npm run build

echo ""
echo "Installation complete."
echo ""
echo "To use as a Claude Code skill:"
echo "  claude skill add ./SKILL.md"
echo ""
echo "To run the agent server:"
echo "  cp .env.example .env"
echo "  # Edit .env with your PRIVATE_KEY"
echo "  npm run dev"
echo ""
echo "To run the demo (no private key needed):"
echo "  npx tsx scripts/demo.ts"
