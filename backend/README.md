# MedChainID Backend Server 🏥

**Production-ready Node.js backend serving as the Security Edge for MedChainID**

## 🎯 Purpose

This backend acts as a secure middleman between:
- **Frontend Client** (React/TypeScript)
- **Off-chain Storage** (IPFS via Pinata)
- **ML Fraud Detection** (Python ML service)

## 🛡️ Security Architecture

### Core Security Principles
1. **Never upload unencrypted files to IPFS**
2. **Hash original files for blockchain verification**
3. **Encrypt before storage**
4. **ML analysis on extracted text only**

### Flow Diagram
```
User Upload → Validation → Hash Generation → Text Extraction (PDF)
     ↓
ML Analysis → Encryption → IPFS Upload → Return Response
     ↓
{docHash, ipfsCid, riskAnalysis}
```

## 📦 Tech Stack

- **Runtime:** Node.js (v16+)
- **Framework:** Express.js
- **Language:** JavaScript (CommonJS)
- **Key Libraries:**
  - `multer` - File uploads
  - `crypto` (native) - AES-256-CBC encryption
  - `axios` - HTTP requests
  - `pdf-parse` - PDF text extraction
  - `form-data` - Multipart form data
  - `dotenv` - Environment configuration

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example and edit with your keys
cp .env.example .env
```

Edit `.env` with:
- **PINATA_API_KEY** & **PINATA_SECRET_API_KEY** from [Pinata](https://app.pinata.cloud/)
- **ENCRYPTION_KEY** - Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **ML_SERVICE_URL** - Your Python ML service endpoint (default: http://localhost:5000)

### 3. Start Server
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs on: **http://localhost:5000**

## 📡 API Endpoints

### 1. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "MedChainID Backend",
  "version": "1.0.0",
  "timestamp": "2025-12-17T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

### 2. Upload Document (PRIMARY ENDPOINT)
```http
POST /api/upload
Content-Type: multipart/form-data
```

**Request:**
- **Field:** `document` (file)
- **Supported:** PDF, JPEG, PNG, GIF
- **Max Size:** 10MB (configurable)

**Response:**
```json
{
  "success": true,
  "docHash": "0x1a2b3c...",
  "ipfsCid": "QmXyZ...",
  "riskAnalysis": {
    "score": 10,
    "verdict": "CLEAN",
    "details": "No anomalies detected"
  },
  "metadata": {
    "filename": "prescription.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "processingTime": "1234ms",
    "timestamp": "2025-12-17T10:30:00.000Z"
  }
}
```

**Processing Steps:**
1. ✅ **Validation** - Check file exists and type
2. 🔐 **Hash Generation** - SHA-256 of original file
3. 📝 **Text Extraction** - Extract text from PDF
4. 🤖 **ML Analysis** - Send to fraud detection service
5. 🔒 **Encryption** - AES-256-CBC with unique IV
6. ☁️ **IPFS Upload** - Upload encrypted file to Pinata
7. 📤 **Response** - Return hash, CID, and risk analysis

---

### 3. Verify Document
```http
POST /api/verify
Content-Type: multipart/form-data
```

**Request:**
- **Field:** `document` (file)
- **Field:** `expectedHash` (string)

**Response:**
```json
{
  "success": true,
  "valid": true,
  "actualHash": "0x1a2b3c...",
  "expectedHash": "0x1a2b3c...",
  "message": "Document verified successfully"
}
```

---

### 4. Download from IPFS
```http
GET /api/download/:cid
```

**Response:** Encrypted file buffer (application/octet-stream)

**Note:** Requires decryption key to access original file.

## 🔐 Encryption Details

### Algorithm: AES-256-CBC

- **Key Size:** 256 bits (32 bytes)
- **Block Size:** 128 bits (16 bytes)
- **IV:** Randomly generated per file
- **Format:** `[IV (16 bytes)][Encrypted Data]`

### Implementation
```javascript
const { encryptBuffer, decryptBuffer } = require('./utils/encryption');

// Encrypt
const encrypted = encryptBuffer(originalBuffer);
// Format: IV prepended to encrypted data

// Decrypt
const original = decryptBuffer(encrypted);
```

### Security Features
- ✅ Unique IV per file (prevents pattern analysis)
- ✅ IV prepended to ciphertext (simplifies decryption)
- ✅ Secure key from environment (never hardcoded)
- ✅ Validation on startup (ensures proper key format)

## ☁️ IPFS Integration

### Pinata Cloud Service

```javascript
const { uploadToPinata, getFromIPFS } = require('./utils/ipfs');

// Upload encrypted buffer
const cid = await uploadToPinata(encryptedBuffer, 'document.pdf');

// Retrieve encrypted buffer
const buffer = await getFromIPFS(cid);
```

### Metadata Stored
- App: MedChainID
- Encrypted: true
- Original filename
- Upload timestamp
- Version

## 🤖 ML Integration

### Fraud Detection Flow

```javascript
// Extract text from PDF
const text = await extractTextFromPDF(buffer);

// Analyze with ML service
const analysis = await analyzeWithML(text, filename);
```

### ML Service Contract
**Endpoint:** `POST /analyze`

**Request:**
```json
{
  "text": "extracted document text...",
  "filename": "document.pdf",
  "timestamp": "2025-12-17T10:30:00.000Z"
}
```

**Response:**
```json
{
  "score": 10,
  "verdict": "CLEAN",
  "details": "Document appears authentic"
}
```

### Fallback Behavior
If ML service is unavailable:
```json
{
  "score": 50,
  "verdict": "ML_SERVICE_UNAVAILABLE",
  "details": "ML service could not be reached. Manual review recommended."
}
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js              # Main Express application
│   └── utils/
│       ├── encryption.js      # AES-256-CBC encryption/decryption
│       └── ipfs.js           # Pinata IPFS upload/download
├── .env                       # Environment variables (git-ignored)
├── .env.example              # Environment template
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | No | Environment | `development` |
| `CORS_ORIGIN` | No | Frontend URL | `http://localhost:5173` |
| `PINATA_API_KEY` | **Yes** | Pinata API key | `your_api_key` |
| `PINATA_SECRET_API_KEY` | **Yes** | Pinata secret | `your_secret` |
| `ENCRYPTION_KEY` | **Yes** | 64-char hex key | `1e4ae9d7...` |
| `ML_SERVICE_URL` | No | ML service URL | `http://localhost:5000` |
| `MAX_FILE_SIZE` | No | Max upload (MB) | `10` |

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

### Test Upload Endpoint
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "document=@test.pdf"
```

### Test with Postman
1. Import endpoints to Postman
2. Set `Content-Type: multipart/form-data`
3. Add `document` file field
4. Send request

## 📊 Logging

The server logs detailed information:
- ✅ Request timestamps and paths
- 🔐 Hash generation
- 📝 Text extraction progress
- 🤖 ML analysis results
- 🔒 Encryption status
- ☁️ IPFS upload status
- ❌ Error details

Example log:
```
📄 Processing Document Upload
================================
   Filename: prescription.pdf
   MIME Type: application/pdf
   Size: 240.12 KB
================================

🔐 Step 1/5: Generating SHA-256 hash...
   Hash: 0x1a2b3c4d5e6f...

📝 Step 2/5: Extracting text from PDF...
   Extracted 1234 characters

🤖 Step 3/5: Running ML fraud detection...
   Risk Score: 10
   Verdict: CLEAN

🔒 Step 4/5: Encrypting file with AES-256-CBC...
   Original: 245678 bytes
   Encrypted: 245694 bytes

☁️ Step 5/5: Uploading to IPFS via Pinata...
   IPFS CID: QmXyZ123...

✅ Upload Complete in 1234ms
```

## 🛠️ Error Handling

### File Validation Errors
- Missing file → 400 Bad Request
- Invalid file type → 400 Bad Request
- File too large → 400 Bad Request

### Processing Errors
- Hash generation failure → 500 Internal Server Error
- Encryption failure → 500 Internal Server Error
- IPFS upload failure → 500 Internal Server Error

### ML Service Errors
- Service unavailable → Continues with fallback verdict
- Analysis timeout → 30-second timeout, then fallback

## 🔒 Security Considerations

### Production Checklist
- [ ] Use HTTPS/SSL in production
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Validate all inputs
- [ ] Implement request signing
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Key rotation strategy
- [ ] Backup encryption keys securely

### Current Limitations (MVP)
- ⚠️ No authentication on endpoints
- ⚠️ No rate limiting
- ⚠️ Keys stored in .env (use secret manager in production)
- ⚠️ No request validation middleware

## 📈 Performance

- **File Upload:** < 2 seconds (for 10MB file)
- **Encryption:** ~100ms per MB
- **IPFS Upload:** ~1-2 seconds (network dependent)
- **ML Analysis:** ~500ms (depends on ML service)

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <process_id> /F
```

### IPFS upload fails
- Check Pinata API keys
- Verify internet connection
- Check file size limits
- Review Pinata dashboard for quota

### Encryption errors
- Verify `ENCRYPTION_KEY` is 64 hex characters
- Check key is properly set in .env
- Ensure no whitespace in key

### ML service unavailable
- Check ML service is running
- Verify `ML_SERVICE_URL` is correct
- Backend will continue with fallback verdict

## 📚 Dependencies

```json
{
  "express": "^4.18.2",      // Web framework
  "cors": "^2.8.5",          // CORS middleware
  "dotenv": "^16.3.1",       // Environment config
  "multer": "^1.4.5-lts.1",  // File uploads
  "axios": "^1.6.2",         // HTTP requests
  "form-data": "^4.0.0",     // Multipart forms
  "pdf-parse": "^1.1.1"      // PDF text extraction
}
```

## 🤝 Contributing

This is a hackathon MVP. For production use:
1. Add comprehensive tests
2. Implement authentication
3. Add input validation
4. Set up CI/CD
5. Add monitoring
6. Implement caching
7. Database for metadata

## 📄 License

MIT

## 👥 Team

MedChainID - Decentralized Medical Identity on Aptos Blockchain

---

**Ready to run!** 🚀

```bash
npm start
# Server running on http://localhost:5000
```
