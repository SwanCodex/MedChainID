/**
 * PatientDashboard.tsx
 * Patient's view of their medical records
 * Fetches from both blockchain and backend database
 * Obsidian theme with SVG icons - no emojis
 */

import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// SVG Icons
const Icons = {
  lock: (
    <svg className="w-16 h-16 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  user: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  loader: (
    <svg className="w-10 h-10 animate-spin text-brand-primary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  inbox: (
    <svg className="w-16 h-16 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  link: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  hospital: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  cube: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  hash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  gamepad: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  chain: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

interface MedicalRecord {
  token_id: string;
  record_type: number[] | string;
  ipfs_cid: number[] | string;
  document_hash: string;
  timestamp: string;
  is_consumed: boolean;
  issuer: string;
  patient_address: string;
  source?: 'blockchain' | 'database';
}

export default function PatientDashboard() {
  const { account, connected } = useWallet();
  const [myRecords, setMyRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || 
    "0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004";
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!connected || !account) {
      setMyRecords([]);
      return;
    }
    fetchRecords();
  }, [connected, account]);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    
    const allRecords: MedicalRecord[] = [];

    // 1. Try fetching from blockchain
    try {
      const config = new AptosConfig({ network: Network.DEVNET });
      const aptos = new Aptos(config);

      const response = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::MedChainID::get_all_tokens`,
          functionArguments: [CONTRACT_ADDRESS],
        },
      });

      const allTokens = response[0] as any[];
      console.log('Fetched tokens from blockchain:', allTokens?.length || 0);

      if (allTokens && allTokens.length > 0) {
        const myTokens = allTokens.filter((t: any) => {
          const tokenAddress = (t.patient_address || '').toLowerCase().trim();
          const myAddress = (account?.address || '').toLowerCase().trim();
          return tokenAddress === myAddress && tokenAddress.length > 0;
        });
        
        myTokens.forEach((t: any) => {
          allRecords.push({ ...t, source: 'blockchain' });
        });
        console.log(`Found ${myTokens.length} blockchain records for ${account?.address}`);
      }
    } catch (e: any) {
      console.warn('Blockchain fetch failed:', e.message);
    }

    // 2. Also fetch from backend database
    try {
      const response = await fetch(`${API_URL}/documents`);
      if (response.ok) {
        const data = await response.json();
        const docs = data.documents || [];
        
        // Filter for current user's documents (if patient_address is stored)
        // For now, show all documents since patient address might not be stored
        console.log(`Found ${docs.length} database records`);
        
        // Add database records that aren't already in blockchain records
        docs.forEach((doc: any) => {
          const exists = allRecords.some(r => r.document_hash === doc.documentHash);
          if (!exists) {
            allRecords.push({
              token_id: doc.id?.toString() || 'N/A',
              record_type: doc.recordType || 'Unknown',
              ipfs_cid: doc.ipfsCid || '',
              document_hash: doc.documentHash || '',
              timestamp: doc.createdAt ? new Date(doc.createdAt).getTime().toString() : Date.now().toString(),
              is_consumed: false,
              issuer: doc.uploaderEmail || CONTRACT_ADDRESS,
              patient_address: account?.address || '',
              source: 'database',
            });
          }
        });
      }
    } catch (e: any) {
      console.warn('Database fetch failed:', e.message);
    }

    if (allRecords.length === 0 && error === '') {
      console.log('No records found from any source');
    }

    setMyRecords(allRecords);
    setLoading(false);
  };

  const generateShareLink = (record: MedicalRecord) => {
    const secretKey = import.meta.env.VITE_ENCRYPTION_KEY_PREVIEW || 
      '1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3';

    // Handle both string and byte array formats for IPFS CID
    const cidString = typeof record.ipfs_cid === 'string' 
      ? record.ipfs_cid 
      : new TextDecoder().decode(new Uint8Array(record.ipfs_cid));

    const encodedCid = encodeURIComponent(cidString);
    const url = `${window.location.origin}/verifier?cid=${encodedCid}#key=${secretKey}`;
    
    navigator.clipboard.writeText(url);
    alert('Secure verification link copied to clipboard!\n\nShare this with authorized verifiers.');
  };

  // Helper to convert bytes or string to displayable string
  const toDisplayString = (value: number[] | string): string => {
    if (typeof value === 'string') return value;
    try {
      return new TextDecoder().decode(new Uint8Array(value));
    } catch {
      return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      // Handle both seconds and milliseconds timestamps
      const ts = parseInt(timestamp);
      const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (!connected) {
    return (
      <div className="py-12">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center shadow-lg max-w-lg mx-auto">
          {Icons.lock}
          <h2 className="text-2xl font-bold mt-4 mb-4">Connect Your Wallet</h2>
          <p className="text-text-secondary">
            Please connect your Petra wallet to view your medical records
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="p-2 bg-dark-card border border-dark-border rounded-xl text-brand-primary">
              {Icons.user}
            </span>
            My Medical Records
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-card border border-dark-border rounded-full mt-3">
            <span className="w-2 h-2 bg-status-success rounded-full animate-pulse"></span>
            <span className="text-sm text-text-secondary font-mono">
              {account?.address.substring(0, 6)}...{account?.address.substring(account?.address.length - 4)}
            </span>
          </div>
        </div>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-card border border-dark-border hover:border-brand-primary/50 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              {Icons.refresh}
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4">
          <p className="text-status-error">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center flex flex-col items-center">
          {Icons.loader}
          <p className="text-text-secondary mt-4">Loading your medical records...</p>
        </div>
      ) : myRecords.length === 0 ? (
        /* Empty State */
        <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center flex flex-col items-center">
          {Icons.inbox}
          <h3 className="text-xl font-bold mt-4 mb-3">No Records Found</h3>
          <p className="text-text-secondary max-w-md mx-auto mb-4">
            You don't have any medical records yet. Issue a record first, or check that you're using the correct wallet address.
          </p>
          <p className="text-sm text-text-muted font-mono">
            Your Address: {account?.address.substring(0, 20)}...
          </p>
        </div>
      ) : (
        /* Records Grid */
        <div className="grid gap-4">
          {myRecords.map((record, index) => (
            <div 
              key={`${record.token_id}-${index}`} 
              className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-brand-primary/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0 w-full">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-dark-surface border border-dark-border rounded-xl flex items-center justify-center text-brand-primary">
                      {Icons.document}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">
                        {toDisplayString(record.record_type)}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-text-muted font-mono">
                          #{record.token_id}
                        </span>
                        {record.source && (
                          <span className={`text-xs px-2 py-0.5 rounded-lg ${
                            record.source === 'blockchain' 
                              ? 'bg-brand-primary/10 text-brand-primary' 
                              : 'bg-status-info/10 text-status-info'
                          }`}>
                            {record.source === 'blockchain' ? 'On-chain' : 'Database'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      !record.is_consumed 
                        ? 'bg-status-success/10 text-status-success border border-status-success/20' 
                        : 'bg-status-error/10 text-status-error border border-status-error/20'
                    }`}>
                      {!record.is_consumed ? 'Active' : 'Consumed'}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-dark-surface rounded-xl p-3 border border-dark-border/50">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        {Icons.hospital}
                        <span>Issuer</span>
                      </div>
                      <p className="font-mono text-xs text-text-secondary truncate">
                        {record.issuer.substring(0, 10)}...
                      </p>
                    </div>
                    <div className="bg-dark-surface rounded-xl p-3 border border-dark-border/50">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        {Icons.clock}
                        <span>Date</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {formatTimestamp(record.timestamp)}
                      </p>
                    </div>
                    <div className="bg-dark-surface rounded-xl p-3 border border-dark-border/50">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        {Icons.cube}
                        <span>IPFS CID</span>
                      </div>
                      <p className="font-mono text-xs text-text-secondary truncate">
                        {toDisplayString(record.ipfs_cid).substring(0, 15)}...
                      </p>
                    </div>
                    <div className="bg-dark-surface rounded-xl p-3 border border-dark-border/50">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        {Icons.hash}
                        <span>Hash</span>
                      </div>
                      <p className="font-mono text-xs text-text-secondary truncate">
                        {record.document_hash.substring(0, 15)}...
                      </p>
                    </div>
                  </div>

                  {record.is_consumed && (
                    <div className="mt-4 bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-2">
                      <p className="text-xs text-status-error">
                        This record has been consumed and cannot be reused
                      </p>
                    </div>
                  )}
                </div>

                {/* Share Button */}
                <button 
                  onClick={() => generateShareLink(record)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary hover:shadow-glow text-dark-crust rounded-xl text-sm font-medium transition-all w-full lg:w-auto justify-center"
                >
                  {Icons.link}
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 border border-brand-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          {Icons.info}
          <h3 className="text-lg font-semibold">About Secure Sharing</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-text-secondary">
          <div className="flex items-start gap-3">
            <span className="text-brand-primary">{Icons.shield}</span>
            <div>
              <strong className="text-text-primary text-xs">Secure Links</strong>
              <p className="text-xs mt-0.5">Embedded encryption keys</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-secondary">{Icons.eye}</span>
            <div>
              <strong className="text-text-primary text-xs">Privacy First</strong>
              <p className="text-xs mt-0.5">Keys never sent to servers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-accent">{Icons.gamepad}</span>
            <div>
              <strong className="text-text-primary text-xs">You Control</strong>
              <p className="text-xs mt-0.5">Only link holders can decrypt</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-brand-tertiary">{Icons.chain}</span>
            <div>
              <strong className="text-text-primary text-xs">Blockchain</strong>
              <p className="text-xs mt-0.5">Verified on Aptos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
