import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const wallets = [new PetraWallet()];

  console.log('🔧 WalletProvider initialized with:', wallets.length, 'wallet(s)');
  console.log('🔧 Network:', Network.DEVNET);

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={false}
      dappConfig={{
        network: Network.DEVNET,
        aptosConnectDappId: "medchainid-app",
      }}
      onError={(error) => {
        console.error("❌ Wallet Connection Error:");
        console.error("   Error object:", error);
        console.error("   Error message:", error?.message || 'Unknown error');
        console.error("   Error type:", typeof error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};