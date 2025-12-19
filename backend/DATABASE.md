# 💾 MedChainID Database Documentation

## Overview

MedChainID now includes a **SQLite database** (using sql.js) to store document and token metadata locally. This provides:
- 📊 Fast querying without blockchain calls
- 📜 Complete audit trail of all uploads and mints
- 🔍 Easy filtering and searching
- 📈 Statistics and analytics
- ✅ **No native compilation required** - works on all platforms without Visual Studio

**Database Technology:** sql.js (pure JavaScript/WebAssembly SQLite)  
**Database Location:** `backend/data/medchain.db`  
**Auto-save:** Every 5 seconds and on server shutdown

### Why sql.js?

The database uses `sql.js` instead of `better-sqlite3` because:
- ✅ No native compilation - works immediately on Windows without Visual Studio
- ✅ Cross-platform - same code works on Windows, macOS, Linux
- ✅ Easy installation - `npm install` just works
- ✅ Full SQLite feature support including foreign keys and indexes

---

## Database Schema

### Documents Table

Stores metadata for all uploaded documents.

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_hash TEXT NOT NULL UNIQUE,
    ipfs_cid TEXT NOT NULL,
    record_type TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    uploader_email TEXT,
    uploader_name TEXT,
    risk_verified BOOLEAN DEFAULT 0,
    risk_confidence REAL DEFAULT 0.0,
    risk_message TEXT,
    risk_flags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `document_hash` - SHA-256 hash (unique identifier)
- `ipfs_cid` - IPFS Content ID where encrypted file is stored
- `record_type` - Type of medical record (e.g., "Lab Report")
- `filename` - Original filename
- `file_size` - File size in bytes
- `mime_type` - MIME type (e.g., "application/pdf")
- `uploader_email` - Email of user who uploaded (from Google OAuth)
- `uploader_name` - Name of user who uploaded
- `risk_verified` - Boolean: AI verification passed
- `risk_confidence` - AI confidence score (0.0 to 1.0)
- `risk_message` - AI verification message
- `risk_flags` - JSON array of risk flags
- `created_at` - Upload timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- `idx_documents_hash` on `document_hash`
- `idx_documents_ipfs_cid` on `ipfs_cid`
- `idx_documents_uploader` on `uploader_email`

---

### Tokens Table

Stores metadata for all minted blockchain tokens.

```sql
CREATE TABLE tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER NOT NULL,
    document_hash TEXT NOT NULL,
    ipfs_cid TEXT NOT NULL,
    record_type TEXT NOT NULL,
    patient_address TEXT NOT NULL,
    issuer_address TEXT NOT NULL,
    blockchain_tx_hash TEXT,
    is_consumed BOOLEAN DEFAULT 0,
    blockchain_timestamp INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_hash) REFERENCES documents(document_hash)
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `token_id` - Blockchain token ID
- `document_hash` - Reference to document
- `ipfs_cid` - IPFS Content ID
- `record_type` - Type of medical record
- `patient_address` - Aptos wallet address of patient (owner)
- `issuer_address` - Aptos wallet address of hospital/issuer
- `blockchain_tx_hash` - Transaction hash from blockchain
- `is_consumed` - Boolean: token has been consumed
- `blockchain_timestamp` - Blockchain timestamp
- `created_at` - Database creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- `idx_tokens_patient` on `patient_address`
- `idx_tokens_issuer` on `issuer_address`
- `idx_tokens_document` on `document_hash`

---

## API Endpoints

### Get All Documents

Retrieve all stored documents with optional filtering.

```http
GET /api/documents?limit=100&offset=0&uploader=email@example.com
```

**Query Parameters:**
- `limit` (optional, default: 100) - Maximum number of documents
- `offset` (optional, default: 0) - Pagination offset
- `uploader` (optional) - Filter by uploader email

**Response:**
```json
{
  "success": true,
  "count": 5,
  "documents": [
    {
      "id": 1,
      "documentHash": "0xabc123...",
      "ipfsCid": "QmXyZ...",
      "recordType": "Lab Report",
      "filename": "blood_test.pdf",
      "fileSize": 524288,
      "mimeType": "application/pdf",
      "uploaderEmail": "doctor@hospital.com",
      "uploaderName": "Dr. Smith",
      "riskVerified": true,
      "riskConfidence": 0.95,
      "riskMessage": "Document verified successfully",
      "riskFlags": [],
      "createdAt": "2024-01-01 12:00:00",
      "updatedAt": "2024-01-01 12:00:00"
    }
  ]
}
```

---

### Get Document by Hash

Retrieve a specific document by its hash.

```http
GET /api/documents/0xabc123...
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": 1,
    "documentHash": "0xabc123...",
    "ipfsCid": "QmXyZ...",
    "recordType": "Lab Report",
    ...
  }
}
```

---

### Get All Tokens

Retrieve all stored tokens with optional filtering.

```http
GET /api/tokens?limit=100&offset=0&patient=0x123...&issuer=0x456...
```

**Query Parameters:**
- `limit` (optional, default: 100) - Maximum number of tokens
- `offset` (optional, default: 0) - Pagination offset
- `patient` (optional) - Filter by patient address
- `issuer` (optional) - Filter by issuer address

**Response:**
```json
{
  "success": true,
  "count": 3,
  "tokens": [
    {
      "id": 1,
      "tokenId": 0,
      "documentHash": "0xabc123...",
      "ipfsCid": "QmXyZ...",
      "recordType": "Lab Report",
      "patientAddress": "0x123...",
      "issuerAddress": "0x456...",
      "blockchainTxHash": "0x789...",
      "isConsumed": false,
      "blockchainTimestamp": 1704110400,
      "filename": "blood_test.pdf",
      "mimeType": "application/pdf",
      "riskVerified": true,
      "createdAt": "2024-01-01 12:00:00",
      "updatedAt": "2024-01-01 12:00:00"
    }
  ]
}
```

---

### Save Token to Database

Save a newly minted token to the database (called from frontend after minting).

```http
POST /api/tokens
Content-Type: application/json
```

**Request Body:**
```json
{
  "tokenId": 0,
  "documentHash": "0xabc123...",
  "ipfsCid": "QmXyZ...",
  "recordType": "Lab Report",
  "patientAddress": "0x123...",
  "issuerAddress": "0x456...",
  "blockchainTxHash": "0x789...",
  "isConsumed": false,
  "blockchainTimestamp": 1704110400
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token saved successfully",
  "dbId": 1
}
```

---

### Get Statistics

Get database statistics.

```http
GET /api/stats
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalDocuments": 25,
    "totalTokens": 18,
    "verifiedDocuments": 23,
    "consumedTokens": 2
  }
}
```

---

## Usage in Frontend

### After Uploading Document

```javascript
// Upload returns document metadata
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { docHash, ipfsCid } = await uploadResponse.json();

// Document is automatically saved to database by backend
// You can retrieve it later with:
const doc = await fetch(`/api/documents/${docHash}`);
```

### After Minting Token

```javascript
// After successful mint on blockchain
const mintResult = await mintToken(patientAddress, recordType, docHash, ipfsCid);

// Save token to database
await fetch('/api/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenId: mintResult.tokenId,
    documentHash: docHash,
    ipfsCid: ipfsCid,
    recordType: recordType,
    patientAddress: patientAddress,
    issuerAddress: issuerAddress,
    blockchainTxHash: mintResult.hash,
    blockchainTimestamp: Math.floor(Date.now() / 1000)
  })
});
```

### View Patient's Tokens

```javascript
// Get all tokens for a patient
const response = await fetch(`/api/tokens?patient=${patientAddress}`);
const { tokens } = await response.json();

// Display tokens in UI
tokens.forEach(token => {
  console.log(`Token #${token.tokenId}: ${token.filename}`);
  console.log(`IPFS: ${token.ipfsCid}`);
  console.log(`Consumed: ${token.isConsumed}`);
});
```

### View Issuer's Documents

```javascript
// Get all documents uploaded by current user
const response = await fetch(`/api/documents?uploader=${userEmail}`);
const { documents } = await response.json();

// Display in issuer dashboard
documents.forEach(doc => {
  console.log(`${doc.filename} - ${doc.recordType}`);
  console.log(`Verified: ${doc.riskVerified} (${doc.riskConfidence})`);
});
```

---

## Database Management

### Backup Database

```bash
# Copy the database file
cp backend/data/medchain.db backend/data/medchain.backup.db

# Or use SQLite backup command
sqlite3 backend/data/medchain.db ".backup backend/data/medchain.backup.db"
```

### View Database Contents

```bash
# Open SQLite CLI
sqlite3 backend/data/medchain.db

# List all documents
SELECT * FROM documents;

# List all tokens
SELECT * FROM tokens;

# Get statistics
SELECT 
  (SELECT COUNT(*) FROM documents) as total_documents,
  (SELECT COUNT(*) FROM tokens) as total_tokens,
  (SELECT COUNT(*) FROM documents WHERE risk_verified = 1) as verified_docs,
  (SELECT COUNT(*) FROM tokens WHERE is_consumed = 1) as consumed_tokens;
```

### Clear Database

```bash
# Delete all data but keep schema
sqlite3 backend/data/medchain.db "DELETE FROM tokens; DELETE FROM documents;"

# Or delete the database file (will be recreated on next start)
rm backend/data/medchain.db
```

---

## Important Notes

### Data Flow

1. **Upload Document**
   - User uploads file → Backend processes → IPFS storage
   - Document metadata automatically saved to database
   - Returns hash and CID to frontend

2. **Mint Token**
   - Frontend mints token on blockchain using hash and CID
   - Frontend calls `/api/tokens` to save token metadata
   - Token linked to document via `document_hash`

3. **Query Data**
   - Patient dashboard queries `/api/tokens?patient=address`
   - Issuer dashboard queries `/api/documents?uploader=email`
   - Verifiers can query by hash or CID

### Security

- Database contains metadata only (no actual files)
- Actual files are encrypted on IPFS
- Database is local to backend server
- No sensitive medical data in database (only hashes and CIDs)
- Use proper file permissions on database file in production

### Performance

- SQLite is fast for reads (<1ms for indexed queries)
- Suitable for thousands of documents and tokens
- For millions of records, consider PostgreSQL or MongoDB
- Indexes optimize common query patterns

---

## Migration from Non-Database Version

If upgrading from a version without database:

1. **Documents**: Already on IPFS, will be saved to DB on next upload
2. **Tokens**: Already on blockchain, need to sync from blockchain
3. **Optional**: Write migration script to populate from blockchain events

---

## Troubleshooting

**Issue: Database file not found**
```
Solution: Server will automatically create database on first run
```

**Issue: UNIQUE constraint failed**
```
Solution: Document hash already exists (duplicate upload)
This is normal - document metadata is already stored
```

**Issue: Foreign key constraint failed**
```
Solution: Trying to save token for non-existent document
Upload document first, then mint and save token
```

---

## Future Enhancements

- [ ] Add search functionality (full-text search)
- [ ] Add pagination for large result sets
- [ ] Add filtering by date range
- [ ] Add user management table
- [ ] Add blockchain sync service
- [ ] Add analytics dashboard
- [ ] Add data export functionality

---

**Need Help?** Check [backend/src/utils/database.js](backend/src/utils/database.js) for implementation details.
