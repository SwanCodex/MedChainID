/**
 * DocumentsPage.tsx
 * View all documents stored in the database
 * Dark mode design matching the application theme
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface Document {
  id: number;
  document_hash: string;
  ipfs_cid: string;
  record_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  patient_address: string;
  issuer_address: string;
  blockchain_tx_hash: string;
  encryption_key: string;
  created_at: string;
}

interface Token {
  id: number;
  token_id: string;
  document_hash: string;
  patient_address: string;
  issuer_address: string;
  blockchain_tx_hash: string;
  status: string;
  created_at: string;
}

interface Stats {
  totalDocuments: number;
  totalTokens: number;
  documentsToday: number;
  tokensToday: number;
}

export default function DocumentsPage() {
  const { connected } = useWallet();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'tokens' | 'stats'>('documents');
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
        setStats(statsData);
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
      return dateString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const truncate = (str: string, len: number = 20) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">📁 Database Explorer</h1>
        <p className="text-text-secondary">
          View all documents and tokens stored in the local database
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-400">{stats.totalDocuments}</div>
            <div className="text-sm text-text-secondary mt-1">Total Documents</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="text-3xl font-bold text-green-400">{stats.totalTokens}</div>
            <div className="text-sm text-text-secondary mt-1">Total Tokens</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-400">{stats.documentsToday}</div>
            <div className="text-sm text-text-secondary mt-1">Documents Today</div>
          </div>
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="text-3xl font-bold text-orange-400">{stats.tokensToday}</div>
            <div className="text-sm text-text-secondary mt-1">Tokens Today</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'documents'
              ? 'bg-white text-black'
              : 'bg-dark-card border border-dark-border text-text-secondary hover:text-white'
          }`}
        >
          📄 Documents ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tokens'
              ? 'bg-white text-black'
              : 'bg-dark-card border border-dark-border text-text-secondary hover:text-white'
          }`}
        >
          🎫 Tokens ({tokens.length})
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          className="ml-auto px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm font-medium text-text-secondary hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-text-secondary">Loading data...</p>
          </div>
        ) : activeTab === 'documents' ? (
          documents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium mb-2">No Documents Yet</h3>
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
                        <div className="font-medium">{truncate(doc.file_name, 25)}</div>
                        <div className="text-xs text-text-muted">{doc.mime_type}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-950/30 text-blue-400 text-xs rounded border border-blue-900/50">
                          {doc.record_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${doc.ipfs_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {truncate(doc.ipfs_cid, 15)}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                        {truncate(doc.document_hash, 15)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(doc.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          tokens.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="text-lg font-medium mb-2">No Tokens Yet</h3>
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
                      <td className="px-4 py-3 text-sm font-mono">{token.token_id}</td>
                      <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                        {truncate(token.patient_address, 15)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded border ${
                          token.status === 'minted' 
                            ? 'bg-green-950/30 text-green-400 border-green-900/50'
                            : token.status === 'consumed'
                            ? 'bg-orange-950/30 text-orange-400 border-orange-900/50'
                            : 'bg-gray-950/30 text-gray-400 border-gray-900/50'
                        }`}>
                          {token.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {token.blockchain_tx_hash ? (
                          <a
                            href={`https://explorer.aptoslabs.com/txn/${token.blockchain_tx_hash}?network=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {truncate(token.blockchain_tx_hash, 15)}
                          </a>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(token.created_at)}
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
      <div className="mt-6 bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="text-sm font-medium mb-3">📚 Database Information</h3>
        <ul className="space-y-2 text-xs text-text-secondary">
          <li>• <strong>Documents:</strong> Files uploaded and encrypted, stored on IPFS</li>
          <li>• <strong>Tokens:</strong> On-chain medical tokens minted on Aptos blockchain</li>
          <li>• <strong>Hash:</strong> SHA-256 fingerprint for document verification</li>
          <li>• <strong>IPFS CID:</strong> Content identifier for decentralized storage</li>
        </ul>
      </div>
    </div>
  );
}
