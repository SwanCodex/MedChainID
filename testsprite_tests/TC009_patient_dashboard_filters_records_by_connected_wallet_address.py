import requests
import json
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_patient_dashboard_filters_records_by_connected_wallet_address():
    """
    Test that the patient dashboard frontend displays only medical records matching the connected wallet address,
    ensuring no cross-patient data leakage.
    Also check critical security features related to:
    - File encryption before IPFS upload
    - Share link key security in URL hash fragment
    - Zero-knowledge verification behavior
    - Wrong decryption key rejection
    """

    # Mock wallet addresses (as examples)
    patient_wallet_1 = "0xPatientWalletAddress1"
    patient_wallet_2 = "0xPatientWalletAddress2"

    # Simulate uploading two medical documents for two different patients

    # Helper function to upload a medical document
    def upload_medical_document(file_content, record_type, patient_address):
        # Encrypt file client side is expected, but here we upload assuming backend does encryption
        files = {
            "document": ("testdoc.pdf", file_content, "application/pdf")
        }
        data = {
            "recordType": record_type,
            "patientAddress": patient_address  # Assumed to be accepted by API if supported
        }
        # The PRD does not specify patientAddress uplink param, so simulate mintToken separately
        # For upload, only document and recordType are accepted; we will upload and then mint blockchain token referencing patient_address.

        # Upload encrypted file and get IPFS CID + docHash
        resp = requests.post(f"{BASE_URL}/api/upload", files=files, data={"recordType": record_type}, timeout=TIMEOUT)
        resp.raise_for_status()
        upload_data = resp.json()
        assert "docHash" in upload_data and "ipfsCid" in upload_data, "Upload response missing keys"
        return upload_data["docHash"], upload_data["ipfsCid"]

    # Mint token function: to associate uploaded document to patient wallet address
    def mint_token(record_type, document_hash, ipfs_cid, patient_address):
        # This would normally be done via Aptos blockchain SDK frontend call.
        # Here we call a mock or test endpoint or skip actual blockchain interaction.
        # For test, assume there's an API /api/mock/mint-token for test purposes.

        payload = {
            "recordType": record_type,
            "documentHash": document_hash,
            "ipfsCid": ipfs_cid,
            "patientAddress": patient_address,
            "issuer": "TestIssuer",
            "timestamp": int(time.time())
        }
        mint_resp = requests.post(f"{BASE_URL}/api/mock/mint-token", json=payload, timeout=TIMEOUT)
        mint_resp.raise_for_status()
        return mint_resp.json().get("tokenId")

    # Fetch patient dashboard records for given wallet address
    def get_dashboard_records(patient_address):
        # The PRD does not specify an exact GET endpoint for patient dashboard medical data,
        # but for this test, assume an endpoint '/api/patient/records?wallet_address=...'
        params = {"wallet_address": patient_address}
        resp = requests.get(f"{BASE_URL}/api/patient/records", params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()  # Expected to be a list of records

    # Helper to test that share links embed keys in URL hash fragment (#key=...) only
    def check_share_link_security(share_link):
        # URL must NOT have key in query string, only in hash fragment
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(share_link)
        # Query parameters must NOT contain 'key'
        query_params = parse_qs(parsed.query)
        assert "key" not in query_params, "Decryption key leaked in query parameters"
        # Hash fragment must start with key=...
        assert parsed.fragment.startswith("key="), "Decryption key missing or not in URL hash fragment"

    # Helper to test zero-knowledge verification (no decryption attempt without key)
    def verify_zero_knowledge(ipfs_cid):
        # Call /api/decrypt-view without key param - should reject or return no decrypted data without error
        resp = requests.post(f"{BASE_URL}/api/decrypt-view", json={"cid": ipfs_cid}, timeout=TIMEOUT)
        # Expect an error or empty response because key missing
        if resp.status_code == 400:
            err = resp.json()
            assert "error" in err or "message" in err
        else:
            # If 200, the content should be empty or indicate no decryption
            content_length = len(resp.content)
            assert content_length == 0 or resp.text == "", "Decryption attempt occurred without key"

    # Helper to test wrong decryption key rejection
    def test_wrong_key_rejection(ipfs_cid):
        wrong_key = "f" * 64  # 64 hex chars but wrong key
        resp = requests.post(f"{BASE_URL}/api/decrypt-view", json={"cid": ipfs_cid, "key": wrong_key}, timeout=TIMEOUT)
        assert resp.status_code == 403 or resp.status_code == 400, "Wrong decryption key not rejected properly"
        err = resp.json()
        assert "error" in err or "message" in err

    # Step 1: Upload docs for patient 1 and patient 2 and mint tokens
    patient1_doc = b"%PDF-1.4 patient 1 medical record content"
    patient2_doc = b"%PDF-1.4 patient 2 medical record content"

    record_type = "medical_record_test"

    docHash1, ipfsCid1 = upload_medical_document(patient1_doc, record_type, patient_wallet_1)
    docHash2, ipfsCid2 = upload_medical_document(patient2_doc, record_type, patient_wallet_2)

    token_id_1 = mint_token(record_type, docHash1, ipfsCid1, patient_wallet_1)
    token_id_2 = mint_token(record_type, docHash2, ipfsCid2, patient_wallet_2)

    assert token_id_1 is not None, "Mint token failed for patient 1"
    assert token_id_2 is not None, "Mint token failed for patient 2"

    # Step 2: Fetch dashboard records for patient 1, ensure only patient 1's records appear
    records_patient1 = get_dashboard_records(patient_wallet_1)
    assert isinstance(records_patient1, list), "Expected list of records for patient 1"
    assert any(rec.get("patientAddress", "").lower() == patient_wallet_1.lower() for rec in records_patient1), "Patient 1 records missing"
    # Ensure no records from patient 2 appear for patient 1
    assert all(rec.get("patientAddress", "").lower() == patient_wallet_1.lower() for rec in records_patient1), "Cross-patient data leakage detected for patient 1"

    # Step 3: Fetch dashboard records for patient 2 and repeat check
    records_patient2 = get_dashboard_records(patient_wallet_2)
    assert isinstance(records_patient2, list), "Expected list of records for patient 2"
    assert any(rec.get("patientAddress", "").lower() == patient_wallet_2.lower() for rec in records_patient2), "Patient 2 records missing"
    assert all(rec.get("patientAddress", "").lower() == patient_wallet_2.lower() for rec in records_patient2), "Cross-patient data leakage detected for patient 2"

    # Step 4: Check shareable link generation for patient 1's record
    # Assume an endpoint or generated field "shareLink" in each record
    for record in records_patient1:
        share_link = record.get("shareLink")
        if share_link:
            check_share_link_security(share_link)

    # Step 5: Test zero-knowledge verification behavior (no decryption without key) on patient 1 record
    verify_zero_knowledge(ipfsCid1)

    # Step 6: Test wrong decryption key rejection for patient 1 record
    test_wrong_key_rejection(ipfsCid1)

    # Step 7: Verify that uploaded files were encrypted (cannot be plaintext)
    # Download file to check encryption presence; assume /api/download/:cid returns encrypted content
    resp_file = requests.get(f"{BASE_URL}/api/download/{ipfsCid1}", timeout=TIMEOUT)
    resp_file.raise_for_status()
    content = resp_file.content
    # Basic check: content should not contain plaintext patient data substring
    assert patient1_doc not in content, "Downloaded content is not encrypted"

test_patient_dashboard_filters_records_by_connected_wallet_address()