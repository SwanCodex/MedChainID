/**
 * WalletButton.tsx
 * Professional wallet connection button for dark mode
 */

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { X } from 'lucide-react';

export default function WalletButton() {
  const { connected, account, disconnect, wallets, connect } = useWallet();
  const [showModal, setShowModal] = useState(false);

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

  const handleWalletConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setShowModal(false);
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert(`Failed to connect to ${walletName}. Make sure the wallet extension is installed.`);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-accent-primary hover:bg-accent-primary/90 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
      >
        Connect Wallet
      </button>

      {/* Wallet Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Connect Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              {wallets?.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletConnect(wallet.name)}
                  className="w-full flex items-center gap-3 p-4 bg-dark-card border border-dark-border hover:border-text-muted rounded-lg transition-colors"
                >
                  {wallet.icon && (
                    <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded" />
                  )}
                  <div className="text-left">
                    <div className="text-text-primary font-medium">{wallet.name}</div>
                    {!wallet.readyState && (
                      <div className="text-xs text-text-muted">Not installed</div>
                    )}
                  </div>
                </button>
              ))}

              {(!wallets || wallets.length === 0) && (
                <div className="text-center text-text-secondary py-4">
                  No wallets available. Please install Petra or Martian wallet extension.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
