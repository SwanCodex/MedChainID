# 🏥 MedChainID: Decentralized Medical Asset Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Aptos](https://img.shields.io/badge/Blockchain-Aptos-blue)](https://aptoslabs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)

**MedChainID** is a decentralized, AI-verified medical asset vault that allows patients to truly own their medical records as blockchain tokens on Aptos. The system combines blockchain immutability, AI verification, and zero-knowledge encryption to solve data silos, trust issues, and privacy risks in medical record management.

## 🌟 Core Value Proposition

- **✅ True Ownership**: Medical records are minted as tokens on Aptos blockchain, owned by patients (not hospitals)
- **🤖 AI-Verified Authenticity**: Gemini AI verifies documents before they are ever stored, preventing fake records
- **🔐 Zero-Knowledge Privacy**: Records are encrypted before IPFS storage; only key holders can decrypt
- **🛡️ Anti-Fraud Protection**: Tokens can be marked as "consumed" to prevent insurance double-claiming

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ROLES                              │
│  [Hospital Admin] ────────────────────── [Patient]              │
│         │                                    │                   │
│         ▼                                    ▼                   │
│  ┌─────────────────┐              ┌──────────────────┐          │
│  │ Issuer Dashboard│              │Patient Dashboard │          │
│  └─────────────────┘              └──────────────────┘          │
│         │                                    │                   │
│         └──────────────┬─────────────────────┘                  │
│                        │                                         │
│                        ▼                                         │
│              ┌──────────────────┐                               │
│              │  React Frontend  │◄─────── [Verifier Role]       │
│              │  (TypeScript)    │                               │
│              └──────────────────┘                               │
│                        │                                         │
│         ┌──────────────┼──────────────┐                         │
│         │              │              │                         │
│         ▼              ▼              ▼                         │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐               │
│  │  Aptos    │  │  Backend  │  │   Google     │               │
│  │Blockchain │  │   API     │  │   OAuth      │               │
│  │  (Move)   │  │ (Express) │  │              │               │
│  └───────────┘  └───────────┘  └──────────────┘               │
│                        │                                         │
│         ┌──────────────┼──────────────┐                         │
│         │              │              │                         │
│         ▼              ▼              ▼                         │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐               │
│  │   IPFS    │  │ ML Engine │  │  Encryption  │               │
│  │ (Pinata)  │  │  (Gemini) │  │  (AES-256)   │               │
│  └───────────┘  └───────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Repository Structure

```
SSAY/
├── aptos-contract/          # Aptos Move smart contract
│   ├── sources/
│   │   └── MedChainID.move  # Token minting & lifecycle management
│   └── Move.toml
│
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── server.js        # Main API server
│   │   ├── auth.js          # Google OAuth configuration
│   │   ├── authRoutes.js    # Authentication endpoints
│   │   └── utils/
│   │       ├── encryption.js # AES-256-CBC encryption
│   │       └── ipfs.js       # Pinata IPFS integration
│   └── package.json
│
├── ml-engine/               # Python Flask AI service
│   ├── app.py               # Flask server
│   ├── model.py             # Gemini AI verification
│   └── requirements.txt
│
└── frontend/                # React TypeScript app
    ├── src/
    │   ├── App.tsx
    │   ├── pages/
    │   │   ├── IssueRecordPage.tsx
    │   │   ├── PatientDashboard.tsx
    │   │   └── Verifier.tsx
    │   ├── services/
    │   │   ├── api.ts       # Backend API client
    │   │   └── aptos.ts     # Blockchain interaction
    │   └── contexts/
    │       └── AuthContext.tsx
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/))
- **Aptos CLI** ([Installation Guide](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli))
- **Petra Wallet** ([Chrome Extension](https://petra.app/))

### 1. Clone the Repository

```bash
git clone https://github.com/Aditya-Patil27/SSAY.git
cd SSAY
```

### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file from example
cp .env.example .env

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and set ENCRYPTION_KEY in .env

# Get Pinata API keys from https://app.pinata.cloud/
# Set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env

# Start backend server
npm start
```

Backend will run on `http://localhost:5000`

### 3. Setup ML Engine

```bash
cd ml-engine
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Get Gemini API key from https://makersuite.google.com/app/apikey
# Set GEMINI_API_KEY in .env

# Start ML service
python app.py
```

ML Engine will run on `http://localhost:5001`

### 4. Setup Frontend

```bash
cd frontend
npm install

# Create .env file from example
cp .env.example .env

# Set your deployed contract address in .env
# VITE_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 5. Deploy Smart Contract

```bash
cd aptos-contract

# Initialize Aptos account
aptos init --network devnet

# Fund account (devnet only)
aptos account fund-with-faucet --account <YOUR_ADDRESS>

# Compile contract
aptos move compile

# Deploy contract
aptos move publish --named-addresses medchain=<YOUR_ADDRESS>

# Copy the deployed contract address to frontend/.env
```

## 📖 Component Documentation

- **[Backend API Documentation](./backend/README.md)** - API endpoints, encryption, IPFS uploads
- **[Smart Contract Documentation](./aptos-contract/README.md)** - Move contract, token lifecycle, blockchain interaction
- **[ML Engine Documentation](./ml-engine/README.md)** - AI verification, fraud detection
- **[Frontend Documentation](./frontend/README.md)** - React components, wallet integration, user flows

## 🔑 Key Features

### 1. Document Upload & Encryption
- Upload PDF or image medical records
- Automatic AES-256-CBC encryption before storage
- SHA-256 hash generation for blockchain verification
- IPFS upload via Pinata for decentralized storage

### 2. AI Fraud Detection
- Gemini AI analyzes document content
- Detects inconsistencies and potential fraud
- Risk scoring and confidence metrics
- Automatic fallback if ML service unavailable

### 3. Blockchain Token Minting
- Medical records minted as tokens on Aptos
- Immutable ownership by patient wallet
- Token metadata includes document hash, IPFS CID, issuer info
- Token lifecycle management (mint, verify, consume)

### 4. Zero-Knowledge Verification
- Verifiers can validate without seeing document
- Encryption key required for viewing
- Shareable verification links with embedded keys
- No central authority controls access

### 5. Anti-Fraud Token Consumption
- Tokens can be marked as "consumed" (e.g., after insurance claim)
- Prevents double-claiming and fraud
- Only patient wallet can consume tokens
- Irreversible consumption for audit trail

## 🔐 Security Features

- **Encryption**: AES-256-CBC with random IVs per file
- **Hash Verification**: SHA-256 document hashing for tamper detection
- **Access Control**: Only key holders can decrypt files
- **Session Security**: HTTP-only cookies, secure sessions in production
- **Input Validation**: File type restrictions, size limits
- **CORS Protection**: Configured origins for API access
- **No Plaintext Storage**: Files only stored encrypted on IPFS

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:e2e         # End-to-end tests
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Smart Contract Tests

```bash
cd aptos-contract
aptos move test
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload & encrypt document |
| POST | `/api/verify` | Verify document hash |
| GET | `/api/download/:cid` | Download encrypted file |
| POST | `/api/decrypt-view` | Decrypt & view document |
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/status` | Check auth status |
| POST | `/api/auth/logout` | Logout user |

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Blockchain** | Aptos (Move) | Immutable ownership registry |
| **Frontend** | React + TypeScript + Vite | User interface |
| **Backend** | Node.js + Express | API gateway, encryption |
| **AI** | Python + Flask + Gemini | Document verification |
| **Storage** | IPFS (Pinata) | Decentralized file storage |
| **Auth** | Google OAuth + JWT | Identity verification |
| **Wallet** | Petra Wallet | Blockchain transactions |
| **Styling** | Tailwind CSS | UI design |

## 🌐 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
ENCRYPTION_KEY=64_hex_characters
ML_SERVICE_URL=http://localhost:5001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APTOS_NETWORK=devnet
VITE_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

### ML Engine (.env)
```env
PORT=5001
GEMINI_API_KEY=your_gemini_api_key
DEBUG=True
```

## 📝 User Flows

### Hospital Issuer Flow
1. Login with Google OAuth
2. Upload medical record (PDF/image)
3. AI verification runs automatically
4. File encrypted with AES-256
5. Encrypted file uploaded to IPFS
6. Connect Petra wallet
7. Mint token on Aptos blockchain
8. Patient receives token at their wallet address

### Patient Flow
1. Connect Petra wallet
2. View all medical tokens on blockchain
3. Filter tokens by issuer or record type
4. Click to decrypt and view document
5. Share verification link with verifiers
6. Consume token if needed (e.g., insurance claim)

### Verifier Flow
1. Receive verification link from patient
2. Link contains IPFS CID + encryption key (in URL hash)
3. Click "View Document" to decrypt
4. Verify document authenticity
5. Check blockchain for token consumption status

## 🚧 Known Limitations & Future Improvements

### Current Limitations
- Backend handles encryption (should be client-side for true zero-knowledge)
- Single encryption key for all files (should be per-file keys)
- No key rotation mechanism
- Limited to devnet (not production-ready)
- ML service is synchronous (should be async/queue-based)

### Planned Improvements
- Client-side encryption with patient-controlled keys
- Key management system with rotation
- Multi-signature support for sensitive operations
- Indexer service for faster blockchain queries
- Mobile app with biometric authentication
- Support for multiple blockchains (Ethereum, Solana)
- Advanced AI models with medical domain expertise
- Compliance certifications (HIPAA, GDPR)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Aditya Patil** - [GitHub](https://github.com/Aditya-Patil27)

## 🙏 Acknowledgments

- [Aptos Labs](https://aptoslabs.com/) - Blockchain infrastructure
- [Pinata](https://pinata.cloud/) - IPFS pinning service
- [Google AI](https://ai.google.dev/) - Gemini AI API
- [Petra Wallet](https://petra.app/) - Aptos wallet

## 📞 Support

For support, please:
- Open an issue on [GitHub](https://github.com/Aditya-Patil27/SSAY/issues)
- Contact: [Your Email]

## 🔗 Links

- [Live Demo](https://your-demo-url.com)
- [Documentation](https://your-docs-url.com)
- [Video Demo](https://your-video-url.com)

---

**Built with ❤️ for hackathon by Team SSAY**
