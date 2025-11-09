# MedChainID

**Privacy-First, One-Time-Use Digital Token System for Critical Medical Records on Aptos**

A blockchain-based approach to medical record verification that separates **immutable proofs** (on-chain) from **sensitive data** (off-chain encrypted). Hospitals issue tokens; verifiers validate authenticity without accessing PII.

## 🎯 Technical Approach

### Core Design Principle
```
On-Chain:   Immutable hash + issuer + status → Aptos blockchain
Off-Chain:  Encrypted document + minimal metadata → IPFS/S3
Result:     Authentic verification without revealing sensitive data
```

### Key Innovations

1. **Privacy-First Token Model**
   - Only SHA-256 hash of encrypted document stored on-chain
   - Full ciphertext remains off-chain (IPFS/S3)
   - No PII ever exposed on blockchain

2. **One-Time-Use Mechanism**
   - Token state: `Active` → `Consumed` (irreversible on-chain)
   - Nonce in QR code prevents replay attacks
   - Expiry timestamp enforced at verification

3. **Decoupled Issuance & Verification**
   - Issuers sign token creation (Move transaction)
   - Verifiers perform read-only on-chain checks
   - No centralized database required for trust

## 🏗️ Architecture Overview

### Technology Stack

| Layer | Components | Why |
|-------|-----------|-----|
| **Blockchain** | Aptos Move + Devnet/Testnet | Low-cost txs; stateful proofs; no consensus delays for verification |
| **Frontend** | React/Next.js + Petra/Martian wallet | User-friendly issuance & verification; wallet integration for signatures |
| **Backend** | Node.js/Express | File handling, encryption orchestration, KMS proxy |
| **Storage** | IPFS (Pinata) + AWS S3 (optional) | Distributed encrypted storage; content-addressed deduplication |
| **Database** | Postgres | Metadata (CID ↔ tokenID), issuer registry, audit trail |
| **Crypto** | AES-256-GCM + libsodium | Client-side encryption; no plaintext docs at rest |
| **Key Management** | AWS KMS / HSM | Issuer keys never on disk; key rotation policies |

### System Flow (Simplified)

```
ISSUANCE:
  Hospital encrypts doc → uploads to IPFS → backend stores CID
  → calls Move: mint_token(hash, issuer, expiry)
  → on-chain token created + QR generated

VERIFICATION:
  Verifier scans QR → calls Move: verify_token_status(tokenID)
  → on-chain proof checked (hash, status, expiry)
  → optional: fetch encrypted doc from IPFS, decrypt locally

CONSUMPTION:
  Authorized actor → calls Move: consume_token(tokenID)
  → on-chain state: Active → Consumed (immutable)

REVOCATION:
  Issuer detects fraud → Move: revoke_token(tokenID)
  → status: Active → Revoked + off-chain doc deleted
```

### Move Module Functions

```move
// Core contract: medchainid.move
mint_token(doc_hash, record_type, issuer, expiry) -> token_id
verify_token_status(token_id) -> (hash, issuer, status, expiry)
consume_token(token_id) -> bool
revoke_token(token_id) -> bool
audit_log(start, end) -> Vec<TokenEvent>
```

All state transitions emit immutable on-chain events.

## 🔒 Security & Privacy

**Privacy Zones**:
- **On-Chain**: Only SHA-256 hash + issuer address + status (immutable proof)
- **Off-Chain**: Encrypted documents + metadata (AES-256-GCM, Pinata/S3)

**Key Mitigations**:
| Threat | Solution |
|--------|----------|
| Replay attacks | Nonce in QR + timestamp validation |
| Compromised issuer key | Multi-sig revocation + emergency key rotation |
| Unauthorized access | Signature verification + ACL checks + encryption at rest |
| MitM | TLS 1.3 + certificate pinning |
| Token forging | All mints signed by authorized issuer on-chain |

**Compliance**: GDPR (right-to-erasure via revocation), HIPAA (immutable audit trail, encryption)

## 🔄 Token Lifecycle

```
Active (hospital issued) 
  ↓ read-only
Verified (on-chain hash validated)
  ↓ authorized actor
Consumed (irreversible, prevents re-use)
  ↓ or admin action
Revoked (status → Revoked, off-chain doc deleted)
  ↓ cleanup
Archived (hash remains for audit; plaintext destroyed)
```

**State Guards**:
- `consume_token`: requires status=Active + caller authorized + not expired
- `revoke_token`: may require multi-sig for sensitive records

## 🚀 Quick Start

```bash
# Prerequisites: Node.js v18+, Rust, Docker, Aptos CLI

git clone https://github.com/yourusername/MedChainID.git
cd MedChainID
npm install

# Compile & deploy Move module
cd move && aptos move compile
aptos move publish --network devnet

# Start backend
cd ../backend && npm run dev

# Start frontend
cd ../frontend && npm start
```

**Issue a token**:
```bash
curl -X POST http://localhost:3000/api/token/mint \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"doc_hash":"0x1234...","record_type":"Lab Report","issuer_address":"0x5678...","expiry_days":30}'
```

**Verify a token**:
```bash
curl http://localhost:3000/api/token/verify/token-id
```

## 📚 Docs

- [API Reference](./docs/API.md) — REST endpoints
- [Move Module](./docs/MOVE_MODULE.md) — Smart contract design
- [Security](./docs/SECURITY.md) — Threat model & compliance
- [Deployment](./docs/DEPLOYMENT.md) — Production setup

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Verification latency | < 1 sec (on-chain read, no consensus) |
| Issuance latency | < 5 sec (consensus + DB) |
| Throughput (verify) | 100+ tokens/sec (read-only, scalable) |
| Throughput (mint) | 10–50 tokens/sec (Aptos block rate) |
| Availability | 99.95% (multi-AZ + failover) |

## 📦 Project Structure

```
MedChainID/
├── move/               # Aptos Move smart contracts
│   ├── sources/medchainid.move
│   └── tests/
├── backend/            # Node.js/Express API
│   ├── src/
│   │   ├── services/  (auth, encryption, IPFS, Aptos, KMS, audit)
│   │   ├── routes/    (tokens, issuers, audit endpoints)
│   │   ├── middleware/ (auth, rate-limit, error handling)
│   │   └── db/        (models, migrations)
│   └── tests/
├── frontend/          # React/Next.js
│   ├── src/
│   │   ├── pages/    (admin, verify, audit, wallet)
│   │   ├── components/
│   │   └── services/ (API client, Aptos RPC, encryption)
│   └── tests/
├── docs/              # ARCHITECTURE.md, SECURITY.md, API.md, etc.
├── diagrams/          # SVG + PNG system diagrams
└── .github/workflows/ # CI/CD (tests, Devnet, Testnet, Mainnet deploys)
```

## 🤝 Contributing

1. Fork & create feature branch
2. Ensure tests pass (`npm test`, `aptos move test`)
3. Submit PR with description

**Requirements**:
- TypeScript (backend) + React (frontend) + Move (contracts)
- 80%+ test coverage for Move modules
- ESLint/Prettier compliance

## 📄 License

Apache 2.0 — see [LICENSE](./LICENSE)

**Disclaimer**: Use in healthcare requires professional security & compliance review. Authors not liable for breaches.

---

**Last Updated**: November 9, 2025 | **Version**: 1.0.0 | **Status**: MVP Phase

> **MedChainID**: Privacy-first proofs on-chain, encrypted data off-chain. Healthcare innovation on Aptos. 🏥⛓️🔐
