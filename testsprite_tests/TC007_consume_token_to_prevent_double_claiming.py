import requests
import time

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

# Simulated blockchain service endpoints (assuming local mock or gateway for testing)
BLOCKCHAIN_BASE_URL = "http://localhost:5001"  # Assuming a test blockchain API for invoking functions

# Mock functions to interact with blockchain (replace with actual Aptos SDK calls or API if available)
def mint_token(payload):
    """
    Simulate mintToken blockchain function.
    Payload must include documentHash, ipfsCID, patientAddress, recordType, and other required fields.
    Returns tokenId (string).
    """
    resp = requests.post(f"{BLOCKCHAIN_BASE_URL}/mintToken", json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json().get("tokenId")

def get_token_details(token_id):
    """
    Simulate getTokenDetails blockchain function.
    Returns dictionary with keys:
    recordType, documentHash, ipfsCID, patientAddress, isConsumed, issuer, timestamp
    """
    resp = requests.get(f"{BLOCKCHAIN_BASE_URL}/tokenDetails/{token_id}", timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def consume_token(token_id):
    """
    Simulate consumeToken blockchain function.
    Marks the token as consumed and returns transaction result.
    """
    resp = requests.post(f"{BLOCKCHAIN_BASE_URL}/consumeToken", json={"tokenId": token_id}, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def get_patient_dashboard(wallet_address):
    """
    Simulate getting the patient dashboard records filtered by wallet address.
    Returns list of tokens with their metadata.
    """
    resp = requests.get(f"{BLOCKCHAIN_BASE_URL}/patientDashboard/{wallet_address}", timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()  # List of tokens

def get_ui_token_status(token_id):
    """
    Simulate front-end UI call to get token consumed status.
    Returns consumed status boolean.
    """
    resp = requests.get(f"{BLOCKCHAIN_BASE_URL}/ui/tokenStatus/{token_id}", timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json().get("isConsumed", False)

def test_consume_token_prevents_double_claiming():
    # Step 1: Mint a test token that we can consume
    test_token_payload = {
        "documentHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "ipfsCID": "QmTestCIDforTokenConsume1234567890abcdef",
        "patientAddress": "0xPatientWalletAddress1234567890abcdef",
        "recordType": "TestRecordType",
        "issuer": "HospitalA",
        "timestamp": int(time.time())
    }

    token_id = None
    try:
        token_id = mint_token(test_token_payload)
        assert token_id is not None, "Mint token failed to return token ID."

        # Step 2: Confirm token is initially not consumed
        details_before = get_token_details(token_id)
        assert details_before["isConsumed"] is False, "Token should not be consumed initially."

        # Step 3: Consume the token via blockchain
        consume_response = consume_token(token_id)
        assert consume_response.get("success") is True, "Token consumption failed."

        # Step 4: Retrieve token details again and verify isConsumed is True
        details_after = get_token_details(token_id)
        assert details_after["isConsumed"] is True, "Token did not update to consumed after consumption."

        # Step 5: Verify the UI reflects the consumed status accurately
        ui_status = get_ui_token_status(token_id)
        assert ui_status is True, "UI does not reflect consumed token status correctly."

        # Step 6: Try consuming the token again to check prevention of double claiming
        try:
            consume_token(token_id)
            assert False, "Double consumption should not be allowed, but it succeeded."
        except requests.HTTPError as e:
            # Assuming the API returns 400 or 409 or some error for double consumption
            assert e.response.status_code in (400, 409), "Unexpected status code for double consumption attempt."

    finally:
        # Cleanup if any cleanup API exists - Ignored here as blockchain tokens are persistent.
        # Could add code to revoke or reset token state if supported.
        pass

test_consume_token_prevents_double_claiming()