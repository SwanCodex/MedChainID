# 🏥 MedChainID

**Decentralized Medical Record Verification on Aptos Blockchain**

MedChainID is a privacy-first, tamper-resistant system for issuing and verifying one-time-use medical records. Built for the healthcare ecosystem to prevent fraud, ensure data integrity, and maintain patient privacy.

---

## 🎯 Core Innovation

**Separation of Data & Proof**
- **Sensitive Data**: Encrypted and stored off-chain (IPFS)
- **Cryptographic Proof**: Only document hashes stored on-chain (Aptos)
- **One-Time-Use**: Tokens can be "consumed" to prevent double-claim fraud

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      USER INTERFACE                       │
│              React + TypeScript + Vite                    │
│         (Petra Wallet Integration)                        │
└────────────┬─────────────────────────────┬───────────────┘
             │                             │
             ▼                             ▼
┌────────────────────────┐   ┌─────────────────────────────┐
│   Backend (Node.js)    │   │   Aptos Blockchain (Move)   │
│   - File Upload        │   │   - Token Registry          │
│   - SHA-256 Hashing    │   │   - Mint Function           │
│   - AES-256 Encryption │   │   - Consume Function        │
│   - IPFS Pinning       │   │   - Verify Function         │
└────────┬───────────────┘   └─────────────────────────────┘
         │
         ▼
┌────────────────────────┐   ┌─────────────────────────────┐
│   IPFS (Pinata)        │   │   ML Engine (Python)        │
│   - Encrypted Storage  │   │   - Anomaly Detection       │
│   - Content Delivery   │   │   - Fraud Analysis          │
└────────────────────────┘   └─────────────────────────────┘
```

---

## 📁 Project Structure

```
MedChainID/
│
├── aptos-contract/              # 📦 WEB3: Smart Contracts
│   ├── Move.toml                # Package configuration
│   └── sources/
│       └── MedChainID.move      # Core smart contract logic
│
├── backend/                     # 🔒 BACKEND: Security & IPFS
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js            # Express API server
│       ├── encryption.js        # AES-256 encryption
│       └── ipfs.js              # Pinata integration
│
├── frontend/                    # 💻 CLIENT: UI & Wallet
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── src/
│       ├── App.tsx              # Main application
│       ├── components/          # Reusable components
│       │   ├── WalletProvider.tsx
│       │   └── WalletButton.tsx
│       ├── pages/               # Route pages
│       │   ├── Dashboard.tsx
│       │   ├── Issuer.tsx
│       │   └── Verifier.tsx
│       └── services/            # API & Blockchain services
│           ├── api.ts
│           └── aptos.ts
│
├── ml-engine/                   # 🤖 ML: Fraud Detection
│   ├── requirements.txt
│   ├── app.py                   # Flask API
│   ├── model.py                 # ML models
│   └── .env.example
│
└── README.md                    # This file
```

---

## 🚀 Quick Start Guide

### Prerequisites

Before starting, ensure you have:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://python.org/))
- **Aptos CLI** ([Installation Guide](https://aptos.dev/tools/install-cli/))
- **Pinata Account** ([Sign Up](https://app.pinata.cloud/))

---

### 1️⃣ Deploy Smart Contract

```bash
cd aptos-contract

# Initialize Aptos account (first time only)
aptos init --network devnet

# Compile the Move contract
aptos move compile

# Run tests
aptos move test

# Deploy to devnet
aptos move publish --named-addresses medchain=<YOUR_ADDRESS>
```

**Save your contract address!** You'll need it for the backend and frontend.

---

### 2️⃣ Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add:
# - PINATA_API_KEY
# - PINATA_SECRET_API_KEY
# - ENCRYPTION_KEY (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

---

### 3️⃣ Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add:
# - VITE_CONTRACT_ADDRESS=<your_contract_address>
# - VITE_APTOS_NETWORK=devnet

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

---

### 4️⃣ Setup ML Engine (Optional)

```bash
cd ml-engine

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Start Flask server
python app.py
```

ML Engine will run on `http://localhost:5001`

---

## 💡 Usage Guide

### For Issuers (Hospitals, Labs, Government)

1. **Connect Wallet**: Click "Connect Wallet" and approve Petra wallet connection
2. **Upload Document**: Select medical document (PDF, image, etc.)
3. **Choose Record Type**: Select from Insurance Claim, Birth Certificate, Medicine Report, or Other
4. **Issue Token**: Click "Issue Token" to:
   - Generate SHA-256 hash
   - Encrypt document with AES-256
   - Upload to IPFS
   - Mint token on Aptos blockchain
5. **Save Token Info**: Store the token ID and issuer address for verification

### For Verifiers (Insurance Companies, Pharmacies)

1. **Enter Token Details**: Input issuer address and token ID
2. **Verify Status**: Click "Verify Token" to check:
   - Token validity (active/consumed)
   - Document hash and IPFS CID
   - Issuer information
   - Timestamp
3. **Consume Token** (if authorized): Click "Consume Token" to mark as used (one-time-use)

---

## 🔐 Security Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **No PII on Chain** | Only hashes stored | Privacy protection |
| **AES-256 Encryption** | Off-chain data encrypted | Data confidentiality |
| **SHA-256 Hashing** | Document integrity proof | Tamper detection |
| **One-Time-Use** | Consume mechanism | Fraud prevention |
| **IPFS Storage** | Decentralized storage | Censorship resistance |
| **Event Logging** | On-chain events | Audit trail |

---

## 🛠️ Technology Stack

**Blockchain Layer**
- Aptos Blockchain (Move Language)
- Petra Wallet Adapter

**Backend Layer**
- Node.js + Express
- Crypto (AES-256, SHA-256)
- Pinata SDK (IPFS)

**Frontend Layer**
- React 18 + TypeScript
- Vite Build Tool
- Aptos TypeScript SDK
- Ant Design Components

**ML Layer (Optional)**
- Python + Flask
- scikit-learn
- NumPy + Pandas

---

## 📊 Use Cases

### 🏥 Insurance Claims
- Issue verifiable claim tokens
- Prevent double-claiming
- Streamline approval process

### 👶 Birth Certificates
- Tamper-proof identity documents
- Easy verification for schools/government
- Lifetime validity tracking

### 💊 Medicine Reports
- Combat counterfeit drugs
- Verify pharmaceutical authenticity
- Track supply chain integrity

---

## 🧪 Testing

### Test Smart Contract
```bash
cd aptos-contract
aptos move test
```

### Test Backend API
```bash
cd backend
npm run dev

# In another terminal
curl http://localhost:5000/api/health
```

### Test Frontend
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

---

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret
ENCRYPTION_KEY=your_32_byte_hex_key
CORS_ORIGIN=http://localhost:5173
APTOS_NETWORK=devnet
APTOS_CONTRACT_ADDRESS=0xYOUR_ADDRESS
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APTOS_NETWORK=devnet
VITE_CONTRACT_ADDRESS=0xYOUR_ADDRESS
```

### ML Engine (.env)
```env
PORT=5001
DEBUG=True
MODEL_VERSION=1.0
ANOMALY_THRESHOLD=0.7
```

---

## 🚧 Known Limitations (MVP)

- **Hardcoded Encryption Key**: Use environment variables only
- **Single Issuer Model**: No multi-sig or role-based access
- **Basic ML Model**: Uses heuristics, not trained models
- **Devnet Only**: Not production-ready for mainnet

---

## 🔮 Future Enhancements

- [ ] Multi-signature issuance for high-value documents
- [ ] Role-based access control (RBAC)
- [ ] Advanced ML models with transfer learning
- [ ] Mobile app with QR scanning
- [ ] Integration with national healthcare systems
- [ ] Zero-knowledge proofs for enhanced privacy
- [ ] Cross-chain compatibility

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Team

Built for [Hackathon Name] by [Your Team]

---

## 📞 Support

- **Issues**: [GitHub Issues](#)
- **Documentation**: [Wiki](#)
- **Community**: [Discord](#)

---

## 🙏 Acknowledgments

- Aptos Foundation for blockchain infrastructure
- Pinata for IPFS hosting
- The open-source community

---

**⚠️ Disclaimer**: This is a hackathon MVP. Do not use in production without proper security audits and compliance reviews.

---