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
  useEffect(() => {
    const cid = searchParams.get('cid');
    // Extract key from hash fragment (e.g., #key=XYZ)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const key = hashParams.get('key');

    if (cid && key) {
      decryptAndShow(cid, key);
    }
  }, [searchParams]);

  const decryptAndShow = async (cid: string, key: string) => {
    setDecrypting(true);
    setError('');
    setImageUrl(null);

    try {
      console.log('🔓 Decrypting document from IPFS:', cid);

      // Call backend endpoint to decrypt and return the image
      // Note: Backend is trusted (Privacy Vault) for demo purposes
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/decrypt-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cid, key }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to decrypt document');
      }

      // Get the decrypted image as a blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);

      console.log('✅ Document decrypted and ready to display');
    } catch (err: any) {
      console.error('Decryption error:', err);
      setError(err.message || 'Failed to decrypt document');
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
                {tokenData.isConsumed ? '❌ Consumed' : '✅ Active'}
              </span>
            </p>
            
            <p><strong>Record Type:</strong> {tokenData.recordType}</p>
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
