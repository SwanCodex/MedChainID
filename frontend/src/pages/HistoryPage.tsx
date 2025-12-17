/**
 * HistoryPage.tsx
 * Minimalist transaction history table
 * Clean, flat design with no zebra striping
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

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
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-lg font-medium mb-2">Wallet Not Connected</h3>
          <p className="text-text-secondary text-sm">
            Please connect your wallet to view transaction history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">Transaction History</h2>
        <p className="text-sm text-text-secondary">
          View all minted medical tokens from your wallet
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-sm text-text-secondary">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
            <p className="text-sm text-text-secondary">
              Issue your first medical token to see it here
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Token ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Record Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Hash
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
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {tx.recordType}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {tx.date}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium
                        ${
                          tx.status === 'Minted'
                            ? 'bg-green-950/30 text-green-400 border border-green-900/50'
                            : tx.status === 'Pending'
                            ? 'bg-yellow-950/30 text-yellow-400 border border-yellow-900/50'
                            : 'bg-red-950/30 text-red-400 border border-red-900/50'
                        }
                      `}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                    {tx.hash.substring(0, 12)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Card */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
            Total Minted
          </p>
          <p className="text-2xl font-medium">{transactions.length}</p>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
            This Month
          </p>
          <p className="text-2xl font-medium">{transactions.length}</p>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">
            Success Rate
          </p>
          <p className="text-2xl font-medium">100%</p>
        </div>
      </div>
    </div>
  );
}
