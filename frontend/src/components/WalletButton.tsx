/**
 * WalletButton.tsx
 * Minimalist wallet connection button for dark mode
 */

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';

export default function WalletButton() {
  const { connected, account, disconnect } = useWallet();

  if (connected && account) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-dark-card border border-dark-border rounded-md px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-mono text-text-primary">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary
            hover:border-text-muted rounded-md px-4 py-2 text-sm font-medium
            transition-colors duration-150"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-selector-dark">
      <WalletSelector />
    </div>
  );
}
