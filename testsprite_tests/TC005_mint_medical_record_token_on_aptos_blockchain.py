import requests
import hashlib
from io import BytesIO

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_mint_medical_record_token_on_aptos_blockchain():
    # Step 1: Upload encrypted medical document to get document hash and IPFS CID
    upload_url = f"{BASE_URL}/api/upload"
    record_type = "medical-record"
    patient_wallet_address = "0xabc123abc123abc123abc123abc123abc123abcd"  # example patient wallet address

    # Prepare dummy medical document content
    document_content = b"Test medical record content for mintToken function"
    document_filename = "test_medical_record.pdf"

    # Use BytesIO to simulate file upload without writing to disk
    document_file = BytesIO(document_content)
    document_file.name = document_filename

    # Upload encrypted file and get docHash, ipfsCid
    files = {
        "document": (document_filename, document_file, "application/pdf"),
    }
    data = {
        "recordType": record_type
    }

    try:
        upload_resp = requests.post(upload_url, files=files, data=data, timeout=TIMEOUT)
        assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
        upload_json = upload_resp.json()
        # Validate presence of critical fields
        assert "docHash" in upload_json, "docHash missing from upload response"
        assert "ipfsCid" in upload_json, "ipfsCid missing from upload response"
        assert "riskAnalysis" in upload_json, "riskAnalysis missing from upload response"
        doc_hash = upload_json["docHash"]
        ipfs_cid = upload_json["ipfsCid"]

        # Note: docHash is hash of encrypted content, not plaintext, so we remove plaintext hash check

        # Step 2: Construct Aptos Wallet Adapter v2 payload for mintToken
        payload = {
            "function": "mintToken",
            "args": [record_type, doc_hash, ipfs_cid, patient_wallet_address],
            "type": "entry_function_payload",
            "type_args": []
        }

        # Assume backend exposes endpoint to mint token: POST /api/mint-token
        mint_url = f"{BASE_URL}/api/mint-token"
        mint_resp = requests.post(mint_url, json=payload, timeout=TIMEOUT)
        assert mint_resp.status_code == 200, f"Mint token failed: {mint_resp.text}"
        mint_json = mint_resp.json()

        # Validate mint response contains expected token information
        assert "tokenId" in mint_json, "tokenId missing in mint response"
        assert "transactionHash" in mint_json, "transactionHash missing in mint response"
        assert "mintedAt" in mint_json, "mintedAt timestamp missing in mint response"

        # Validate patient address filtering: token must be minted to the given patient address
        assert mint_json.get("patientAddress", "").lower() == patient_wallet_address.lower(), "Patient address mismatch in minted token"

        # Validate payload matches Aptos Wallet Adapter v2 format requirements
        assert mint_json.get("payload") == payload, "Payload mismatch in mint response"

    finally:
        pass


test_mint_medical_record_token_on_aptos_blockchain()
