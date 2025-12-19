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
    <div className="page-container">
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <a href="/issuer" style={{ color: '#10b981', textDecoration: 'underline' }}>← Hospital Issuer</a>
        <a href="/patient" style={{ color: '#10b981', textDecoration: 'underline' }}>← Patient Dashboard</a>
      </div>
      <h2>🔍 Verify Medical Token</h2>

      {/* Image Display Section (for URL-based verification) */}
      {(decrypting || imageUrl || (searchParams.get('cid') && !imageUrl && error)) && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>📄 Medical Record Document</h3>
          
          {decrypting && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
              <p>Decrypting document securely...</p>
            </div>
          )}

          {imageUrl && (
            <div style={{ 
              marginTop: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f9fafb'
            }}>
              <img 
                src={imageUrl} 
                alt="Medical Record" 
                style={{ 
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </div>
          )}

          {!imageUrl && !decrypting && error && (
            <div className="error-box" style={{ marginTop: '1rem' }}>
              <p>❌ {error}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
                Make sure the verification link is complete and hasn't expired.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="form-group">
          <label>Issuer Address</label>
          <input 
            type="text" 
            value={issuerAddress}
            onChange={(e) => setIssuerAddress(e.target.value)}
            placeholder="0x..."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Token ID</label>
          <input 
            type="number" 
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="0"
            disabled={loading}
          />
        </div>

        <button 
          onClick={handleVerify} 
          className="btn-primary"
          disabled={loading || !issuerAddress || !tokenId}
        >
          {loading ? '⏳ Verifying...' : '🔍 Verify Token'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {tokenData && (
        <div className="card">
          <h3>Token Details</h3>
          
          <div style={{ marginTop: '1rem' }}>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`status-badge ${tokenData.isConsumed ? 'status-consumed' : 'status-active'}`}>
                {tokenData.isConsumed ? '❌ CONSUMED (Already Claimed)' : '✅ ACTIVE (Can Be Claimed)'}
              </span>
            </p>
            
            {tokenData.isConsumed && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                backgroundColor: '#7f1d1d20',
                border: '1px solid #991b1b',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#fca5a5', fontSize: '0.9rem', margin: 0 }}>
                  ⚠️ <strong>WARNING:</strong> This medical record has been consumed and cannot be used for insurance claims again.
                  This prevents double-claiming and fraud.
                </p>
              </div>
            )}
            
            <p style={{ marginTop: '0.5rem' }}></p>
            
            <p><strong>Record Type:</strong> {tokenData.recordType}</p>
            <p><strong>Patient Address:</strong> <code style={{ fontSize: '0.85rem' }}>{tokenData.patientAddress}</code></p>
            <p><strong>Document Hash:</strong> <code style={{ fontSize: '0.85rem' }}>{tokenData.documentHash}</code></p>
            <p><strong>IPFS CID:</strong> <code style={{ fontSize: '0.85rem' }}>{tokenData.ipfsCID}</code></p>
            <p><strong>Issuer:</strong> <code style={{ fontSize: '0.85rem' }}>{tokenData.issuer}</code></p>
            <p><strong>Timestamp:</strong> {new Date(tokenData.timestamp * 1000).toLocaleString()}</p>
          </div>

          {!tokenData.isConsumed && (
            <div style={{ marginTop: '1.5rem' }}>
              {!connected ? (
                <div>
                  <p style={{ marginBottom: '1rem' }}>Connect wallet to consume this token:</p>
                  <WalletButton />
                </div>
              ) : (
                <button 
                  onClick={handleConsume}
                  className="btn-primary"
                  disabled={consuming}
                  style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                >
                  {consuming ? '⏳ Consuming...' : '🔥 Consume Token (One-Time-Use)'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
