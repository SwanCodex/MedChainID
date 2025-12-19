
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** SSAY
- **Date:** 2025-12-19
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** upload medical document encrypt and upload to ipfs
- **Test Code:** [TC001_upload_medical_document_encrypt_and_upload_to_ipfs.py](./TC001_upload_medical_document_encrypt_and_upload_to_ipfs.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 113, in <module>
  File "<string>", line 104, in test_upload_medical_document_encrypt_and_upload_to_ipfs
AssertionError: Expected client error status for missing recordType

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/b09332dd-f0e6-4d52-8a89-087417077fb7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** decrypt and return document from ipfs using provided key
- **Test Code:** [TC002_decrypt_and_return_document_from_ipfs_using_provided_key.py](./TC002_decrypt_and_return_document_from_ipfs_using_provided_key.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 65, in <module>
  File "<string>", line 48, in test_decrypt_view_document_with_correct_and_wrong_key
AssertionError: Decryption with assumed correct key failed unexpectedly: HTTP 500 - {"success":false,"error":"Decryption failed","message":"error:1C800064:Provider routines::bad decrypt"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/ae20d136-92ec-427a-874b-6e80914a5d3e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** verify document hash with uploaded file
- **Test Code:** [TC003_verify_document_hash_with_uploaded_file.py](./TC003_verify_document_hash_with_uploaded_file.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 94, in <module>
  File "<string>", line 39, in test_verify_document_hash_with_uploaded_file
AssertionError: docHash is not a valid SHA256 hex string

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/4a5c722b-a474-43c4-b2a9-3034d5d3a61c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** download encrypted file from ipfs using cid
- **Test Code:** [TC004_download_encrypted_file_from_ipfs_using_cid.py](./TC004_download_encrypted_file_from_ipfs_using_cid.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 69, in <module>
  File "<string>", line 23, in test_download_encrypted_file_from_ipfs_using_cid
AssertionError: Upload failed with status 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/4213c139-5729-494d-aeed-f75625ce5e37
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** mint medical record token on aptos blockchain
- **Test Code:** [TC005_mint_medical_record_token_on_aptos_blockchain.py](./TC005_mint_medical_record_token_on_aptos_blockchain.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 75, in <module>
  File "<string>", line 57, in test_mint_medical_record_token_on_aptos_blockchain
AssertionError: Mint token failed: {"success":false,"error":"Route not found","path":"/api/mint-token","method":"POST"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/e6719c93-795e-4692-b969-cab653449caf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** get token details from blockchain with correct parsing
- **Test Code:** [TC006_get_token_details_from_blockchain_with_correct_parsing.py](./TC006_get_token_details_from_blockchain_with_correct_parsing.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 67, in test_get_token_details_blockchain_correct_parsing
AssertionError: Mint token failed: 404 {"success":false,"error":"Route not found","path":"/api/mint-token","method":"POST"}

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 123, in <module>
  File "<string>", line 73, in test_get_token_details_blockchain_correct_parsing
AssertionError: Failed to mint token: Mint token failed: 404 {"success":false,"error":"Route not found","path":"/api/mint-token","method":"POST"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/69b1a237-d69e-4bd6-b325-f8cc25dc8fbf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** consume token to prevent double claiming
- **Test Code:** [TC007_consume_token_to_prevent_double_claiming.py](./TC007_consume_token_to_prevent_double_claiming.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 104, in <module>
  File "<string>", line 72, in test_consume_token_prevents_double_claiming
  File "<string>", line 19, in mint_token
  File "/var/task/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 500 Server Error: Internal Server Error for url: http://localhost:5001/mintToken

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/60ce34c1-dac6-4771-bb7c-72b47238e7ba
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** verify token validity and consumption status
- **Test Code:** [TC008_verify_token_validity_and_consumption_status.py](./TC008_verify_token_validity_and_consumption_status.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 66, in test_verify_token_validity_and_consumption_status
  File "<string>", line 38, in create_test_token
  File "/var/task/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 404 Client Error: Not Found for url: http://localhost:5000/api/mint-token

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 149, in <module>
  File "<string>", line 143, in test_verify_token_validity_and_consumption_status
AssertionError: Request failed: 404 Client Error: Not Found for url: http://localhost:5000/api/mint-token

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/3b55c6be-dcbe-41de-b289-bbebef196198
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** patient dashboard filters records by connected wallet address
- **Test Code:** [TC009_patient_dashboard_filters_records_by_connected_wallet_address.py](./TC009_patient_dashboard_filters_records_by_connected_wallet_address.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 153, in <module>
  File "<string>", line 113, in test_patient_dashboard_filters_records_by_connected_wallet_address
  File "<string>", line 60, in mint_token
  File "/var/task/requests/models.py", line 1024, in raise_for_status
    raise HTTPError(http_error_msg, response=self)
requests.exceptions.HTTPError: 404 Client Error: Not Found for url: http://localhost:5000/api/mock/mint-token

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/2ce6d117-71ae-468c-b4f2-92610293c29e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** shareable verification links embed key in url hash fragment
- **Test Code:** [TC010_shareable_verification_links_embed_key_in_url_hash_fragment.py](./TC010_shareable_verification_links_embed_key_in_url_hash_fragment.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 81, in <module>
  File "<string>", line 24, in test_shareable_verification_links_embed_key_in_url_hash_fragment
AssertionError: Upload failed with status 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/df9b85a9-383f-49a3-ae2c-6f56a7439f81/b50a36a8-439e-45fb-b97b-55f92e14793b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---