import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const APTOS_NETWORK = (import.meta.env.VITE_APTOS_NETWORK as Network) || Network.DEVNET;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xCAFE';
const MODULE_NAME = 'MedChainID';

const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

// Helper: Convert Hex String to Uint8Array (Browser compatible)
const fromHexString = (hexString: string) => {
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return new Uint8Array(cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
};

export async function mintToken(
  signAndSubmitTransaction: any,
  recordType: string,
  documentHash: string,
  ipfsCID: string,
  patientAddress: string
) {
  // Convert data to byte arrays for the smart contract
  const recordTypeBytes = Array.from(new TextEncoder().encode(recordType));
  const documentHashBytes = Array.from(fromHexString(documentHash));
  const ipfsCIDBytes = Array.from(new TextEncoder().encode(ipfsCID));

  const payload = {
    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::mint_token`,
    functionArguments: [patientAddress, recordTypeBytes, documentHashBytes, ipfsCIDBytes],
  };

  const response = await signAndSubmitTransaction(payload);
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

  // Aptos SDK returns vector<u8> as a Hex String (e.g. "0x68656c6c6f")
  const [recordTypeHex, documentHashHex, ipfsCIDHex, isConsumed, issuer, timestamp] = result as any[];

  return {
    // Fix: Parse the Hex String -> Uint8Array -> Text
    recordType: new TextDecoder().decode(fromHexString(recordTypeHex)),
    // documentHash is already a hex string from the chain, just strip 0x if needed
    documentHash: documentHashHex.startsWith('0x') ? documentHashHex.slice(2) : documentHashHex,
    ipfsCID: new TextDecoder().decode(fromHexString(ipfsCIDHex)),
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
  const payload = {
    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::consume_token`,
    functionArguments: [issuerAddress, tokenId],
  };

  const response = await signAndSubmitTransaction(payload);
  await aptos.waitForTransaction({ transactionHash: response.hash });
  
  return response.hash;
}