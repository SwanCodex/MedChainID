import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyToken, getTokenDetails, consumeToken } from '../services/aptos';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletButton from '../components/WalletButton';

export default function Verifier() {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [searchParams] = useSearchParams();
  const [issuerAddress, setIssuerAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
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

      console.log('🔓 Decrypting document from IPFS:', cid);

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

      console.log('✅ Document decrypted and ready to display');
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
      const [isValid, issuer] = await verifyToken(issuerAddress, parseInt(tokenId));
      
      if (!isValid) {
        setError('Token is invalid or has been consumed');
        setLoading(false);
        return;
      }

      // Get full token details
      const details = await getTokenDetails(issuerAddress, parseInt(tokenId));
      setTokenData({
        isValid,
        issuer,
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

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary">
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a 
              href="/issuer" 
              className="text-text-secondary hover:text-brand-primary transition-colors text-sm"
            >
              ← Hospital Issuer
            </a>
            <a 
              href="/patient" 
              className="text-text-secondary hover:text-brand-primary transition-colors text-sm"
            >
              ← Patient Dashboard
            </a>
          </div>
          <WalletButton />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🔍 Verify Medical Token</h1>
          <p className="text-text-secondary">
            Verify authenticity and view medical records securely
          </p>
        </div>

        {/* Image Display Section (for URL-based verification) */}
        {(decrypting || imageUrl || (searchParams.get('cid') && !imageUrl && error)) && (
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📄 Medical Record Document
            </h3>
            
            {decrypting && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                <p className="text-text-secondary">Decrypting document securely...</p>
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
              <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 mt-4">
                <p className="text-red-400">❌ {error}</p>
                <p className="text-sm mt-2 text-red-300/70">
                  Make sure the verification link is complete and hasn't expired.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Verification Form */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 shadow-lg mb-6">
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
              className="w-full py-3 px-6 bg-white text-black font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Verifying...
                </>
              ) : (
                <>🔍 Verify Token</>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && !searchParams.get('cid') && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-6">
            <p className="text-red-400">❌ {error}</p>
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
                  ? 'bg-red-950/30 text-red-400 border border-red-900/50' 
                  : 'bg-green-950/30 text-green-400 border border-green-900/50'
              }`}>
                {tokenData.isConsumed ? (
                  <>❌ CONSUMED (Already Claimed)</>
                ) : (
                  <><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> ACTIVE (Can Be Claimed)</>
                )}
              </div>
            </div>
            
            {tokenData.isConsumed && (
              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 mb-6">
                <p className="text-red-300 text-sm">
                  ⚠️ <strong>WARNING:</strong> This medical record has been consumed and cannot be used for insurance claims again.
                  This prevents double-claiming and fraud.
                </p>
              </div>
            )}
            
            {/* Details Grid */}
            <div className="space-y-4">
              {[
                { label: 'Record Type', value: tokenData.recordType, icon: '📋' },
                { label: 'Patient Address', value: tokenData.patientAddress, mono: true, icon: '👤' },
                { label: 'Document Hash', value: tokenData.documentHash, mono: true, icon: '🔐' },
                { label: 'IPFS CID', value: tokenData.ipfsCID, mono: true, icon: '📦' },
                { label: 'Issuer', value: tokenData.issuer, mono: true, icon: '🏥' },
                { label: 'Timestamp', value: new Date(tokenData.timestamp * 1000).toLocaleString(), icon: '🕐' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-dark-surface rounded-lg border border-dark-border/50">
                  <span className="text-xl">{item.icon}</span>
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
                    className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-red-500 text-white font-medium rounded-xl hover:from-pink-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {consuming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Consuming...
                      </>
                    ) : (
                      <>🔥 Consume Token (One-Time-Use)</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
