# 🏥 MedChainID - Decentralized Medical Record Verification

> **Tamper-proof, privacy-first medical records on Aptos blockchain with one-time-use verification**

[![Aptos](https://img.shields.io/badge/Aptos-Blockchain-00D4AA?style=for-the-badge)](https://aptoslabs.com/)
[![Move](https://img.shields.io/badge/Move-Smart_Contract-FF5733?style=for-the-badge)](https://move-language.github.io/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)

---

## 🎯 Problem Statement

Healthcare fraud costs **$68 billion annually** in the US alone. Issues include:
- ❌ Document forgery and tampering
- ❌ Double-claiming of insurance benefits
- ❌ Counterfeit medical certificates
- ❌ Privacy breaches with centralized storage

## 💡 Our Solution

**MedChainID** separates **data** from **proof**:
- 🔐 **Encrypted medical records** stored off-chain (IPFS)
- ✅ **Cryptographic hashes** stored on-chain (Aptos)
- 🎫 **One-time-use tokens** prevent fraud
- 🔒 **Zero sensitive data** on blockchain

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
```bash
# Required
node -v    # v18 or higher
python -V  # 3.9 or higher
aptos -V   # Aptos CLI installed

# Get accounts
# 1. Pinata account: https://app.pinata.cloud/
# 2. Aptos wallet: https://petra.app/
```

### 🎬 One-Command Setup

```bash
# Clone repository
git clone https://github.com/SwanCodex/MedChainID.git
cd MedChainID

# Run setup script (automated)
chmod +x setup.sh
./setup.sh
```

### 📦 Manual Setup

#### 1️⃣ Deploy Smart Contract (2 mins)

```bash
cd aptos-contract

# Configure your Aptos account
aptos init --network devnet
# Follow prompts - choose "devnet" and paste your private key from Petra wallet

# Compile and deploy
aptos move compile --named-addresses medchain=default
aptos move publish --named-addresses medchain=default --assume-yes

# ✅ SAVE YOUR CONTRACT ADDRESS - you'll see it in the output!
```

#### 2️⃣ Configure Backend (1 min)

```bash
cd ../backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env:
nano .env
```

**Required .env values:**
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Get from https://app.pinata.cloud/keys
PINATA_JWT=your_jwt_token_here

# Generate encryption key
ENCRYPTION_KEY=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Your deployed contract address
APTOS_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
```

#### 3️⃣ Configure Frontend (1 min)

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env:
nano .env
```

**Required .env values:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APTOS_NETWORK=devnet
VITE_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
```

#### 4️⃣ Setup ML Engine (Optional - 1 min)

```bash
cd ../ml-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start ML server
python app.py
```

#### 5️⃣ Start All Servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - ML Engine (optional)
cd ml-engine && python app.py
```

**🎉 Open http://localhost:5173 in your browser!**

---

## 📱 How to Use

### For Issuers (Hospitals/Labs/Government)

1. **Connect Wallet**
   - Click "Connect Wallet" in top right
   - Approve Petra wallet connection
   - Ensure you're on Aptos Devnet

2. **Issue Medical Token**
   - Go to "Issue Record" page
   - Upload document (PDF/Image)
   - Select record type (Birth Certificate, Insurance Claim, etc.)
   - Click "Issue Token"

3. **Process Flow**
   ```
   Upload → Hash (SHA-256) → Encrypt (AES-256) → Upload to IPFS → Mint on Aptos
   ```

4. **Save Token Details**
   - Token ID: `0`
   - Issuer Address: `0x2ce5...`
   - Transaction Hash: `0x098f...`

### For Verifiers (Insurance/Pharmacies)

1. **Verify Token**
   - Go to "Verify" page
   - Enter Issuer Address + Token ID
   - Click "Verify Token"

2. **Check Details**
   - ✅ Valid/Consumed status
   - 📄 Document hash
   - 🌐 IPFS CID
   - ⏰ Timestamp

3. **Consume Token** (One-Time Use)
   - Click "Consume Token"
   - Approve transaction
   - Token marked as used (prevents reuse)

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