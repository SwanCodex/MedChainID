# MedChainID - Manual Testing Checklist

**Project:** MedChainID  
**Version:** 1.0.0  
**Last Updated:** 2024

---

## How to Use This Checklist

- ✅ **Pass:** Test passed, no issues found
- ❌ **Fail:** Test failed, defect found
- ⚠️ **Blocked:** Test cannot be executed due to blocking issue
- ➖ **N/A:** Not applicable for this test cycle

**Notes:** Use the Notes column to document any observations, screenshots, or defect IDs.

---

## 1. Backend Security Testing

### 1.1 File Encryption Verification

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 1.1.1 | Start backend server and monitor console logs | Server starts successfully | ⏳ | |
| 1.1.2 | Upload a PDF file via POST `/api/upload` | File uploads successfully | ⏳ | |
| 1.1.3 | Check server logs for encryption step | Log shows "Step 4/5: Encrypting file with AES-256-CBC..." BEFORE IPFS upload | ⏳ | |
| 1.1.4 | Check server logs for IPFS upload step | Log shows "Step 5/5: Uploading to IPFS via Pinata..." AFTER encryption | ⏳ | |
| 1.1.5 | Verify encrypted buffer size | Encrypted size > original size (original + 16 bytes IV) | ⏳ | |
| 1.1.6 | Upload an image file (JPEG/PNG) | Same encryption flow applies | ⏳ | |

**Critical:** If encryption does NOT occur before IPFS upload, this is a **CRITICAL SECURITY BUG**.

---

### 1.2 RecordType Metadata Handling

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 1.2.1 | Upload file with `recordType: "lab_result"` | Upload succeeds | ⏳ | |
| 1.2.2 | Check Pinata dashboard metadata | Metadata contains `recordType: "lab_result"` in keyvalues | ⏳ | |
| 1.2.3 | Upload file with `recordType: "prescription"` | Upload succeeds | ⏳ | |
| 1.2.4 | Verify metadata is searchable | Can search by `recordType` in Pinata | ⏳ | |
| 1.2.5 | Upload file without `recordType` | Defaults to `"unknown"` or handles gracefully | ⏳ | |

---

### 1.3 Decryption Endpoint Security

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 1.3.1 | Upload file → Get `ipfsCid` and encryption key | Upload successful | ⏳ | |
| 1.3.2 | Call POST `/api/decrypt-view` with **correct key** | Status 200, decrypted file returned | ⏳ | |
| 1.3.3 | Verify decrypted file matches original | Files match byte-for-byte | ⏳ | |
| 1.3.4 | Call POST `/api/decrypt-view` with **wrong key** (1 char changed) | Status 500, error message: "Decryption failed" | ⏳ | |
| 1.3.5 | Call POST `/api/decrypt-view` with **invalid key format** (short string) | Status 400/500, error: "Invalid encryption key format" | ⏳ | |
| 1.3.6 | Call POST `/api/decrypt-view` with **empty key** | Status 400, error message | ⏳ | |
| 1.3.7 | Call POST `/api/decrypt-view` with **missing CID** | Status 400, error: "CID and decryption key are required" | ⏳ | |

**Critical:** Wrong key MUST fail. If wrong key succeeds or returns corrupted data, this is a **CRITICAL SECURITY BUG**.

---

## 2. Blockchain Integration Testing

### 2.1 Token Minting

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 2.1.1 | Connect Petra wallet (Issuer account) | Wallet connected successfully | ⏳ | |
| 2.1.2 | Navigate to Issuer page (`/issuer`) | Page loads, upload form visible | ⏳ | |
| 2.1.3 | Upload medical record PDF | File uploads, encryption occurs | ⏳ | |
| 2.1.4 | Enter patient address | Address accepted | ⏳ | |
| 2.1.5 | Enter record type | Record type accepted | ⏳ | |
| 2.1.6 | Click "Issue Record" / "Mint Token" | Transaction popup appears in wallet | ⏳ | |
| 2.1.7 | Approve transaction in wallet | Transaction submitted | ⏳ | |
| 2.1.8 | Wait for confirmation | Transaction confirmed on blockchain | ⏳ | |
| 2.1.9 | Check Aptos Explorer | Token visible on-chain | ⏳ | |
| 2.1.10 | Verify transaction payload structure | Payload matches Aptos Wallet Adapter v2 format | ⏳ | |

**Note:** Check browser console for transaction payload structure. Should be:
```json
{
  "type": "entry_function_payload",
  "function": "0x...::MedChainID::mint_token",
  "arguments": [...]
}
```

---

### 2.2 Token Details Retrieval

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 2.2.1 | Call `getTokenDetails(issuerAddress, tokenId)` | Returns object with 7 fields | ⏳ | |
| 2.2.2 | Verify `recordType` field | Decoded text (not hex) | ⏳ | |
| 2.2.3 | Verify `documentHash` field | Hex string | ⏳ | |
| 2.2.4 | Verify `ipfsCID` field | Decoded text (not hex) | ⏳ | |
| 2.2.5 | Verify `patientAddress` field | **CRITICAL:** Address string present | ⏳ | |
| 2.2.6 | Verify `isConsumed` field | Boolean (true/false) | ⏳ | |
| 2.2.7 | Verify `issuer` field | Address string | ⏳ | |
| 2.2.8 | Verify `timestamp` field | Number (Unix timestamp) | ⏳ | |

**Critical:** If `patientAddress` is missing or incorrect, patient filtering will fail.

---

### 2.3 Token Consumption

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 2.3.1 | Verify token (see 2.2) | Token details shown, `isConsumed: false` | ⏳ | |
| 2.3.2 | Click "Consume Token" button | Wallet popup appears | ⏳ | |
| 2.3.3 | Approve transaction | Transaction submitted | ⏳ | |
| 2.3.4 | Wait for confirmation | Transaction confirmed | ⏳ | |
| 2.3.5 | Refresh token details | `isConsumed: true` | ⏳ | |
| 2.3.6 | Attempt to consume again | Button disabled or transaction rejected | ⏳ | |

---

## 3. Patient Privacy Testing

### 3.1 Patient Dashboard Filtering

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 3.1.1 | Issue 3 records for Patient A | Records minted successfully | ⏳ | |
| 3.1.2 | Issue 2 records for Patient B | Records minted successfully | ⏳ | |
| 3.1.3 | Connect Patient A wallet | Wallet connected | ⏳ | |
| 3.1.4 | Navigate to `/patient` dashboard | Dashboard loads | ⏳ | |
| 3.1.5 | Check browser console logs | Log shows: "Fetched all tokens: 5" | ⏳ | |
| 3.1.6 | Check browser console logs | Log shows: "Found 3 records for [Patient A address]" | ⏳ | |
| 3.1.7 | Verify displayed records | Only 3 records shown (Patient A's records) | ⏳ | |
| 3.1.8 | Verify record details | All records have `patient_address === Patient A address` | ⏳ | |
| 3.1.9 | Switch to Patient B wallet | Wallet switched | ⏳ | |
| 3.1.10 | Refresh dashboard | Only 2 records shown (Patient B's records) | ⏳ | |
| 3.1.11 | Verify no Patient A records visible | Patient A records NOT displayed | ⏳ | |

**Critical:** If Patient B can see Patient A's records, this is a **CRITICAL PRIVACY BUG**.

---

### 3.2 Share Access Link Generation

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 3.2.1 | Click "Share Access" button on a record | Alert: "Secure verification link copied to clipboard!" | ⏳ | |
| 3.2.2 | Paste link from clipboard | URL format: `http://localhost:5173/verifier?cid=...` | ⏳ | |
| 3.2.3 | Check URL structure | Key is in hash fragment: `#key=...` | ⏳ | |
| 3.2.4 | Verify key is NOT in query params | URL does NOT contain `?key=...` | ⏳ | |
| 3.2.5 | Verify key length | Key is 64 hex characters | ⏳ | |
| 3.2.6 | Verify CID matches record | CID matches record's IPFS CID | ⏳ | |
| 3.2.7 | Open link in new browser tab | Verifier page loads | ⏳ | |
| 3.2.8 | Check browser Network tab | No request contains key in URL | ⏳ | |

**Critical:** Key MUST be in hash fragment (`#key=...`), NOT in query parameters (`?key=...`). Hash fragments are not sent to the server.

---

## 4. Verification Flow Testing

### 4.1 Zero-Knowledge Verification (No Key)

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 4.1.1 | Navigate to `/verifier?cid=QmTest123...` (NO `#key=` fragment) | Verifier page loads | ⏳ | |
| 4.1.2 | Check browser Network tab | NO request to `/api/decrypt-view` | ⏳ | |
| 4.1.3 | Check browser console | No decryption attempt logged | ⏳ | |
| 4.1.4 | Verify manual verification form | Form is visible and functional | ⏳ | |
| 4.1.5 | Verify no error displayed | No error message shown | ⏳ | |

**Critical:** Without the key, the application MUST NOT attempt to decrypt the file.

---

### 4.2 Zero-Knowledge Verification (With Key)

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 4.2.1 | Navigate to `/verifier?cid=QmTest123...#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3` | Verifier page loads | ⏳ | |
| 4.2.2 | Check browser Network tab | Request to `/api/decrypt-view` with `{cid, key}` | ⏳ | |
| 4.2.3 | Verify decryption request | POST body contains CID and key | ⏳ | |
| 4.2.4 | Wait for response | Document decrypted successfully | ⏳ | |
| 4.2.5 | Verify document displayed | Image/PDF rendered correctly | ⏳ | |
| 4.2.6 | Verify no errors | No error messages | ⏳ | |

---

### 4.3 Manual Token Verification

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 4.3.1 | Enter issuer address in form | Address accepted | ⏳ | |
| 4.3.2 | Enter token ID in form | Token ID accepted | ⏳ | |
| 4.3.3 | Click "Verify Token" button | Verification starts | ⏳ | |
| 4.3.4 | Wait for response | Token details displayed | ⏳ | |
| 4.3.5 | Verify token details | All fields populated correctly | ⏳ | |
| 4.3.6 | Verify status badge | Shows "ACTIVE" or "CONSUMED" | ⏳ | |
| 4.3.7 | Verify patient address shown | Patient address displayed | ⏳ | |
| 4.3.8 | Verify IPFS CID shown | IPFS CID displayed | ⏳ | |
| 4.3.9 | Verify document hash shown | Document hash displayed | ⏳ | |

---

### 4.4 Token Consumption Flow

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 4.4.1 | Verify token (see 4.3) | Token verified, status: "ACTIVE" | ⏳ | |
| 4.4.2 | Connect wallet (if not connected) | Wallet connected | ⏳ | |
| 4.4.3 | Click "Consume Token" button | Wallet popup appears | ⏳ | |
| 4.4.4 | Approve transaction | Transaction submitted | ⏳ | |
| 4.4.5 | Wait for confirmation | Transaction confirmed | ⏳ | |
| 4.4.6 | Verify alert message | Alert: "Token consumed successfully!" | ⏳ | |
| 4.4.7 | Refresh token details | Status: "CONSUMED" | ⏳ | |
| 4.4.8 | Verify button state | "Consume Token" button disabled/hidden | ⏳ | |
| 4.4.9 | Verify warning message | Warning: "This claim has been consumed..." | ⏳ | |

---

## 5. End-to-End User Flows

### 5.1 Complete Flow: Issuer → Patient → Doctor

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| **Issuer Flow** | | | | |
| 5.1.1 | Connect Issuer wallet | Wallet connected | ⏳ | |
| 5.1.2 | Navigate to `/issuer` | Issuer page loads | ⏳ | |
| 5.1.3 | Upload medical record PDF | File selected | ⏳ | |
| 5.1.4 | Enter record type: "lab_result" | Record type entered | ⏳ | |
| 5.1.5 | Enter patient address | Patient address entered | ⏳ | |
| 5.1.6 | Click "Issue Record" | Upload starts | ⏳ | |
| 5.1.7 | Wait for upload completion | Upload successful, hash and CID returned | ⏳ | |
| 5.1.8 | Approve blockchain transaction | Transaction popup appears | ⏳ | |
| 5.1.9 | Confirm transaction | Transaction confirmed | ⏳ | |
| 5.1.10 | Verify success message | Success message displayed | ⏳ | |
| **Patient Flow** | | | | |
| 5.1.11 | Switch to Patient wallet | Patient wallet connected | ⏳ | |
| 5.1.12 | Navigate to `/patient` | Patient dashboard loads | ⏳ | |
| 5.1.13 | Verify record appears | Record visible in dashboard | ⏳ | |
| 5.1.14 | Click "Share Access" | Link copied to clipboard | ⏳ | |
| 5.1.15 | Copy link | Link copied | ⏳ | |
| **Doctor/Verifier Flow** | | | | |
| 5.1.16 | Open link in new browser/incognito | Verifier page loads | ⏳ | |
| 5.1.17 | Verify document decrypted | Document displayed correctly | ⏳ | |
| 5.1.18 | Verify token details | Token details shown | ⏳ | |
| 5.1.19 | Consume token (if needed) | Token consumed successfully | ⏳ | |

---

### 5.2 Privacy Flow: Multiple Patients

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 5.2.1 | Issue 2 records for Patient A | Records minted | ⏳ | |
| 5.2.2 | Issue 1 record for Patient B | Record minted | ⏳ | |
| 5.2.3 | Connect Patient A wallet | Wallet connected | ⏳ | |
| 5.2.4 | Navigate to `/patient` | Dashboard loads | ⏳ | |
| 5.2.5 | Verify records shown | Only 2 records (Patient A's) | ⏳ | |
| 5.2.6 | Switch to Patient B wallet | Wallet switched | ⏳ | |
| 5.2.7 | Refresh dashboard | Only 1 record (Patient B's) | ⏳ | |
| 5.2.8 | Verify no Patient A records | Patient A records NOT visible | ⏳ | |

---

## 6. Edge Cases & Error Handling

### 6.1 Invalid Inputs

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 6.1.1 | Upload file > 10MB | Error: "File too large" | ⏳ | |
| 6.1.2 | Upload invalid file type (.exe) | Error: "Invalid file type" | ⏳ | |
| 6.1.3 | Upload without file | Error: "No file uploaded" | ⏳ | |
| 6.1.4 | Verify token with invalid token ID | Error: "Token is invalid" | ⏳ | |
| 6.1.5 | Verify token with invalid issuer address | Error: "Token is invalid" | ⏳ | |

---

### 6.2 Network & Service Failures

| # | Test Step | Expected Result | Status | Notes |
|---|-----------|----------------|--------|-------|
| 6.2.1 | Stop backend server, attempt upload | Error: "Cannot connect to backend" | ⏳ | |
| 6.2.2 | Stop ML service, attempt upload | Upload succeeds with default risk analysis | ⏳ | |
| 6.2.3 | Use invalid IPFS CID | Error: "File not found on IPFS" | ⏳ | |
| 6.2.4 | Disconnect wallet during transaction | Transaction cancelled or error shown | ⏳ | |

---

## 7. Browser & Wallet Compatibility

### 7.1 Browser Testing

| # | Browser | Test Step | Expected Result | Status | Notes |
|---|---------|-----------|----------------|--------|-------|
| 7.1.1 | Chrome | Complete E2E flow | All features work | ⏳ | |
| 7.1.2 | Firefox | Complete E2E flow | All features work | ⏳ | |
| 7.1.3 | Safari | Complete E2E flow | All features work | ⏳ | |
| 7.1.4 | Edge | Complete E2E flow | All features work | ⏳ | |

---

### 7.2 Wallet Compatibility

| # | Wallet | Test Step | Expected Result | Status | Notes |
|---|--------|-----------|----------------|--------|-------|
| 7.2.1 | Petra Wallet | Connect and mint token | Works correctly | ⏳ | |
| 7.2.2 | Other Aptos Wallets | Connect and mint token | Works correctly | ⏳ | |

---

## Test Execution Summary

**Test Execution Date:** _______________  
**Tester Name:** _______________  
**Environment:** _______________ (Dev/Staging/Production)

**Summary:**
- Total Test Cases: ______
- Passed: ______
- Failed: ______
- Blocked: ______
- Not Executed: ______

**Critical Issues Found:**
1. _________________________________
2. _________________________________
3. _________________________________

**Sign-off:**
- **Tester:** _______________ Date: _______
- **Reviewer:** _______________ Date: _______

---

**Document Status:** ✅ Ready for Manual Testing

