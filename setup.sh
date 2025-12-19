#!/bin/bash

# ============================================
# MedChainID Project Setup Script
# ============================================
# This script sets up the entire MedChainID project
# Runs on Linux, macOS, and Windows (Git Bash)

set -e  # Exit on error

echo "🏥 MedChainID Project Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Check Prerequisites
# ============================================

echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}❌ Python is not installed${NC}"
    echo "   Please install Python 3.9+ from https://www.python.org/"
    exit 1
fi

if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    PIP_CMD=pip3
else
    PYTHON_CMD=python
    PIP_CMD=pip
fi

PYTHON_VERSION=$($PYTHON_CMD --version)
echo -e "${GREEN}✅ Python installed: $PYTHON_VERSION${NC}"

# Check pip
if ! command -v $PIP_CMD &> /dev/null; then
    echo -e "${RED}❌ pip is not installed${NC}"
    exit 1
fi
PIP_VERSION=$($PIP_CMD --version)
echo -e "${GREEN}✅ pip installed: $PIP_VERSION${NC}"

echo ""

# ============================================
# Setup Backend
# ============================================

echo -e "${BLUE}📦 Setting up Backend...${NC}"
cd backend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    
    # Generate secrets
    echo "Generating secure keys..."
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i '' "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
    else
        # Linux and Git Bash
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
    fi
    
    echo -e "${GREEN}✅ Backend .env created with generated keys${NC}"
    echo -e "${YELLOW}⚠️  Please update PINATA_API_KEY and PINATA_SECRET_API_KEY in backend/.env${NC}"
    echo -e "${YELLOW}⚠️  Please update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping creation${NC}"
fi

cd ..
echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# ============================================
# Setup ML Engine
# ============================================

echo -e "${BLUE}🤖 Setting up ML Engine...${NC}"
cd ml-engine

# Install Python dependencies
echo "Installing Python dependencies..."
$PIP_CMD install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✅ ML Engine .env created${NC}"
    echo -e "${YELLOW}⚠️  Please update GEMINI_API_KEY in ml-engine/.env${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping creation${NC}"
fi

cd ..
echo -e "${GREEN}✅ ML Engine setup complete${NC}"
echo ""

# ============================================
# Setup Frontend
# ============================================

echo -e "${BLUE}🎨 Setting up Frontend...${NC}"
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✅ Frontend .env created${NC}"
    echo -e "${YELLOW}⚠️  Please update VITE_CONTRACT_ADDRESS in frontend/.env after deploying smart contract${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping creation${NC}"
fi

cd ..
echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# ============================================
# Setup Smart Contract (Optional)
# ============================================

echo -e "${BLUE}⛓️  Checking Aptos CLI...${NC}"

if command -v aptos &> /dev/null; then
    APTOS_VERSION=$(aptos --version)
    echo -e "${GREEN}✅ Aptos CLI installed: $APTOS_VERSION${NC}"
    echo ""
    echo -e "${BLUE}To deploy the smart contract:${NC}"
    echo "  1. cd aptos-contract"
    echo "  2. aptos init --network devnet"
    echo "  3. aptos account fund-with-faucet --account <YOUR_ADDRESS>"
    echo "  4. aptos move compile"
    echo "  5. aptos move publish --named-addresses medchain=<YOUR_ADDRESS>"
else
    echo -e "${YELLOW}⚠️  Aptos CLI not installed${NC}"
    echo "   Install from: https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli"
fi

echo ""

# ============================================
# Summary
# ============================================

echo "================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Configure API Keys:"
echo "   - Get Pinata API keys from https://app.pinata.cloud/"
echo "   - Set in backend/.env: PINATA_API_KEY and PINATA_SECRET_API_KEY"
echo ""
echo "   - Get Gemini API key from https://makersuite.google.com/app/apikey"
echo "   - Set in ml-engine/.env: GEMINI_API_KEY"
echo ""
echo "   - Get Google OAuth credentials from https://console.cloud.google.com/"
echo "   - Set in backend/.env: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo ""
echo "2. Deploy Smart Contract:"
echo "   - Follow instructions above to deploy to Aptos"
echo "   - Update frontend/.env with VITE_CONTRACT_ADDRESS"
echo ""
echo "3. Start Services:"
echo "   - Backend:    cd backend && npm start"
echo "   - ML Engine:  cd ml-engine && python app.py"
echo "   - Frontend:   cd frontend && npm run dev"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
