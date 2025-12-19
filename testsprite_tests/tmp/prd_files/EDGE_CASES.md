# MedChainID - Edge Cases & Security Scenarios

**Project:** MedChainID  
**Version:** 1.0.0  
**Last Updated:** 2024

---

## Overview

This document outlines edge cases, security scenarios, and boundary conditions that must be tested to ensure the robustness and security of the MedChainID application.

---

## 1. IPFS CID Edge Cases

### EC-IPFS-001: Malformed IPFS CID
**Scenario:** User provides invalid IPFS CID format  
**Test Data:**
- `"invalid_cid_123"`
- `"not_a_cid"`
- `"Qm"` (too short)
- `""` (empty string)
- `"Qm123!@#$%^&*()"` (special characters)

**Expected Behavior:**
- Backend should validate CID format before attempting IPFS retrieval
- Error message: "Invalid IPFS CID format" or "File not found on IPFS"
- No crash or undefined behavior

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `GET /api/download/:cid`, `POST /api/decrypt-view`

---

### EC-IPFS-002: Non-Existent IPFS CID
**Scenario:** Valid CID format but file doesn't exist on IPFS  
**Test Data:**
- `"QmNonExistent1234567890abcdefghijklmnopqrstuvwxyz"`
- Valid CIDv1 format but unpinned/deleted

**Expected Behavior:**
- Error: "File not found on IPFS. Invalid CID or file unpinned."
- Status: 404 or 500
- Graceful error handling

**Priority:** MEDIUM  
**Component:** `backend/src/utils/ipfs.js` → `getFromIPFS()`

---

### EC-IPFS-003: IPFS Gateway Timeout
**Scenario:** IPFS gateway is slow or times out  
**Test Data:**
- Valid CID but slow network response (>30 seconds)

**Expected Behavior:**
- Timeout after 30 seconds
- Error: "Failed to retrieve from IPFS: timeout"
- User-friendly error message

**Priority:** LOW  
**Component:** `backend/src/utils/ipfs.js` → `getFromIPFS()`

---

### EC-IPFS-004: Corrupted IPFS Data
**Scenario:** IPFS returns corrupted or incomplete data  
**Test Data:**
- Valid CID but file is corrupted on IPFS

**Expected Behavior:**
- Decryption fails with appropriate error
- Error: "Decryption failed: Invalid encrypted buffer"
- No crash or undefined behavior

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/decrypt-view`

---

## 2. Wallet Address Edge Cases

### EC-WALLET-001: Invalid Wallet Address Format
**Scenario:** User enters invalid Aptos address format  
**Test Data:**
- `"not_an_address"`
- `"0x"` (too short)
- `"0x123"` (invalid length)
- `"0xInvalidChars!@#$"`
- `""` (empty string)

**Expected Behavior:**
- Frontend validation before submission
- Error: "Invalid wallet address format"
- Transaction not submitted

**Priority:** MEDIUM  
**Component:** `frontend/src/pages/Issuer.tsx`, `frontend/src/pages/PatientDashboard.tsx`

---

### EC-WALLET-002: Address Case Sensitivity
**Scenario:** Aptos addresses may have different casing  
**Test Data:**
- `"0xABC123..."` vs `"0xabc123..."`

**Expected Behavior:**
- Address comparison should be case-insensitive OR normalized
- Patient filtering works correctly regardless of case
- No false positives/negatives in filtering

**Priority:** HIGH  
**Component:** `frontend/src/pages/PatientDashboard.tsx` → Filtering logic

---

### EC-WALLET-003: Wallet Disconnection During Transaction
**Scenario:** User disconnects wallet while transaction is pending  
**Test Data:**
- Transaction submitted → Wallet disconnected → Transaction confirmation

**Expected Behavior:**
- Transaction still processes on-chain
- UI handles disconnection gracefully
- Error message or state update when wallet reconnected

**Priority:** MEDIUM  
**Component:** `frontend/src/services/aptos.ts` → `mintToken()`, `consumeToken()`

---

### EC-WALLET-004: Insufficient APT Balance
**Scenario:** User doesn't have enough APT to pay gas fees  
**Test Data:**
- Wallet with 0 APT or very low balance

**Expected Behavior:**
- Error: "Insufficient APT tokens. Get free tokens from https://aptoslabs.com/testnet-faucet"
- Transaction not submitted
- User-friendly error message

**Priority:** MEDIUM  
**Component:** `frontend/src/services/aptos.ts` → `mintToken()`, `consumeToken()`

---

## 3. URL Hash Fragment Security

### EC-URL-001: Key in Query Parameter (Security Risk)
**Scenario:** Malicious user or bug puts key in query parameter instead of hash  
**Test Data:**
- `http://localhost:5173/verifier?cid=Qm123&key=abc...` (WRONG - key in query)

**Expected Behavior:**
- Application should NOT use key from query parameters
- Only use key from hash fragment (`#key=...`)
- Log security warning if query param key detected

**Priority:** CRITICAL  
**Component:** `frontend/src/pages/Verifier.tsx` → `useEffect` hash parsing

**Test:**
```javascript
// Should NOT work:
/verifier?cid=Qm123&key=abc...  // Query param - REJECT

// Should work:
/verifier?cid=Qm123#key=abc...   // Hash fragment - ACCEPT
```

---

### EC-URL-002: Tampered URL Hash
**Scenario:** User modifies the hash fragment key  
**Test Data:**
- Original: `#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3`
- Tampered: `#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c4` (last char changed)

**Expected Behavior:**
- Decryption fails with wrong key
- Error: "Decryption failed"
- No corrupted data displayed

**Priority:** CRITICAL  
**Component:** `frontend/src/pages/Verifier.tsx` → `decryptAndShow()`

---

### EC-URL-003: Missing CID in URL
**Scenario:** URL has key but no CID  
**Test Data:**
- `http://localhost:5173/verifier#key=abc...` (no CID)

**Expected Behavior:**
- No decryption attempt
- Manual verification form shown
- No error thrown

**Priority:** MEDIUM  
**Component:** `frontend/src/pages/Verifier.tsx` → `useEffect`

---

### EC-URL-004: Multiple Hash Parameters
**Scenario:** URL has multiple hash parameters  
**Test Data:**
- `http://localhost:5173/verifier?cid=Qm123#key=abc&other=value`

**Expected Behavior:**
- Only `key` parameter extracted from hash
- Other parameters ignored
- Decryption proceeds with correct key

**Priority:** LOW  
**Component:** `frontend/src/pages/Verifier.tsx` → Hash parsing

---

### EC-URL-005: URL Encoding Issues
**Scenario:** Key or CID contains special characters that need encoding  
**Test Data:**
- CID: `QmTest+123` (contains `+`)
- Key: `1e4a+e9d7...` (contains `+`)

**Expected Behavior:**
- URL encoding/decoding handled correctly
- No data corruption
- Decryption works correctly

**Priority:** MEDIUM  
**Component:** `frontend/src/pages/Verifier.tsx` → URL parsing

---

## 4. Encryption/Decryption Edge Cases

### EC-ENC-001: Wrong Key Length
**Scenario:** Decryption key has incorrect length  
**Test Data:**
- Key: `"short"` (too short)
- Key: `"1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3extra"` (too long)
- Key: `"1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283"` (63 chars, missing 1)

**Expected Behavior:**
- Validation: "Invalid encryption key format (must be 64 hex characters)"
- Status: 400 Bad Request
- No decryption attempt

**Priority:** HIGH  
**Component:** `backend/src/server.js` → `POST /api/decrypt-view`

---

### EC-ENC-002: Non-Hex Key Characters
**Scenario:** Key contains non-hexadecimal characters  
**Test Data:**
- Key: `"1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283cg"` (contains 'g')
- Key: `"1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c!"` (contains '!')

**Expected Behavior:**
- Validation error or decryption failure
- Error message indicates invalid hex characters
- No crash

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/decrypt-view`

---

### EC-ENC-003: Empty Encrypted Buffer
**Scenario:** IPFS returns empty buffer (0 bytes)  
**Test Data:**
- CID pointing to empty file

**Expected Behavior:**
- Error: "Invalid encrypted buffer: too short to contain IV"
- Status: 500
- No crash

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/decrypt-view`

---

### EC-ENC-004: Buffer Too Short for IV
**Scenario:** Encrypted buffer is shorter than IV length (16 bytes)  
**Test Data:**
- Buffer: `Buffer.from([1, 2, 3])` (only 3 bytes)

**Expected Behavior:**
- Error: "Invalid encrypted buffer: too short to contain IV"
- Status: 500
- No crash

**Priority:** MEDIUM  
**Component:** `backend/src/utils/encryption.js` → `decryptBuffer()`

---

### EC-ENC-005: Same File, Different Encryption
**Scenario:** Same file encrypted twice produces different encrypted buffers  
**Test Data:**
- Upload same PDF twice
- Compare encrypted buffers

**Expected Behavior:**
- Encrypted buffers are DIFFERENT (due to random IV)
- Both can be decrypted with same key
- Original files match after decryption

**Priority:** LOW  
**Component:** `backend/src/utils/encryption.js` → `encryptBuffer()`

---

## 5. Blockchain Transaction Edge Cases

### EC-BC-001: Transaction Rejection by User
**Scenario:** User rejects transaction in wallet popup  
**Test Data:**
- User clicks "Reject" in Petra wallet

**Expected Behavior:**
- Error: "Transaction rejected by user" or "User rejected the transaction"
- No transaction submitted
- UI returns to previous state
- User-friendly error message

**Priority:** MEDIUM  
**Component:** `frontend/src/services/aptos.ts` → `mintToken()`, `consumeToken()`

---

### EC-BC-002: Transaction Timeout
**Scenario:** Transaction takes too long to confirm  
**Test Data:**
- Network congestion or slow blockchain

**Expected Behavior:**
- Timeout after reasonable time (e.g., 60 seconds)
- Error message: "Transaction timeout"
- User can retry

**Priority:** LOW  
**Component:** `frontend/src/services/aptos.ts` → `aptos.waitForTransaction()`

---

### EC-BC-003: Contract Not Deployed
**Scenario:** Contract address points to non-existent contract  
**Test Data:**
- Invalid `VITE_CONTRACT_ADDRESS` in .env

**Expected Behavior:**
- Error: "Smart contract not found. Please ensure contract is deployed at: [address]"
- Transaction not submitted
- Clear error message

**Priority:** HIGH  
**Component:** `frontend/src/services/aptos.ts` → `mintToken()`

---

### EC-BC-004: Invalid Function Arguments
**Scenario:** Transaction payload has wrong argument types or count  
**Test Data:**
- Missing argument in `mintToken()` call
- Wrong argument type (string instead of bytes)

**Expected Behavior:**
- Validation error before transaction submission
- Or blockchain error: "Invalid function arguments"
- User-friendly error message

**Priority:** HIGH  
**Component:** `frontend/src/services/aptos.ts` → `mintToken()`

---

### EC-BC-005: getTokenDetails - Missing Return Values
**Scenario:** Smart contract returns fewer than 7 values  
**Test Data:**
- Contract bug or version mismatch

**Expected Behavior:**
- Error handling for missing values
- No crash or undefined behavior
- Error: "Invalid token details response"

**Priority:** HIGH  
**Component:** `frontend/src/services/aptos.ts` → `getTokenDetails()`

---

## 6. Patient Privacy Edge Cases

### EC-PRIV-001: Empty Patient Address
**Scenario:** Patient address is empty string or null  
**Test Data:**
- `patientAddress: ""`
- `patientAddress: null`
- `patientAddress: undefined`

**Expected Behavior:**
- Validation error before minting
- Or filtering excludes records with empty patient address
- No records shown if own address is empty

**Priority:** HIGH  
**Component:** `frontend/src/pages/PatientDashboard.tsx` → Filtering logic

---

### EC-PRIV-002: Case-Insensitive Address Comparison
**Scenario:** Patient addresses stored with different casing  
**Test Data:**
- On-chain: `"0xABC123..."`
- Connected wallet: `"0xabc123..."`

**Expected Behavior:**
- Address comparison should be case-insensitive OR normalized
- Records still filtered correctly
- No false negatives

**Priority:** HIGH  
**Component:** `frontend/src/pages/PatientDashboard.tsx` → Filtering logic

---

### EC-PRIV-003: Multiple Wallets Same Patient
**Scenario:** Patient uses multiple wallets, records issued to different addresses  
**Test Data:**
- Patient has Wallet A and Wallet B
- Some records issued to Wallet A, some to Wallet B

**Expected Behavior:**
- Each wallet shows only records issued to that specific address
- No cross-wallet record visibility
- Patient must switch wallets to see all records

**Priority:** MEDIUM  
**Component:** `frontend/src/pages/PatientDashboard.tsx` → Filtering logic

---

### EC-PRIV-004: Token Without Patient Address
**Scenario:** Legacy token or bug creates token without patient_address field  
**Test Data:**
- Token with `patient_address: null` or missing field

**Expected Behavior:**
- Filtering excludes tokens without patient_address
- Or shows error/warning
- No crash

**Priority:** MEDIUM  
**Component:** `frontend/src/pages/PatientDashboard.tsx` → Filtering logic

---

## 7. File Upload Edge Cases

### EC-FILE-001: File Size Boundary
**Scenario:** File exactly at size limit (10MB)  
**Test Data:**
- File: Exactly 10MB (10 * 1024 * 1024 bytes)

**Expected Behavior:**
- File uploads successfully
- No rejection

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/upload`

---

### EC-FILE-002: File Size Over Limit
**Scenario:** File exceeds 10MB limit  
**Test Data:**
- File: 10.1MB or 11MB

**Expected Behavior:**
- Error: "File too large. Maximum size is 10MB"
- Status: 400 Bad Request
- Upload rejected

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/upload`

---

### EC-FILE-003: Empty File
**Scenario:** User uploads 0-byte file  
**Test Data:**
- Empty PDF or image file

**Expected Behavior:**
- Error: "File is empty" or validation error
- Upload rejected
- No crash

**Priority:** LOW  
**Component:** `backend/src/server.js` → `POST /api/upload`

---

### EC-FILE-004: Corrupted File
**Scenario:** File is corrupted or invalid format  
**Test Data:**
- PDF with corrupted header
- Image file with wrong extension

**Expected Behavior:**
- Error during processing
- Error: "Failed to process document" or format-specific error
- No crash

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/upload`

---

### EC-FILE-005: Very Large File Name
**Scenario:** Filename is extremely long  
**Test Data:**
- Filename: 500+ characters

**Expected Behavior:**
- Filename truncated or handled gracefully
- Upload succeeds
- No crash

**Priority:** LOW  
**Component:** `backend/src/server.js` → `POST /api/upload`

---

### EC-FILE-006: Special Characters in Filename
**Scenario:** Filename contains special characters  
**Test Data:**
- `"test file (1).pdf"`
- `"test@file#123.pdf"`
- `"test file 中文.pdf"` (Unicode)

**Expected Behavior:**
- Filename handled correctly
- No encoding issues
- Upload succeeds

**Priority:** LOW  
**Component:** `backend/src/server.js` → `POST /api/upload`

---

## 8. ML Service Edge Cases

### EC-ML-001: ML Service Down
**Scenario:** ML fraud detection service is unavailable  
**Test Data:**
- ML service URL returns 500 or timeout

**Expected Behavior:**
- Upload continues with default risk analysis
- Log: "ML service unavailable - using default risk assessment"
- No upload failure

**Priority:** LOW  
**Component:** `backend/src/server.js` → `analyzeWithML()`

---

### EC-ML-002: ML Service Slow Response
**Scenario:** ML service takes >60 seconds to respond  
**Test Data:**
- ML service timeout set to 60 seconds

**Expected Behavior:**
- Timeout after 60 seconds
- Default risk analysis used
- Upload continues

**Priority:** LOW  
**Component:** `backend/src/server.js` → `analyzeWithML()`

---

### EC-ML-003: ML Service Invalid Response
**Scenario:** ML service returns unexpected response format  
**Test Data:**
- ML service returns malformed JSON
- Missing required fields

**Expected Behavior:**
- Default risk analysis used
- Error logged but upload continues
- No crash

**Priority:** LOW  
**Component:** `backend/src/server.js` → `analyzeWithML()`

---

## 9. Concurrent Operations Edge Cases

### EC-CONC-001: Multiple Simultaneous Uploads
**Scenario:** User uploads multiple files at once  
**Test Data:**
- 5 files uploaded simultaneously

**Expected Behavior:**
- All uploads process correctly
- No race conditions
- Each file encrypted independently

**Priority:** MEDIUM  
**Component:** `backend/src/server.js` → `POST /api/upload`

---

### EC-CONC-002: Token Consumption Race Condition
**Scenario:** Two verifiers attempt to consume same token simultaneously  
**Test Data:**
- Token ID: 1
- Two users click "Consume" at same time

**Expected Behavior:**
- Only one transaction succeeds
- Second transaction fails or is rejected
- Token marked as consumed after first transaction

**Priority:** HIGH  
**Component:** `frontend/src/services/aptos.ts` → `consumeToken()`

---

## 10. Network & Infrastructure Edge Cases

### EC-NET-001: Backend Server Restart During Upload
**Scenario:** Backend server restarts while file is being processed  
**Test Data:**
- Upload in progress → Server restarts

**Expected Behavior:**
- Upload fails with connection error
- User can retry
- No data corruption

**Priority:** LOW  
**Component:** `frontend/src/services/api.ts` → `uploadDocument()`

---

### EC-NET-002: IPFS Gateway Unavailable
**Scenario:** Pinata gateway is down or unreachable  
**Test Data:**
- Valid CID but gateway returns 503

**Expected Behavior:**
- Error: "Failed to retrieve from IPFS: [error]"
- User-friendly error message
- Retry option

**Priority:** MEDIUM  
**Component:** `backend/src/utils/ipfs.js` → `getFromIPFS()`

---

## Test Execution Priority

### Critical (Must Test)
- EC-URL-001: Key in Query Parameter (Security Risk)
- EC-URL-002: Tampered URL Hash
- EC-ENC-001: Wrong Key Length
- EC-PRIV-001: Empty Patient Address
- EC-PRIV-002: Case-Insensitive Address Comparison
- EC-BC-003: Contract Not Deployed
- EC-BC-004: Invalid Function Arguments
- EC-BC-005: getTokenDetails - Missing Return Values

### High Priority
- EC-IPFS-001: Malformed IPFS CID
- EC-WALLET-002: Address Case Sensitivity
- EC-ENC-002: Non-Hex Key Characters
- EC-PRIV-003: Multiple Wallets Same Patient
- EC-CONC-002: Token Consumption Race Condition

### Medium Priority
- EC-IPFS-002: Non-Existent IPFS CID
- EC-IPFS-004: Corrupted IPFS Data
- EC-WALLET-001: Invalid Wallet Address Format
- EC-WALLET-003: Wallet Disconnection During Transaction
- EC-WALLET-004: Insufficient APT Balance
- EC-URL-003: Missing CID in URL
- EC-ENC-003: Empty Encrypted Buffer
- EC-ENC-004: Buffer Too Short for IV
- EC-BC-001: Transaction Rejection by User
- EC-FILE-001: File Size Boundary
- EC-FILE-002: File Size Over Limit
- EC-FILE-004: Corrupted File
- EC-CONC-001: Multiple Simultaneous Uploads
- EC-NET-002: IPFS Gateway Unavailable

### Low Priority
- EC-IPFS-003: IPFS Gateway Timeout
- EC-URL-004: Multiple Hash Parameters
- EC-URL-005: URL Encoding Issues
- EC-ENC-005: Same File, Different Encryption
- EC-BC-002: Transaction Timeout
- EC-PRIV-004: Token Without Patient Address
- EC-FILE-003: Empty File
- EC-FILE-005: Very Large File Name
- EC-FILE-006: Special Characters in Filename
- EC-ML-001: ML Service Down
- EC-ML-002: ML Service Slow Response
- EC-ML-003: ML Service Invalid Response
- EC-NET-001: Backend Server Restart During Upload

---

**Document Status:** ✅ Ready for Edge Case Testing

