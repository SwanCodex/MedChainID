import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { PropsWithChildren } from "react";

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const wallets = [
    new PetraWallet(),
    new MartianWallet()
  ];

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      onError={(error) => {
        console.error("Wallet Connection Error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};