/**
 * server.js
 * Main Express server for MedChainID Backend
 * 
 * Primary Endpoint: POST /api/upload
 * 
 * Flow:
 * 1. Receive file from frontend
 * 2. Validate file exists
 * 3. Generate SHA-256 hash of original file (for blockchain)
 * 4. Extract text from PDF (if applicable)
 * 5. Send text to ML service for fraud detection analysis
 * 6. Encrypt original file buffer with AES-256-CBC
 * 7. Upload encrypted buffer to IPFS via Pinata
 * 8. Return hash, IPFS CID, and ML risk analysis to frontend
 * 
 * Security: NEVER upload unencrypted files to IPFS
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Import utility modules
const { encryptBuffer, generateHash, verifyHash } = require('./utils/encryption');
const { uploadToPinata, getFromIPFS } = require('./utils/ipfs');
const { 
    saveDocument, 
    getDocumentByHash,
    getDocumentByCid,
    getDocumentsByUploader,
    getAllDocuments,
    saveToken,
    getTokensByPatient,
    getTokensByIssuer,
    getAllTokens,
    getStatistics
} = require('./utils/database');
const { passport } = require('./auth');
const authRoutes = require('./authRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001';

// ============================================
// Middleware Configuration
// ============================================

// CORS - Allow frontend to make requests
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// File Upload Configuration (Multer)
// ============================================

// Use memory storage (files stored in RAM as Buffer)
const storage = multer.memoryStorage();

// File filter - accept only PDFs and images
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
    }
};

// Multer configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: (process.env.MAX_FILE_SIZE || 10) * 1024 * 1024 // Default 10MB
    }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate IPFS CID format
 * @param {string} cid - IPFS Content ID to validate
 * @returns {boolean} - True if valid CID format
 */
function isValidCID(cid) {
    if (!cid || typeof cid !== 'string') return false;
    // CIDv0: Starts with "Qm" and is 46 characters
    // CIDv1: Starts with "b" and is longer
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^b[a-z2-7]{58,}$/;
    return cidv0Regex.test(cid) || cidv1Regex.test(cid);
}

/**
 * Sanitize record type string
 * @param {string} recordType - Record type to sanitize
 * @returns {string} - Sanitized record type
 */
function sanitizeRecordType(recordType) {
    if (!recordType || typeof recordType !== 'string') return '';
    // Remove any HTML tags and trim
    return recordType.replace(/<[^>]*>/g, '').trim().substring(0, 100);
}

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('❌ PDF text extraction failed:', error.message);
        throw new Error('Failed to extract text from PDF');
    }
}

/**
 * Analyze document with ML service
 * @param {string} text - Extracted document text
 * @param {string} filename - Original filename
 * @returns {Promise<object>} - ML analysis result
 */
async function analyzeWithML(text, filename) {
    try {
        console.log(`🤖 Sending to ML service: ${ML_SERVICE_URL}/api/ocr-verify`);
        console.log(`   Text length: ${text.length} characters`);

        const response = await axios.post(`${ML_SERVICE_URL}/api/ocr-verify`, {
            text: text,
            filename: filename,
            timestamp: new Date().toISOString()
        }, {
            timeout: 60000, // 60 second timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = response.data.data || response.data;
        
        console.log('✅ ML Analysis Complete:');
        console.log(`   Verified: ${result.verified || 'N/A'}`);
        console.log(`   Confidence: ${result.confidence || 'N/A'}`);
        console.log(`   Message: ${result.message || 'N/A'}`);

        return {
            verified: result.verified || false,
            confidence: result.confidence || 0.5,
            message: result.message || 'Analysis completed',
            riskFlags: result.risk_flags || []
        };

    } catch (error) {
        console.error('❌ ML service error:', error.message);
        
        // If ML service is down, return default safe values
        console.warn('⚠️  ML service unavailable - using default risk assessment');
        return {
            verified: false,
            confidence: 0.5,
            message: 'ML service unavailable. Manual review recommended.',
            riskFlags: ['ML_SERVICE_UNAVAILABLE']
        };
    }
}

// ============================================
// API Routes
// ============================================

/**
 * Health check endpoint with service dependency monitoring
 * GET /api/health
 */
app.get('/api/health', async (req, res) => {
    const health = {
        status: 'ok',
        service: 'MedChainID Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        dependencies: {
            mlService: { status: 'unknown', url: ML_SERVICE_URL },
            ipfs: { status: 'unknown', provider: 'Pinata' },
            encryption: { status: 'ok', algorithm: 'AES-256-CBC' }
        }
    };

    // Check ML Service
    try {
        const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/health`, { timeout: 5000 });
        health.dependencies.mlService.status = mlResponse.data.status === 'ok' ? 'healthy' : 'degraded';
        health.dependencies.mlService.geminiConfigured = mlResponse.data.gemini_configured || false;
    } catch (error) {
        health.dependencies.mlService.status = 'unhealthy';
        health.dependencies.mlService.error = error.message;
    }

    // Check Pinata IPFS
    health.dependencies.ipfs.status = (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) ? 'configured' : 'not_configured';

    // Overall health status
    const allHealthy = health.dependencies.mlService.status !== 'unhealthy' && 
                      health.dependencies.ipfs.status === 'configured';
    
    health.status = allHealthy ? 'ok' : 'degraded';

    res.status(health.status === 'ok' ? 200 : 503).json(health);
});

/**
 * Main upload endpoint - THE CORE OF THE BACKEND
 * POST /api/upload
 * 
 * Request: multipart/form-data with 'document' file field
 * Response: { success, docHash, ipfsCid, riskAnalysis }
 */
app.post('/api/upload', upload.single('document'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // ===== STEP 1: VALIDATION =====
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded. Please attach a document.'
            });
        }

        const { originalname, mimetype, size, buffer } = req.file;
        const { recordType: rawRecordType } = req.body; // Extract recordType from form data
        
        // Validate and sanitize recordType
        if (!rawRecordType || typeof rawRecordType !== 'string' || rawRecordType.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'recordType is required. Please provide a record type (e.g., "Lab Report", "Prescription", "X-Ray").'
            });
        }
        
        const recordType = sanitizeRecordType(rawRecordType);
        
        if (recordType.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid recordType. Please provide a valid record type.'
            });
        }
        
        console.log('\n📄 Processing Document Upload');
        console.log('================================');
        console.log(`   Filename: ${originalname}`);
        console.log(`   MIME Type: ${mimetype}`);
        console.log(`   Size: ${(size / 1024).toFixed(2)} KB`);
        console.log(`   Record Type: ${recordType}`);
        console.log('================================\n');

        // ===== STEP 2: GENERATE HASH =====
        console.log('🔐 Step 1/5: Generating SHA-256 hash...');
        const docHash = generateHash(buffer);
        console.log(`   Hash: ${docHash.substring(0, 20)}...${docHash.substring(docHash.length - 10)}`);

        // ===== STEP 3: TEXT EXTRACTION (if PDF) =====
        let extractedText = '';
        let riskAnalysis = null;

        if (mimetype === 'application/pdf') {
            console.log('\n📝 Step 2/5: Extracting text from PDF...');
            try {
                extractedText = await extractTextFromPDF(buffer);
                console.log(`   Extracted ${extractedText.length} characters`);
                console.log(`   Preview: ${extractedText.substring(0, 100)}...`);
            } catch (error) {
                console.warn('⚠️  Could not extract text from PDF, skipping ML analysis');
            }
        } else {
            console.log('\n⏭️  Step 2/5: Skipping text extraction (not a PDF)');
        }

        // ===== STEP 4: ML FRAUD ANALYSIS =====
        if (extractedText && extractedText.length > 10) {
            console.log('\n🤖 Step 3/5: Running ML fraud detection...');
            riskAnalysis = await analyzeWithML(extractedText, originalname);
        } else {
            console.log('\n⏭️  Step 3/5: Skipping ML analysis (no text extracted)');
            riskAnalysis = {
                score: 0,
                verdict: 'NO_TEXT_EXTRACTED',
                details: 'Document is an image or text extraction failed'
            };
        }

        // ===== STEP 5: ENCRYPTION =====
        console.log('\n🔒 Step 4/5: Encrypting file with AES-256-CBC...');
        const encryptedBuffer = encryptBuffer(buffer);
        console.log(`   Original: ${size} bytes`);
        console.log(`   Encrypted: ${encryptedBuffer.length} bytes`);

        // ===== STEP 6: IPFS UPLOAD =====
        console.log('\n☁️  Step 5/5: Uploading to IPFS via Pinata...');
        let ipfsCid;
        try {
            ipfsCid = await uploadToPinata(encryptedBuffer, originalname, recordType);
            console.log(`   IPFS CID: ${ipfsCid}`);
        } catch (ipfsError) {
            console.error('❌ IPFS Upload Error:', ipfsError.message);
            // Re-throw with more context
            throw new Error(`IPFS upload failed: ${ipfsError.message}. Please check Pinata API configuration.`);
        }

        // ===== SUCCESS RESPONSE =====
        const processingTime = Date.now() - startTime;
        console.log(`\n✅ Upload Complete in ${processingTime}ms\n`);

        // Save document metadata to database
        try {
            saveDocument({
                documentHash: docHash,
                ipfsCid: ipfsCid,
                recordType: recordType,
                filename: originalname,
                fileSize: size,
                mimeType: mimetype,
                uploaderEmail: req.user?.email,
                uploaderName: req.user?.name,
                riskAnalysis: riskAnalysis
            });
            console.log('💾 Document metadata saved to database');
        } catch (dbError) {
            console.error('⚠️  Failed to save to database:', dbError.message);
            // Continue anyway - document is on IPFS
        }

        res.json({
            success: true,
            docHash: docHash,
            ipfsCid: ipfsCid,
            riskAnalysis: riskAnalysis,
            metadata: {
                filename: originalname,
                fileSize: size,
                mimeType: mimetype,
                processingTime: `${processingTime}ms`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('\n❌ Upload Failed:', error.message);
        console.error(`   Failed after ${processingTime}ms\n`);
        console.error('   Stack:', error.stack);

        // Provide more specific error messages based on error type
        let statusCode = 500;
        let errorMessage = 'Failed to process document';
        
        if (error.message.includes('Pinata API')) {
            errorMessage = 'IPFS upload failed. Please check Pinata API configuration.';
            statusCode = 503; // Service Unavailable
        } else if (error.message.includes('Encryption failed')) {
            errorMessage = 'File encryption failed. Please try again.';
            statusCode = 500;
        } else if (error.message.includes('IPFS upload failed')) {
            errorMessage = 'Failed to upload to IPFS. Please check your network connection and Pinata configuration.';
            statusCode = 503;
        } else if (error.message.includes('Hash generation failed')) {
            errorMessage = 'Document hash generation failed. Please try again.';
            statusCode = 500;
        }

        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Verify document hash endpoint
 * POST /api/verify
 * 
 * Request: multipart/form-data with 'document' file and 'expectedHash' field
 * Response: { valid, hash, message }
 */
app.post('/api/verify', upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const { expectedHash } = req.body;
        if (!expectedHash) {
            return res.status(400).json({
                success: false,
                error: 'Expected hash is required'
            });
        }

        const actualHash = generateHash(req.file.buffer);
        const isValid = verifyHash(req.file.buffer, expectedHash);

        res.json({
            success: true,
            valid: isValid,
            actualHash: actualHash,
            expectedHash: expectedHash,
            message: isValid 
                ? 'Document verified successfully' 
                : 'Document hash mismatch - file may be tampered'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: error.message
        });
    }
});

/**
 * Download and decrypt document from IPFS
 * GET /api/download/:cid
 * 
 * Note: Requires encryption key - only authorized parties can decrypt
 */
app.get('/api/download/:cid', async (req, res) => {
    try {
        const { cid } = req.params;

        if (!cid) {
            return res.status(400).json({
                success: false,
                error: 'IPFS CID is required'
            });
        }
        
        // Validate CID format
        if (!isValidCID(cid)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IPFS CID format'
            });
        }

        console.log(`📥 Downloading from IPFS: ${cid}`);

        // Get encrypted file from IPFS
        const encryptedBuffer = await getFromIPFS(cid);

        // Note: In production, add authorization check here
        // Only authorized users should be able to decrypt files

        // Return encrypted buffer (frontend will decrypt if they have the key)
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="encrypted_${cid}"`
        });

        res.send(encryptedBuffer);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            error: 'Download failed',
            message: error.message
        });
    }
});

/**
 * Decrypt and view document from IPFS
 * POST /api/decrypt-view
 * 
 * Body: { cid: string, key: string }
 * 
 * Note: For demo/hackathon - backend decrypts with provided key
 * In production, implement proper access control and key management
 */
app.post('/api/decrypt-view', async (req, res) => {
    try {
        const { cid, key } = req.body;

        if (!cid || !key) {
            return res.status(400).json({
                success: false,
                error: 'CID and decryption key are required'
            });
        }
        
        // Validate CID format
        if (!isValidCID(cid)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid IPFS CID format'
            });
        }

        console.log(`🔓 Decrypting document: ${cid}`);

        // Get encrypted file from IPFS
        const encryptedBuffer = await getFromIPFS(cid);

        // Decrypt using provided key
        // Note: In production, validate user authorization before decrypting
        const crypto = require('crypto');
        
        // Validate key format
        if (!key || typeof key !== 'string' || key.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(key)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request. Please check the CID and key format.'
            });
        }
        
        // Extract IV from encrypted buffer
        const IV_LENGTH = 16;
        if (encryptedBuffer.length < IV_LENGTH) {
            throw new Error('Invalid encrypted buffer');
        }
        
        const iv = encryptedBuffer.slice(0, IV_LENGTH);
        const encryptedData = encryptedBuffer.slice(IV_LENGTH);
        
        // Decrypt with provided key
        const keyBuffer = Buffer.from(key, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
        
        const decryptedBuffer = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);

        console.log(`✅ Document decrypted: ${decryptedBuffer.length} bytes`);

        // Detect content type from buffer (simple detection)
        let contentType = 'application/octet-stream';
        if (decryptedBuffer[0] === 0xFF && decryptedBuffer[1] === 0xD8) {
            contentType = 'image/jpeg';
        } else if (decryptedBuffer[0] === 0x89 && decryptedBuffer[1] === 0x50) {
            contentType = 'image/png';
        } else if (decryptedBuffer[0] === 0x25 && decryptedBuffer[1] === 0x50) {
            contentType = 'application/pdf';
        }

        // Return decrypted document
        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
        });

        res.send(decryptedBuffer);

    } catch (error) {
        console.error('Decrypt-view error:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'The key may be incorrect or the file may be corrupted.';
        if (error.message.includes('Invalid encrypted buffer')) {
            errorMessage = 'The encrypted file is corrupted or incomplete.';
        } else if (error.message.includes('wrong final block length')) {
            errorMessage = 'Incorrect decryption key. Please verify the key and try again.';
        } else if (error.message.includes('File not found')) {
            errorMessage = 'Document not found on IPFS. The CID may be incorrect.';
        }
        
        res.status(500).json({
            success: false,
            error: 'Decryption failed',
            message: errorMessage
        });
    }
});

// ============================================
// Authentication Routes
// ============================================

app.use('/api/auth', authRoutes);

// ============================================
// Database Query Routes
// ============================================

/**
 * Get all stored documents
 * GET /api/documents
 */
app.get('/api/documents', (req, res) => {
    try {
        const { limit = 100, offset = 0, uploader } = req.query;
        
        let documents;
        if (uploader) {
            documents = getDocumentsByUploader(uploader);
        } else {
            documents = getAllDocuments(parseInt(limit), parseInt(offset));
        }

        res.json({
            success: true,
            count: documents.length,
            documents: documents.map(doc => ({
                id: doc.id,
                documentHash: doc.document_hash,
                ipfsCid: doc.ipfs_cid,
                recordType: doc.record_type,
                filename: doc.filename,
                fileSize: doc.file_size,
                mimeType: doc.mime_type,
                uploaderEmail: doc.uploader_email,
                uploaderName: doc.uploader_name,
                riskVerified: doc.risk_verified === 1,
                riskConfidence: doc.risk_confidence,
                riskMessage: doc.risk_message,
                riskFlags: JSON.parse(doc.risk_flags || '[]'),
                createdAt: doc.created_at,
                updatedAt: doc.updated_at
            }))
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve documents',
            message: error.message
        });
    }
});

/**
 * Get document by hash
 * GET /api/documents/:hash
 */
app.get('/api/documents/:hash', (req, res) => {
    try {
        const { hash } = req.params;
        const document = getDocumentByHash(hash);

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        res.json({
            success: true,
            document: {
                id: document.id,
                documentHash: document.document_hash,
                ipfsCid: document.ipfs_cid,
                recordType: document.record_type,
                filename: document.filename,
                fileSize: document.file_size,
                mimeType: document.mime_type,
                uploaderEmail: document.uploader_email,
                uploaderName: document.uploader_name,
                riskVerified: document.risk_verified === 1,
                riskConfidence: document.risk_confidence,
                riskMessage: document.risk_message,
                riskFlags: JSON.parse(document.risk_flags || '[]'),
                createdAt: document.created_at,
                updatedAt: document.updated_at
            }
        });
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve document',
            message: error.message
        });
    }
});

/**
 * Get all stored tokens
 * GET /api/tokens
 */
app.get('/api/tokens', (req, res) => {
    try {
        const { limit = 100, offset = 0, patient, issuer } = req.query;
        
        let tokens;
        if (patient) {
            tokens = getTokensByPatient(patient);
        } else if (issuer) {
            tokens = getTokensByIssuer(issuer);
        } else {
            tokens = getAllTokens(parseInt(limit), parseInt(offset));
        }

        res.json({
            success: true,
            count: tokens.length,
            tokens: tokens.map(token => ({
                id: token.id,
                tokenId: token.token_id,
                documentHash: token.document_hash,
                ipfsCid: token.ipfs_cid,
                recordType: token.record_type,
                patientAddress: token.patient_address,
                issuerAddress: token.issuer_address,
                blockchainTxHash: token.blockchain_tx_hash,
                isConsumed: token.is_consumed === 1,
                blockchainTimestamp: token.blockchain_timestamp,
                filename: token.filename,
                mimeType: token.mime_type,
                riskVerified: token.risk_verified === 1,
                createdAt: token.created_at,
                updatedAt: token.updated_at
            }))
        });
    } catch (error) {
        console.error('Get tokens error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve tokens',
            message: error.message
        });
    }
});

/**
 * Save token to database (called from frontend after minting)
 * POST /api/tokens
 */
app.post('/api/tokens', express.json(), (req, res) => {
    try {
        const {
            tokenId,
            documentHash,
            ipfsCid,
            recordType,
            patientAddress,
            issuerAddress,
            blockchainTxHash,
            isConsumed,
            blockchainTimestamp
        } = req.body;

        // Validate required fields
        if (!tokenId || !documentHash || !ipfsCid || !patientAddress || !issuerAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const dbId = saveToken({
            tokenId,
            documentHash,
            ipfsCid,
            recordType,
            patientAddress,
            issuerAddress,
            blockchainTxHash,
            isConsumed,
            blockchainTimestamp
        });

        res.json({
            success: true,
            message: 'Token saved successfully',
            dbId: dbId
        });
    } catch (error) {
        console.error('Save token error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save token',
            message: error.message
        });
    }
});

/**
 * Get database statistics
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
    try {
        const stats = getStatistics();
        res.json({
            success: true,
            statistics: stats
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});

// ============================================
// Error Handling Middleware
// ============================================

// Handle 404 - Route not found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Global Error Handler:', err);

    // Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                message: `Maximum file size is ${process.env.MAX_FILE_SIZE || 10}MB`
            });
        }
        return res.status(400).json({
            success: false,
            error: 'File upload error',
            message: err.message
        });
    }

    // Other errors
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    const stats = getStatistics();
    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🏥  MedChainID Backend Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 ML Service: ${ML_SERVICE_URL}`);
    console.log(`📦 Max File Size: ${process.env.MAX_FILE_SIZE || 10}MB`);
    console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Enabled' : 'Not configured'}`);
    console.log(`💾 Database: SQLite (${stats.totalDocuments} docs, ${stats.totalTokens} tokens)`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✅ Server is ready to accept requests\n');
    console.log('Available Endpoints:');
    console.log('  GET  /api/health');
    console.log('  POST /api/upload');
    console.log('  POST /api/verify');
    console.log('  GET  /api/download/:cid');
    console.log('  POST /api/decrypt-view');
    console.log('  GET  /api/documents');
    console.log('  GET  /api/documents/:hash');
    console.log('  GET  /api/tokens');
    console.log('  POST /api/tokens');
    console.log('  GET  /api/stats');
    console.log('  *    /api/auth/*');
    console.log('\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
