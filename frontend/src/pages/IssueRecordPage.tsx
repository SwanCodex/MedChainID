/**
 * IssueRecordPage.tsx
 * Professional dark mode page for issuing medical record tokens
 * Enterprise-grade design with clean, data-focused interface
 */

import { useState, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Upload, FileText, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
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

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('📤 Uploading document to backend...');
      const uploadResult = await uploadDocument(file, recordType);
      console.log('✅ Upload result:', uploadResult);

      console.log('⛓️  Minting token on Aptos blockchain...');
      const txResult = await mintToken(
        signAndSubmitTransaction,
        recordType,
        uploadResult.documentHash,
        uploadResult.ipfsCID
      );
      console.log('✅ Transaction result:', txResult);

      setResult({
        ...uploadResult,
        transactionHash: txResult,
      });

      // Reset form
      setFile(null);
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
        <div className="bg-dark-card border border-dark-border rounded p-12 text-center">
          <div className="w-16 h-16 bg-dark-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-text-primary">Wallet Not Connected</h3>
          <p className="text-sm text-text-secondary mb-4">
            Please connect your Aptos wallet to issue medical tokens
          </p>
          <p className="text-xs text-text-muted">
            Click the "Connect Wallet" button in the top right corner
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Main Card */}
      <div className="bg-dark-card border border-dark-border rounded overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">Issue New Medical Token</h2>
          <p className="text-sm text-text-secondary mt-1">
            Upload, encrypt, and mint verifiable medical records on Aptos blockchain
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Record Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">Record Type</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              disabled={loading}
              className="w-full bg-dark-surface border border-dark-border rounded px-3 py-2.5 text-sm text-text-primary
                focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary
                transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {recordTypes.map((type) => (
                <option key={type} value={type} className="bg-dark-surface text-text-primary">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium mb-2 text-text-primary">Document Upload</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded p-8 text-center cursor-pointer
                transition-all duration-200
                ${
                  dragging
                    ? 'border-accent-primary bg-accent-primary/5'
                    : 'border-dark-border hover:border-text-muted bg-dark-surface'
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
                  <div className="w-12 h-12 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-accent-primary" />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">{file.name}</p>
                  <p className="text-xs text-text-secondary">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-xs text-text-muted mt-3">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-dark-hover rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload size={24} className="text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">
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
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-400">Token Minted Successfully</p>
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-text-muted min-w-[60px]">Hash:</span>
                  <span className="break-all">{result.documentHash.substring(0, 32)}...</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-text-muted min-w-[60px]">IPFS:</span>
                  <span className="break-all">{result.ipfsCID.substring(0, 32)}...</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-text-muted min-w-[60px]">TX:</span>
                  <span className="break-all">{result.transactionHash?.substring(0, 32)}...</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className={`
              w-full py-3 rounded text-sm font-semibold
              transition-all duration-200
              ${
                loading || !file
                  ? 'bg-dark-border text-text-muted cursor-not-allowed'
                  : 'bg-accent-primary hover:bg-accent-hover text-white shadow-lg shadow-accent-primary/20'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              'Process & Mint Token'
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-dark-surface border border-dark-border rounded p-5">
        <h3 className="text-sm font-semibold mb-3 text-text-primary">Security Process</h3>
        <ul className="space-y-2.5 text-xs text-text-secondary">
          <li className="flex items-start gap-3">
            <span className="text-text-muted font-mono min-w-[20px]">01</span>
            <span>Document hashed using SHA-256 for tamper-proof verification</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-text-muted font-mono min-w-[20px]">02</span>
            <span>File encrypted with AES-256-CBC before storage</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-text-muted font-mono min-w-[20px]">03</span>
            <span>Encrypted file uploaded to IPFS decentralized storage</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-text-muted font-mono min-w-[20px]">04</span>
            <span>Immutable token minted on Aptos blockchain with hash proof</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
