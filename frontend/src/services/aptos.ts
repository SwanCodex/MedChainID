import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const APTOS_NETWORK = (import.meta.env.VITE_APTOS_NETWORK as Network) || Network.DEVNET;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xCAFE';
const MODULE_NAME = 'MedChainID';

const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

/**
 * Convert string to byte array for Move vector<u8>
 */
const stringToBytes = (str: string): number[] => {
  return Array.from(new TextEncoder().encode(str));
};

/**
 * Convert hex string to byte array for Move vector<u8>
 */
const hexToBytes = (hexString: string): number[] => {
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  const bytes: number[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.substr(i, 2), 16));
  }
  return bytes;
};

/**
 * Mint a new medical token on the blockchain
 * 
 * Move function signature:
 * public entry fun mint_token(
 *   account: &signer,
 *   patient_address: address,
 *   record_type: vector<u8>,
 *   document_hash: vector<u8>,
 *   ipfs_cid: vector<u8>,
 * )
 */
export async function mintToken(
  signAndSubmitTransaction: any,
  recordType: string,
  documentHash: string,
  ipfsCID: string,
  patientAddress: string
): Promise<string> {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0xCAFE') {
    throw new Error("VITE_CONTRACT_ADDRESS not set in .env");
  }

  console.log("⛓️ Preparing mint transaction...");
  console.log("   Contract:", CONTRACT_ADDRESS);
  console.log("   Patient:", patientAddress);
  console.log("   Record Type:", recordType);
  console.log("   Hash:", documentHash.substring(0, 20) + "...");
  console.log("   IPFS CID:", ipfsCID);

  // Convert to byte arrays as required by Move contract
  const recordTypeBytes = stringToBytes(recordType);
  const documentHashBytes = hexToBytes(documentHash);
  const ipfsCIDBytes = stringToBytes(ipfsCID);

  // Transaction structure for @aptos-labs/wallet-adapter-react v3.x
  // Uses InputTransactionData format with 'data' wrapper
  const payload = {
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::mint_token`,
      typeArguments: [],
      functionArguments: [
        patientAddress,      // address
        recordTypeBytes,     // vector<u8>
        documentHashBytes,   // vector<u8>
        ipfsCIDBytes,        // vector<u8>
      ],
    },
  };

  console.log("📝 Transaction payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await signAndSubmitTransaction(payload);
    
    console.log("✅ Transaction submitted!");
    console.log("   Response:", response);
    
    // Handle different response formats
    const txHash = response.hash || response;
    
    // Wait for confirmation
    await aptos.waitForTransaction({ transactionHash: txHash });
    console.log("✅ Transaction confirmed on blockchain!");
    
    return txHash;
  } catch (error: any) {
    console.error("❌ Minting failed:", error);
    
    // Better error messages
    if (error.message?.includes('INSUFFICIENT_BALANCE')) {
      throw new Error('Insufficient APT. Get free tokens from https://aptos.dev/en/network/faucet');
    }
    if (error.message?.includes('rejected') || error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    if (error.message?.includes('MODULE_NOT_FOUND')) {
      throw new Error(`Contract not found at ${CONTRACT_ADDRESS}. Make sure it's deployed on ${APTOS_NETWORK}.`);
    }
    
    throw error;
  }
}

/**
 * Verify if a token is valid and not consumed
 */
export async function verifyToken(
  issuerAddress: string, 
  tokenId: number
): Promise<[boolean, string]> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::verify_token`,
        typeArguments: [],
        functionArguments: [issuerAddress, tokenId],
      },
    });
    return result as [boolean, string];
  } catch (e) {
    console.error("Verification failed:", e);
    return [false, ""];
  }
}

/**
 * Get detailed information about a token
 */
export async function getTokenDetails(issuerAddress: string, tokenId: number) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_token_details`,
        typeArguments: [],
        functionArguments: [issuerAddress, tokenId],
      },
    });

    const [recordType, documentHash, ipfsCID, isConsumed, issuer, timestamp] = result as any[];
    
    // Decode byte arrays to strings
    const decode = (bytes: any) => {
      if (typeof bytes === 'string') return bytes;
      try {
        return new TextDecoder().decode(new Uint8Array(bytes));
      } catch {
        return String(bytes);
      }
    };
    
    return {
      recordType: decode(recordType),
      documentHash: typeof documentHash === 'string' ? documentHash : 
        Array.from(new Uint8Array(documentHash)).map(b => b.toString(16).padStart(2, '0')).join(''),
      ipfsCID: decode(ipfsCID),
      isConsumed,
      issuer,
      timestamp: Number(timestamp),
    };
  } catch (e) {
    console.error("Get details failed:", e);
    throw e;
  }
}

/**
 * Consume a token (mark as used - one-time use)
 */
export async function consumeToken(
  signAndSubmitTransaction: any,
  issuerAddress: string,
  tokenId: number
): Promise<string> {
  const transaction = {
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::consume_token` as `${string}::${string}::${string}`,
      typeArguments: [],
      functionArguments: [issuerAddress, tokenId],
    },
  };

  const response = await signAndSubmitTransaction(transaction);
  await aptos.waitForTransaction({ transactionHash: response.hash });
  return response.hash;
}
