import requests
import traceback

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_get_token_details_blockchain_correct_parsing():
    """
    Test the getTokenDetails blockchain function to verify it returns all 7 expected values:
    recordType, documentHash, ipfsCID, patientAddress, isConsumed, issuer, timestamp.
    Confirm correct parsing of patient_address field.
    Since blockchain functions are frontend/sdk based, simulate minting a token first,
    then call the getTokenDetails endpoint or equivalent HTTP endpoint if exposed.
    Here, we mimic the flow by uploading a document, minting a token, then fetching details.
    """
    new_resource_created = False
    mint_response = None
    token_id = None

    # These are placeholders for mintToken and getTokenDetails endpoints,
    # which are normally blockchain SDK functions, assumed here exposed for testing.
    # We will instead:
    # 1) Upload an encrypted document (POST /api/upload)
    # 2) Mint a token via POST /api/mint-token (assuming this endpoint exists for testing)
    # 3) Get token details via GET /api/token-details/:token_id (assuming for testing)
    #
    # If no mint-token or token-details endpoints exist, this test requires integration with blockchain SDK.
    # For this test, we assume these HTTP APIs exist for testing purposes.

    # Step 1: Upload a test encrypted document to get documentHash and ipfsCid
    upload_url = f"{BASE_URL}/api/upload"

    # Minimal valid PDF file content
    test_pdf_content = (
        b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 10 100 Td (Test PDF Content) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000018 00000 n \n0000000077 00000 n \n0000000178 00000 n \n0000000297 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n397\n%%EOF\n"
    )

    files = {'document': ('test_doc.pdf', test_pdf_content, 'application/pdf')}
    data = {'recordType': 'testRecordType'}

    try:
        upload_resp = requests.post(upload_url, files=files, data=data, timeout=TIMEOUT)
        assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.status_code} {upload_resp.text}"
        upload_json = upload_resp.json()
        doc_hash = upload_json.get('docHash')
        ipfs_cid = upload_json.get('ipfsCid')
        assert doc_hash and ipfs_cid, "Upload response missing docHash or ipfsCid"
    except Exception as e:
        raise AssertionError(f"Failed to upload document for minting token: {e}")

    # Step 2: Mint the token on blockchain using assumed test endpoint /api/mint-token
    # Payload includes docHash, ipfsCid, patientAddress, recordType
    # We generate a test patient address hex string (simulated)
    patient_address = "0x123abc456def7890"
    mint_url = f"{BASE_URL}/api/mint-token"
    mint_payload = {
        "documentHash": doc_hash,
        "ipfsCID": ipfs_cid,
        "patientAddress": patient_address,
        "recordType": "testRecordType"
    }

    try:
        mint_resp = requests.post(mint_url, json=mint_payload, timeout=TIMEOUT)
        assert mint_resp.status_code == 201, f"Mint token failed: {mint_resp.status_code} {mint_resp.text}"
        mint_json = mint_resp.json()
        token_id = mint_json.get('tokenId')
        assert token_id, "Mint token response missing tokenId"
        new_resource_created = True
    except Exception as e:
        raise AssertionError(f"Failed to mint token: {e}")

    # Step 3: Get token details from blockchain via GET /api/token-details/:tokenId
    token_details_url = f"{BASE_URL}/api/token-details/{token_id}"

    try:
        details_resp = requests.get(token_details_url, timeout=TIMEOUT)
        assert details_resp.status_code == 200, f"Get token details failed: {details_resp.status_code} {details_resp.text}"
        details_json = details_resp.json()

        # Validate the 7 expected values present
        expected_keys = [
            "recordType",
            "documentHash",
            "ipfsCID",
            "patientAddress",
            "isConsumed",
            "issuer",
            "timestamp"
        ]
        for key in expected_keys:
            assert key in details_json, f"Token details missing '{key}'"

        # Confirm patientAddress parsing correctness
        patient_addr = details_json.get("patientAddress")
        assert isinstance(patient_addr, str) and patient_addr.lower() == patient_address.lower(), \
            "Patient address in token details does not match expected address"

        # Basic type checks
        assert isinstance(details_json["recordType"], str), "recordType should be string"
        assert isinstance(details_json["documentHash"], str), "documentHash should be string"
        assert isinstance(details_json["ipfsCID"], str), "ipfsCID should be string"
        assert isinstance(details_json["isConsumed"], bool), "isConsumed should be boolean"
        assert isinstance(details_json["issuer"], str), "issuer should be string"
        assert isinstance(details_json["timestamp"], (int, float)), "timestamp should be numeric"

    except Exception as e:
        raise AssertionError(f"Failed to validate token details correctly: {e}")

    finally:
        # Cleanup: Try to delete the minted token to avoid residue data if endpoint exists
        if new_resource_created and token_id:
            try:
                delete_url = f"{BASE_URL}/api/token/{token_id}"
                del_resp = requests.delete(delete_url, timeout=TIMEOUT)
                assert del_resp.status_code in (200,204), f"Cleanup delete token failed: {del_resp.status_code}"
            except Exception:
                # Log but do not fail test on cleanup error
                traceback.print_exc()

test_get_token_details_blockchain_correct_parsing()
