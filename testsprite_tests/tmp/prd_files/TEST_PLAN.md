# MedChainID - Comprehensive Test Plan

**Project:** MedChainID - Web3 Healthcare Medical Records Platform  
**Version:** 1.0.0  
**Date:** 2024  
**QA Engineer:** Senior QA Automation Engineer  
**Technology Stack:** React, Node.js, Aptos Blockchain, IPFS, AES-256 Encryption

---

## 1. Executive Summary

### 1.1 Purpose
This document outlines the comprehensive test strategy for MedChainID, a Web3 healthcare application that issues and verifies private medical records using blockchain technology. The application ensures patient privacy through end-to-end encryption, decentralized storage, and zero-knowledge verification.

### 1.2 Scope
- **Backend API Testing:** File upload, encryption, IPFS integration, decryption endpoints
- **Frontend Testing:** React components, wallet integration, user flows
- **Blockchain Integration:** Aptos smart contract interactions, token minting, verification
- **Security Testing:** Encryption/decryption, key management, privacy controls
- **End-to-End Flows:** Issuer → Patient → Doctor/Verifier workflows

### 1.3 Test Objectives
1. Verify all files are encrypted (AES-256) before IPFS upload
2. Validate blockchain transaction payloads match Aptos Wallet Adapter v2 requirements
3. Ensure patient privacy through proper filtering of medical records
4. Verify secure sharing mechanism using URL hash fragments (not query parameters)
5. Test zero-knowledge verification flow without decryption keys
6. Validate token consumption mechanism prevents double-claiming

---

## 2. Test Environment

### 2.1 Backend
- **URL:** `http://localhost:5000`
- **Framework:** Node.js/Express
- **Dependencies:** Multer, Axios, PDF-Parse, Crypto (AES-256-CBC)

### 2.2 Frontend
- **URL:** `http://localhost:5173`
- **Framework:** React + TypeScript + Vite
- **Wallet:** Aptos Wallet Adapter v2 (Petra Wallet)

### 2.3 Blockchain
- **Network:** Aptos Devnet
- **Contract Address:** `VITE_CONTRACT_ADDRESS` (from .env)
- **Module:** `MedChainID`

### 2.4 External Services
- **IPFS:** Pinata Cloud Gateway
- **ML Service:** `http://127.0.0.1:5001` (Fraud Detection)

---

## 3. Test Strategy

### 3.1 Testing Levels

#### 3.1.1 Unit Testing
- **Backend:** Encryption utilities, IPFS helpers, hash generation
- **Frontend:** Service functions (aptos.ts, api.ts), utility functions
- **Tools:** Jest, Mocha/Chai

#### 3.1.2 Integration Testing
- **Backend API:** POST /api/upload, POST /api/decrypt-view, GET /api/download
- **Blockchain:** mintToken, getTokenDetails, consumeToken functions
- **IPFS:** Upload and retrieval flows
- **Tools:** Supertest, Jest

#### 3.1.3 End-to-End Testing
- **User Flows:** Issuer upload → Patient view → Doctor verification
- **Security Flows:** Encryption → IPFS → Decryption → Display
- **Tools:** Playwright, Cypress

#### 3.1.4 Security Testing
- **Encryption:** Verify AES-256-CBC implementation
- **Key Management:** Test wrong key rejection
- **Privacy:** Verify patient filtering logic
- **URL Security:** Hash fragment vs query parameter handling

### 3.2 Test Types

#### 3.2.1 Functional Testing
- ✅ File upload and processing
- ✅ Blockchain token minting
- ✅ Patient dashboard filtering
- ✅ Verification and consumption flows
- ✅ Share link generation

#### 3.2.2 Security Testing
- ✅ Encryption before IPFS upload
- ✅ Wrong decryption key rejection
- ✅ Patient address filtering
- ✅ URL hash fragment security
- ✅ Zero-knowledge verification

#### 3.2.3 Performance Testing
- ⚠️ Large file uploads (up to 10MB)
- ⚠️ Concurrent uploads
- ⚠️ IPFS retrieval latency
- ⚠️ Blockchain transaction confirmation time

#### 3.2.4 Compatibility Testing
- ⚠️ Browser compatibility (Chrome, Firefox, Safari)
- ⚠️ Wallet compatibility (Petra, other Aptos wallets)
- ⚠️ File format support (PDF, JPEG, PNG, GIF)

---

## 4. Critical Test Areas

### 4.1 Backend Security (`backend/src/server.js` & `utils/encryption.js`)

#### Priority: **CRITICAL**

**Test Focus:**
1. **File Encryption Before IPFS Upload**
   - Verify `encryptBuffer()` is called BEFORE `uploadToPinata()`
   - Confirm encrypted buffer size > original (IV prepended)
   - Validate AES-256-CBC algorithm usage
   - Check IV uniqueness per file

2. **RecordType Metadata Handling**
   - Verify `recordType` is extracted from form data
   - Confirm `recordType` is passed to `uploadToPinata()`
   - Validate metadata is searchable in Pinata

3. **Decryption Endpoint Security**
   - Test `POST /api/decrypt-view` with correct key → Success
   - Test `POST /api/decrypt-view` with wrong key → Failure
   - Test `POST /api/decrypt-view` with invalid key format → Error
   - Verify key length validation (64 hex characters)

### 4.2 Blockchain Interaction (`frontend/src/services/aptos.ts`)

#### Priority: **HIGH**

**Test Focus:**
1. **mintToken Function Payload**
   - Verify transaction payload structure matches Aptos Wallet Adapter v2
   - Confirm payload is wrapped in `data` object (if required by adapter)
   - Validate function signature: `${CONTRACT_ADDRESS}::MedChainID::mint_token`
   - Test argument serialization (bytes arrays)

2. **getTokenDetails Parsing**
   - Verify all 7 return values are parsed correctly:
     - `recordType` (hex → text)
     - `documentHash` (hex string)
     - `ipfsCID` (hex → text)
     - `patientAddress` ⚠️ **CRITICAL** - Must be extracted
     - `isConsumed` (boolean)
     - `issuer` (address)
     - `timestamp` (number)
   - Test hex string decoding for recordType and ipfsCID

### 4.3 Patient Privacy (`frontend/src/pages/PatientDashboard.tsx`)

#### Priority: **CRITICAL**

**Test Focus:**
1. **Filtering Logic**
   - Verify `get_all_tokens` fetches ALL tokens from chain
   - Confirm filtering: `token.patient_address === account?.address`
   - Test with multiple patients → Only own records shown
   - Verify no records leak between patients

2. **Share Access Button**
   - Verify URL format: `/verifier?cid=...` (query param)
   - Verify key format: `#key=...` (hash fragment) ⚠️ **NOT query param**
   - Confirm key is NOT sent to server (hash fragment stays client-side)
   - Test clipboard copy functionality

### 4.4 Verification Flow (`frontend/src/pages/Verifier.tsx`)

#### Priority: **HIGH**

**Test Focus:**
1. **Zero-Knowledge View**
   - Test URL without `#key=` fragment → No decryption attempt
   - Test URL with `#key=` fragment → Decryption triggered
   - Verify `decryptAndShow()` only called when key present
   - Confirm error handling for missing key

2. **Token Consumption**
   - Test `consumeToken()` function call
   - Verify transaction submission to blockchain
   - Confirm token status changes to "Consumed"
   - Test double-consumption prevention

---

## 5. Test Data Requirements

### 5.1 Test Files
- **PDF:** Sample medical record (lab_result.pdf, prescription.pdf)
- **Images:** JPEG, PNG medical documents
- **Sizes:** Small (<1MB), Medium (1-5MB), Large (5-10MB)

### 5.2 Test Accounts
- **Issuer Wallet:** Hospital/Clinic address
- **Patient Wallet 1:** Test patient address
- **Patient Wallet 2:** Different patient address (for privacy testing)
- **Verifier Wallet:** Doctor/Insurance address

### 5.3 Test Record Types
- `lab_result`
- `prescription`
- `xray`
- `vaccination_record`
- `medical_report`

### 5.4 Test IPFS CIDs
- Valid CID: `Qm...` (CIDv0) or `bafy...` (CIDv1)
- Invalid CID: `invalid_cid_123`
- Non-existent CID: `QmNonExistent123...`

---

## 6. Test Execution Plan

### 6.1 Phase 1: Backend API Testing (Week 1)
- ✅ Unit tests for encryption utilities
- ✅ Integration tests for `/api/upload`
- ✅ Security tests for `/api/decrypt-view`
- ✅ IPFS upload/retrieval tests

### 6.2 Phase 2: Blockchain Integration (Week 1-2)
- ✅ Unit tests for `aptos.ts` service functions
- ✅ Integration tests for token minting
- ✅ Tests for `getTokenDetails` parsing
- ✅ Token consumption tests

### 6.3 Phase 3: Frontend Component Testing (Week 2)
- ✅ PatientDashboard filtering tests
- ✅ Verifier zero-knowledge tests
- ✅ Share link generation tests
- ✅ Wallet connection tests

### 6.4 Phase 4: End-to-End Testing (Week 2-3)
- ✅ Complete Issuer → Patient → Doctor flow
- ✅ Security and privacy validation
- ✅ Edge case testing
- ✅ Performance testing

### 6.5 Phase 5: Regression & Final Validation (Week 3)
- ✅ Full regression suite
- ✅ Security audit
- ✅ Documentation review
- ✅ Production readiness checklist

---

## 7. Risk Assessment

### 7.1 High-Risk Areas
1. **Patient Privacy Leakage** - Filtering logic failure could expose records
2. **Encryption Bypass** - Unencrypted files uploaded to IPFS
3. **Key Exposure** - Decryption keys in URL query parameters
4. **Blockchain Payload Errors** - Incorrect transaction format

### 7.2 Medium-Risk Areas
1. **IPFS Availability** - Pinata service downtime
2. **ML Service Failure** - Fraud detection unavailable
3. **Wallet Connection Issues** - Aptos adapter compatibility

### 7.3 Mitigation Strategies
- Automated security tests in CI/CD pipeline
- Regular encryption audits
- Monitoring and alerting for IPFS/ML service failures
- Wallet compatibility matrix testing

---

## 8. Success Criteria

### 8.1 Must-Pass Criteria
- ✅ 100% of files encrypted before IPFS upload
- ✅ 100% patient filtering accuracy (no cross-patient leaks)
- ✅ 100% wrong key rejection rate
- ✅ 100% zero-knowledge verification compliance
- ✅ 100% blockchain transaction success rate

### 8.2 Quality Metrics
- **Test Coverage:** ≥80% code coverage
- **Defect Density:** <5 critical bugs per 1000 LOC
- **Security Score:** Zero high-severity vulnerabilities
- **Performance:** Upload <30s for 10MB files

---

## 9. Test Deliverables

1. ✅ **Test Plan** (This document)
2. ✅ **Test Cases** (See TEST_CASES.md)
3. ✅ **Manual Testing Checklist** (See MANUAL_TESTING_CHECKLIST.md)
4. ✅ **Edge Cases Document** (See EDGE_CASES.md)
5. ✅ **Automated Test Scripts** (See `tests/` directory)
6. ✅ **Test Execution Report** (Post-execution)
7. ✅ **Defect Log** (Bug tracking)

---

## 10. Sign-off

**Prepared by:** Senior QA Automation Engineer  
**Reviewed by:** [Development Lead]  
**Approved by:** [Project Manager]  
**Date:** [Date]

---

**Document Status:** ✅ Ready for Review

