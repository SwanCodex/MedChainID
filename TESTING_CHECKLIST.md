# 🧪 MedChainID Manual Testing Guide

## ✅ Test 1: Wallet Connection

### Prerequisites
- [ ] Petra wallet extension installed
- [ ] Wallet unlocked
- [ ] Network set to **Devnet**
- [ ] Wallet address: `0xea46617e98ef84c6f0b779b97a5af054dc003a59221a1d0aab91cdb023ba2911`

### Steps
1. Open http://localhost:5173
2. You should be redirected to `/login` (Google Auth)
3. Click "Sign in with Google" (blue button)
4. Sign in with your Google account
5. After login, you should see the dashboard
6. Click "🔐 Connect Petra Wallet" in the top right
7. Petra popup should appear
8. Click "Connect" in Petra popup

### Expected Results
- ✅ Google login successful
- ✅ Petra popup appears
- ✅ After connecting, see wallet address in header: `0xea46...2911`
- ✅ "Disconnect" button appears

### Troubleshooting
If Petra doesn't connect:
- Check console (F12) for errors
- Verify Petra is on Devnet network
- Refresh page and try again

---

## ✅ Test 2: Issue Medical Record (Hospital View)

### Prerequisites
- [ ] Wallet connected
- [ ] Backend running on http://localhost:5000
- [ ] Test document ready (any image or PDF)

### Steps
1. Navigate to http://localhost:5173/issue-record (or click "Issue Record" in sidebar)
2. Fill in Patient Wallet Address:
   ```
   0xea46617e98ef84c6f0b779b97a5af054dc003a59221a1d0aab91cdb023ba2911
   ```
3. Select Record Type: "Lab Report"
4. Upload test document (drag & drop or click to browse)
5. Click "Process & Mint Token"
6. Wait for processing (2-10 seconds)
7. Petra popup appears - click "Approve"
8. Wait for transaction confirmation

### Expected Results
- ✅ Form validates patient address (must start with 0x, min 64 chars)
- ✅ File uploads successfully
- ✅ "✅ Token Minted Successfully!" message appears
- ✅ See transaction details:
  - Document Hash: `0xabc123...`
  - IPFS CID: `QmXXX...`
  - TX Hash: `0x789def...`
- ✅ **Shareable Verification Link** appears with Copy button
- ✅ Click Copy - link copied to clipboard

### Sample Link Format
```
http://localhost:5173/verifier?cid=QmXXX...#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3
```

### Backend Logs to Check
Open backend terminal and verify:
```
📤 Uploading document to backend...
✅ Upload result: {...}
⛓️  Minting token on Aptos blockchain...
✅ Transaction result: 0x...
```

### Troubleshooting
- **"Please connect your wallet"**: Connect Petra first
- **"Please enter the patient wallet address"**: Fill patient address field
- **"Invalid address"**: Check address format (0x + 64 chars)
- **Transaction fails**: Check Aptos devnet is working, check wallet has funds
- **Backend error**: Verify backend is running on port 5000

---

## ✅ Test 3: Patient Dashboard (Patient View)

### Prerequisites
- [ ] At least one record issued to your wallet address
- [ ] Wallet connected

### Steps
1. Navigate to http://localhost:5173/my-records (or click "My Records" in sidebar)
2. Wait for records to load (2-5 seconds)

### Expected Results
- ✅ See header: "👤 My Medical Vault"
- ✅ Connected address shown: `0xea46...2911`
- ✅ Record cards displayed with:
  - Record type (Lab Report, etc.)
  - Token ID
  - Issuer address
  - Date/timestamp
  - Status: "✅ Valid" or "❌ Consumed"
  - IPFS CID
  - Document hash
  - "🔗 Share Access" button

### Test Record Card
Click on a record card and verify:
- [ ] All metadata visible
- [ ] Issuer address matches your wallet
- [ ] Timestamp is recent
- [ ] Status shows "✅ Valid"

### Test Share Access
1. Click "🔗 Share Access" button on any record
2. Alert appears: "🔗 Secure verification link copied to clipboard!"
3. Paste link in notepad to verify format

### Expected Link Format
```
http://localhost:5173/verifier?cid=QmXXX...#key=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3
```

### Test Filtering
To verify filtering works:
1. Note your wallet address
2. Issue another record to a DIFFERENT address: `0x1234567890123456789012345678901234567890123456789012345678901234`
3. Refresh `/my-records`
4. ✅ Should ONLY see records for YOUR address
5. ✅ Should NOT see records for other addresses

### Empty State Test
1. Connect a wallet that has NO records
2. Navigate to `/my-records`
3. ✅ Should see: "📭 No Records Found"
4. ✅ Message: "You don't have any medical records yet..."

### Troubleshooting
- **"No Records Found"**: Check if records were issued to correct address
- **Loading forever**: Check console for errors, verify contract address is correct
- **Wrong records showing**: Verify patient_address field in contract

---

## ✅ Test 4: Verification System (Public View)

### Prerequisites
- [ ] Shareable verification link from Test 2 or Test 3
- [ ] Backend running

### Steps
1. Copy the verification link from previous tests
2. Open link in NEW BROWSER TAB (or incognito window)
3. Wait for automatic decryption

### Expected Results
- ✅ Page loads at `/verifier?cid=QmXXX...#key=abc123...`
- ✅ "📄 Medical Record Document" header appears
- ✅ "Decrypting document securely..." message shows briefly
- ✅ Document decrypts and displays (image or PDF preview)
- ✅ Document shows in bordered container

### Test Different Scenarios

**Scenario 1: Complete Link (Should Work)**
```
http://localhost:5173/verifier?cid=QmXXX...#key=1e4ae9d795acdd17...
✅ Document displays
```

**Scenario 2: Missing Key (Should Fail)**
```
http://localhost:5173/verifier?cid=QmXXX...
❌ No decryption attempt
❌ Nothing displays
```

**Scenario 3: Wrong Key (Should Fail)**
```
http://localhost:5173/verifier?cid=QmXXX...#key=wrongkey123
❌ "Decryption failed" error
❌ Message: "Make sure the verification link is complete..."
```

**Scenario 4: Invalid CID (Should Fail)**
```
http://localhost:5173/verifier?cid=invalid123#key=1e4ae9d795acdd17...
❌ Backend error: "CID not found"
```

### Backend Logs to Check
```
🔓 Decrypting document: QmXXX...
✅ Document decrypted: 156789 bytes
```

### Troubleshooting
- **Nothing happens**: Check URL has both `?cid=` and `#key=`
- **Decryption failed**: Verify encryption key matches backend `.env` file
- **IPFS error**: Check Pinata configuration, verify CID exists
- **CORS error**: Check backend CORS settings allow frontend origin

---

## ✅ Test 5: Backend APIs

### Prerequisites
- [ ] Backend running on http://localhost:5000
- [ ] Test file ready

### Test 5.1: Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T..."
}
```

### Test 5.2: Upload & Encrypt
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@test-image.jpg" \
  -F "recordType=Lab Report"
```

**Expected:**
```json
{
  "success": true,
  "documentHash": "0xabc123...",
  "ipfsCID": "QmXXX...",
  "encryptionKey": "1e4ae9d795acdd17...",
  "analysis": { ... }
}
```

### Test 5.3: Download Encrypted
```bash
curl http://localhost:5000/api/download/QmXXX... -o encrypted.bin
```

**Expected:**
- Binary file downloads
- File size matches encrypted size

### Test 5.4: Decrypt & View
```bash
curl -X POST http://localhost:5000/api/decrypt-view \
  -H "Content-Type: application/json" \
  -d '{"cid":"QmXXX...","key":"1e4ae9d795acdd17..."}' \
  -o decrypted-image.jpg
```

**Expected:**
- Image file downloads
- File can be opened and viewed
- Matches original uploaded file

### Test 5.5: Google Auth Status
```bash
curl http://localhost:5000/api/auth/status
```

**Expected (not logged in):**
```json
{
  "authenticated": false
}
```

**Expected (logged in with token):**
```json
{
  "authenticated": true,
  "user": { ... }
}
```

---

## ✅ Test 6: Smart Contract Verification

### Prerequisites
- [ ] Contract deployed: `0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004`
- [ ] Aptos CLI installed
- [ ] At least one token minted

### Test 6.1: View All Tokens
```bash
aptos move view \
  --function-id 0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004::MedChainID::get_all_tokens \
  --args address:0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004
```

**Expected:**
```json
[
  {
    "token_id": 0,
    "record_type": [76, 97, 98, ...], // "Lab Report" in bytes
    "patient_address": "0xea46617e98ef84c6f0b779b97a5af054dc003a59221a1d0aab91cdb023ba2911",
    "is_consumed": false,
    "issuer": "0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004",
    "timestamp": 1702901234
  }
]
```

### Test 6.2: Verify Token
```bash
aptos move view \
  --function-id 0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004::MedChainID::verify_token \
  --args address:0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004 u64:0
```

**Expected:**
```json
[
  true,  // is_valid
  "0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004"  // issuer
]
```

### Test 6.3: Get Token Details
```bash
aptos move view \
  --function-id 0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004::MedChainID::get_token_details \
  --args address:0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004 u64:0
```

**Expected:**
```json
[
  [76, 97, 98, ...],  // record_type bytes
  [48, 120, 97, ...],  // document_hash bytes
  [81, 109, 88, ...],  // ipfs_cid bytes
  "0xea46617e98ef84c6f0b779b97a5af054dc003a59221a1d0aab91cdb023ba2911",  // patient_address
  false,  // is_consumed
  "0xfdb11b3940120057998fc39463745d3e3d0342449fe85f324ef7a512c5ac9004",  // issuer
  1702901234  // timestamp
]
```

### Verify on Aptos Explorer
1. Go to: https://explorer.aptoslabs.com/
2. Switch to "Devnet"
3. Search for your contract address
4. Check "Modules" tab - should see `MedChainID` module
5. Check "Transactions" - should see mint transactions
6. Check "Resources" - should see `TokenRegistry`

---

## 🎯 Complete Integration Test

### End-to-End Test Flow

**1. Hospital Issues Record**
- [ ] Login with Google
- [ ] Connect Petra wallet
- [ ] Navigate to Issue Record
- [ ] Enter patient address: `0xea46617e98ef84c6f0b779b97a5af054dc003a59221a1d0aab91cdb023ba2911`
- [ ] Upload test document (lab-report.pdf)
- [ ] Select "Lab Report"
- [ ] Click "Process & Mint Token"
- [ ] Approve transaction in Petra
- [ ] ✅ Success message appears
- [ ] ✅ Copy verification link

**2. Verify On-Chain**
- [ ] Open Aptos Explorer
- [ ] Search for contract address
- [ ] ✅ See new transaction
- [ ] ✅ Verify token_id incremented
- [ ] ✅ Check patient_address matches

**3. Patient Views Record**
- [ ] Navigate to My Records
- [ ] ✅ New record appears
- [ ] ✅ All metadata correct
- [ ] ✅ Status shows "Valid"
- [ ] Click "Share Access"
- [ ] ✅ Link copied

**4. Verifier Opens Link**
- [ ] Paste link in new tab
- [ ] ✅ Document auto-decrypts
- [ ] ✅ Document displays correctly
- [ ] ✅ Document matches original upload

**5. Backend Verification**
- [ ] Check backend logs for all operations
- [ ] ✅ Encryption logged
- [ ] ✅ IPFS upload logged
- [ ] ✅ Decryption logged
- [ ] ✅ No errors

---

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Wallet Connection | ⬜ | |
| Google Auth | ⬜ | |
| Issue Record | ⬜ | |
| Patient Dashboard | ⬜ | |
| Verification Link | ⬜ | |
| Backend APIs | ⬜ | |
| Smart Contract | ⬜ | |
| End-to-End Flow | ⬜ | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Partial

---

## 🐛 Common Issues & Solutions

### Issue: Wallet Won't Connect
**Solutions:**
- Ensure Petra installed and unlocked
- Check network is Devnet
- Refresh page
- Clear browser cache
- Check console for errors

### Issue: Transaction Fails
**Solutions:**
- Check wallet has APT tokens (get from faucet)
- Verify on correct network (Devnet)
- Check contract address is correct
- Try again with lower gas

### Issue: IPFS Upload Fails
**Solutions:**
- Check Pinata API keys in backend `.env`
- Verify internet connection
- Check file size < 10MB
- Try different file

### Issue: Decryption Fails
**Solutions:**
- Verify encryption key matches in backend and frontend `.env`
- Check full link copied (including #key=)
- Verify IPFS CID is correct
- Check backend is running

### Issue: No Records Show
**Solutions:**
- Verify wallet address matches patient_address in token
- Check contract address is correct
- Verify at least one token minted
- Check console for errors

---

## 🎉 All Tests Complete!

Once all tests pass, your MedChainID system is ready for:
- ✅ Demo/presentation
- ✅ Hackathon submission
- ✅ Further development

**Next Steps:**
1. Document any failed tests
2. Fix issues found
3. Re-run failed tests
4. Consider adding automated tests
5. Deploy to testnet/mainnet

**Good luck! 🚀**
