/**
 * Verifier.tsx
 * Verify medical tokens and view documents
 * Obsidian theme with SVG icons - no emojis
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyToken, getTokenDetails, consumeToken } from '../services/aptos';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletButton from '../components/WalletButton';

// SVG Icons
const Icons = {
  search: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  loader: (
    <svg className="w-8 h-8 animate-spin text-brand-primary" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  fire: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  hash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  cube: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
};

export default function Verifier() {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [searchParams] = useSearchParams();
  const [issuerAddress, setIssuerAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  // Handle URL-based decryption (for shared verification links)
  // CRITICAL: Only decrypt if BOTH cid and key are present (zero-knowledge verification)
  useEffect(() => {
    const cid = searchParams.get('cid');
    // Extract key from hash fragment (e.g., #key=XYZ)
    // Hash fragment is NOT sent to server - this is critical for security
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const key = hashParams.get('key');

    // Zero-knowledge: Only attempt decryption if key is provided in hash fragment
    if (cid && key) {
      // Validate key format (64 hex characters)
      if (key.length === 64 && /^[0-9a-fA-F]{64}$/.test(key)) {
        decryptAndShow(decodeURIComponent(cid), key);
      } else {
        setError('Invalid decryption key format. Key must be 64 hexadecimal characters.');
      }
    } else if (cid && !key) {
      // CID provided but no key - this is the zero-knowledge case
      // Do NOT attempt decryption - just show manual verification form
      console.log('Zero-knowledge mode: CID provided but no decryption key in hash fragment');
    }
  }, [searchParams]);

  const decryptAndShow = async (cid: string, key: string) => {
    setDecrypting(true);
    setError('');
    setImageUrl(null);

    try {
      // Validate inputs
      if (!cid || cid.trim().length === 0) {
        throw new Error('IPFS CID is required');
      }
      if (!key || key.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(key)) {
        throw new Error('Invalid decryption key. Key must be 64 hexadecimal characters.');
      }

      console.log('Decrypting document from IPFS:', cid);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // Call backend endpoint to decrypt and return the image
      // Note: Backend is trusted (Privacy Vault) for demo purposes
      const response = await fetch(`${apiUrl}/decrypt-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cid, key }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to decrypt document';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Decryption failed: ${response.status} ${response.statusText}`;
        }
        
        // Provide specific error messages
        if (response.status === 400) {
          errorMessage = 'Invalid request. Please check the CID and key format.';
        } else if (response.status === 500) {
          errorMessage = 'Decryption failed. The key may be incorrect or the file may be corrupted.';
        }
        
        throw new Error(errorMessage);
      }

      // Get the decrypted image as a blob
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Decrypted file is empty');
      }
      
      const url = URL.createObjectURL(blob);
      setImageUrl(url);

      console.log('Document decrypted and ready to display');
    } catch (err: any) {
      console.error('Decryption error:', err);
      setError(err.message || 'Failed to decrypt document. Please verify the link is complete and correct.');
    } finally {
      setDecrypting(false);
    }
  };

  const handleVerify = async () => {
    if (!issuerAddress || !tokenId) {
      setError('Please enter both issuer address and token ID');
      return;
    }

    setLoading(true);
    setError('');
    setTokenData(null);

    try {
      // Check if token is valid
      const [isValid] = await verifyToken(issuerAddress, parseInt(tokenId));
      
      if (!isValid) {
        setError('Token is invalid or has been consumed');
        setLoading(false);
        return;
      }

      // Get full token details
      const details = await getTokenDetails(issuerAddress, parseInt(tokenId));
      setTokenData({
        isValid,
        ...details,
      });

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!connected) {
      setError('Please connect your wallet to consume tokens');
      return;
    }

    if (!tokenData) {
      return;
    }

    setConsuming(true);
    setError('');

    try {
      const txHash = await consumeToken(
        signAndSubmitTransaction,
        issuerAddress,
        parseInt(tokenId)
      );

      console.log('Token consumed:', txHash);
      
      // Refresh token data
      await handleVerify();
      
      alert('Token consumed successfully! Transaction hash: ' + txHash);

    } catch (err: any) {
      console.error('Consume error:', err);
      setError(err.message || 'Failed to consume token');
    } finally {
      setConsuming(false);
    }
  };

  const detailItems = tokenData ? [
    { label: 'Record Type', value: tokenData.recordType, icon: Icons.clipboard },
    { label: 'Patient Address', value: tokenData.patientAddress, mono: true, icon: Icons.user },
    { label: 'Document Hash', value: tokenData.documentHash, mono: true, icon: Icons.hash },
    { label: 'IPFS CID', value: tokenData.ipfsCID, mono: true, icon: Icons.cube },
    { label: 'Issuer', value: tokenData.issuer, mono: true, icon: Icons.hospital },
    { label: 'Timestamp', value: new Date(tokenData.timestamp * 1000).toLocaleString(), icon: Icons.clock },
  ] : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="p-3 bg-dark-card border border-dark-border rounded-xl text-brand-primary">
            {Icons.search}
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Verify Medical Token</h1>
        <p className="text-text-secondary">
          Verify authenticity and view medical records securely
        </p>
      </div>

      {/* Image Display Section (for URL-based verification) */}
      {(decrypting || imageUrl || (searchParams.get('cid') && !imageUrl && error)) && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-brand-primary">{Icons.document}</span>
            Medical Record Document
          </h3>
          
          {decrypting && (
            <div className="text-center py-8 flex flex-col items-center">
              {Icons.loader}
              <p className="text-text-secondary mt-4">Decrypting document securely...</p>
            </div>
          )}

          {imageUrl && (
            <div className="mt-4 border-2 border-dark-border rounded-xl overflow-hidden bg-dark-surface">
              <img 
                src={imageUrl} 
                alt="Medical Record" 
                className="w-full h-auto block"
              />
            </div>
          )}

          {!imageUrl && !decrypting && error && (
            <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2 text-status-error mb-2">
                {Icons.x}
                <span>{error}</span>
              </div>
              <p className="text-sm text-status-error/70">
                Make sure the verification link is complete and hasn't expired.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Verification Form */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-6">Enter Token Details</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Issuer Address
            </label>
            <input 
              type="text" 
              value={issuerAddress}
              onChange={(e) => setIssuerAddress(e.target.value)}
              placeholder="0x..."
              disabled={loading}
              className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Token ID
            </label>
            <input 
              type="number" 
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="0"
              disabled={loading}
              className="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all disabled:opacity-50"
            />
          </div>

          <button 
            onClick={handleVerify} 
            disabled={loading || !issuerAddress || !tokenId}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-primary to-brand-secondary text-dark-crust font-semibold rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              <>
                {Icons.search}
                Verify Token
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && !searchParams.get('cid') && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-status-error">
            {Icons.x}
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Token Details */}
      {tokenData && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-6">Token Details</h3>
          
          {/* Status Badge */}
          <div className="mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
              tokenData.isConsumed 
                ? 'bg-status-error/10 text-status-error border border-status-error/20' 
                : 'bg-status-success/10 text-status-success border border-status-success/20'
            }`}>
              {tokenData.isConsumed ? (
                <>
                  {Icons.x}
                  CONSUMED (Already Claimed)
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-status-success rounded-full animate-pulse"></span>
                  ACTIVE (Can Be Claimed)
                </>
              )}
            </div>
          </div>
          
          {tokenData.isConsumed && (
            <div className="bg-status-warning/10 border border-status-warning/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-status-warning mt-0.5">{Icons.warning}</span>
                <p className="text-status-warning text-sm">
                  <strong>WARNING:</strong> This medical record has been consumed and cannot be used for insurance claims again.
                  This prevents double-claiming and fraud.
                </p>
              </div>
            </div>
          )}
          
          {/* Details Grid */}
          <div className="space-y-3">
            {detailItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-dark-surface rounded-xl border border-dark-border/50">
                <span className="text-brand-primary mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted mb-1">{item.label}</p>
                  <p className={`${item.mono ? 'font-mono text-sm break-all' : ''} text-text-primary`}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Consume Button */}
          {!tokenData.isConsumed && (
            <div className="mt-6 pt-6 border-t border-dark-border">
              {!connected ? (
                <div className="text-center">
                  <p className="text-text-secondary mb-4">Connect wallet to consume this token:</p>
                  <WalletButton />
                </div>
              ) : (
                <button 
                  onClick={handleConsume}
                  disabled={consuming}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-status-error to-brand-accent text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {consuming ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Consuming...
                    </>
                  ) : (
                    <>
                      {Icons.fire}
                      Consume Token (One-Time-Use)
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
