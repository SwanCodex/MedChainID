/**
 * Backend API Upload Endpoint Tests
 * Tests for POST /api/upload endpoint
 * 
 * Critical Test Areas:
 * 1. File encryption before IPFS upload
 * 2. RecordType metadata handling
 * 3. File validation
 * 4. Error handling
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import the app (server.js exports the Express app)
const app = require('../src/server');

// Test configuration
const API_URL = '/api/upload';
const TEST_FILES_DIR = path.join(__dirname, '../test-files');

// Helper: Create test PDF buffer (minimal valid PDF)
function createTestPDF() {
  // Minimal valid PDF content
  const pdfContent = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj\n' +
    '<< /Type /Catalog /Pages 2 0 R >>\n' +
    'endobj\n' +
    '2 0 obj\n' +
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n' +
    'endobj\n' +
    '3 0 obj\n' +
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\n' +
    'endobj\n' +
    'xref\n' +
    '0 4\n' +
    '0000000000 65535 f \n' +
    '0000000009 00000 n \n' +
    '0000000058 00000 n \n' +
    '0000000115 00000 n \n' +
    'trailer\n' +
    '<< /Size 4 /Root 1 0 R >>\n' +
    'startxref\n' +
    '178\n' +
    '%%EOF'
  );
  return pdfContent;
}

// Helper: Create test image buffer (minimal valid PNG)
function createTestPNG() {
  // Minimal valid PNG (1x1 transparent pixel)
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0D, // Length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00 // Bit depth, color type, etc.
  ]);
  // Simplified PNG (not fully valid but enough for testing)
  return Buffer.concat([pngHeader, ihdr]);
}

describe('POST /api/upload', () => {
  let testPDFBuffer;
  let testPNGBuffer;

  beforeAll(() => {
    // Create test files
    testPDFBuffer = createTestPDF();
    testPNGBuffer = createTestPNG();
  });

  describe('TC-BE-001: File Encryption Before IPFS Upload', () => {
    test('should encrypt file before uploading to IPFS', async () => {
      // Mock IPFS upload to verify encryption occurred
      const originalUploadToPinata = require('../src/utils/ipfs').uploadToPinata;
      let receivedBuffer = null;
      
      // Spy on uploadToPinata to capture the buffer
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockImplementation(async (buffer, filename, recordType) => {
        receivedBuffer = buffer;
        // Verify buffer is encrypted (should have IV prepended = 16 bytes)
        expect(buffer.length).toBeGreaterThan(testPDFBuffer.length);
        expect(buffer.length).toBe(testPDFBuffer.length + 16); // Original + IV
        return 'QmTestCID123456789';
      });

      const response = await request(app)
        .post(API_URL)
        .attach('document', testPDFBuffer, 'test_lab_result.pdf')
        .field('recordType', 'lab_result')
        .expect(200);

      // Verify encryption occurred
      expect(receivedBuffer).not.toBeNull();
      expect(receivedBuffer.length).toBe(testPDFBuffer.length + 16);
      
      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.docHash).toBeDefined();
      expect(response.body.ipfsCid).toBe('QmTestCID123456789');

      // Restore original function
      jest.restoreAllMocks();
    });

    test('should use AES-256-CBC encryption', async () => {
      // This test verifies the encryption module is called
      const encryptSpy = jest.spyOn(require('../src/utils/encryption'), 'encryptBuffer');
      
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockResolvedValue('QmTestCID123456789');

      await request(app)
        .post(API_URL)
        .attach('document', testPDFBuffer, 'test.pdf')
        .field('recordType', 'lab_result')
        .expect(200);

      // Verify encryptBuffer was called
      expect(encryptSpy).toHaveBeenCalled();
      
      jest.restoreAllMocks();
    });
  });

  describe('TC-BE-002: RecordType Metadata Handling', () => {
    test('should extract and pass recordType to IPFS upload', async () => {
      let receivedRecordType = null;
      
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockImplementation(async (buffer, filename, recordType) => {
        receivedRecordType = recordType;
        return 'QmTestCID123456789';
      });

      const response = await request(app)
        .post(API_URL)
        .attach('document', testPDFBuffer, 'test.pdf')
        .field('recordType', 'prescription')
        .expect(200);

      // Verify recordType was passed correctly
      expect(receivedRecordType).toBe('prescription');
      expect(response.body.success).toBe(true);

      jest.restoreAllMocks();
    });

    test('should handle missing recordType gracefully', async () => {
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockResolvedValue('QmTestCID123456789');

      const response = await request(app)
        .post(API_URL)
        .attach('document', testPDFBuffer, 'test.pdf')
        // No recordType field
        .expect(200);

      // Should still succeed, recordType defaults to 'unknown' or handled gracefully
      expect(response.body.success).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('TC-BE-006: File Upload - Missing File', () => {
    test('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post(API_URL)
        .field('recordType', 'lab_result')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No file uploaded');
    });
  });

  describe('TC-BE-007: File Upload - Invalid File Type', () => {
    test('should reject invalid file types', async () => {
      const invalidFile = Buffer.from('This is not a valid file');
      
      const response = await request(app)
        .post(API_URL)
        .attach('document', invalidFile, 'test.exe')
        .field('recordType', 'lab_result')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid file type');
    });
  });

  describe('TC-BE-008: File Upload - File Size Limit', () => {
    test('should reject files larger than 10MB', async () => {
      // Create a buffer larger than 10MB
      const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
      largeFile.fill(0);

      const response = await request(app)
        .post(API_URL)
        .attach('document', largeFile, 'large_file.pdf')
        .field('recordType', 'lab_result')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('File too large');
    });

    test('should accept files exactly at 10MB limit', async () => {
      const exactSizeFile = Buffer.alloc(10 * 1024 * 1024); // Exactly 10MB
      exactSizeFile.fill(0);

      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockResolvedValue('QmTestCID123456789');

      const response = await request(app)
        .post(API_URL)
        .attach('document', exactSizeFile, 'exact_10mb.pdf')
        .field('recordType', 'lab_result')
        .expect(200);

      expect(response.body.success).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('TC-BE-003: Successful Upload Flow', () => {
    test('should return docHash, ipfsCid, and riskAnalysis on success', async () => {
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockResolvedValue('QmTestCID123456789');
      
      // Mock ML service response
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          verified: true,
          confidence: 0.95,
          message: 'Document verified',
          risk_flags: []
        }
      });

      const response = await request(app)
        .post(API_URL)
        .attach('document', testPDFBuffer, 'test_lab_result.pdf')
        .field('recordType', 'lab_result')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.docHash).toBeDefined();
      expect(response.body.docHash).toMatch(/^0x[a-f0-9]{64}$/); // SHA-256 hash format
      expect(response.body.ipfsCid).toBe('QmTestCID123456789');
      expect(response.body.riskAnalysis).toBeDefined();
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.filename).toBe('test_lab_result.pdf');

      jest.restoreAllMocks();
    });
  });

  describe('Image File Upload', () => {
    test('should accept PNG images', async () => {
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockResolvedValue('QmTestCID123456789');

      const response = await request(app)
        .post(API_URL)
        .attach('document', testPNGBuffer, 'test_image.png')
        .field('recordType', 'xray')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.mimeType).toBe('image/png');

      jest.restoreAllMocks();
    });
  });

  describe('Error Handling', () => {
    test('should handle IPFS upload failure gracefully', async () => {
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockRejectedValue(new Error('IPFS upload failed'));

      const response = await request(app)
        .post(API_URL)
        .attach('document', testPDFBuffer, 'test.pdf')
        .field('recordType', 'lab_result')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      jest.restoreAllMocks();
    });

    test('should handle ML service failure gracefully', async () => {
      jest.spyOn(require('../src/utils/ipfs'), 'uploadToPinata').mockResolvedValue('QmTestCID123456789');
      
      const axios = require('axios');
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('ML service unavailable'));

      // Should still succeed, using default risk analysis
      const response = await request(app)
        .post(API_URL)
        .attach('document', testPDFBuffer, 'test.pdf')
        .field('recordType', 'lab_result')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.riskAnalysis).toBeDefined();

      jest.restoreAllMocks();
    });
  });
});

describe('POST /api/decrypt-view', () => {
  const API_DECRYPT_URL = '/api/decrypt-view';

  describe('TC-BE-004: Decryption Endpoint - Wrong Key', () => {
    test('should reject wrong decryption key', async () => {
      // This test requires a real encrypted file from IPFS
      // For unit testing, we'll mock the IPFS retrieval
      const mockEncryptedBuffer = Buffer.alloc(100);
      mockEncryptedBuffer.fill(0);
      
      jest.spyOn(require('../src/utils/ipfs'), 'getFromIPFS').mockResolvedValue(mockEncryptedBuffer);

      const response = await request(app)
        .post(API_DECRYPT_URL)
        .send({
          cid: 'QmTestCID123456789',
          key: '1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c4' // Wrong key (last char changed)
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Decryption failed');

      jest.restoreAllMocks();
    });
  });

  describe('TC-BE-005: Decryption Endpoint - Invalid Key Format', () => {
    test('should reject invalid key format (too short)', async () => {
      const response = await request(app)
        .post(API_DECRYPT_URL)
        .send({
          cid: 'QmTestCID123456789',
          key: 'short' // Invalid: too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid encryption key format');
    });

    test('should reject missing CID', async () => {
      const response = await request(app)
        .post(API_DECRYPT_URL)
        .send({
          key: '1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3'
          // Missing cid
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('CID and decryption key are required');
    });

    test('should reject missing key', async () => {
      const response = await request(app)
        .post(API_DECRYPT_URL)
        .send({
          cid: 'QmTestCID123456789'
          // Missing key
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('CID and decryption key are required');
    });
  });
});

// Health check test
describe('GET /api/health', () => {
  test('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('MedChainID Backend');
  });
});

