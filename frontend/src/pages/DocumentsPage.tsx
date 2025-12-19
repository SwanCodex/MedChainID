/**
 * DocumentsPage.tsx
 * View all documents stored in the database
 * Obsidian theme with SVG icons - Fixed field name mapping
 */

import { useState, useEffect } from 'react';

interface Document {
  id: number;
  documentHash: string;
  ipfsCid: string;
  recordType: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploaderEmail?: string;
  uploaderName?: string;
  riskVerified: boolean;
  riskConfidence?: number;
  riskMessage?: string;
  riskFlags: string[];
  createdAt: string;
  updatedAt?: string;
}

interface Token {
  id: number;
  tokenId: string;
  documentHash: string;
  patientAddress: string;
  issuerAddress: string;
  blockchainTxHash: string;
  isConsumed: boolean;
  createdAt: string;
  recordType?: string;
  filename?: string;
}

interface Stats {
  totalDocuments: number;
  totalTokens: number;
  documentsToday: number;
  tokensToday: number;
  verifiedDocuments: number;
  consumedTokens: number;
}

// SVG Icons
const Icons = {
  database: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  token: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  loader: (
    <svg className="w-8 h-8 animate-spin text-brand-primary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  inbox: (
    <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'tokens'>('documents');
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [docsRes, tokensRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/documents`),
        fetch(`${API_URL}/tokens`),
        fetch(`${API_URL}/stats`),
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }

      if (tokensRes.ok) {
        const tokensData = await tokensRes.json();
        setTokens(tokensData.tokens || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        // Stats are now spread directly in response
        setStats({
          totalDocuments: statsData.totalDocuments || 0,
          totalTokens: statsData.totalTokens || 0,
          documentsToday: statsData.documentsToday || 0,
          tokensToday: statsData.tokensToday || 0,
          verifiedDocuments: statsData.verifiedDocuments || 0,
          consumedTokens: statsData.consumedTokens || 0
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError('Failed to connect to backend. Make sure the server is running.');
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

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const truncate = (str: string, len: number = 20) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="p-2 bg-dark-card border border-dark-border rounded-lg text-brand-primary">
          {Icons.database}
        </span>
        <div>
          <h1 className="text-2xl font-bold">Database Explorer</h1>
          <p className="text-text-secondary text-sm">
            View all documents and tokens stored in the local database
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-status-info">{Icons.document}</span>
              <span className="text-xs text-text-secondary uppercase">Total Documents</span>
            </div>
            <div className="text-3xl font-bold text-status-info">{stats.totalDocuments}</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-status-success">{Icons.token}</span>
              <span className="text-xs text-text-secondary uppercase">Total Tokens</span>
            </div>
            <div className="text-3xl font-bold text-status-success">{stats.totalTokens}</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-brand-primary">{Icons.calendar}</span>
              <span className="text-xs text-text-secondary uppercase">Docs Today</span>
            </div>
            <div className="text-3xl font-bold text-brand-primary">{stats.documentsToday}</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-brand-accent">{Icons.shield}</span>
              <span className="text-xs text-text-secondary uppercase">Tokens Today</span>
            </div>
            <div className="text-3xl font-bold text-brand-accent">{stats.tokensToday}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'documents'
              ? 'bg-brand-primary text-dark-crust'
              : 'bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary hover:border-brand-primary/30'
          }`}
        >
          {Icons.document}
          Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'tokens'
              ? 'bg-brand-primary text-dark-crust'
              : 'bg-dark-card border border-dark-border text-text-secondary hover:text-text-primary hover:border-brand-primary/30'
          }`}
        >
          {Icons.token}
          Tokens ({tokens.length})
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-dark-card border border-dark-border rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:border-brand-primary/30 transition-all disabled:opacity-50"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          ) : Icons.refresh}
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4">
          <p className="text-status-error">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center">
            {Icons.loader}
            <p className="text-text-secondary mt-4">Loading data...</p>
          </div>
        ) : activeTab === 'documents' ? (
          documents.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              {Icons.inbox}
              <h3 className="text-lg font-medium mt-4 mb-2">No Documents Yet</h3>
              <p className="text-text-secondary text-sm">
                Upload your first document to see it here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-surface">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">File</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">IPFS CID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Hash</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr
                      key={doc.id}
                      className={`border-b border-dark-border hover:bg-dark-hover transition-colors ${
                        index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-surface/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-mono">{doc.id}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{truncate(doc.filename || 'Unknown', 25)}</div>
                        <div className="text-xs text-text-muted">{doc.mimeType || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-status-info/10 text-status-info text-xs rounded-lg border border-status-info/20">
                          {doc.recordType || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsCid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-status-info hover:underline"
                        >
                          {truncate(doc.ipfsCid, 15)}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                        {truncate(doc.documentHash, 15)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(doc.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          tokens.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              {Icons.inbox}
              <h3 className="text-lg font-medium mt-4 mb-2">No Tokens Yet</h3>
              <p className="text-text-secondary text-sm">
                Mint your first token to see it here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-surface">
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Token ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">TX Hash</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, index) => (
                    <tr
                      key={token.id}
                      className={`border-b border-dark-border hover:bg-dark-hover transition-colors ${
                        index % 2 === 0 ? 'bg-dark-card' : 'bg-dark-surface/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-mono">{token.id}</td>
                      <td className="px-4 py-3 text-sm font-mono">{truncate(token.tokenId, 15)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                        {truncate(token.patientAddress, 15)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-lg border ${
                          !token.isConsumed 
                            ? 'bg-status-success/10 text-status-success border-status-success/20'
                            : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                        }`}>
                          {!token.isConsumed ? 'Active' : 'Consumed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {token.blockchainTxHash ? (
                          <a
                            href={`https://explorer.aptoslabs.com/txn/${token.blockchainTxHash}?network=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-status-info hover:underline"
                          >
                            {truncate(token.blockchainTxHash, 15)}
                          </a>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(token.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Help Section */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-brand-primary">{Icons.info}</span>
          <h3 className="text-sm font-medium">Database Information</h3>
        </div>
        <ul className="space-y-2 text-xs text-text-secondary">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
            <strong className="text-text-primary">Documents:</strong> Files uploaded and encrypted, stored on IPFS
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>
            <strong className="text-text-primary">Tokens:</strong> On-chain medical tokens minted on Aptos blockchain
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
            <strong className="text-text-primary">Hash:</strong> SHA-256 fingerprint for document verification
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-tertiary"></span>
            <strong className="text-text-primary">IPFS CID:</strong> Content identifier for decentralized storage
          </li>
        </ul>
      </div>
    </div>
  );
}
