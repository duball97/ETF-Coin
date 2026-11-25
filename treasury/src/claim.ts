import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { AppConfig } from "./config.js";
import { getConnection, getOnlineSdk } from "./connection.js";
import { sendInstructions } from "./tx.js";

export type ClaimResult = {
  claimableLamports: number;
  claimed: boolean;
  signature: string | null;
  balanceBefore: number;
  balanceAfter: number;
};

export async function claimCreatorFees(config: AppConfig): Promise<ClaimResult> {
  const connection = getConnection(config);
  const sdk = getOnlineSdk(config);
  const creator = config.creator.publicKey;

  const claimableBn = await sdk.getCreatorVaultBalanceBothPrograms(creator);
  const claimableLamports = claimableBn.toNumber();
  const balanceBefore = await connection.getBalance(creator);

  console.log(
    `[claim] vault ${claimableLamports / LAMPORTS_PER_SOL} SOL | wallet ${balanceBefore / LAMPORTS_PER_SOL} SOL`,
  );

  if (claimableLamports < config.minClaimLamports) {
    console.log(
      `[claim] below MIN_CLAIM_LAMPORTS (${config.minClaimLamports}); skipping`,
    );
    return {
      claimableLamports,
      claimed: false,
      signature: null,
      balanceBefore,
      balanceAfter: balanceBefore,
    };
  }

  if (balanceBefore < config.gasReserveLamports) {
    throw new Error(
      `Wallet below GAS_RESERVE_LAMPORTS (${config.gasReserveLamports}); refusing to claim`,
    );
  }

  const ixs = await sdk.collectCoinCreatorFeeInstructions(creator, creator);
  const signature = await sendInstructions({
    connection,
    payer: config.creator,
    instructions: ixs,
    dryRun: config.dryRun,
    label: "claim",
  });

  const balanceAfter = config.dryRun
    ? balanceBefore
    : await connection.getBalance(creator);

  return {
    claimableLamports,
    claimed: true,
    signature,
    balanceBefore,
    balanceAfter,
  };
}
