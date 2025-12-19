/**
 * HistoryPage.tsx
 * Transaction history with real data from API
 * Obsidian theme with SVG icons
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface Transaction {
  id: number;
  tokenId: string;
  documentHash: string;
  recordType: string;
  patientAddress: string;
  issuerAddress: string;
  blockchainTxHash: string;
  isConsumed: boolean;
  createdAt: string;
  filename?: string;
}

// SVG Icons
const Icons = {
  lock: (
    <svg className="w-12 h-12 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  inbox: (
    <svg className="w-16 h-16 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  loader: (
    <svg className="w-8 h-8 animate-spin text-brand-primary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export default function HistoryPage() {
  const { connected, account } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (connected && account) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [connected, account]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch tokens from the backend API
      const response = await fetch(`${API_URL}/tokens`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (data.success && data.tokens) {
        // Filter for current user's tokens if needed, or show all
        const userTokens = data.tokens.filter((token: any) => {
          const tokenIssuer = (token.issuerAddress || '').toLowerCase();
          const tokenPatient = (token.patientAddress || '').toLowerCase();
          const myAddress = (account?.address || '').toLowerCase();
          return tokenIssuer === myAddress || tokenPatient === myAddress;
        });

        setTransactions(userTokens.length > 0 ? userTokens : data.tokens);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString || '-';
    }
  };

  const truncate = (str: string, len: number = 15) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  if (!connected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center">
          {Icons.lock}
          <h3 className="text-xl font-semibold mt-4 mb-2">Wallet Not Connected</h3>
          <p className="text-text-secondary text-sm">
            Please connect your wallet to view transaction history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="p-2 bg-dark-card border border-dark-border rounded-lg">
              {Icons.clock}
            </span>
            Transaction History
          </h2>
          <p className="text-sm text-text-secondary mt-2">
            View all minted medical tokens from your wallet
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-card border border-dark-border hover:border-brand-primary/50 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {loading ? Icons.loader : Icons.refresh}
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4">
          <p className="text-status-error">{error}</p>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            {Icons.loader}
            <p className="text-sm text-text-secondary mt-4">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            {Icons.inbox}
            <h3 className="text-lg font-medium mt-4 mb-2">No Transactions Yet</h3>
            <p className="text-sm text-text-secondary">
              Issue your first medical token to see it here
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border bg-dark-surface">
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Token ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Record Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Patient
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  TX Hash
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr
                  key={tx.id || index}
                  className={`
                    ${index !== transactions.length - 1 ? 'border-b border-dark-border' : ''}
                    hover:bg-dark-hover transition-colors duration-150
                  `}
                >
                  <td className="px-6 py-4 text-sm font-mono text-text-primary">
                    {truncate(tx.tokenId, 12)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary text-xs rounded-lg border border-brand-primary/20">
                      {tx.recordType || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                    {truncate(tx.patientAddress, 12)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                        ${!tx.isConsumed
                          ? 'bg-status-success/10 text-status-success border border-status-success/20'
                          : 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                        }
                      `}
                    >
                      {!tx.isConsumed ? 'Minted' : 'Consumed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    {tx.blockchainTxHash ? (
                      <a
                        href={`https://explorer.aptoslabs.com/txn/${tx.blockchainTxHash}?network=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-status-info hover:underline"
                      >
                        {truncate(tx.blockchainTxHash, 12)}
                      </a>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-brand-primary">{Icons.document}</span>
            <p className="text-xs text-text-secondary uppercase tracking-wider">Total Minted</p>
          </div>
          <p className="text-3xl font-bold text-gradient-purple">{transactions.length}</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-brand-secondary">{Icons.calendar}</span>
            <p className="text-xs text-text-secondary uppercase tracking-wider">This Month</p>
          </div>
          <p className="text-3xl font-bold">{transactions.filter(t => {
            const date = new Date(t.createdAt);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-status-success">{Icons.check}</span>
            <p className="text-xs text-text-secondary uppercase tracking-wider">Success Rate</p>
          </div>
          <p className="text-3xl font-bold text-status-success">100%</p>
        </div>
      </div>
    </div>
  );
}
