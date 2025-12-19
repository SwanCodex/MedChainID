/**
 * database.js
 * SQLite database using sql.js (no native compilation required)
 * 
 * Tables:
 * - documents: Store uploaded document metadata
 * - tokens: Store minted token information
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Database file location
const DB_PATH = path.join(__dirname, '../../data/medchain.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created data directory:', dataDir);
}

// Initialize database
let db;
let SQL;
let isReady = false;

async function initDatabase() {
    try {
        SQL = await initSqlJs();
        
        // Load existing database or create new one
        if (fs.existsSync(DB_PATH)) {
            const buffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(buffer);
            console.log('✅ Database loaded:', DB_PATH);
        } else {
            db = new SQL.Database();
            console.log('✅ New database created');
        }
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        // Create tables
        createTables();
        
        // Save initial state
        saveDatabase();
        
        isReady = true;
        return db;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    }
}

// Save database to disk
function saveDatabase() {
    if (db) {
        try {
            const data = db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(DB_PATH, buffer);
        } catch (error) {
            console.error('⚠️ Failed to save database:', error.message);
        }
    }
}

// Create tables
function createTables() {
    // Documents table
    db.run(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_hash TEXT NOT NULL UNIQUE,
            ipfs_cid TEXT NOT NULL,
            record_type TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            uploader_email TEXT,
            uploader_name TEXT,
            risk_verified INTEGER DEFAULT 0,
            risk_confidence REAL,
            risk_message TEXT,
            risk_flags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_document_hash ON documents(document_hash)');
    db.run('CREATE INDEX IF NOT EXISTS idx_ipfs_cid ON documents(ipfs_cid)');
    db.run('CREATE INDEX IF NOT EXISTS idx_uploader ON documents(uploader_email)');

    // Tokens table
    db.run(`
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id TEXT NOT NULL UNIQUE,
            document_hash TEXT NOT NULL,
            patient_address TEXT NOT NULL,
            issuer_address TEXT NOT NULL,
            blockchain_tx_hash TEXT,
            blockchain_timestamp INTEGER,
            is_consumed INTEGER DEFAULT 0,
            consumed_at DATETIME,
            consumed_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_hash) REFERENCES documents(document_hash) ON DELETE CASCADE
        )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_token_patient ON tokens(patient_address)');
    db.run('CREATE INDEX IF NOT EXISTS idx_token_issuer ON tokens(issuer_address)');
    db.run('CREATE INDEX IF NOT EXISTS idx_token_document ON tokens(document_hash)');
}

// Helper to convert sql.js result to single object
function rowToObject(result) {
    if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
        return null;
    }
    const obj = {};
    result[0].columns.forEach((col, idx) => {
        obj[col] = result[0].values[0][idx];
    });
    return obj;
}

// Helper to convert sql.js result to array of objects
function rowsToObjects(result) {
    if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
        return [];
    }
    return result[0].values.map(row => {
        const obj = {};
        result[0].columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    });
}

// ============================================
// Document Operations
// ============================================

/**
 * Save a document to the database
 */
function saveDocument(documentData) {
    if (!isReady) {
        console.warn('⚠️ Database not ready yet');
        return;
    }
    
    try {
        db.run(
            `INSERT INTO documents (
                document_hash, ipfs_cid, record_type, filename, file_size, mime_type,
                uploader_email, uploader_name, risk_verified, risk_confidence, risk_message, risk_flags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                documentData.documentHash,
                documentData.ipfsCid,
                documentData.recordType,
                documentData.filename,
                documentData.fileSize,
                documentData.mimeType,
                documentData.uploaderEmail || null,
                documentData.uploaderName || null,
                documentData.riskAnalysis?.verified ? 1 : 0,
                documentData.riskAnalysis?.confidence || null,
                documentData.riskAnalysis?.message || null,
                documentData.riskAnalysis?.risk_flags ? JSON.stringify(documentData.riskAnalysis.risk_flags) : null
            ]
        );
        saveDatabase();
    } catch (error) {
        console.error('Error saving document:', error.message);
        throw error;
    }
}

/**
 * Get a document by its hash
 */
function getDocumentByHash(documentHash) {
    if (!isReady) return null;
    const result = db.exec('SELECT * FROM documents WHERE document_hash = ?', [documentHash]);
    return rowToObject(result);
}

/**
 * Get a document by IPFS CID
 */
function getDocumentByCid(ipfsCid) {
    if (!isReady) return null;
    const result = db.exec('SELECT * FROM documents WHERE ipfs_cid = ?', [ipfsCid]);
    return rowToObject(result);
}

/**
 * Get documents by uploader email
 */
function getDocumentsByUploader(uploaderEmail) {
    if (!isReady) return [];
    const result = db.exec('SELECT * FROM documents WHERE uploader_email = ? ORDER BY created_at DESC', [uploaderEmail]);
    return rowsToObjects(result);
}

/**
 * Get all documents with pagination
 */
function getAllDocuments(limit = 100, offset = 0) {
    if (!isReady) return [];
    const result = db.exec('SELECT * FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    return rowsToObjects(result);
}

/**
 * Get document count
 */
function getDocumentCount() {
    if (!isReady) return 0;
    const result = db.exec('SELECT COUNT(*) as count FROM documents');
    if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
        return result[0].values[0][0];
    }
    return 0;
}

// ============================================
// Token Operations
// ============================================

/**
 * Save a token to the database
 */
function saveToken(tokenData) {
    if (!isReady) {
        console.warn('⚠️ Database not ready yet');
        return;
    }
    
    try {
        db.run(
            `INSERT INTO tokens (
                token_id, document_hash, patient_address, issuer_address, 
                blockchain_tx_hash, blockchain_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                tokenData.tokenId,
                tokenData.documentHash,
                tokenData.patientAddress,
                tokenData.issuerAddress,
                tokenData.blockchainTxHash || null,
                tokenData.blockchainTimestamp || null
            ]
        );
        saveDatabase();
    } catch (error) {
        console.error('Error saving token:', error.message);
        throw error;
    }
}

/**
 * Get tokens by patient address
 */
function getTokensByPatient(patientAddress) {
    if (!isReady) return [];
    const result = db.exec(`
        SELECT t.*, d.filename, d.record_type, d.ipfs_cid
        FROM tokens t
        LEFT JOIN documents d ON t.document_hash = d.document_hash
        WHERE t.patient_address = ?
        ORDER BY t.created_at DESC
    `, [patientAddress]);
    return rowsToObjects(result);
}

/**
 * Get tokens by issuer address
 */
function getTokensByIssuer(issuerAddress) {
    if (!isReady) return [];
    const result = db.exec(`
        SELECT t.*, d.filename, d.record_type, d.ipfs_cid
        FROM tokens t
        LEFT JOIN documents d ON t.document_hash = d.document_hash
        WHERE t.issuer_address = ?
        ORDER BY t.created_at DESC
    `, [issuerAddress]);
    return rowsToObjects(result);
}

/**
 * Get a specific token by ID and issuer
 */
function getTokenByIdAndIssuer(tokenId, issuerAddress) {
    if (!isReady) return null;
    const result = db.exec(`
        SELECT t.*, d.filename, d.record_type, d.ipfs_cid
        FROM tokens t
        LEFT JOIN documents d ON t.document_hash = d.document_hash
        WHERE t.token_id = ? AND t.issuer_address = ?
    `, [tokenId, issuerAddress]);
    return rowToObject(result);
}

/**
 * Update token consumption status
 */
function updateTokenConsumption(tokenId, consumedBy) {
    if (!isReady) return;
    try {
        db.run(
            `UPDATE tokens 
            SET is_consumed = 1, consumed_at = datetime('now'), consumed_by = ?, updated_at = datetime('now')
            WHERE token_id = ?`,
            [consumedBy, tokenId]
        );
        saveDatabase();
    } catch (error) {
        console.error('Error updating token consumption:', error.message);
        throw error;
    }
}

/**
 * Get all tokens with pagination
 */
function getAllTokens(limit = 100, offset = 0) {
    if (!isReady) return [];
    const result = db.exec(`
        SELECT t.*, d.filename, d.record_type
        FROM tokens t
        LEFT JOIN documents d ON t.document_hash = d.document_hash
        ORDER BY t.created_at DESC 
        LIMIT ? OFFSET ?
    `, [limit, offset]);
    return rowsToObjects(result);
}

/**
 * Get token count
 */
function getTokenCount() {
    if (!isReady) return 0;
    const result = db.exec('SELECT COUNT(*) as count FROM tokens');
    if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
        return result[0].values[0][0];
    }
    return 0;
}

// ============================================
// Statistics
// ============================================

/**
 * Get count of documents created today
 */
function getDocumentsToday() {
    if (!isReady) return 0;
    try {
        const result = db.exec("SELECT COUNT(*) as count FROM documents WHERE date(created_at) = date('now')");
        if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
            return result[0].values[0][0];
        }
        return 0;
    } catch (error) {
        console.error('Error getting documents today:', error.message);
        return 0;
    }
}

/**
 * Get count of tokens created today
 */
function getTokensToday() {
    if (!isReady) return 0;
    try {
        const result = db.exec("SELECT COUNT(*) as count FROM tokens WHERE date(created_at) = date('now')");
        if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
            return result[0].values[0][0];
        }
        return 0;
    } catch (error) {
        console.error('Error getting tokens today:', error.message);
        return 0;
    }
}

/**
 * Get database statistics
 */
function getStatistics() {
    if (!isReady) {
        return {
            totalDocuments: 0,
            totalTokens: 0,
            verifiedDocuments: 0,
            consumedTokens: 0,
            documentsToday: 0,
            tokensToday: 0
        };
    }
    
    const totalDocs = getDocumentCount();
    const totalTokens = getTokenCount();
    const docsToday = getDocumentsToday();
    const tokensToday = getTokensToday();
    
    const verifiedResult = db.exec('SELECT COUNT(*) as count FROM documents WHERE risk_verified = 1');
    const verifiedDocs = verifiedResult && verifiedResult.length > 0 && verifiedResult[0].values && verifiedResult[0].values.length > 0 
        ? verifiedResult[0].values[0][0] : 0;
    
    const consumedResult = db.exec('SELECT COUNT(*) as count FROM tokens WHERE is_consumed = 1');
    const consumedTokens = consumedResult && consumedResult.length > 0 && consumedResult[0].values && consumedResult[0].values.length > 0 
        ? consumedResult[0].values[0][0] : 0;
    
    return {
        totalDocuments: totalDocs,
        totalTokens: totalTokens,
        verifiedDocuments: verifiedDocs,
        consumedTokens: consumedTokens,
        documentsToday: docsToday,
        tokensToday: tokensToday
    };
}

// ============================================
// Cleanup
// ============================================

// Auto-save every 5 seconds
const autoSaveInterval = setInterval(() => {
    if (isReady) {
        saveDatabase();
    }
}, 5000);

// Graceful shutdown - only on explicit termination
const handleShutdown = (signal) => {
    console.log(`📡 Received ${signal}, saving database...`);
    clearInterval(autoSaveInterval);
    saveDatabase();
    if (db) {
        try {
            db.close();
            console.log('💾 Database closed cleanly');
        } catch (err) {
            console.error('⚠️ Error closing database:', err.message);
        }
    }
    // Don't call process.exit() here - let the process handle it
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
process.on('beforeExit', () => {
    console.log('📡 Process exiting, saving database...');
    saveDatabase();
});

// Initialize database on module load
const dbInit = initDatabase();

// Export functions
module.exports = {
    initDatabase,
    saveDocument,
    getDocumentByHash,
    getDocumentByCid,
    getDocumentsByUploader,
    getAllDocuments,
    getDocumentCount,
    saveToken,
    getTokensByPatient,
    getTokensByIssuer,
    getTokenByIdAndIssuer,
    updateTokenConsumption,
    getAllTokens,
    getTokenCount,
    getDocumentsToday,
    getTokensToday,
    getStatistics,
    dbInit // Export promise so server can wait for init
};
