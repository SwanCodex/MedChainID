# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** MedChainID (SSAY)
- **Date:** 2025-12-19
- **Prepared by:** TestSprite AI Team
- **Test Type:** Backend API Testing
- **Total Tests Executed:** 10
- **Tests Passed:** 0
- **Tests Failed:** 10
- **Pass Rate:** 0.00%

---

## 2️⃣ Requirement Validation Summary

### Requirement Group 1: File Upload & Encryption Security

#### Test TC001: Upload Medical Document, Encrypt and Upload to IPFS
- **Test Name:** upload medical document encrypt and upload to ipfs
- **Test Code:** [TC001_upload_medical_document_encrypt_and_upload_to_ipfs.py](./TC001_upload_medical_document_encrypt_and_upload_to_ipfs.py)
- **Requirement:** Files MUST be encrypted (AES-256) before uploading to IPFS. RecordType metadata must be handled correctly.
- **Test Error:** 
  ```
  AssertionError: Expected client error status for missing recordType
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/b09332dd-f0e6-4d52-8a89-087417077fb7
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Backend does not validate `recordType` as a required parameter. When `recordType` is missing, the endpoint returns HTTP 200 instead of a 400 error.
  - **Impact:** MEDIUM - Missing validation allows uploads without proper categorization, affecting metadata searchability.
  - **Recommendation:** Add validation in `POST /api/upload` endpoint to require `recordType` parameter and return 400 Bad Request if missing.
  - **Location:** `backend/src/server.js` → `POST /api/upload` endpoint

---

#### Test TC002: Decrypt Document from IPFS Using Provided Key
- **Test Name:** decrypt and return document from ipfs using provided key
- **Test Code:** [TC002_decrypt_and_return_document_from_ipfs_using_provided_key.py](./TC002_decrypt_and_return_document_from_ipfs_using_provided_key.py)
- **Requirement:** POST /api/decrypt-view MUST fail if wrong decryption key is provided. Correct key should successfully decrypt.
- **Test Error:** 
  ```
  AssertionError: Decryption with assumed correct key failed unexpectedly: HTTP 500 - {"success":false,"error":"Decryption failed","message":"error:1C800064:Provider routines::bad decrypt"}
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/ae20d136-92ec-427a-874b-6e80914a5d3e
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Test uses dummy keys (`"a" * 64` and `"f" * 64`) that don't match the actual encryption key used by the backend. The backend uses `ENCRYPTION_KEY` from environment variables.
  - **Impact:** HIGH - Test design issue: Tests cannot verify decryption without the actual encryption key. However, the error handling is working correctly (wrong key fails).
  - **Recommendation:** 
    1. Update test to use the actual encryption key from backend environment or expose a test endpoint that returns the key for testing.
    2. Verify that wrong key rejection works correctly (which it does - returns 500 error).
  - **Location:** `backend/src/server.js` → `POST /api/decrypt-view` endpoint

---

#### Test TC003: Verify Document Hash
- **Test Name:** verify document hash with uploaded file
- **Test Code:** [TC003_verify_document_hash_with_uploaded_file.py](./TC003_verify_document_hash_with_uploaded_file.py)
- **Requirement:** Document hash verification should work correctly. Hash should be valid SHA-256 format.
- **Test Error:** 
  ```
  AssertionError: docHash is not a valid SHA256 hex string
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/4a5c722b-a474-43c4-b2a9-3034d5d3a61c
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** The `docHash` returned from upload endpoint may not be in the expected format (64 hex characters). The hash might include `0x` prefix or have different formatting.
  - **Impact:** MEDIUM - Hash format inconsistency could cause issues with blockchain integration or verification.
  - **Recommendation:** Verify hash generation in `backend/src/utils/encryption.js` → `generateHash()` function. Ensure consistent format (with or without `0x` prefix).
  - **Location:** `backend/src/utils/encryption.js` → `generateHash()` function

---

#### Test TC004: Download Encrypted File from IPFS
- **Test Name:** download encrypted file from ipfs using cid
- **Test Code:** [TC004_download_encrypted_file_from_ipfs_using_cid.py](./TC004_download_encrypted_file_from_ipfs_using_cid.py)
- **Requirement:** GET /api/download/:cid should download encrypted files from IPFS correctly.
- **Test Error:** 
  ```
  AssertionError: Upload failed with status 500
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/4213c139-5729-494d-aeed-f75625ce5e37
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Upload endpoint returns HTTP 500 error, preventing test from proceeding to download test.
  - **Impact:** HIGH - Upload functionality is failing, blocking downstream tests.
  - **Recommendation:** Investigate backend server logs for upload errors. Common causes: IPFS/Pinata API key issues, ML service unavailable, or encryption errors.
  - **Location:** `backend/src/server.js` → `POST /api/upload` endpoint

---

### Requirement Group 2: Blockchain Integration

#### Test TC005: Mint Medical Record Token on Aptos Blockchain
- **Test Name:** mint medical record token on aptos blockchain
- **Test Code:** [TC005_mint_medical_record_token_on_aptos_blockchain.py](./TC005_mint_medical_record_token_on_aptos_blockchain.py)
- **Requirement:** mintToken function should mint tokens correctly with payload matching Aptos Wallet Adapter v2 format.
- **Test Error:** 
  ```
  AssertionError: Mint token failed: {"success":false,"error":"Route not found","path":"/api/mint-token","method":"POST"}
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/e6719c93-795e-4692-b969-cab653449caf
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Test expects backend endpoint `/api/mint-token`, but `mintToken` is a frontend function that interacts directly with Aptos blockchain via wallet adapter, not a backend API endpoint.
  - **Impact:** LOW - Test design issue. Blockchain minting happens client-side, not via backend API.
  - **Recommendation:** 
    1. Update test to use frontend E2E testing (Playwright) instead of backend API testing.
    2. Or create a mock/test endpoint for backend testing purposes.
  - **Location:** `frontend/src/services/aptos.ts` → `mintToken()` function

---

#### Test TC006: Get Token Details from Blockchain with Correct Parsing
- **Test Name:** get token details from blockchain with correct parsing
- **Test Code:** [TC006_get_token_details_from_blockchain_with_correct_parsing.py](./TC006_get_token_details_from_blockchain_with_correct_parsing.py)
- **Requirement:** getTokenDetails should return all 7 values: recordType, documentHash, ipfsCID, patientAddress, isConsumed, issuer, timestamp.
- **Test Error:** 
  ```
  AssertionError: Failed to mint token: Mint token failed: 404 {"success":false,"error":"Route not found","path":"/api/mint-token","method":"POST"}
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/69b1a237-d69e-4bd6-b325-f8cc25dc8fbf
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Same as TC005 - blockchain functions are frontend-based, not backend API endpoints.
  - **Impact:** LOW - Test design issue.
  - **Recommendation:** Use frontend E2E testing or mock blockchain endpoints for backend testing.
  - **Location:** `frontend/src/services/aptos.ts` → `getTokenDetails()` function

---

#### Test TC007: Consume Token to Prevent Double Claiming
- **Test Name:** consume token to prevent double claiming
- **Test Code:** [TC007_consume_token_to_prevent_double_claiming.py](./TC007_consume_token_to_prevent_double_claiming.py)
- **Requirement:** consumeToken should mark tokens as consumed, preventing reuse.
- **Test Error:** 
  ```
  HTTPError: 500 Server Error: Internal Server Error for url: http://localhost:5001/mintToken
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/60ce34c1-dac6-4771-bb7c-72b47238e7ba
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Test attempts to call blockchain functions via non-existent backend endpoints. Also tries to use ML service port (5001) incorrectly.
  - **Impact:** LOW - Test design issue.
  - **Recommendation:** Use frontend E2E testing for blockchain token consumption.
  - **Location:** `frontend/src/services/aptos.ts` → `consumeToken()` function

---

#### Test TC008: Verify Token Validity and Consumption Status
- **Test Name:** verify token validity and consumption status
- **Test Code:** [TC008_verify_token_validity_and_consumption_status.py](./TC008_verify_token_validity_and_consumption_status.py)
- **Requirement:** verifyToken should confirm token validity and consumption status.
- **Test Error:** 
  ```
  AssertionError: Request failed: 404 Client Error: Not Found for url: http://localhost:5000/api/mint-token
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/3b55c6be-dcbe-41de-b289-bbebef196198
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Same blockchain endpoint issue as previous tests.
  - **Impact:** LOW - Test design issue.
  - **Recommendation:** Use frontend E2E testing.
  - **Location:** `frontend/src/services/aptos.ts` → `verifyToken()` function

---

### Requirement Group 3: Patient Privacy & Security

#### Test TC009: Patient Dashboard Filters Records by Connected Wallet Address
- **Test Name:** patient dashboard filters records by connected wallet address
- **Test Code:** [TC009_patient_dashboard_filters_records_by_connected_wallet_address.py](./TC009_patient_dashboard_filters_records_by_connected_wallet_address.py)
- **Requirement:** Patient dashboard MUST only display records where patient_address matches connected wallet. No cross-patient data leakage.
- **Test Error:** 
  ```
  HTTPError: 404 Client Error: Not Found for url: http://localhost:5000/api/mock/mint-token
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/2ce6d117-71ae-468c-b4f2-92610293c29e
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Test requires blockchain minting endpoints that don't exist. Patient dashboard filtering is a frontend feature.
  - **Impact:** LOW - Test design issue. This should be tested via frontend E2E testing.
  - **Recommendation:** Use Playwright E2E tests to verify patient dashboard filtering logic.
  - **Location:** `frontend/src/pages/PatientDashboard.tsx` → Filtering logic

---

#### Test TC010: Shareable Verification Links Embed Key in URL Hash Fragment
- **Test Name:** shareable verification links embed key in url hash fragment
- **Test Code:** [TC010_shareable_verification_links_embed_key_in_url_hash_fragment.py](./TC010_shareable_verification_links_embed_key_in_url_hash_fragment.py)
- **Requirement:** Share links MUST embed decryption key in URL hash fragment (#key=...), NOT in query parameters (?key=...).
- **Test Error:** 
  ```
  AssertionError: Upload failed with status 500
  ```
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/b50a36a8-439e-45fb-b97b-55f92e14793b
- **Status:** ❌ Failed
- **Analysis / Findings:** 
  - **Issue:** Upload endpoint failure prevents test from proceeding. Share link generation is a frontend feature.
  - **Impact:** MEDIUM - Cannot verify critical security feature (key in hash fragment vs query params).
  - **Recommendation:** 
    1. Fix upload endpoint first (see TC004).
    2. Use frontend E2E testing to verify share link URL structure.
  - **Location:** `frontend/src/pages/PatientDashboard.tsx` → `generateShareLink()` function

---

## 3️⃣ Coverage & Matching Metrics

- **0.00%** of tests passed (0/10)
- **100.00%** of tests failed (10/10)

| Requirement Group | Total Tests | ✅ Passed | ❌ Failed | Pass Rate |
|-------------------|-------------|-----------|-----------|-----------|
| File Upload & Encryption Security | 4 | 0 | 4 | 0.00% |
| Blockchain Integration | 4 | 0 | 4 | 0.00% |
| Patient Privacy & Security | 2 | 0 | 2 | 0.00% |
| **TOTAL** | **10** | **0** | **10** | **0.00%** |

---

## 4️⃣ Key Gaps / Risks

### Critical Issues Found:

1. **Backend Upload Endpoint Failure (TC004, TC010)**
   - **Severity:** HIGH
   - **Issue:** POST /api/upload returns HTTP 500 errors
   - **Impact:** Core functionality broken, preventing file uploads
   - **Root Cause:** Likely IPFS/Pinata configuration issues or ML service unavailability
   - **Action Required:** 
     - Check backend server logs
     - Verify Pinata API keys in `.env`
     - Ensure ML service is running (or handle gracefully if optional)

2. **Missing RecordType Validation (TC001)**
   - **Severity:** MEDIUM
   - **Issue:** Backend doesn't validate `recordType` as required parameter
   - **Impact:** Uploads succeed without proper categorization
   - **Action Required:** Add validation to require `recordType` parameter

3. **Hash Format Inconsistency (TC003)**
   - **Severity:** MEDIUM
   - **Issue:** Document hash format may not match expected SHA-256 hex format
   - **Impact:** Could cause blockchain integration issues
   - **Action Required:** Verify and standardize hash format in `generateHash()` function

### Test Design Issues:

4. **Blockchain Functions Tested as Backend APIs (TC005-TC008)**
   - **Severity:** LOW (Test Design Issue)
   - **Issue:** Tests expect backend endpoints for blockchain functions that are actually frontend functions
   - **Impact:** Tests cannot execute correctly
   - **Action Required:** 
     - Use frontend E2E testing (Playwright) for blockchain functions
     - Or create mock/test endpoints for backend testing

5. **Decryption Key Testing Issue (TC002)**
   - **Severity:** LOW (Test Design Issue)
   - **Issue:** Tests use dummy keys that don't match actual encryption key
   - **Impact:** Cannot verify correct decryption, but wrong key rejection works
   - **Action Required:** Update tests to use actual encryption key or expose test endpoint

### Security Concerns:

6. **Patient Privacy Filtering Not Tested (TC009)**
   - **Severity:** HIGH
   - **Issue:** Critical security feature (patient address filtering) cannot be tested via backend API
   - **Impact:** Cannot verify no cross-patient data leakage
   - **Action Required:** Implement frontend E2E tests for patient dashboard filtering

7. **Share Link Security Not Verified (TC010)**
   - **Severity:** CRITICAL
   - **Issue:** Cannot verify that decryption keys are in hash fragments (not query params)
   - **Impact:** Critical security requirement not validated
   - **Action Required:** Implement frontend E2E tests for share link generation

---

## 5️⃣ Recommendations

### Immediate Actions (High Priority):

1. **Fix Backend Upload Endpoint**
   - Investigate HTTP 500 errors in POST /api/upload
   - Check Pinata API configuration
   - Verify ML service availability or handle gracefully

2. **Add RecordType Validation**
   - Require `recordType` parameter in upload endpoint
   - Return 400 Bad Request if missing

3. **Standardize Hash Format**
   - Ensure `docHash` is consistently formatted (64 hex chars, with or without `0x` prefix)
   - Document expected format

### Medium Priority:

4. **Create Frontend E2E Tests**
   - Use Playwright to test blockchain functions (mintToken, getTokenDetails, consumeToken)
   - Test patient dashboard filtering
   - Test share link generation and URL structure

5. **Improve Test Design**
   - Update decryption tests to use actual encryption keys
   - Create mock endpoints for blockchain functions if needed for backend testing

### Long-term Improvements:

6. **Add Integration Tests**
   - Test complete flow: Upload → Encrypt → IPFS → Blockchain Mint
   - Test patient privacy end-to-end
   - Test zero-knowledge verification flow

7. **Add Security Tests**
   - Verify encryption before IPFS upload (check buffer size, IV presence)
   - Test wrong key rejection thoroughly
   - Verify URL hash fragment security

---

## 6️⃣ Test Environment Notes

- **Backend URL:** http://localhost:5000
- **Frontend URL:** http://localhost:5173
- **ML Service URL:** http://localhost:5001 (optional)
- **Blockchain Network:** Aptos Devnet
- **IPFS Provider:** Pinata

**Environment Issues:**
- Backend upload endpoint returning 500 errors
- Blockchain functions are frontend-based, not backend APIs
- ML service may be unavailable (should handle gracefully)

---

## 7️⃣ Next Steps

1. **Fix Critical Backend Issues:**
   - Resolve upload endpoint 500 errors
   - Add RecordType validation
   - Standardize hash format

2. **Implement Frontend E2E Tests:**
   - Set up Playwright for frontend testing
   - Test blockchain integration
   - Test patient privacy features
   - Test share link security

3. **Re-run Tests:**
   - After fixes, re-run backend API tests
   - Execute frontend E2E tests
   - Verify all critical security features

---

**Report Generated:** 2025-12-19  
**Test Execution ID:** df9b85a9-383f-49a3-ae2c-6f56a7439f81

