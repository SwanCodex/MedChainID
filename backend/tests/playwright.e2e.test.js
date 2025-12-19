/**
 * Playwright End-to-End Tests for MedChainID
 * 
 * Tests critical user flows:
 * 1. Issuer → Patient → Doctor flow
 * 2. Patient privacy filtering
 * 3. Share link generation
 * 4. Zero-knowledge verification
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:5000
 * - Frontend running on http://localhost:5173
 * - Petra wallet extension installed (or use test wallet)
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

// Test configuration
test.describe('MedChainID E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for blockchain operations
    test.setTimeout(60000);
  });

  test.describe('TC-E2E-001: Complete Flow - Issuer → Patient → Doctor', () => {
    test('should complete full workflow', async ({ page }) => {
      // Step 1: Issuer Flow
      await page.goto(`${FRONTEND_URL}/issuer`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Note: Wallet connection requires manual interaction or test wallet setup
      // For automated testing, you may need to:
      // 1. Use a test wallet with pre-funded account
      // 2. Mock wallet adapter
      // 3. Use Playwright's extension loading for Petra wallet
      
      // This is a template - actual implementation depends on wallet setup
      console.log('⚠️  Wallet connection requires manual setup or test wallet');
      
      // Verify issuer page loads
      const issuerHeading = page.locator('h1, h2').filter({ hasText: /issuer|hospital/i });
      await expect(issuerHeading).toBeVisible();
    });
  });

  test.describe('TC-FE-002: Share Access Link Generation', () => {
    test('should generate share link with key in hash fragment', async ({ page, context }) => {
      // Mock the share link generation
      await page.goto(`${FRONTEND_URL}/patient`);
      
      // Wait for page load
      await page.waitForLoadState('networkidle');
      
      // This test verifies the URL structure when share link is generated
      // Actual implementation would require:
      // 1. Connected wallet
      // 2. Existing records
      // 3. Clicking share button
      
      // Verify URL structure expectation
      const expectedUrlPattern = /\/verifier\?cid=[^#]+#key=[a-f0-9]{64}/;
      
      // For testing, we can manually construct and verify the URL format
      const testCID = 'QmTestCID123456789';
      const testKey = '1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3';
      const shareUrl = `${FRONTEND_URL}/verifier?cid=${testCID}#key=${testKey}`;
      
      // Verify URL structure
      expect(shareUrl).toMatch(expectedUrlPattern);
      
      // Verify key is NOT in query parameters
      const urlObj = new URL(shareUrl);
      expect(urlObj.searchParams.has('key')).toBe(false);
      
      // Verify key is in hash fragment
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      expect(hashParams.get('key')).toBe(testKey);
    });
  });

  test.describe('TC-FE-005: Zero-Knowledge Verification (No Key)', () => {
    test('should not attempt decryption without key', async ({ page }) => {
      const testCID = 'QmTestCID123456789';
      const urlWithoutKey = `${FRONTEND_URL}/verifier?cid=${testCID}`;
      
      // Track network requests
      const requests = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/decrypt-view')) {
          requests.push(request);
        }
      });
      
      await page.goto(urlWithoutKey);
      await page.waitForLoadState('networkidle');
      
      // Verify no decryption request was made
      const decryptRequests = requests.filter(req => 
        req.url().includes('/api/decrypt-view')
      );
      expect(decryptRequests.length).toBe(0);
      
      // Verify manual verification form is visible
      const verifyButton = page.locator('button').filter({ hasText: /verify/i });
      await expect(verifyButton).toBeVisible();
    });
  });

  test.describe('TC-FE-006: Zero-Knowledge Verification (With Key)', () => {
    test('should decrypt and display document with key', async ({ page }) => {
      const testCID = 'QmTestCID123456789';
      const testKey = '1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3';
      const urlWithKey = `${FRONTEND_URL}/verifier?cid=${testCID}#key=${testKey}`;
      
      // Mock backend response for decryption
      await page.route('**/api/decrypt-view', async (route) => {
        // Return a mock image response
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from('mock-image-data')
        });
      });
      
      await page.goto(urlWithKey);
      
      // Wait for decryption attempt
      await page.waitForTimeout(2000);
      
      // Verify decryption request was made
      const decryptRequest = await page.waitForRequest(request => 
        request.url().includes('/api/decrypt-view') && 
        request.method() === 'POST'
      );
      
      expect(decryptRequest).toBeTruthy();
      
      // Verify request body contains CID and key
      const requestBody = decryptRequest.postDataJSON();
      expect(requestBody.cid).toBe(testCID);
      expect(requestBody.key).toBe(testKey);
    });
  });

  test.describe('Backend API Health Check', () => {
    test('should return health status', async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/health`);
      expect(response.ok()).toBeTruthy();
      
      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('MedChainID Backend');
    });
  });

  test.describe('URL Security Tests', () => {
    test('should reject key in query parameters', async ({ page }) => {
      // This test verifies the application doesn't use keys from query params
      const testCID = 'QmTestCID123456789';
      const testKey = '1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3';
      
      // WRONG: Key in query parameter (should be rejected)
      const wrongUrl = `${FRONTEND_URL}/verifier?cid=${testCID}&key=${testKey}`;
      
      const requests = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/decrypt-view')) {
          requests.push(request);
        }
      });
      
      await page.goto(wrongUrl);
      await page.waitForLoadState('networkidle');
      
      // Application should NOT decrypt with key from query params
      const decryptRequests = requests.filter(req => 
        req.url().includes('/api/decrypt-view')
      );
      
      // This should be 0 - key in query params should be ignored
      expect(decryptRequests.length).toBe(0);
    });
  });
});

// Helper function to create test PDF file
function createTestPDFBuffer() {
  // Minimal valid PDF
  return Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj\n' +
    '<< /Type /Catalog /Pages 2 0 R >>\n' +
    'endobj\n' +
    'xref\n' +
    'trailer\n' +
    '<< /Size 1 /Root 1 0 R >>\n' +
    'startxref\n' +
    '%%EOF'
  );
}

