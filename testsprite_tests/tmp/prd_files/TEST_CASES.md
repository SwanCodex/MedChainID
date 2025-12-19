# MedChainID - Detailed Test Cases

**Project:** MedChainID  
**Version:** 1.0.0  
**Last Updated:** 2024

---

## Test Case ID Convention
- **TC-BE-XXX:** Backend Test Cases
- **TC-FE-XXX:** Frontend Test Cases
- **TC-BC-XXX:** Blockchain Test Cases
- **TC-E2E-XXX:** End-to-End Test Cases
- **TC-SEC-XXX:** Security Test Cases

---

## 1. Backend Security Test Cases

### TC-BE-001: File Encryption Before IPFS Upload
**Priority:** CRITICAL  
**Component:** `backend/src/server.js` → `POST /api/upload`

**Preconditions:**
- Backend server running on `http://localhost:5000`
- Valid Pinata API keys configured
- Test PDF file available (`test_lab_result.pdf`)

**Test Steps:**
1. Send POST request to `/api/upload` with test PDF file
2. Monitor server logs for encryption step
3. Verify `encryptBuffer()` is called BEFORE `uploadToPinata()`
4. Check encrypted buffer size > original buffer size
5. Verify IV is prepended (first 16 bytes)

**Expected Results:**
- ✅ Encryption occurs before IPFS upload
- ✅ Encrypted buffer length = original length + 16 bytes (IV)
- ✅ Server logs show: "Step 4/5: Encrypting file with AES-256-CBC..."
- ✅ Server logs show: "Step 5/5: Uploading to IPFS via Pinata..."

**Test Data:**
- File: `test_lab_result.pdf` (500 KB)
- Record Type: `lab_result`

---

### TC-BE-002: RecordType Metadata Handling
**Priority:** HIGH  
**Component:** `backend/src/server.js` → `POST /api/upload`

**Preconditions:**
- Backend server running
- Valid Pinata API keys configured

**Test Steps:**
1. Send POST request with `recordType: "prescription"` in form data
2. Verify `recordType` is extracted from `req.body.recordType`
3. Check `recordType` is passed to `uploadToPinata(buffer, filename, recordType)`
4. Verify Pinata metadata contains `recordType` in keyvalues

**Expected Results:**
- ✅ `recordType` extracted from form data
- ✅ `recordType` passed to IPFS upload function
- ✅ Pinata metadata includes: `recordType: "prescription"`
- ✅ Metadata is searchable in Pinata dashboard

**Test Data:**
- Record Types: `prescription`, `lab_result`, `xray`, `vaccination_record`

---

### TC-BE-003: Decryption Endpoint - Correct Key
**Priority:** HIGH  
**Component:** `backend/src/server.js` → `POST /api/decrypt-view`

**Preconditions:**
- Valid IPFS CID from previous upload
- Correct decryption key (64 hex characters)

**Test Steps:**
1. Upload a file via `/api/upload` → Get `ipfsCid` and encryption key
2. Send POST request to `/api/decrypt-view` with:
   - `cid`: Valid IPFS CID
   - `key`: Correct 64-character hex key
3. Verify response status: 200 OK
4. Verify response Content-Type matches original file type
5. Verify decrypted buffer matches original file

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Content-Type: `application/pdf` (or original mime type)
- ✅ Decrypted file matches original file byte-for-byte
- ✅ Server logs: "✅ Document decrypted: X bytes"

**Test Data:**
- CID: `Qm...` (from test upload)
- Key: `1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3`

---

### TC-BE-004: Decryption Endpoint - Wrong Key
**Priority:** CRITICAL  
**Component:** `backend/src/server.js` → `POST /api/decrypt-view`

**Preconditions:**
- Valid IPFS CID from previous upload
- Correct decryption key known

**Test Steps:**
1. Upload a file via `/api/upload` → Get `ipfsCid`
2. Send POST request to `/api/decrypt-view` with:
   - `cid`: Valid IPFS CID
   - `key`: Wrong key (modified one character)
3. Verify response status: 500 Internal Server Error
4. Verify error message indicates decryption failure

**Expected Results:**
- ✅ Status: 500 Internal Server Error
- ✅ Error message: "Decryption failed" or similar
- ✅ Decryption throws error (does not return corrupted data)
- ✅ Server logs show decryption error

**Test Data:**
- CID: `Qm...` (from test upload)
- Wrong Key: `1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c4` (last char changed)

---

### TC-BE-005: Decryption Endpoint - Invalid Key Format
**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/decrypt-view`

**Test Steps:**
1. Send POST request to `/api/decrypt-view` with:
   - `cid`: Valid IPFS CID
   - `key`: Invalid format (e.g., "short", "not64chars", "invalid-hex")
2. Verify response status: 400 Bad Request or 500 Error
3. Verify error message indicates invalid key format

**Expected Results:**
- ✅ Status: 400 or 500
- ✅ Error message: "Invalid encryption key format (must be 64 hex characters)"
- ✅ Request rejected before decryption attempt

**Test Data:**
- Invalid Keys: `"short"`, `"not64chars"`, `"123"`, `""` (empty)

---

### TC-BE-006: File Upload - Missing File
**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/upload`

**Test Steps:**
1. Send POST request to `/api/upload` without file field
2. Verify response status: 400 Bad Request
3. Verify error message indicates missing file

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "No file uploaded. Please attach a document."

---

### TC-BE-007: File Upload - Invalid File Type
**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/upload`

**Test Steps:**
1. Send POST request with invalid file type (e.g., `.exe`, `.zip`)
2. Verify response status: 400 Bad Request
3. Verify error message indicates invalid file type

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Invalid file type. Only PDF and images are allowed."

**Test Data:**
- Invalid Files: `test.exe`, `test.zip`, `test.docx`

---

### TC-BE-008: File Upload - File Size Limit
**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/upload`

**Test Steps:**
1. Send POST request with file > 10MB
2. Verify response status: 400 Bad Request
3. Verify error message indicates file too large

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "File too large" or "LIMIT_FILE_SIZE"

**Test Data:**
- Large File: `large_file.pdf` (11 MB)

---

## 2. Blockchain Integration Test Cases

### TC-BC-001: mintToken Payload Structure
**Priority:** HIGH  
**Component:** `frontend/src/services/aptos.ts` → `mintToken()`

**Preconditions:**
- Wallet connected (Petra Wallet)
- Sufficient APT balance
- Valid contract address configured

**Test Steps:**
1. Call `mintToken()` with test data:
   - `recordType`: "lab_result"
   - `documentHash`: "0xabc123..."
   - `ipfsCID`: "Qm..."
   - `patientAddress`: "0x..."
2. Intercept `signAndSubmitTransaction` call
3. Verify transaction payload structure:
   - `type`: "entry_function_payload"
   - `function`: `${CONTRACT_ADDRESS}::MedChainID::mint_token`
   - `arguments`: Array with 4 elements
4. Verify arguments are byte arrays (not strings)

**Expected Results:**
- ✅ Payload type: "entry_function_payload"
- ✅ Function signature matches contract
- ✅ Arguments array length: 4
- ✅ All arguments are byte arrays (Uint8Array or Array<number>)
- ✅ Transaction submitted successfully

**Test Data:**
- Record Type: `"lab_result"`
- Document Hash: `"0x1234567890abcdef..."`
- IPFS CID: `"QmTest123..."`
- Patient Address: `"0xPatient123..."`

---

### TC-BC-002: getTokenDetails - Parse All 7 Return Values
**Priority:** CRITICAL  
**Component:** `frontend/src/services/aptos.ts` → `getTokenDetails()`

**Preconditions:**
- Valid token ID exists on-chain
- Valid issuer address

**Test Steps:**
1. Call `getTokenDetails(issuerAddress, tokenId)`
2. Verify response contains all 7 values:
   - `recordType` (hex → decoded text)
   - `documentHash` (hex string)
   - `ipfsCID` (hex → decoded text)
   - `patientAddress` ⚠️ **CRITICAL**
   - `isConsumed` (boolean)
   - `issuer` (address)
   - `timestamp` (number)
3. Verify `patientAddress` is correctly extracted
4. Verify hex strings are decoded correctly

**Expected Results:**
- ✅ All 7 values present in response
- ✅ `patientAddress` matches on-chain value
- ✅ `recordType` decoded from hex to text
- ✅ `ipfsCID` decoded from hex to text
- ✅ `isConsumed` is boolean
- ✅ `timestamp` is number

**Test Data:**
- Issuer Address: `"0xIssuer123..."`
- Token ID: `1`

---

### TC-BC-003: consumeToken - Mark Token as Consumed
**Priority:** HIGH  
**Component:** `frontend/src/services/aptos.ts` → `consumeToken()`

**Preconditions:**
- Valid non-consumed token exists
- Wallet connected
- Sufficient APT balance

**Test Steps:**
1. Call `getTokenDetails()` → Verify `isConsumed: false`
2. Call `consumeToken(issuerAddress, tokenId)`
3. Wait for transaction confirmation
4. Call `getTokenDetails()` again → Verify `isConsumed: true`
5. Attempt to consume again → Should fail or be rejected

**Expected Results:**
- ✅ Initial `isConsumed`: false
- ✅ Transaction submitted successfully
- ✅ After consumption: `isConsumed`: true
- ✅ Second consumption attempt fails or is rejected

**Test Data:**
- Issuer Address: `"0xIssuer123..."`
- Token ID: `1`

---

### TC-BC-004: verifyToken - Valid Token
**Priority:** MEDIUM  
**Component:** `frontend/src/services/aptos.ts` → `verifyToken()`

**Test Steps:**
1. Call `verifyToken(issuerAddress, tokenId)` with valid token
2. Verify response: `[true, issuerAddress]`
3. Verify issuer address matches

**Expected Results:**
- ✅ Returns: `[true, issuerAddress]`
- ✅ Issuer address matches expected value

---

### TC-BC-005: verifyToken - Invalid/Consumed Token
**Priority:** MEDIUM  
**Component:** `frontend/src/services/aptos.ts` → `verifyToken()`

**Test Steps:**
1. Call `verifyToken()` with consumed token ID
2. Verify response: `[false, issuerAddress]` or error

**Expected Results:**
- ✅ Returns: `[false, ...]` or throws error
- ✅ Invalid token correctly identified

---

## 3. Patient Privacy Test Cases

### TC-FE-001: PatientDashboard - Filter Records by Patient Address
**Priority:** CRITICAL  
**Component:** `frontend/src/pages/PatientDashboard.tsx`

**Preconditions:**
- Multiple tokens exist on-chain for different patients
- Patient Wallet 1 connected
- Patient Wallet 2 available (different address)

**Test Steps:**
1. Connect Patient Wallet 1
2. Navigate to `/patient` dashboard
3. Verify `get_all_tokens` is called (fetches ALL tokens)
4. Verify filtering logic: `token.patient_address === account?.address`
5. Verify only Patient Wallet 1's records are displayed
6. Switch to Patient Wallet 2
7. Verify only Patient Wallet 2's records are displayed
8. Verify no records leak between patients

**Expected Results:**
- ✅ `get_all_tokens` fetches all tokens from chain
- ✅ Filtering applied: `patient_address === connected wallet`
- ✅ Only own records displayed
- ✅ No cross-patient record leakage
- ✅ Console logs show: "Found X records for [address]"

**Test Data:**
- Patient 1 Address: `"0xPatient1..."`
- Patient 2 Address: `"0xPatient2..."`
- Total Tokens on Chain: 5 (3 for Patient1, 2 for Patient2)

---

### TC-FE-002: PatientDashboard - Share Access Button URL Format
**Priority:** CRITICAL  
**Component:** `frontend/src/pages/PatientDashboard.tsx` → `generateShareLink()`

**Preconditions:**
- Patient wallet connected
- Medical record exists in dashboard

**Test Steps:**
1. Click "Share Access" button on a record
2. Verify URL copied to clipboard
3. Parse URL structure:
   - Base URL: `/verifier?cid=...`
   - Hash fragment: `#key=...`
4. Verify key is in hash fragment (NOT query parameter)
5. Verify key is 64 hex characters
6. Verify CID matches record's IPFS CID

**Expected Results:**
- ✅ URL format: `${origin}/verifier?cid=${cid}#key=${key}`
- ✅ Key is in hash fragment (`#key=...`)
- ✅ Key is NOT in query parameters (`?key=...`)
- ✅ Key length: 64 hex characters
- ✅ CID matches record's IPFS CID
- ✅ Alert shown: "Secure verification link copied to clipboard!"

**Test Data:**
- IPFS CID: `"QmTest123..."`
- Encryption Key: `"1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3"`
- Expected URL: `http://localhost:5173/verifier?cid=QmTest123...#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3`

---

### TC-FE-003: PatientDashboard - Empty State
**Priority:** LOW  
**Component:** `frontend/src/pages/PatientDashboard.tsx`

**Test Steps:**
1. Connect wallet with no records
2. Navigate to `/patient` dashboard
3. Verify empty state message displayed
4. Verify "No Records Found" message

**Expected Results:**
- ✅ Empty state UI displayed
- ✅ Message: "No Records Found"
- ✅ Helpful message about checking address

---

### TC-FE-004: PatientDashboard - Wallet Not Connected
**Priority:** LOW  
**Component:** `frontend/src/pages/PatientDashboard.tsx`

**Test Steps:**
1. Disconnect wallet
2. Navigate to `/patient` dashboard
3. Verify "Connect Your Wallet" message displayed

**Expected Results:**
- ✅ "Connect Your Wallet" UI displayed
- ✅ No records fetched
- ✅ No errors thrown

---

## 4. Verification Flow Test Cases

### TC-FE-005: Verifier - Zero-Knowledge View (No Key)
**Priority:** CRITICAL  
**Component:** `frontend/src/pages/Verifier.tsx`

**Preconditions:**
- Valid IPFS CID exists

**Test Steps:**
1. Navigate to `/verifier?cid=QmTest123...` (WITHOUT `#key=` fragment)
2. Verify `decryptAndShow()` is NOT called
3. Verify no decryption request sent to backend
4. Verify no error displayed (or appropriate message)
5. Verify manual verification form is shown

**Expected Results:**
- ✅ No decryption attempt made
- ✅ No API call to `/api/decrypt-view`
- ✅ Manual verification form displayed
- ✅ No error thrown

**Test Data:**
- URL: `http://localhost:5173/verifier?cid=QmTest123...` (no hash fragment)

---

### TC-FE-006: Verifier - Zero-Knowledge View (With Key)
**Priority:** HIGH  
**Component:** `frontend/src/pages/Verifier.tsx`

**Preconditions:**
- Valid IPFS CID exists
- Valid decryption key

**Test Steps:**
1. Navigate to `/verifier?cid=QmTest123...#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3`
2. Verify `decryptAndShow()` is called automatically
3. Verify API call to `/api/decrypt-view` with correct CID and key
4. Verify decrypted document displayed
5. Verify image/document rendered correctly

**Expected Results:**
- ✅ `decryptAndShow()` called automatically
- ✅ API call: `POST /api/decrypt-view` with `{cid, key}`
- ✅ Document decrypted and displayed
- ✅ Image/document rendered correctly
- ✅ No errors

**Test Data:**
- URL: `http://localhost:5173/verifier?cid=QmTest123...#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3`

---

### TC-FE-007: Verifier - Manual Token Verification
**Priority:** MEDIUM  
**Component:** `frontend/src/pages/Verifier.tsx` → `handleVerify()`

**Preconditions:**
- Valid issuer address and token ID

**Test Steps:**
1. Enter issuer address in form
2. Enter token ID in form
3. Click "Verify Token" button
4. Verify `verifyToken()` is called
5. Verify `getTokenDetails()` is called
6. Verify token details displayed
7. Verify status (Active/Consumed) shown correctly

**Expected Results:**
- ✅ Token verified successfully
- ✅ Token details displayed
- ✅ Status badge shown (Active/Consumed)
- ✅ All fields populated correctly

**Test Data:**
- Issuer Address: `"0xIssuer123..."`
- Token ID: `1`

---

### TC-FE-008: Verifier - Consume Token
**Priority:** HIGH  
**Component:** `frontend/src/pages/Verifier.tsx` → `handleConsume()`

**Preconditions:**
- Valid non-consumed token verified
- Wallet connected

**Test Steps:**
1. Verify token (see TC-FE-007)
2. Verify token status: "Active"
3. Click "Consume Token" button
4. Approve transaction in wallet
5. Wait for transaction confirmation
6. Verify token status updated to "Consumed"
7. Verify "Consume Token" button disabled or hidden

**Expected Results:**
- ✅ Transaction submitted successfully
- ✅ Token status changes to "Consumed"
- ✅ Button disabled or hidden after consumption
- ✅ Warning message displayed
- ✅ Alert: "Token consumed successfully!"

---

### TC-FE-009: Verifier - Consume Already Consumed Token
**Priority:** MEDIUM  
**Component:** `frontend/src/pages/Verifier.tsx`

**Preconditions:**
- Already consumed token verified

**Test Steps:**
1. Verify consumed token
2. Verify "Consume Token" button is disabled or hidden
3. Attempt to consume via direct function call (if possible)
4. Verify error or rejection

**Expected Results:**
- ✅ Button disabled/hidden for consumed tokens
- ✅ Consumption attempt fails or is rejected
- ✅ Error message displayed

---

## 5. End-to-End Test Cases

### TC-E2E-001: Complete Flow - Issuer → Patient → Doctor
**Priority:** CRITICAL  
**Component:** Full Application Flow

**Preconditions:**
- All services running (Backend, Frontend, ML Service)
- Wallet connected (Issuer wallet)
- Test PDF file available

**Test Steps:**
1. **Issuer Flow:**
   - Navigate to `/issuer`
   - Upload medical record PDF
   - Enter record type: "lab_result"
   - Enter patient address
   - Submit → Verify upload success
   - Verify token minted on blockchain

2. **Patient Flow:**
   - Switch to Patient wallet
   - Navigate to `/patient`
   - Verify record appears in dashboard
   - Click "Share Access" → Copy link

3. **Doctor/Verifier Flow:**
   - Open shared link in new browser/incognito
   - Verify document decrypted and displayed
   - Verify token details shown
   - Consume token (if needed)

**Expected Results:**
- ✅ File encrypted and uploaded to IPFS
- ✅ Token minted successfully
- ✅ Patient sees only their record
- ✅ Share link works correctly
- ✅ Document decrypted and displayed
- ✅ Token consumption works

---

### TC-E2E-002: Privacy Flow - Multiple Patients
**Priority:** CRITICAL  
**Component:** Patient Dashboard Filtering

**Test Steps:**
1. Issue records for Patient 1 and Patient 2
2. Connect Patient 1 wallet
3. Verify only Patient 1's records shown
4. Switch to Patient 2 wallet
5. Verify only Patient 2's records shown
6. Verify no cross-contamination

**Expected Results:**
- ✅ Patient 1 sees only their records
- ✅ Patient 2 sees only their records
- ✅ No records leak between patients
- ✅ Filtering works correctly

---

## 6. Security Test Cases

### TC-SEC-001: Encryption Key Not in Query Parameters
**Priority:** CRITICAL  
**Component:** Share Link Generation

**Test Steps:**
1. Generate share link
2. Parse URL
3. Verify key is NOT in query parameters (`?key=...`)
4. Verify key is in hash fragment (`#key=...`)
5. Verify key not sent to server (check network tab)

**Expected Results:**
- ✅ Key in hash fragment only
- ✅ Key NOT in query parameters
- ✅ No server request contains key in URL

---

### TC-SEC-002: Wrong Decryption Key Rejection
**Priority:** CRITICAL  
**Component:** Backend Decryption Endpoint

**Test Steps:**
1. Upload file → Get CID and correct key
2. Attempt decryption with wrong key
3. Verify decryption fails
4. Verify no corrupted data returned
5. Verify error message displayed

**Expected Results:**
- ✅ Decryption fails with wrong key
- ✅ Error returned (not corrupted data)
- ✅ Status: 500 Internal Server Error

---

### TC-SEC-003: Patient Address Filtering
**Priority:** CRITICAL  
**Component:** Patient Dashboard

**Test Steps:**
1. Create tokens for multiple patients
2. Connect Patient A wallet
3. Verify only Patient A's records shown
4. Verify Patient B's records NOT shown
5. Check network requests for any patient B data

**Expected Results:**
- ✅ Only own records displayed
- ✅ No other patient's records visible
- ✅ Filtering applied correctly

---

## Test Execution Summary

| Test Case ID | Priority | Status | Notes |
|-------------|----------|--------|-------|
| TC-BE-001 | CRITICAL | ⏳ Pending | File encryption verification |
| TC-BE-002 | HIGH | ⏳ Pending | RecordType metadata |
| TC-BE-003 | HIGH | ⏳ Pending | Correct key decryption |
| TC-BE-004 | CRITICAL | ⏳ Pending | Wrong key rejection |
| TC-BE-005 | MEDIUM | ⏳ Pending | Invalid key format |
| TC-BC-001 | HIGH | ⏳ Pending | mintToken payload |
| TC-BC-002 | CRITICAL | ⏳ Pending | getTokenDetails parsing |
| TC-BC-003 | HIGH | ⏳ Pending | Token consumption |
| TC-FE-001 | CRITICAL | ⏳ Pending | Patient filtering |
| TC-FE-002 | CRITICAL | ⏳ Pending | Share link format |
| TC-FE-005 | CRITICAL | ⏳ Pending | Zero-knowledge view |
| TC-FE-006 | HIGH | ⏳ Pending | Decryption with key |
| TC-E2E-001 | CRITICAL | ⏳ Pending | Complete flow |
| TC-SEC-001 | CRITICAL | ⏳ Pending | Key security |

---

**Document Status:** ✅ Ready for Execution

