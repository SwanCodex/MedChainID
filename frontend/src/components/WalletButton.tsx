import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';

export default function WalletButton() {
  const { connected, account, disconnect } = useWallet();

  if (connected && account) {
    return (
      <div className="wallet-connected">
        <span className="wallet-address">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </span>
        <button onClick={disconnect} className="btn-disconnect">
          Disconnect
        </button>
      </div>
    );
  }

  return <WalletSelector />;
}
