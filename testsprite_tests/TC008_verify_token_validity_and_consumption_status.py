import requests
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
HEADERS = {"Accept": "application/json"}


def create_test_token():
    # Create a dummy encrypted document and upload to get docHash and ipfsCid for minting token
    file_content = b"%PDF-1.4 test document for token validation"
    files = {
        "document": ("testdoc.pdf", file_content, "application/pdf"),
    }
    data = {"recordType": "testRecord"}

    upload_resp = requests.post(
        f"{BASE_URL}/api/upload", files=files, data=data, timeout=TIMEOUT
    )
    upload_resp.raise_for_status()
    upload_result = upload_resp.json()
    doc_hash = upload_result["docHash"]
    ipfs_cid = upload_result["ipfsCid"]

    # Mint token on blockchain via an assumed test mint API or simulate mint via API (no direct blockchain endpoint given)
    # We simulate mintToken by posting to a hypothetical /api/mint-token endpoint (not in PRD, but needed for test)
    # If no such exists, we skip mint and just test verifyToken gracefully with invalid token IDs.
    # For demonstration, we'll assume that to test verifyToken, we first obtain a token_id from upload + mint simulation.
    mint_payload = {
        "documentHash": doc_hash,
        "ipfsCID": ipfs_cid,
        "patientAddress": "0xTestPatientAddress1234567890",
        "recordType": "testRecord",
    }
    mint_resp = requests.post(
        f"{BASE_URL}/api/mint-token", json=mint_payload, timeout=TIMEOUT
    )
    mint_resp.raise_for_status()
    token_data = mint_resp.json()
    token_id = token_data.get("tokenId")
    return token_id


def delete_test_token(token_id):
    # Hypothetical cleanup endpoint to delete token from blockchain in test environment
    try:
        resp = requests.delete(
            f"{BASE_URL}/api/token/{token_id}", timeout=TIMEOUT, headers=HEADERS
        )
        resp.raise_for_status()
    except Exception:
        # May not exist or fail, but ignore as cleanup
        pass


def test_verify_token_validity_and_consumption_status():
    # Test the verifyToken blockchain function to confirm tokens validity and consumption status
    # and handle invalid or consumed tokens gracefully.

    # Without direct blockchain SDK or endpoint specified for verifyToken, we assume backend exposes POST /api/token/verify
    # with payload {tokenId: <token_id>} returning JSON {valid: bool, consumed: bool} or error.
    # If no such endpoint exists, adapt to the closest available. This is a pragmatic assumption.

    token_id = None
    try:
        token_id = create_test_token()
        assert token_id, "Failed to mint token for test"

        verify_url = f"{BASE_URL}/api/token/verify"
        # Valid token verify request
        resp_valid = requests.post(
            verify_url,
            json={"tokenId": token_id},
            timeout=TIMEOUT,
            headers=HEADERS,
        )
        assert resp_valid.status_code == 200, "Valid token verification failed"
        valid_data = resp_valid.json()
        assert "valid" in valid_data and "consumed" in valid_data, "Missing fields in valid token response"
        assert valid_data["valid"] is True, "Token should be valid"
        assert valid_data["consumed"] is False, "Token should not be consumed initially"

        # Simulate consuming the token once
        consume_url = f"{BASE_URL}/api/token/consume"
        resp_consume = requests.post(
            consume_url,
            json={"tokenId": token_id},
            timeout=TIMEOUT,
            headers=HEADERS,
        )
        assert resp_consume.status_code == 200, "Token consumption failed"

        # Verify token again after consumption should indicate consumed
        resp_after_consume = requests.post(
            verify_url,
            json={"tokenId": token_id},
            timeout=TIMEOUT,
            headers=HEADERS,
        )
        assert resp_after_consume.status_code == 200, "Verification after consumption failed"
        after_data = resp_after_consume.json()
        assert after_data["valid"] is True, "Token should still be valid"
        assert after_data["consumed"] is True, "Token should be marked consumed"

        # Verify invalid token ID gracefully handled
        resp_invalid = requests.post(
            verify_url,
            json={"tokenId": "invalid_token_id_1234567890"},
            timeout=TIMEOUT,
            headers=HEADERS,
        )

        assert resp_invalid.status_code in (400, 404), "Invalid token should return error status"
        err_resp = resp_invalid.json()
        assert (
            "error" in err_resp or "message" in err_resp
        ), "Error response must contain error or message field"

        # Verify consumed token cannot be consumed again (simulate double consumption)
        resp_double_consume = requests.post(
            consume_url,
            json={"tokenId": token_id},
            timeout=TIMEOUT,
            headers=HEADERS,
        )
        # Should fail with error or idempotent success but token remains consumed
        assert resp_double_consume.status_code in (400, 409, 422, 200), (
            "Double consumption attempt should be rejected or idempotent"
        )
        if resp_double_consume.status_code == 200:
            resp_check = requests.post(
                verify_url,
                json={"tokenId": token_id},
                timeout=TIMEOUT,
                headers=HEADERS,
            )
            check_data = resp_check.json()
            assert check_data["consumed"] is True, "Token must remain consumed after double consume"

    except requests.Timeout:
        assert False, "Test failed due to request timeout"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    finally:
        if token_id:
            delete_test_token(token_id)


test_verify_token_validity_and_consumption_status()