/**
 * IssueRecordPage.tsx
 * Minimalist dark mode page for issuing medical record tokens
 * Clean, centered design with drag-and-drop file upload
 */

import { useState, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { uploadDocument } from '../services/api';
import { mintToken } from '../services/aptos';

const recordTypes = [
  'Birth Certificate',
  'Insurance Claim',
  'Medicine Report',
  'Prescription',
  'Lab Report',
  'Vaccination Record',
];

export default function IssueRecordPage() {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [recordType, setRecordType] = useState(recordTypes[0]);
  const [patientAddress, setPatientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!connected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!patientAddress) {
      setError('Please enter the patient wallet address');
      return;
    }

    if (!patientAddress.startsWith('0x') || patientAddress.length < 64) {
      setError('Please enter a valid Aptos wallet address (starts with 0x and at least 64 characters)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('📤 Step 1/2: Uploading document to backend...');
      const uploadResult = await uploadDocument(file, recordType);
      console.log('✅ Backend upload successful!');
      console.log('   Document Hash:', uploadResult.documentHash);
      console.log('   IPFS CID:', uploadResult.ipfsCID);

      console.log('⛓️  Step 2/2: Minting token on Aptos blockchain...');
      
      if (!signAndSubmitTransaction) {
        throw new Error('Wallet not properly connected. Please refresh and reconnect wallet.');
      }
      
      const txResult = await mintToken(
        signAndSubmitTransaction,
        recordType,
        uploadResult.documentHash,
        uploadResult.ipfsCID,
        patientAddress
      );
      console.log('✅ Blockchain transaction successful!');
      console.log('   TX Hash:', txResult);

      setResult({
        ...uploadResult,
        transactionHash: txResult,
        patientAddress,
      });

      // Reset form
      setFile(null);
      setPatientAddress('');
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-dark-card border border-dark-border rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-lg font-medium mb-2">Wallet Not Connected</h3>
          <p className="text-text-secondary text-sm mb-6">
            Please connect your Aptos wallet to issue medical tokens
          </p>
          <p className="text-xs text-text-muted">
            Click the "Connect Wallet" button in the top right
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Card */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-dark-border">
          <h2 className="text-xl font-medium">Issue New Medical Token</h2>
          <p className="text-sm text-text-secondary mt-2">
            Upload a document, encrypt it, and mint it as a verifiable token on Aptos
          </p>
        </div>

        {/* FoPatient Wallet Address */}
          <div>
            <label className="block text-sm font-medium mb-3">Patient Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              disabled={loading}
              className="w-full bg-dark-surface border border-dark-border rounded-md px-4 py-3 text-sm font-mono
                focus:outline-none focus:border-text-secondary transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-text-muted mt-2">
              The medical record will be cryptographically tied to this patient's wallet address
            </p>
          </div>

          {/* rm */}
        <div className="p-8 space-y-6">
          {/* Record Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-3">Record Type</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              disabled={loading}
              className="w-full bg-dark-surface border border-dark-border rounded-md px-4 py-3 text-sm
                focus:outline-none focus:border-text-secondary transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recordTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium mb-3">Document Upload</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-all duration-200
                ${
                  dragging
                    ? 'border-text-primary bg-dark-hover'
                    : 'border-dark-border hover:border-text-secondary bg-dark-surface'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
              />

              {file ? (
                <div>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-sm font-medium mb-1">{file.name}</p>
                  <p className="text-xs text-text-secondary">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-xs text-text-muted mt-3">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3">📁</div>
                  <p className="text-sm font-medium mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-text-secondary">
                    Supports PDF, JPG, PNG (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-md p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-green-950/30 border border-green-900/50 rounded-md p-4 space-y-3">
              <p className="text-sm font-medium text-green-400">✅ Token Minted Successfully!</p>
              <div className="space-y-1 text-xs text-text-secondary font-mono">
                <p>Hash: {result.documentHash.substring(0, 20)}...</p>
                <p>IPFS: {result.ipfsCID.substring(0, 20)}...</p>
                <p>TX: {result.transactionHash?.substring(0, 20)}...</p>
              </div>
              
              {/* Shareable Verification Link */}
              {result.encryptionKey && result.ipfsCID && (
                <div className="pt-3 border-t border-green-900/30">
                  <p className="text-sm font-medium text-green-400 mb-2">🔗 Shareable Verification Link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/verifier?cid=${result.ipfsCID}#key=${result.encryptionKey}`}
                      className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded text-xs font-mono"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/verifier?cid=${result.ipfsCID}#key=${result.encryptionKey}`;
                        navigator.clipboard.writeText(link);
                        alert('Link copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    Share this link with authorized verifiers to view the medical record securely.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className={`
              w-full py-4 rounded-md text-sm font-medium
              transition-all duration-200
              ${
                loading || !file
                  ? 'bg-dark-border text-text-muted cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Processing...
              </span>
            ) : (
              'Process & Mint Token'
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-dark-surface border border-dark-border rounded-lg p-6">
        <h3 className="text-sm font-medium mb-3">How It Works</h3>
        <ul className="space-y-2 text-xs text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-text-muted">1.</span>
            <span>Document is hashed (SHA-256) for on-chain verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-muted">2.</span>
            <span>File is encrypted (AES-256-CBC) before storage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-muted">3.</span>
            <span>Encrypted file uploaded to IPFS (decentralized storage)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text-muted">4.</span>
            <span>Token minted on Aptos blockchain with hash proof</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
