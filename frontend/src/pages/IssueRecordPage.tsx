/**
 * IssueRecordPage.tsx
 * Obsidian theme page for issuing medical record tokens
 * Clean, centered design with drag-and-drop file upload - no emojis
 */

import { useState, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { uploadDocument } from '../services/api';
import { mintToken } from '../services/aptos';

// SVG Icons
const Icons = {
  lock: (
    <svg className="w-12 h-12 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  document: (
    <svg className="w-12 h-12 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  folder: (
    <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  upload: (
    <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  loader: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  link: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  copy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  hash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  cloud: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  cube: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
};

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
    if (!connected) return setError('Please connect your wallet first');
    if (!file) return setError('Please select a file to upload');
    if (!patientAddress.startsWith('0x')) return setError('Invalid Patient Address');

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Uploading document...');
      const uploadResult = await uploadDocument(file, recordType);
      
      // uploadResult from api.ts has: { documentHash, ipfsCID, riskAnalysis, metadata }
      if (!uploadResult || !uploadResult.documentHash) {
          throw new Error("Upload failed: No document hash returned.");
      }

      console.log('Minting token...');
      const txHash = await mintToken(
        signAndSubmitTransaction,
        recordType,
        uploadResult.documentHash, // Ensure this matches what your API returns
        uploadResult.ipfsCID,      // Ensure this matches what your API returns
        patientAddress
      );

      setResult({
        ...uploadResult,
        transactionHash: txHash,
      });

      setFile(null);
      setPatientAddress('');
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
          {Icons.lock}
          <h3 className="text-xl font-semibold mt-4 mb-2">Wallet Not Connected</h3>
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
      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="px-8 py-6 border-b border-dark-border bg-dark-surface/50">
          <h2 className="text-xl font-semibold">Issue New Medical Token</h2>
          <p className="text-sm text-text-secondary mt-2">
            Upload a document, encrypt it, and mint it as a verifiable token on Aptos
          </p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          {/* Patient Wallet Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Patient Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-brand-primary/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Record Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-3">Record Type</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              disabled={loading}
              className="w-full bg-dark-surface border border-dark-border rounded-xl px-4 py-3 text-sm
                focus:outline-none focus:border-brand-primary/50 transition-colors
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
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                transition-all duration-200
                ${
                  dragging
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-dark-border hover:border-brand-primary/30 bg-dark-surface/50'
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
                <div className="flex flex-col items-center">
                  {Icons.document}
                  <p className="text-sm font-medium mt-3 mb-1">{file.name}</p>
                  <p className="text-xs text-text-secondary">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-xs text-text-muted mt-3">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {Icons.folder}
                  <p className="text-sm font-medium mt-3 mb-1">
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
            <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4">
              <p className="text-sm text-status-error">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-status-success">{Icons.check}</span>
                <p className="text-sm font-medium text-status-success">Token Minted Successfully!</p>
              </div>
              <div className="space-y-2 text-xs text-text-secondary font-mono bg-dark-surface/50 rounded-lg p-3">
                <p>Hash: {result.documentHash?.substring(0, 20)}...</p>
                <p>IPFS: {result.ipfsCID?.substring(0, 20)}...</p>
                <p>TX: {result.transactionHash?.substring(0, 20)}...</p>
              </div>
              
              {/* Shareable Verification Link */}
              {result.encryptionKey && result.ipfsCID && (
                <div className="pt-3 border-t border-status-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-status-success">{Icons.link}</span>
                    <p className="text-sm font-medium text-status-success">Shareable Verification Link</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/verifier?cid=${result.ipfsCID}#key=${result.encryptionKey}`}
                      className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-xs font-mono"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/verifier?cid=${result.ipfsCID}#key=${result.encryptionKey}`;
                        navigator.clipboard.writeText(link);
                        alert('Link copied to clipboard!');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-status-success hover:bg-status-success/90 text-dark-crust text-xs rounded-lg transition-colors"
                    >
                      {Icons.copy}
                      Copy
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
              w-full py-4 rounded-xl text-sm font-semibold
              transition-all duration-200
              ${
                loading || !file
                  ? 'bg-dark-border text-text-muted cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-primary to-brand-secondary text-dark-crust hover:shadow-glow'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                {Icons.loader}
                Processing...
              </span>
            ) : (
              'Process & Mint Token'
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-dark-surface border border-dark-border rounded-2xl p-6">
        <h3 className="text-sm font-medium mb-4">How It Works</h3>
        <ul className="space-y-3 text-xs text-text-secondary">
          <li className="flex items-start gap-3">
            <span className="text-brand-primary mt-0.5">{Icons.hash}</span>
            <span>Document is hashed (SHA-256) for on-chain verification</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-secondary mt-0.5">{Icons.shield}</span>
            <span>File is encrypted (AES-256-CBC) before storage</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-accent mt-0.5">{Icons.cloud}</span>
            <span>Encrypted file uploaded to IPFS (decentralized storage)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-tertiary mt-0.5">{Icons.cube}</span>
            <span>Token minted on Aptos blockchain with hash proof</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
