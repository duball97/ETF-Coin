import { Connection } from "@solana/web3.js";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import type { AppConfig } from "./config.js";

let connection: Connection | null = null;
let onlineSdk: OnlinePumpSdk | null = null;

export function getConnection(config: AppConfig): Connection {
  if (!connection) {
    connection = new Connection(config.rpcUrl, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60_000,
    });
  }
  return connection;
}

export function getOnlineSdk(config: AppConfig): OnlinePumpSdk {
  if (!onlineSdk) {
    onlineSdk = new OnlinePumpSdk(getConnection(config));
  }
  return onlineSdk;
}
