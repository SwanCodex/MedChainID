import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.warn('⚠️  WARNING: Pinata API keys not found in .env');
    console.warn('⚠️  Get your keys from: https://app.pinata.cloud/');
}

/**
 * Upload a file buffer to IPFS via Pinata
 * @param {Buffer} buffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} recordType - Type of medical record
 * @returns {Promise<string>} - IPFS CID
 */
export async function uploadToIPFS(buffer, fileName, recordType) {
    try {
        if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
            throw new Error('Pinata API keys not configured');
        }

        // Create form data
        const formData = new FormData();
        formData.append('file', buffer, {
            filename: `encrypted_${fileName}`,
            contentType: 'application/octet-stream'
        });

        // Add metadata
        const metadata = JSON.stringify({
            name: `MedChainID_${recordType}_${Date.now()}`,
            keyvalues: {
                recordType,
                encrypted: 'true',
                timestamp: new Date().toISOString()
            }
        });
        formData.append('pinataMetadata', metadata);

        // Upload to Pinata
        const response = await axios.post(PINATA_API_URL, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        console.log('✅ File uploaded to IPFS via Pinata');
        return response.data.IpfsHash;

    } catch (error) {
        console.error('IPFS Upload Error:', error.response?.data || error.message);
        throw new Error('Failed to upload to IPFS');
    }
}

/**
 * Get file from IPFS
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<Buffer>} - File buffer
 */
export async function getFromIPFS(cid) {
    try {
        const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        return Buffer.from(response.data);

    } catch (error) {
        console.error('IPFS Retrieval Error:', error.message);
        throw new Error('Failed to retrieve from IPFS');
    }
}

/**
 * Check if a file exists on IPFS
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<boolean>} - True if file exists
 */
export async function checkIPFSExists(cid) {
    try {
        const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const response = await axios.head(url);
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

/**
 * Get metadata for a pinned file
 * @param {string} cid - IPFS Content Identifier
 * @returns {Promise<object>} - File metadata
 */
export async function getFileMetadata(cid) {
    try {
        const url = `https://api.pinata.cloud/data/pinList?hashContains=${cid}`;
        const response = await axios.get(url, {
            headers: {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }
        });

        if (response.data.rows.length > 0) {
            return response.data.rows[0];
        }
        return null;

    } catch (error) {
        console.error('Metadata Retrieval Error:', error.message);
        throw new Error('Failed to get file metadata');
    }
}
