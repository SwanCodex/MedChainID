import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️  WARNING: No ENCRYPTION_KEY found in .env');
    console.warn('⚠️  Using temporary key. Generate one with:');
    console.warn(`   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
}

/**
 * Generate SHA-256 hash of a file buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string} - Hex encoded hash
 */
export function generateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Encrypt a file buffer using AES-256-CBC
 * @param {Buffer} buffer - File buffer to encrypt
 * @returns {Buffer} - Encrypted buffer with IV prepended
 */
export function encryptFile(buffer) {
    try {
        // Generate a random initialization vector
        const iv = crypto.randomBytes(16);
        
        // Convert hex key to buffer if it's a string
        const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
        
        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
        
        // Encrypt the data
        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        
        // Prepend IV to encrypted data (needed for decryption)
        return Buffer.concat([iv, encrypted]);
        
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt file');
    }
}

/**
 * Decrypt a file buffer using AES-256-CBC
 * @param {Buffer} encryptedBuffer - Encrypted buffer with IV prepended
 * @returns {Buffer} - Decrypted buffer
 */
export function decryptFile(encryptedBuffer) {
    try {
        // Extract IV from the beginning
        const iv = encryptedBuffer.slice(0, 16);
        const encrypted = encryptedBuffer.slice(16);
        
        // Convert hex key to buffer if it's a string
        const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');
        
        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
        
        // Decrypt the data
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        
        return decrypted;
        
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt file');
    }
}

/**
 * Verify if a buffer matches a given hash
 * @param {Buffer} buffer - File buffer
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} - True if hashes match
 */
export function verifyHash(buffer, expectedHash) {
    const actualHash = generateHash(buffer);
    return actualHash === expectedHash;
}

// Export key info for testing
export function getKeyInfo() {
    return {
        algorithm: ALGORITHM,
        keyLength: ENCRYPTION_KEY.length,
        isDefault: !process.env.ENCRYPTION_KEY
    };
}
