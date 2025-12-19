/**
 * HistoryPage.tsx
 * Professional transaction history table
 * Enterprise-grade data-focused design
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Lock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  tokenId: string;
  recordType: string;
  date: string;
  status: 'Minted' | 'Pending' | 'Failed';
  hash: string;
}

// Mock data - Replace with actual blockchain queries
const mockTransactions: Transaction[] = [
  {
    id: '1',
    tokenId: '0x1a2b3c4d5e6f7890',
    recordType: 'Birth Certificate',
    date: '2025-12-17 10:30:00',
    status: 'Minted',
    hash: '0xabc123def456...',
  },
  {
    id: '2',
    tokenId: '0x2b3c4d5e6f789012',
    recordType: 'Insurance Claim',
    date: '2025-12-16 15:45:00',
    status: 'Minted',
    hash: '0xdef456abc789...',
  },
  {
    id: '3',
    tokenId: '0x3c4d5e6f78901234',
    recordType: 'Medicine Report',
    date: '2025-12-15 09:20:00',
    status: 'Minted',
    hash: '0x789012def456...',
  },
];

const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
  const config = {
    Minted: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    Pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
    Failed: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' },
  };

  const style = config[status];

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium border ${style.bg} ${style.border} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      {status}
    </span>
  );
};

export default function HistoryPage() {
  const { connected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 500);
  }, []);

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-card border border-dark-border rounded p-12 text-center">
          <div className="w-16 h-16 bg-dark-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-text-primary">Wallet Not Connected</h3>
          <p className="text-sm text-text-secondary">
            Please connect your wallet to view transaction history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-1 text-text-primary">Transaction History</h2>
        <p className="text-sm text-text-secondary">
          View all minted medical tokens from your wallet
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-dark-card border border-dark-border rounded overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 border-2 border-text-muted/30 border-t-accent-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-text-secondary">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-dark-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={32} className="text-text-muted" />
            </div>
            <h3 className="text-base font-semibold mb-2 text-text-primary">No Transactions Yet</h3>
            <p className="text-sm text-text-secondary">
              Issue your first medical token to see it here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border bg-dark-surface">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Token ID
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Record Type
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Transaction Hash
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr
                    key={tx.id}
                    className={`
                      ${index !== transactions.length - 1 ? 'border-b border-dark-border' : ''}
                      hover:bg-dark-hover transition-colors duration-150
                    `}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-text-primary">
                      {tx.tokenId.substring(0, 10)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary font-medium">
                      {tx.recordType}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {tx.date}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                      {tx.hash.substring(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Card */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Total Minted
            </p>
            <CheckCircle size={16} className="text-accent-primary" />
          </div>
          <p className="text-2xl font-semibold text-text-primary">{transactions.length}</p>
          <p className="text-xs text-text-secondary mt-1">All time</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              This Month
            </p>
            <TrendingUp size={16} className="text-accent-primary" />
          </div>
          <p className="text-2xl font-semibold text-text-primary">{transactions.length}</p>
          <p className="text-xs text-emerald-400 mt-1">+100% from last month</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
              Success Rate
            </p>
            <AlertCircle size={16} className="text-accent-primary" />
          </div>
          <p className="text-2xl font-semibold text-text-primary">100%</p>
          <p className="text-xs text-text-secondary mt-1">No failed transactions</p>
        </div>
      </div>
    </div>
  );
}
