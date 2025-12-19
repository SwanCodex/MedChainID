import requests
import re

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_download_encrypted_file_from_ipfs_using_cid():
    # Valid CID format: IPFS CIDv0 (Qm...) or CIDv1 (base32)
    # We'll try a valid CID and invalid CIDs
    valid_cid = None
    created_cid = None

    # Step 1: Upload a file to get a valid encrypted IPFS CID for download
    try:
        upload_url = f"{BASE_URL}/api/upload"
        files = {
            'document': ('test_document.txt', b'Sample medical document content for encryption test.', 'text/plain')
        }
        data = {
            'recordType': 'TestRecord'
        }
        upload_resp = requests.post(upload_url, files=files, data=data, timeout=TIMEOUT)
        assert upload_resp.status_code == 200, f"Upload failed with status {upload_resp.status_code}"
        upload_json = upload_resp.json()
        assert 'ipfsCid' in upload_json and isinstance(upload_json['ipfsCid'], str)
        created_cid = upload_json['ipfsCid']
        valid_cid = created_cid

        # Confirm CID format (basic check for IPFS CID format - CIDv0 or CIDv1 base32)
        cid_pattern = re.compile(r'^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[afkz][0-9a-z]{50,})$')
        assert cid_pattern.match(valid_cid), f"Returned CID '{valid_cid}' does not match expected format"

        # Step 2: Use the GET /api/download/:cid to download the encrypted file
        download_url = f"{BASE_URL}/api/download/{valid_cid}"
        download_resp = requests.get(download_url, timeout=TIMEOUT)
        assert download_resp.status_code == 200, f"Failed to download file with valid CID, status {download_resp.status_code}"

        # The response content should be non-empty bytes (encrypted file)
        content = download_resp.content
        assert content and isinstance(content, bytes)
        assert len(content) > 0, "Downloaded file content is empty"

    finally:
        # Cleanup: No dedicated delete endpoint mentioned for uploaded files,
        # so can't delete uploaded CID here in backend.
        pass

    # Step 3: Test error handling for missing CID (empty)
    download_url_missing = f"{BASE_URL}/api/download/"
    missing_resp = requests.get(download_url_missing)
    # The route likely 404 or 400 for missing CID path param
    assert missing_resp.status_code in {400, 404}

    # Step 4: Test invalid CID formats - malformed strings
    invalid_cids = [
        "",  # empty
        "1234",  # too short, invalid chars
        "QmInvalidCIDBecauseTooShort",  # invalid length for CIDv0
        "bafz!@#$%^&*()_+",  # invalid chars in CIDv1
        "QmOThisIsNotBase58Correct12345678901234567890",  # invalid base58 chars
    ]

    for cid in invalid_cids:
        url = f"{BASE_URL}/api/download/{cid}"
        resp = requests.get(url, timeout=TIMEOUT)
        # Expect 400 Bad Request or 422 Unprocessable Entity or 404 Not Found
        assert resp.status_code in {400, 404, 422}, f"Invalid CID '{cid}' did not return expected error status, got {resp.status_code}"

test_download_encrypted_file_from_ipfs_using_cid()
