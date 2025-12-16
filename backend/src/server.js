import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { uploadToIPFS } from './ipfs.js';
import { encryptFile, generateHash } from './encryption.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'MedChainID Backend is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * Upload and process medical document
 * 1. Receives file from frontend
 * 2. Generates SHA-256 hash
 * 3. Encrypts the file with AES-256
 * 4. Uploads encrypted file to IPFS
 * 5. Returns hash and IPFS CID to frontend
 */
app.post('/api/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { recordType } = req.body;
        if (!recordType) {
            return res.status(400).json({ error: 'Record type is required' });
        }

        console.log(`Processing file: ${req.file.originalname}`);
        console.log(`Record Type: ${recordType}`);

        // Step 1: Generate SHA-256 hash of original file
        const documentHash = generateHash(req.file.buffer);
        console.log(`Generated Hash: ${documentHash}`);

        // Step 2: Encrypt the file
        const encryptedBuffer = encryptFile(req.file.buffer);
        console.log('File encrypted successfully');

        // Step 3: Upload encrypted file to IPFS
        const ipfsCID = await uploadToIPFS(
            encryptedBuffer,
            req.file.originalname,
            recordType
        );
        console.log(`Uploaded to IPFS: ${ipfsCID}`);

        // Step 4: Return hash and CID to frontend
        res.json({
            success: true,
            data: {
                documentHash,
                ipfsCID,
                fileName: req.file.originalname,
                recordType,
                fileSize: req.file.size,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ 
            error: 'Failed to process document',
            message: error.message 
        });
    }
});

/**
 * Verify document integrity
 * Allows users to upload a file and check if it matches a known hash
 */
app.post('/api/verify', upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { expectedHash } = req.body;
        if (!expectedHash) {
            return res.status(400).json({ error: 'Expected hash is required' });
        }

        const actualHash = generateHash(req.file.buffer);
        const isValid = actualHash === expectedHash;

        res.json({
            success: true,
            data: {
                isValid,
                actualHash,
                expectedHash,
                message: isValid ? 'Document is authentic' : 'Document has been tampered with'
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ 
            error: 'Failed to verify document',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🏥 MedChainID Backend Server`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN}`);
    console.log(`⛓️  Aptos Network: ${process.env.APTOS_NETWORK}`);
});

export default app;
