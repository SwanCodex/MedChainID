import requests
import hashlib
import io

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_verify_document_hash_with_uploaded_file():
    upload_url = f"{BASE_URL}/api/upload"
    verify_url = f"{BASE_URL}/api/verify"

    # Prepare a sample medical document file content (simulate small pdf or text)
    sample_content = b"Sample medical record content for hashing test."
    sample_file = io.BytesIO(sample_content)
    sample_file.name = "test_medical_record.pdf"
    record_type = "lab_report"

    # Step 1: Upload the document to get the docHash (server applies encryption and hash)
    files = {"document": (sample_file.name, sample_file, "application/pdf")}
    data = {"recordType": record_type}

    try:
        upload_resp = requests.post(upload_url, files=files, data=data, timeout=TIMEOUT)
        upload_resp.raise_for_status()
        upload_json = upload_resp.json()
        assert "docHash" in upload_json, "docHash missing in upload response"
        assert "ipfsCid" in upload_json, "ipfsCid missing in upload response"
        assert "riskAnalysis" in upload_json, "riskAnalysis missing in upload response"

        server_doc_hash = upload_json["docHash"].strip()

        # Manually compute SHA256 hash of original file content
        local_hash = hashlib.sha256(sample_content).hexdigest()

        # We expect server_doc_hash to match hash of encrypted data,
        # but since server encrypts before hashing, they should differ.
        # So verify server hash is a valid SHA256 hex string (case insensitive).
        lowered_hash = server_doc_hash.lower()
        assert len(server_doc_hash) == 64 and all(c in "0123456789abcdef" for c in lowered_hash), \
            "docHash is not a valid SHA256 hex string"

        # Step 2: Verify endpoint - POST /api/verify with the original file and expectedHash param
        # This should verify uploaded document hash matches expectedHash provided.
        # We test positive case with the server_doc_hash - expect success.
        sample_file.seek(0)
        files_verify = {"document": (sample_file.name, sample_file, "application/pdf")}
        data_verify = {"expectedHash": server_doc_hash}

        verify_resp = requests.post(verify_url, files=files_verify, data=data_verify, timeout=TIMEOUT)
        verify_resp.raise_for_status()
        verify_json = verify_resp.json() if verify_resp.headers.get("Content-Type","").startswith("application/json") else {}

        # We expect a success status or any success indication.
        assert verify_resp.status_code == 200 or verify_resp.status_code == 201, "Verification failed unexpectedly"

        # Step 3: Verify with mismatched hash - provide incorrect expectedHash
        sample_file.seek(0)
        data_invalid = {"expectedHash": "0"*64}  # obviously invalid hash
        resp_invalid = requests.post(verify_url, files=files_verify, data=data_invalid, timeout=TIMEOUT)

        # Should return error 400 or 422 or 4xx
        assert resp_invalid.status_code >= 400 and resp_invalid.status_code < 500, \
            "Expected client error status for mismatched hash"

        # Step 4: Verify malformed expectedHash param - wrong length or invalid chars
        sample_file.seek(0)
        data_malformed = {"expectedHash": "ZZZ"}
        resp_malformed = requests.post(verify_url, files=files_verify, data=data_malformed, timeout=TIMEOUT)

        # Should reject with client error status and informative error message
        assert resp_malformed.status_code >= 400 and resp_malformed.status_code < 500, \
            "Expected client error status for malformed expectedHash"

        # Step 5: Verify missing expectedHash param
        sample_file.seek(0)
        data_missing = {}
        resp_missing = requests.post(verify_url, files=files_verify, data=data_missing, timeout=TIMEOUT)

        # Should reject as expectedHash is required
        assert resp_missing.status_code >= 400 and resp_missing.status_code < 500, \
            "Expected client error status for missing expectedHash"

        # Step 6: Verify missing document file parameter
        data_only_hash = {"expectedHash": server_doc_hash}
        resp_no_file = requests.post(verify_url, files={}, data=data_only_hash, timeout=TIMEOUT)

        # Should reject - document file required
        assert resp_no_file.status_code >= 400 and resp_no_file.status_code < 500, \
            "Expected client error status for missing document file"

    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_verify_document_hash_with_uploaded_file()
