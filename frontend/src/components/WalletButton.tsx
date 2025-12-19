/**
 * WalletButton.tsx
 * Direct Petra wallet connection button (no modal needed)
 */

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState, useEffect } from 'react';

export default function WalletButton() {
  const { connected, account, disconnect, connect, wallets } = useWallet();
  const [isPetraAvailable, setIsPetraAvailable] = useState(false);

  useEffect(() => {
    // Check if Petra is available
    const checkPetra = () => {
      const hasWindow = typeof window !== 'undefined';
      const hasPetra = hasWindow && ((window as any).aptos || (window as any).petra);
      setIsPetraAvailable(!!hasPetra);
    };
    
    checkPetra();
    // Check again after a delay in case extension loads late
    const timer = setTimeout(checkPetra, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = async () => {
    console.log('🔍 Available wallets:', wallets);
    console.log('🔍 Wallet count:', wallets?.length);
    console.log('🔍 Wallet names:', wallets?.map(w => w.name));
    console.log('🔍 Petra in window:', !!(window as any).aptos || !!(window as any).petra);
    console.log('🔍 isPetraAvailable:', isPetraAvailable);
    
    // Petra uses the Aptos Wallet Standard now
    // The adapter should detect it automatically
    if (!wallets || wallets.length === 0) {
      // No wallets detected at all
      if (isPetraAvailable) {
        alert('⚠️ Petra is installed but not detected by the adapter.\n\nPlease:\n1. Refresh the page (Ctrl+R)\n2. Make sure Petra is on Devnet network\n3. Try connecting again\n\nIf issue persists, restart your browser.');
      } else {
        const shouldInstall = confirm(
          '❌ No Aptos wallets found!\n\nPlease install Petra Wallet:\n1. Visit https://petra.app/\n2. Install the extension\n3. Create wallet and switch to Devnet\n4. Refresh this page\n\nClick OK to open Petra website.'
        );
        if (shouldInstall) {
          window.open('https://petra.app/', '_blank');
        }
      }
      return;
    }

    // Try to find and connect to any available wallet (Petra should be first)
    const petraWallet = wallets.find(w => 
      w.name === 'Petra' || 
      w.name.toLowerCase().includes('petra') ||
      w.name === 'Petra Wallet'
    ) || wallets[0]; // Fallback to first available wallet

    try {
      console.log('✅ Connecting to:', petraWallet.name);
      await connect(petraWallet.name);
      console.log('✅ Connected successfully!');
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      alert(`Failed to connect: ${error.message || 'Unknown error'}\n\nPlease try:\n1. Refreshing the page\n2. Checking Petra is unlocked\n3. Making sure you're on Devnet network`);
    }
  };

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
    <div>
      <button
        onClick={handleConnect}
        className="bg-gradient-to-r from-brand-primary to-brand-secondary text-dark-crust hover:shadow-glow rounded-xl px-6 py-2.5 text-sm font-semibold
          transition-all duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Connect Petra Wallet</span>
      </button>
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-text-muted mt-2">
          Wallets: {wallets?.length || 0} | Petra: {isPetraAvailable ? '✅' : '❌'}
        </div>
      )}
    </div>
  );
}
