import requests
import io
import hashlib
import json

BASE_URL = "http://localhost:5000"
UPLOAD_ENDPOINT = "/api/upload"
DECRYPT_VIEW_ENDPOINT = "/api/decrypt-view"

def test_upload_medical_document_encrypt_and_upload_to_ipfs():
    timeout = 30
    headers = {}
    # Prepare a dummy medical document content (PDF-like bytes)
    dummy_pdf_content = (
        b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\n"
        b"BT\n/F1 24 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000074 00000 n \n"
        b"0000000121 00000 n \n0000000200 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\n"
        b"startxref\n279\n%%EOF"
    )

    record_type = "BloodTest"

    files = {
        "document": ("test_medical_document.pdf", io.BytesIO(dummy_pdf_content), "application/pdf")
    }
    data = {
        "recordType": record_type
    }

    try:
        # Step 1: POST to /api/upload with medical document and recordType
        resp = requests.post(
            BASE_URL + UPLOAD_ENDPOINT,
            headers=headers,
            files=files,
            data=data,
            timeout=timeout,
        )
    except requests.RequestException as e:
        assert False, f"Request to /api/upload failed: {e}"

    # Validate response HTTP status code
    assert resp.status_code == 200, f"Expected HTTP 200 OK, got {resp.status_code}"

    # Validate JSON response content
    try:
        resp_json = resp.json()
    except json.JSONDecodeError:
        assert False, "Response is not valid JSON"

    # Must include docHash, ipfsCid, riskAnalysis (optional)
    assert "docHash" in resp_json and isinstance(resp_json["docHash"], str) and len(resp_json["docHash"]) > 0, \
        "Missing or invalid 'docHash' in response"
    assert "ipfsCid" in resp_json and isinstance(resp_json["ipfsCid"], str) and len(resp_json["ipfsCid"]) > 0, \
        "Missing or invalid 'ipfsCid' in response"
    # riskAnalysis may be optional or null; if present check type
    if "riskAnalysis" in resp_json and resp_json["riskAnalysis"] is not None:
        assert isinstance(resp_json["riskAnalysis"], dict), "'riskAnalysis' must be a dict if present"

    # Validate docHash correctness: accept optional '0x' prefix
    doc_hash_val = resp_json["docHash"]
    if doc_hash_val.startswith("0x") or doc_hash_val.startswith("0X"):
        doc_hash_val = doc_hash_val[2:]
    assert len(doc_hash_val) == 64 and all(c in "0123456789abcdef" for c in doc_hash_val.lower()), \
        f"docHash not valid SHA-256 hex: {resp_json['docHash']}"

    # Validate ipfsCid format: CIDv0 or CIDv1
    ipfs_cid = resp_json["ipfsCid"]
    # Basic validation: CID typically base58 or base32 string with length > 20 chars
    assert isinstance(ipfs_cid, str) and 20 <= len(ipfs_cid) <= 64, "ipfsCid format invalid or unexpected length"

    # Test error handling: missing file
    try:
        resp_missing_file = requests.post(
            BASE_URL + UPLOAD_ENDPOINT,
            data={"recordType": record_type},
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Request to /api/upload missing file failed: {e}"
    assert resp_missing_file.status_code >= 400 and resp_missing_file.status_code < 500, \
        "Expected client error status for missing file"

    # Validate error message present for missing file request
    try:
        err_json = resp_missing_file.json()
        assert "error" in err_json or "message" in err_json, "Error response JSON missing 'error' or 'message' key"
    except json.JSONDecodeError:
        assert False, "Error response for missing file is not valid JSON"

    # Test error handling: missing recordType
    try:
        resp_missing_recordtype = requests.post(
            BASE_URL + UPLOAD_ENDPOINT,
            files=files,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Request to /api/upload missing recordType failed: {e}"
    assert resp_missing_recordtype.status_code >= 400 and resp_missing_recordtype.status_code < 500, \
        "Expected client error status for missing recordType"

    try:
        err_json = resp_missing_recordtype.json()
        assert "error" in err_json or "message" in err_json, "Error response JSON missing 'error' or 'message' key"
    except json.JSONDecodeError:
        assert False, "Error response for missing recordType is not valid JSON"

test_upload_medical_document_encrypt_and_upload_to_ipfs()
