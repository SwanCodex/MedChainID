/**
 * encryption.js
 * Handles AES-256-CBC encryption/decryption for secure file storage
 * 
 * Security Note: 
 * - Only encrypted files are uploaded to IPFS
 * - Each file gets a unique IV (Initialization Vector)
 * - IV is prepended to encrypted data for decryption later
 */

const crypto = require('crypto');
require('dotenv').config();

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key on startup
if (!ENCRYPTION_KEY) {
    console.error('❌ FATAL: ENCRYPTION_KEY not found in .env file');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
}

if (ENCRYPTION_KEY.length !== 64) {
    console.error('❌ FATAL: ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    console.error('Current length:', ENCRYPTION_KEY.length);
    process.exit(1);
}

/**
 * Encrypt a file buffer using AES-256-CBC
 * 
 * @param {Buffer} buffer - Raw file buffer to encrypt
 * @returns {Buffer} - Encrypted buffer with IV prepended (IV + EncryptedData)
 * 
 * Flow:
 * 1. Generate random 16-byte IV
 * 2. Create cipher with key and IV
 * 3. Encrypt the buffer
 * 4. Prepend IV to encrypted data (needed for decryption)
 * 5. Return combined buffer
 */
function encryptBuffer(buffer) {
    try {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer');
        }

        // Generate a cryptographically secure random IV
        const iv = crypto.randomBytes(IV_LENGTH);
        
        // Convert hex key string to Buffer
        const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
        
        // Create cipher instance
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
        
        // Encrypt the data
        const encryptedData = Buffer.concat([
            cipher.update(buffer),
            cipher.final()
        ]);
        
        // Prepend IV to encrypted data (IV is not secret, just needs to be unique)
        const result = Buffer.concat([iv, encryptedData]);
        
        console.log(`✅ Encrypted ${buffer.length} bytes → ${result.length} bytes (IV: 16 bytes + encrypted data)`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Encryption failed:', error.message);
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

/**
 * Decrypt a file buffer using AES-256-CBC
 * 
 * @param {Buffer} encryptedBuffer - Encrypted buffer with IV prepended
 * @returns {Buffer} - Decrypted original buffer
 * 
 * Flow:
 * 1. Extract IV from first 16 bytes
 * 2. Extract encrypted data from remaining bytes
 * 3. Create decipher with key and IV
 * 4. Decrypt the data
 * 5. Return original buffer
 */
function decryptBuffer(encryptedBuffer) {
    try {
        if (!Buffer.isBuffer(encryptedBuffer)) {
            throw new Error('Input must be a Buffer');
        }

        if (encryptedBuffer.length < IV_LENGTH) {
            throw new Error('Invalid encrypted buffer: too short to contain IV');
        }

        // Extract IV from the first 16 bytes
        const iv = encryptedBuffer.slice(0, IV_LENGTH);
        
        // Extract encrypted data (everything after IV)
        const encryptedData = encryptedBuffer.slice(IV_LENGTH);
        
        // Convert hex key string to Buffer
        const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
        
        // Create decipher instance
        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
        
        // Decrypt the data
        const decryptedData = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);
        
        console.log(`✅ Decrypted ${encryptedBuffer.length} bytes → ${decryptedData.length} bytes`);
        
        return decryptedData;
        
    } catch (error) {
        console.error('❌ Decryption failed:', error.message);
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

/**
 * Generate SHA-256 hash of a buffer
 * This hash is stored on-chain for document verification
 * 
 * @param {Buffer} buffer - File buffer to hash
 * @returns {string} - Hex-encoded SHA-256 hash with 0x prefix
 */
function generateHash(buffer) {
    try {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer');
        }

        const hash = crypto
            .createHash('sha256')
            .update(buffer)
            .digest('hex');
        
        // Validate hash length (should be 64 hex characters)
        if (hash.length !== 64) {
            throw new Error(`Invalid hash length: expected 64, got ${hash.length}`);
        }
        
        // Validate hash contains only hex characters
        if (!/^[0-9a-f]{64}$/i.test(hash)) {
            throw new Error('Hash contains invalid characters');
        }
        
        // Add 0x prefix for blockchain compatibility
        return `0x${hash}`;
        
    } catch (error) {
        console.error('❌ Hash generation failed:', error.message);
        throw new Error(`Hash generation failed: ${error.message}`);
    }
}

/**
 * Verify if a buffer matches an expected hash
 * 
 * @param {Buffer} buffer - File buffer to verify
 * @param {string} expectedHash - Expected hash value (with or without 0x prefix)
 * @returns {boolean} - True if hashes match
 */
function verifyHash(buffer, expectedHash) {
    try {
        const actualHash = generateHash(buffer);
        const cleanExpectedHash = expectedHash.startsWith('0x') ? expectedHash : `0x${expectedHash}`;
        
        return actualHash.toLowerCase() === cleanExpectedHash.toLowerCase();
        
    } catch (error) {
        console.error('❌ Hash verification failed:', error.message);
        return false;
    }
}

// Export functions
module.exports = {
    encryptBuffer,
    decryptBuffer,
    generateHash,
    verifyHash
};

// Log startup info
console.log('🔐 Encryption module loaded');
console.log(`   Algorithm: ${ALGORITHM}`);
console.log(`   Key Length: ${KEY_LENGTH} bytes`);
console.log(`   IV Length: ${IV_LENGTH} bytes`);
