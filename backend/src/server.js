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
const { passport } = require('./auth');
const authRoutes = require('./authRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

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
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'MedChainID Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
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
        const { recordType } = req.body; // Extract recordType from form data
        
        console.log('\n📄 Processing Document Upload');
        console.log('================================');
        console.log(`   Filename: ${originalname}`);
        console.log(`   MIME Type: ${mimetype}`);
        console.log(`   Size: ${(size / 1024).toFixed(2)} KB`);
        console.log(`   Record Type: ${recordType || 'not specified'}`);
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
        const ipfsCid = await uploadToPinata(encryptedBuffer, originalname, recordType);
        console.log(`   IPFS CID: ${ipfsCid}`);

        // ===== SUCCESS RESPONSE =====
        const processingTime = Date.now() - startTime;
        console.log(`\n✅ Upload Complete in ${processingTime}ms\n`);

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

        res.status(500).json({
            success: false,
            error: 'Failed to process document',
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

        console.log(`🔓 Decrypting document: ${cid}`);

        // Get encrypted file from IPFS
        const encryptedBuffer = await getFromIPFS(cid);

        // Decrypt using provided key
        // Note: In production, validate user authorization before decrypting
        const crypto = require('crypto');
        
        // Validate key format
        if (key.length !== 64) {
            throw new Error('Invalid encryption key format (must be 64 hex characters)');
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
        res.status(500).json({
            success: false,
            error: 'Decryption failed',
            message: error.message
        });
    }
});

// ============================================
// Authentication Routes
// ============================================

app.use('/api/auth', authRoutes);

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
    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🏥  MedChainID Backend Server');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 ML Service: ${ML_SERVICE_URL}`);
    console.log(`📦 Max File Size: ${process.env.MAX_FILE_SIZE || 10}MB`);
    console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Enabled' : 'Not configured'}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✅ Server is ready to accept requests\n');
    console.log('Available Endpoints:');
    console.log('  GET  /api/health');
    console.log('  POST /api/upload');
    console.log('  POST /api/verify');
    console.log('  GET  /api/download/:cid');
    console.log('  POST /api/decrypt-view');
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
