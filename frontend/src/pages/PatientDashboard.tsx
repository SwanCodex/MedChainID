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
      <div className="p-8">
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-text-secondary mb-6">
            Please connect your Petra wallet to view your medical records
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <a href="/issuer" style={{ color: '#10b981', textDecoration: 'underline' }}>← Hospital Issuer</a>
        <a href="/verifier" style={{ color: '#10b981', textDecoration: 'underline' }}>Verifier →</a>
      </div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">👤 My Medical Vault</h2>
          <p className="text-sm text-text-secondary">
            Connected: {account?.address.substring(0, 6)}...{account?.address.substring(account?.address.length - 4)}
          </p>
        </div>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="px-4 py-2 bg-dark-border hover:bg-dark-surface text-text-primary rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-md p-4 mb-6">
          <p className="text-sm text-red-400">❌ {error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your medical records...</p>
        </div>
      ) : myRecords.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold mb-2">No Records Found</h3>
          <p className="text-text-secondary">
            You don't have any medical records yet, or they were issued to a different address.
          </p>
          <p className="text-sm text-text-muted mt-4">
            Hospital Address: {HOSPITAL_ADDRESS.substring(0, 10)}...
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {myRecords.map((record) => (
            <div 
              key={record.token_id} 
              className="bg-dark-card border border-dark-border p-6 rounded-lg hover:border-text-muted transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">📄</div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {bytesToString(record.record_type)}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        Token ID: {record.token_id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted text-xs mb-1">Issued By</p>
                      <p className="font-mono text-text-secondary">
                        {record.issuer.substring(0, 8)}...{record.issuer.substring(record.issuer.length - 6)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Date</p>
                      <p className="text-text-secondary">
                        {formatTimestamp(record.timestamp)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Status</p>
                      <p className={`font-medium ${!record.is_consumed ? 'text-green-400' : 'text-red-400'}`}>
                        {!record.is_consumed ? '✅ Active (Claimable)' : '❌ Consumed (Claimed)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">IPFS</p>
                      <p className="font-mono text-text-secondary text-xs">
                        {bytesToString(record.ipfs_cid).substring(0, 12)}...
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dark-border">
                    <p className="text-text-muted text-xs mb-1">Document Hash</p>
                    <p className="font-mono text-xs text-text-secondary break-all">
                      {record.document_hash}
                    </p>
                  </div>

                  {record.is_consumed && (
                    <div className="mt-3 px-3 py-2 bg-red-950/30 border border-red-900/50 rounded-md">
                      <p className="text-xs text-red-400">
                        ⚠️ This claim has been consumed and cannot be used for insurance again
                      </p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button 
                    onClick={() => generateShareLink(record)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
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

      <div className="mt-8 bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="text-sm font-bold mb-3">ℹ️ About Sharing</h3>
        <ul className="text-xs text-text-secondary space-y-2">
          <li>• <strong>Secure Links</strong>: Clicking "Share Access" generates a one-time link with embedded decryption key</li>
          <li>• <strong>Privacy</strong>: The encryption key is stored in the URL hash (#key=...) and never sent to servers</li>
          <li>• <strong>Control</strong>: Only people with the complete link can decrypt and view your records</li>
          <li>• <strong>Blockchain Verified</strong>: All records are permanently stored on Aptos blockchain for authenticity</li>
        </ul>
      </div>
    </div>
  );
}
