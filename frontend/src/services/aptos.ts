import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const APTOS_NETWORK = import.meta.env.VITE_APTOS_NETWORK || 'devnet';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xCAFE';
const MODULE_NAME = 'MedChainID';

const config = new AptosConfig({ network: APTOS_NETWORK as Network });
const aptos = new Aptos(config);

export async function initializeRegistry(signAndSubmitTransaction: any) {
  const transaction = {
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::initialize`,
      typeArguments: [],
      functionArguments: [],
    },
  };

  try {
    const response = await signAndSubmitTransaction(transaction);
    await aptos.waitForTransaction({ transactionHash: response.hash });
    return response.hash;
  } catch (error: any) {
    // Ignore if already initialized
    if (error.message?.includes('RESOURCE_ALREADY_EXISTS')) {
      return null;
    }
    throw error;
  }
}

export async function mintToken(
  signAndSubmitTransaction: any,
  recordType: string,
  documentHash: string,
  ipfsCID: string
) {
  // Convert strings to hex byte arrays (browser-compatible)
  const recordTypeBytes = Array.from(new TextEncoder().encode(recordType));
  
  // Convert hex string to byte array
  const documentHashBytes = documentHash.startsWith('0x') 
    ? Array.from(new Uint8Array(documentHash.slice(2).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []))
    : Array.from(new TextEncoder().encode(documentHash));
  
  const ipfsCIDBytes = Array.from(new TextEncoder().encode(ipfsCID));

  const transaction = {
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::mint_token`,
      typeArguments: [],
      functionArguments: [recordTypeBytes, documentHashBytes, ipfsCIDBytes],
    },
  };

  const response = await signAndSubmitTransaction(transaction);
  await aptos.waitForTransaction({ transactionHash: response.hash });
  
  return response.hash;
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
  const result = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_token_details`,
      typeArguments: [],
      functionArguments: [issuerAddress, tokenId],
    },
  });

  const [recordType, documentHash, ipfsCID, isConsumed, issuer, timestamp] = result as any[];

  return {
    recordType: new TextDecoder().decode(new Uint8Array(recordType)),
    documentHash: Buffer.from(documentHash).toString('hex'),
    ipfsCID: new TextDecoder().decode(new Uint8Array(ipfsCID)),
    isConsumed,
    issuer,
    timestamp: Number(timestamp),
  };
}

export async function consumeToken(
  signAndSubmitTransaction: any,
  issuerAddress: string,
  tokenId: number
) {
  const transaction = {
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::consume_token`,
      typeArguments: [],
      functionArguments: [issuerAddress, tokenId],
    },
  };

  const response = await signAndSubmitTransaction(transaction);
  await aptos.waitForTransaction({ transactionHash: response.hash });
  
  return response.hash;
}
