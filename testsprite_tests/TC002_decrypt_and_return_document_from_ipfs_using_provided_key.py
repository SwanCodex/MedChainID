import requests
import io

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_decrypt_view_document_with_correct_and_wrong_key():
    # Step 1: Prepare an in-memory dummy PDF file to upload
    sample_pdf_content = b"%PDF-1.4\n%EOF\n"
    sample_file = io.BytesIO(sample_pdf_content)
    sample_file.name = "test_document.pdf"

    upload_url = f"{BASE_URL}/api/upload"
    record_type = "medical_report"

    files = {"document": (sample_file.name, sample_file, "application/pdf")}
    data = {"recordType": record_type}
    try:
        upload_resp = requests.post(upload_url, files=files, data=data, timeout=TIMEOUT)
        upload_resp.raise_for_status()
    except Exception as e:
        assert False, f"Upload API call failed: {e}"

    upload_json = upload_resp.json()
    assert "ipfsCid" in upload_json, "Upload response missing ipfsCid"
    ipfs_cid = upload_json["ipfsCid"]
    assert isinstance(ipfs_cid, str) and len(ipfs_cid) > 0, "Invalid ipfsCid received"

    # Step 2: Use a dummy 64 hex char AES key for testing
    correct_key = "a" * 64  # dummy correct key
    wrong_key = "f" * 64    # dummy wrong key

    decrypt_url = f"{BASE_URL}/api/decrypt-view"
    headers = {"Content-Type": "application/json"}

    # Step 3: Test decryption with the correct key
    try:
        resp_correct = requests.post(decrypt_url, json={"cid": ipfs_cid, "key": correct_key}, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Decryption call with correct key failed: {e}"

    if resp_correct.status_code == 200:
        content_type = resp_correct.headers.get("Content-Type", "")
        assert content_type != "application/json", "Expected binary decrypted content, got JSON error"
        content = resp_correct.content
        assert content is not None and len(content) > 0, "Decrypted content is empty"
    else:
        assert False, f"Decryption with assumed correct key failed unexpectedly: HTTP {resp_correct.status_code} - {resp_correct.text}"

    # Step 4: Test decryption with wrong key
    try:
        resp_wrong = requests.post(decrypt_url, json={"cid": ipfs_cid, "key": wrong_key}, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Decryption call with wrong key failed: {e}"

    assert resp_wrong.status_code != 200, f"Decryption should fail with wrong key but got HTTP 200"

    try:
        err_json = resp_wrong.json()
    except Exception:
        assert False, "Response with wrong key is not JSON error but got non-JSON content"

    assert "error" in err_json or "message" in err_json, "Error message missing from wrong key response"

test_decrypt_view_document_with_correct_and_wrong_key()
