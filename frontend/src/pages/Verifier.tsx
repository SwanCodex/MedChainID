import { useState } from 'react';
import { verifyToken, getTokenDetails, consumeToken } from '../services/aptos';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletButton from '../components/WalletButton';

export default function Verifier() {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [issuerAddress, setIssuerAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [error, setError] = useState('');

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
