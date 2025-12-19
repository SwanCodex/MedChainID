/**
 * PatientDashboard.tsx
 * Patient's view of their medical records
 * Filters global token list to show only records belonging to connected wallet
 */

import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

interface MedicalRecord {
  token_id: string;
  record_type: number[];
  ipfs_cid: number[];
  document_hash: string;
  timestamp: string;
  is_consumed: boolean;
  issuer: string;
  patient_address: string;
}

export default function PatientDashboard() {
  const { account, connected } = useWallet();
  const [myRecords, setMyRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // HACKATHON SHORTCUT: 
  // In a real app, the patient usually doesn't know the Issuer's address. 
  // For the demo, we hardcode the "Hospital Address" or fetch from a known list.
  const HOSPITAL_ADDRESS = import.meta.env.VITE_ISSUER_ADDRESS || 
    import.meta.env.VITE_CONTRACT_ADDRESS || 
    "0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004";

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

    const config = new AptosConfig({ network: Network.DEVNET });
    const aptos = new Aptos(config);

    try {
      // 1. Fetch ALL tokens from the Hospital's registry
      const response = await aptos.view({
        payload: {
          function: `${import.meta.env.VITE_CONTRACT_ADDRESS}::MedChainID::get_all_tokens`,
          functionArguments: [HOSPITAL_ADDRESS],
        },
      });

      const allTokens = response[0] as any[];
      console.log('📋 Fetched all tokens:', allTokens.length);

      // 2. FILTER: Only keep tokens where patient_address == Me
      // Use case-insensitive comparison for Aptos addresses
      const myTokens = allTokens.filter(
        (t: any) => {
          const tokenAddress = (t.patient_address || '').toLowerCase().trim();
          const myAddress = (account?.address || '').toLowerCase().trim();
          return tokenAddress === myAddress && tokenAddress.length > 0;
        }
      );

      console.log(`✅ Found ${myTokens.length} records for ${account?.address}`);
      setMyRecords(myTokens);

    } catch (e: any) {
      console.error('❌ Error fetching records:', e);
      setError(e.message || 'Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = (record: MedicalRecord) => {
    // 1. The Secret Key (For Hackathon: Global .env key)
    // In production, this would be decrypted by the User's Wallet or retrieved from secure storage
    const secretKey = import.meta.env.VITE_ENCRYPTION_KEY_PREVIEW || 
      '1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3'; // Fallback to backend key for demo

    // 2. Decode IPFS CID from bytes
    const cidString = new TextDecoder().decode(new Uint8Array(record.ipfs_cid));

    // 3. Construct URL with Fragment (#) so key is NOT sent to server
    // URL encode the CID to handle special characters safely
    const encodedCid = encodeURIComponent(cidString);
    const url = `${window.location.origin}/verifier?cid=${encodedCid}#key=${secretKey}`;
    
    navigator.clipboard.writeText(url);
    alert('🔗 Secure verification link copied to clipboard!\n\nYou can now share this link with authorized verifiers (doctors, insurance, etc.)');
  };

  const bytesToString = (bytes: number[]) => {
    try {
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-dark-bg text-text-primary">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center shadow-lg">
            <div className="text-7xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary text-lg max-w-md mx-auto">
              Please connect your Petra wallet to view your medical records
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary">
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
        <div className="absolute top-[40%] right-[5%] w-[35%] h-[35%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <a 
            href="/issuer" 
            className="text-text-secondary hover:text-brand-primary transition-colors text-sm"
          >
            ← Hospital Issuer
          </a>
          <a 
            href="/verifier" 
            className="text-text-secondary hover:text-brand-primary transition-colors text-sm"
          >
            Verifier →
          </a>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <span className="text-4xl">👤</span> My Medical Vault
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-card border border-dark-border rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                Loading...
              </>
            ) : (
              <>🔄 Refresh</>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-6">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading your medical records...</p>
          </div>
        ) : myRecords.length === 0 ? (
          /* Empty State */
          <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
            <div className="text-7xl mb-6">📭</div>
            <h3 className="text-2xl font-bold mb-3">No Records Found</h3>
            <p className="text-text-secondary max-w-md mx-auto mb-4">
              You don't have any medical records yet, or they were issued to a different address.
            </p>
            <p className="text-sm text-text-muted font-mono">
              Hospital: {HOSPITAL_ADDRESS.substring(0, 10)}...
            </p>
          </div>
        ) : (
          /* Records Grid */
          <div className="grid gap-4">
            {myRecords.map((record) => (
              <div 
                key={record.token_id} 
                className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-brand-primary/30 transition-all shadow-lg"
              >
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 bg-dark-surface border border-dark-border rounded-xl flex items-center justify-center">
                        <span className="text-3xl">📄</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {bytesToString(record.record_type)}
                        </h3>
                        <p className="text-sm text-text-muted font-mono">
                          Token #{record.token_id}
                        </p>
                      </div>
                      <span className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium ${
                        !record.is_consumed 
                          ? 'bg-green-950/30 text-green-400 border border-green-900/50' 
                          : 'bg-red-950/30 text-red-400 border border-red-900/50'
                      }`}>
                        {!record.is_consumed ? '✅ Active' : '❌ Consumed'}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      <div className="bg-dark-surface rounded-lg p-3 border border-dark-border/50">
                        <p className="text-xs text-text-muted mb-1">🏥 Issued By</p>
                        <p className="font-mono text-sm text-text-secondary truncate">
                          {record.issuer.substring(0, 8)}...
                        </p>
                      </div>
                      <div className="bg-dark-surface rounded-lg p-3 border border-dark-border/50">
                        <p className="text-xs text-text-muted mb-1">🕐 Date</p>
                        <p className="text-sm text-text-secondary">
                          {formatTimestamp(record.timestamp)}
                        </p>
                      </div>
                      <div className="bg-dark-surface rounded-lg p-3 border border-dark-border/50">
                        <p className="text-xs text-text-muted mb-1">📦 IPFS</p>
                        <p className="font-mono text-sm text-text-secondary truncate">
                          {bytesToString(record.ipfs_cid).substring(0, 12)}...
                        </p>
                      </div>
                      <div className="bg-dark-surface rounded-lg p-3 border border-dark-border/50">
                        <p className="text-xs text-text-muted mb-1">🔐 Hash</p>
                        <p className="font-mono text-sm text-text-secondary truncate">
                          {record.document_hash.substring(0, 12)}...
                        </p>
                      </div>
                    </div>

                    {record.is_consumed && (
                      <div className="bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">
                        <p className="text-sm text-red-300">
                          ⚠️ This claim has been consumed and cannot be used for insurance again
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Share Button */}
                  <div className="flex-shrink-0">
                    <button 
                      onClick={() => generateShareLink(record)}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
                      title="Generate and copy secure verification link"
                    >
                      🔗 Share Access
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-brand-primary/5 to-blue-500/5 border border-brand-primary/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            ℹ️ About Secure Sharing
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-text-secondary">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <div>
                <strong className="text-text-primary">Secure Links</strong>
                <p className="text-xs mt-1">Generated links contain embedded encryption keys for secure access</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">👁️</span>
              <div>
                <strong className="text-text-primary">Privacy First</strong>
                <p className="text-xs mt-1">Keys are stored in URL hash (#) and never sent to servers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🎮</span>
              <div>
                <strong className="text-text-primary">You're in Control</strong>
                <p className="text-xs mt-1">Only people with the complete link can decrypt records</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">⛓️</span>
              <div>
                <strong className="text-text-primary">Blockchain Verified</strong>
                <p className="text-xs mt-1">All records are stored on Aptos blockchain for authenticity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
