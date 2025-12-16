import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletButton from '../components/WalletButton';

export default function Dashboard() {
  const { connected, account } = useWallet();

  return (
    <div className="page-container">
      <h2>🏠 Dashboard</h2>
      
      <div className="card">
        <h3>Wallet Connection</h3>
        <WalletButton />
        
        {connected && account && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Status:</strong> <span className="status-badge status-active">Connected</span></p>
            <p><strong>Address:</strong> {account.address}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>What is MedChainID?</h3>
        <p>
          MedChainID is a decentralized application for issuing and verifying tamper-resistant,
          one-time-use medical records on the Aptos blockchain.
        </p>
        <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
          <li>🔐 Privacy-First: Encrypted data stored on IPFS</li>
          <li>⛓️ On-Chain Proof: Only hashes stored on blockchain</li>
          <li>🎫 One-Time-Use: Prevents double-claim fraud</li>
          <li>✅ Verifiable: Anyone can verify authenticity</li>
        </ul>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn-primary" onClick={() => window.location.href = '/issuer'}>
            📝 Issue New Token
          </button>
          <button className="btn-primary" onClick={() => window.location.href = '/verifier'}>
            🔍 Verify Token
          </button>
        </div>
      </div>
    </div>
  );
}
