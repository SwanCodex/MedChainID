import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Link } from 'react-router-dom';
import WalletButton from '../components/WalletButton';

export default function Dashboard() {
  const { connected, account } = useWallet();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-brand-primary to-emerald-200 bg-clip-text text-transparent">
          Welcome to MedChainID
        </h1>
        <p className="text-text-secondary text-lg">
          Secure, verifiable medical records on the blockchain
        </p>
      </div>

      {/* Wallet Status Card */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              connected ? 'bg-green-950/30 border border-green-900/50' : 'bg-orange-950/30 border border-orange-900/50'
            }`}>
              <span className="text-2xl">{connected ? '🔗' : '⚠️'}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Wallet Status</h3>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  connected 
                    ? 'bg-green-950/30 text-green-400 border border-green-900/50' 
                    : 'bg-orange-950/30 text-orange-400 border border-orange-900/50'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></span>
                  {connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
          <WalletButton />
        </div>
        
        {connected && account && (
          <div className="mt-4 pt-4 border-t border-dark-border">
            <p className="text-xs text-text-muted mb-1">Connected Address</p>
            <p className="font-mono text-sm text-text-secondary bg-dark-surface px-3 py-2 rounded-lg border border-dark-border break-all">
              {account.address}
            </p>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '🔐', title: 'Privacy-First', desc: 'Encrypted data on IPFS', color: 'purple' },
          { icon: '⛓️', title: 'On-Chain Proof', desc: 'Hash-based verification', color: 'blue' },
          { icon: '🎫', title: 'One-Time-Use', desc: 'Prevents fraud', color: 'green' },
          { icon: '✅', title: 'Verifiable', desc: 'Anyone can verify', color: 'emerald' },
        ].map((feature, i) => (
          <div key={i} className={`bg-dark-card border border-dark-border rounded-xl p-5 hover:border-${feature.color}-500/30 transition-colors group`}>
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{feature.icon}</div>
            <h4 className="font-semibold mb-1">{feature.title}</h4>
            <p className="text-sm text-text-secondary">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          ⚡ Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">📝</span>
            <div>
              <div className="font-medium">Issue Record</div>
              <div className="text-xs text-text-muted">Create new token</div>
            </div>
          </Link>
          <Link
            to="/verifier"
            className="flex items-center gap-3 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🔍</span>
            <div>
              <div className="font-medium">Verify Token</div>
              <div className="text-xs text-text-muted">Check authenticity</div>
            </div>
          </Link>
          <Link
            to="/patient"
            className="flex items-center gap-3 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">👤</span>
            <div>
              <div className="font-medium">My Records</div>
              <div className="text-xs text-text-muted">View patient data</div>
            </div>
          </Link>
          <Link
            to="/documents"
            className="flex items-center gap-3 p-4 bg-dark-surface border border-dark-border rounded-xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
            <div>
              <div className="font-medium">Database</div>
              <div className="text-xs text-text-muted">View stored docs</div>
            </div>
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gradient-to-r from-brand-primary/10 to-blue-500/10 border border-brand-primary/20 rounded-2xl p-8">
        <h3 className="text-xl font-semibold mb-4">🏥 What is MedChainID?</h3>
        <p className="text-text-secondary leading-relaxed">
          MedChainID is a decentralized application for issuing and verifying tamper-resistant,
          one-time-use medical records on the Aptos blockchain. Healthcare providers can issue
          encrypted medical credentials that patients control and can selectively share
          with verifiers while maintaining complete privacy and security.
        </p>
      </div>
    </div>
  );
}
