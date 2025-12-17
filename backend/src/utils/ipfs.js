/**
 * ipfs.js
 * Handles IPFS uploads via Pinata cloud service
 * 
 * Security Note: 
 * - Only encrypted buffers should be uploaded
 * - Never upload raw/unencrypted files to IPFS
 */

const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Pinata API configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// Validate API keys on startup
if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.error('❌ WARNING: Pinata API keys not found in .env');
    console.error('   Get your keys from: https://app.pinata.cloud/');
    console.error('   Set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env');
}

/**
 * Upload an encrypted buffer to IPFS via Pinata
 * 
 * @param {Buffer} buffer - Encrypted file buffer (MUST be encrypted!)
 * @param {string} filename - Original filename (will be prefixed with 'encrypted_')
 * @returns {Promise<string>} - IPFS CID (Content Identifier)
 * 
 * Flow:
 * 1. Create form data with encrypted buffer
 * 2. Add metadata (timestamp, encrypted flag)
 * 3. Send to Pinata API
 * 4. Return IPFS CID
 */
async function uploadToPinata(buffer, filename) {
    try {
        // Validate inputs
        if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
            throw new Error('Pinata API keys not configured. Check .env file.');
        }

        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer');
        }

        if (!filename || typeof filename !== 'string') {
            throw new Error('Filename must be a non-empty string');
        }

        console.log(`📤 Uploading to IPFS: ${filename} (${buffer.length} bytes)`);

        // Create form data
        const formData = new FormData();
        
        // Append encrypted file with metadata
        formData.append('file', buffer, {
            filename: `encrypted_${filename}`,
            contentType: 'application/octet-stream' // Generic binary type
        });

        // Add Pinata metadata
        const metadata = JSON.stringify({
            name: `MedChainID_${Date.now()}_${filename}`,
            keyvalues: {
                app: 'MedChainID',
                encrypted: 'true',
                originalFilename: filename,
                uploadedAt: new Date().toISOString(),
                version: '1.0'
            }
        });
        formData.append('pinataMetadata', metadata);

        // Optional: Pin options (keep pinned)
        const pinOptions = JSON.stringify({
            cidVersion: 1 // Use CIDv1 (more future-proof)
        });
        formData.append('pinataOptions', pinOptions);

        // Make API request to Pinata
        const response = await axios.post(PINATA_API_URL, formData, {
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            },
            maxBodyLength: Infinity, // No size limit
            maxContentLength: Infinity
        });

        // Extract CID from response
        const ipfsCID = response.data.IpfsHash;
        
        console.log(`✅ Successfully uploaded to IPFS`);
        console.log(`   CID: ${ipfsCID}`);
        console.log(`   Gateway URL: ${PINATA_GATEWAY}/${ipfsCID}`);
        
        return ipfsCID;

    } catch (error) {
        // Detailed error logging
        if (error.response) {
            // API returned an error
            console.error('❌ Pinata API Error:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
            throw new Error(`Pinata API error: ${error.response.data.error || error.response.statusText}`);
        } else if (error.request) {
            // Request made but no response
            console.error('❌ No response from Pinata:', error.message);
            throw new Error('Failed to connect to Pinata. Check your internet connection.');
        } else {
            // Something else went wrong
            console.error('❌ IPFS Upload Error:', error.message);
            throw new Error(`IPFS upload failed: ${error.message}`);
        }
    }
}

/**
 * Retrieve a file from IPFS via Pinata gateway
 * 
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Buffer>} - File buffer (will be encrypted)
 */
async function getFromIPFS(cid) {
    try {
        if (!cid || typeof cid !== 'string') {
            throw new Error('CID must be a non-empty string');
        }

        console.log(`📥 Retrieving from IPFS: ${cid}`);

        const url = `${PINATA_GATEWAY}/${cid}`;
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30 second timeout
        });

        const buffer = Buffer.from(response.data);
        
        console.log(`✅ Retrieved ${buffer.length} bytes from IPFS`);
        
        return buffer;

    } catch (error) {
        console.error('❌ IPFS Retrieval Error:', error.message);
        if (error.response?.status === 404) {
            throw new Error('File not found on IPFS. Invalid CID or file unpinned.');
        }
        throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
    }
}

/**
 * Check if a file exists on IPFS
 * 
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<boolean>} - True if file exists and is accessible
 */
async function checkIPFSExists(cid) {
    try {
        if (!cid) return false;

        const url = `${PINATA_GATEWAY}/${cid}`;
        const response = await axios.head(url, {
            timeout: 10000 // 10 second timeout
        });

        return response.status === 200;

    } catch (error) {
        return false;
    }
}

/**
 * Get file metadata from Pinata
 * 
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<object>} - Metadata object
 */
async function getFileMetadata(cid) {
    try {
        if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
            throw new Error('Pinata API keys not configured');
        }

        const url = `https://api.pinata.cloud/data/pinList?hashContains=${cid}`;
        const response = await axios.get(url, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        });

        if (response.data.rows && response.data.rows.length > 0) {
            return response.data.rows[0];
        }

        return null;

    } catch (error) {
        console.error('❌ Metadata retrieval failed:', error.message);
        return null;
    }
}

// Export functions
module.exports = {
    uploadToPinata,
    getFromIPFS,
    checkIPFSExists,
    getFileMetadata
};

// Log startup info
console.log('☁️  IPFS module loaded (Pinata)');
if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    console.log('   ✅ API keys configured');
} else {
    console.log('   ⚠️  API keys missing - configure in .env');
}
