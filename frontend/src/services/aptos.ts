import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const APTOS_NETWORK = (import.meta.env.VITE_APTOS_NETWORK as Network) || Network.DEVNET;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xCAFE';
const MODULE_NAME = 'MedChainID';

const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

// Helper: Convert Hex String to Uint8Array (Browser compatible)
const fromHexString = (hexString: string) => {
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
    throw new Error('Invalid hex string format');
  }
  return new Uint8Array(cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
};

// Helper: Normalize Aptos address for comparison (case-insensitive)
const normalizeAddress = (address: string): string => {
  if (!address) return '';
  // Remove 0x prefix if present, convert to lowercase
  const cleaned = address.startsWith('0x') ? address.slice(2) : address;
  return cleaned.toLowerCase().trim();
};

export async function mintToken(
  signAndSubmitTransaction: any,
  recordType: string,
  documentHash: string,
  ipfsCID: string,
  patientAddress: string
) {
  try {
    // Validate inputs
    if (!recordType || recordType.trim().length === 0) {
      throw new Error('Record type is required');
    }
    if (!documentHash || documentHash.trim().length === 0) {
      throw new Error('Document hash is required');
    }
    if (!ipfsCID || ipfsCID.trim().length === 0) {
      throw new Error('IPFS CID is required');
    }
    if (!patientAddress || patientAddress.trim().length === 0) {
      throw new Error('Patient address is required');
    }

    // Validate address format (basic check)
    const normalizedAddress = normalizeAddress(patientAddress);
    if (normalizedAddress.length < 32) {
      throw new Error('Invalid patient address format');
    }

    console.log('⛓️  Preparing blockchain transaction...');
    console.log('   Contract:', CONTRACT_ADDRESS);
    console.log('   Network:', APTOS_NETWORK);
    console.log('   Patient:', patientAddress);
    console.log('   Record Type:', recordType);
    
    // Convert data to byte arrays for the smart contract
    const recordTypeBytes = Array.from(new TextEncoder().encode(recordType));
    const documentHashBytes = Array.from(fromHexString(documentHash));
    const ipfsCIDBytes = Array.from(new TextEncoder().encode(ipfsCID));

    console.log('   Record Type Bytes:', recordTypeBytes.length, 'bytes');
    console.log('   Document Hash Bytes:', documentHashBytes.length, 'bytes');
    console.log('   IPFS CID Bytes:', ipfsCIDBytes.length, 'bytes');

    // Transaction payload for Aptos wallet adapter v2
    // Note: Aptos Wallet Adapter v2 expects the transaction object directly
    const transaction = {
      type: "entry_function_payload",
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::mint_token`,
      type_arguments: [],
      arguments: [patientAddress, recordTypeBytes, documentHashBytes, ipfsCIDBytes],
    };

    console.log('📝 Sending transaction to wallet for signature...');
    console.log('   Transaction:', JSON.stringify(transaction, null, 2));
    
    if (!signAndSubmitTransaction || typeof signAndSubmitTransaction !== 'function') {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    const response = await signAndSubmitTransaction(transaction);
    
    if (!response || !response.hash) {
      throw new Error('Transaction failed: No transaction hash returned');
    }
    
    console.log('⏳ Waiting for transaction confirmation...');
    console.log('   TX Hash:', response.hash);
    
    await aptos.waitForTransaction({ transactionHash: response.hash });
    
    console.log('✅ Transaction confirmed on blockchain!');
    return response.hash;
  } catch (error: any) {
    console.error('❌ Blockchain minting error:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('INSUFFICIENT_BALANCE')) {
      throw new Error('Insufficient APT tokens. Get free tokens from https://aptoslabs.com/testnet-faucet');
    }
    if (error.message?.includes('rejected')) {
      throw new Error('Transaction rejected by user');
    }
    if (error.message?.includes('MODULE_NOT_FOUND') || error.message?.includes('FUNCTION_NOT_FOUND')) {
      throw new Error('Smart contract not found. Please ensure contract is deployed at: ' + CONTRACT_ADDRESS);
    }
    if (error.code === 4001) {
      throw new Error('User rejected the transaction');
    }
    
    throw new Error('Blockchain error: ' + (error.message || 'Unknown error'));
  }
}

export async function verifyToken(issuerAddress: string, tokenId: number): Promise<[boolean, string]> {
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::verify_token`,
      typeArguments: [],
      functionArguments: [issuerAddress, tokenId],
    },
  });

  return result as [boolean, string];
}

export async function getTokenDetails(issuerAddress: string, tokenId: number) {
  // Validate inputs
  if (!issuerAddress || issuerAddress.trim().length === 0) {
    throw new Error('Issuer address is required');
  }
  if (typeof tokenId !== 'number' || tokenId < 0) {
    throw new Error('Invalid token ID');
  }

  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_token_details`,
      typeArguments: [],
      functionArguments: [issuerAddress, tokenId],
    },
  });

  // Validate result structure
  if (!Array.isArray(result) || result.length < 7) {
    throw new Error(`Invalid token details response: expected 7 values, got ${result?.length || 0}`);
  }

  // Contract returns: (record_type, document_hash, ipfs_cid, patient_address, is_consumed, issuer, timestamp)
  const [
    recordTypeHex, 
    documentHashHex, 
    ipfsCIDHex, 
    patientAddress, // CRITICAL: Must be extracted correctly
    isConsumed, 
    issuer, 
    timestamp
  ] = result as any[];

  // Validate all required fields are present
  if (patientAddress === undefined || patientAddress === null) {
    throw new Error('Patient address missing from token details');
  }

  return {
    // Parse the Hex String -> Uint8Array -> Text
    recordType: new TextDecoder().decode(fromHexString(recordTypeHex)),
    // documentHash is already a hex string from the chain, just strip 0x if needed
    documentHash: documentHashHex.startsWith('0x') ? documentHashHex.slice(2) : documentHashHex,
    ipfsCID: new TextDecoder().decode(fromHexString(ipfsCIDHex)),
    patientAddress: String(patientAddress), // Ensure it's a string
    isConsumed: Boolean(isConsumed),
    issuer: String(issuer),
    timestamp: Number(timestamp),
  };
}

export async function consumeToken(
  signAndSubmitTransaction: any,
  issuerAddress: string,
  tokenId: number
) {
  // Transaction payload for Aptos wallet adapter
  const transaction = {
    type: "entry_function_payload",
    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::consume_token`,
    type_arguments: [],
    arguments: [issuerAddress, tokenId],
  };

  const response = await signAndSubmitTransaction(transaction);
  await aptos.waitForTransaction({ transactionHash: response.hash });
  
  return response.hash;
}