import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumOne, arbSepolia, type SupportedChain } from "../config/chains";

export function getPublicClient(chain: SupportedChain = arbitrumOne): any {
  return createPublicClient({
    chain: chain as Chain,
    transport: http(),
  });
}

export function getWalletClient(chain: SupportedChain = arbitrumOne): any {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY environment variable is required for write operations");

  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({
    account,
    chain: chain as Chain,
    transport: http(),
  });
}

export function getAccount() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY environment variable is required");
  return privateKeyToAccount(pk as `0x${string}`);
}
