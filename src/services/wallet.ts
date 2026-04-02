import { formatEther, formatUnits, type Address } from "viem";
import { getPublicClient } from "../utils/client";
import { arbitrumOne, type SupportedChain } from "../config/chains";
import { ERC20_ABI } from "../config/contracts";
import { TOKENS } from "../config/tokens";

export async function getEthBalance(address: Address, chain: SupportedChain = arbitrumOne) {
  const client = getPublicClient(chain);
  const balance = await client.getBalance({ address });
  return { raw: balance.toString(), formatted: formatEther(balance), symbol: "ETH" };
}

export async function getTokenBalance(
  walletAddress: Address,
  tokenAddress: Address,
  chain: SupportedChain = arbitrumOne,
) {
  const client = getPublicClient(chain);
  const [balance, decimals, symbol, name] = await Promise.all([
    client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [walletAddress] }),
    client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "decimals" }),
    client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "symbol" }),
    client.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: "name" }),
  ]);
  return { raw: balance.toString(), formatted: formatUnits(balance, decimals), symbol, name, decimals, tokenAddress };
}

export async function getPortfolio(address: Address, chain: SupportedChain = arbitrumOne) {
  const ethBalance = await getEthBalance(address, chain);
  const tokenPromises = Object.values(TOKENS).map(async (token) => {
    try { return await getTokenBalance(address, token.address, chain); }
    catch { return null; }
  });
  const tokenResults = await Promise.all(tokenPromises);
  const tokens = tokenResults.filter((t) => t !== null && BigInt(t.raw) > 0n);
  return { address, eth: ethBalance, tokens };
}
