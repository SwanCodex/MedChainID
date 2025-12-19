import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { uploadDocument } from '../services/api';
import { mintToken } from '../services/aptos';
import WalletButton from '../components/WalletButton';

export default function Issuer() {
  const { connected, signAndSubmitTransaction, account } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [recordType, setRecordType] = useState('Insurance Claim');
  const [patientAddress, setPatientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!patientAddress) {
      setError('Please enter patient wallet address');
      return;
    }

    if (!patientAddress.startsWith('0x')) {
      setError('Patient address must start with 0x');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Step 1: Upload to backend (generates hash, encrypts, uploads to IPFS)
      console.log('Uploading document...');
      const uploadResult = await uploadDocument(file, recordType);
      console.log('Upload result:', uploadResult);

      // Step 2: Mint token on blockchain
      console.log('Minting token on blockchain...');
      const txResult = await mintToken(
        signAndSubmitTransaction,
        recordType,
        uploadResult.documentHash,
        uploadResult.ipfsCID,
        patientAddress
      );
      console.log('Transaction result:', txResult);

      setResult({
        ...uploadResult,
        transactionHash: txResult,
      });

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <a href="/patient" style={{ color: '#10b981', textDecoration: 'underline' }}>← Patient Dashboard</a>
        <a href="/verifier" style={{ color: '#10b981', textDecoration: 'underline' }}>Verifier →</a>
      </div>
      <h2>📝 Issue Medical Token (Hospital)</h2>

      {!connected && (
        <div className="card">
          <p>Please connect your wallet to issue tokens</p>
          <WalletButton />
        </div>
      )}

      {connected && (
        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Record Type</label>
            <select 
              value={recordType} 
              onChange={(e) => setRecordType(e.target.value)}
              disabled={loading}
            >
              <option>Insurance Claim</option>
              <option>Birth Certificate</option>
              <option>Medicine Report</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Patient Wallet Address</label>
            <input 
              type="text" 
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              placeholder="0x..."
              disabled={loading}
              style={{ fontFamily: 'monospace' }}
            />
            <small style={{ color: '#666', fontSize: '0.8rem' }}>
              The patient who will own this medical record
            </small>
          </div>

          <div className="form-group">
            <label>Upload Document (PDF, Image, etc.)</label>
            <input 
              type="file" 
              onChange={handleFileChange}
              disabled={loading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            {file && <p style={{ marginTop: '0.5rem', color: '#666' }}>Selected: {file.name}</p>}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !file}
          >
            {loading ? '⏳ Processing...' : '🚀 Issue Token'}
          </button>
        </form>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="success-message">
          <h3>✅ Token Issued Successfully!</h3>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Document Hash:</strong> <code>{result.documentHash}</code></p>
            <p><strong>IPFS CID:</strong> <code>{result.ipfsCID}</code></p>
            <p><strong>Transaction:</strong> <code>{result.transactionHash}</code></p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Save this information! The token can now be verified by service providers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
