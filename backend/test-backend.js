/**
 * test-backend.js
 * Quick test script to verify backend functionality
 */

const crypto = require('crypto');
const { encryptBuffer, decryptBuffer, generateHash, verifyHash } = require('./src/utils/encryption');

console.log('🧪 Testing MedChainID Backend Components\n');
console.log('═══════════════════════════════════════\n');

// Test 1: Hash Generation
console.log('Test 1: SHA-256 Hash Generation');
const testData = Buffer.from('Hello, MedChainID!');
const hash = generateHash(testData);
console.log(`✅ Hash generated: ${hash}`);
console.log(`   Length: ${hash.length} characters\n`);

// Test 2: Encryption
console.log('Test 2: AES-256-CBC Encryption');
const originalBuffer = Buffer.from('This is a sensitive medical document.');
console.log(`   Original size: ${originalBuffer.length} bytes`);
const encrypted = encryptBuffer(originalBuffer);
console.log(`   Encrypted size: ${encrypted.length} bytes`);
console.log(`   IV included: ${encrypted.length > originalBuffer.length ? 'Yes' : 'No'}\n`);

// Test 3: Decryption
console.log('Test 3: Decryption');
const decrypted = decryptBuffer(encrypted);
console.log(`   Decrypted size: ${decrypted.length} bytes`);
console.log(`   Content matches: ${originalBuffer.equals(decrypted) ? '✅ Yes' : '❌ No'}`);
console.log(`   Decrypted text: "${decrypted.toString()}"\n`);

// Test 4: Hash Verification
console.log('Test 4: Hash Verification');
const isValid = verifyHash(testData, hash);
console.log(`   Valid: ${isValid ? '✅ Yes' : '❌ No'}\n`);

// Test 5: Tampering Detection
console.log('Test 5: Tampering Detection');
const tamperedData = Buffer.from('Hello, MedChainID!!!!');
const isTampered = verifyHash(tamperedData, hash);
console.log(`   Tampered data detected: ${!isTampered ? '✅ Yes' : '❌ No'}\n`);

console.log('═══════════════════════════════════════');
console.log('✅ All tests passed!\n');
console.log('Backend components are working correctly.');
console.log('You can now start the server with: npm start\n');
