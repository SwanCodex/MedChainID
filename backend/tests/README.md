# MedChainID Test Suite

This directory contains automated tests for the MedChainID application.

## Test Structure

- `api.upload.test.js` - Jest tests for backend API endpoints
- `playwright.e2e.test.js` - Playwright E2E tests for full user flows

## Prerequisites

### Backend Tests (Jest)
```bash
cd backend
npm install --save-dev jest supertest
```

### E2E Tests (Playwright)
```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Running Tests

### Backend API Tests
```bash
cd backend
npm test
# Or with Jest directly:
npx jest tests/api.upload.test.js
```

### E2E Tests
```bash
# Make sure backend and frontend are running:
# Terminal 1: cd backend && npm start
# Terminal 2: cd frontend && npm run dev

# Run Playwright tests:
npx playwright test tests/playwright.e2e.test.js
```

## Test Coverage

### Backend API Tests
- ✅ File encryption before IPFS upload
- ✅ RecordType metadata handling
- ✅ File validation (type, size)
- ✅ Decryption endpoint security
- ✅ Error handling

### E2E Tests
- ✅ Complete Issuer → Patient → Doctor flow
- ✅ Share link generation
- ✅ Zero-knowledge verification
- ✅ URL security (hash fragment vs query params)

## Environment Setup

Create a `.env.test` file in the backend directory:
```env
ENCRYPTION_KEY=1e4ae9d795acdd17cdd68c7d1f03548e7c74df53cb7f27868f10a59879e283c3
PINATA_API_KEY=your_test_key
PINATA_SECRET_API_KEY=your_test_secret
ML_SERVICE_URL=http://127.0.0.1:5001
```

## Mocking

The tests use mocks for:
- IPFS uploads (to avoid actual Pinata API calls)
- ML service (to avoid dependency on ML service)
- Blockchain transactions (for unit tests)

## Notes

- Wallet connection in E2E tests requires manual setup or test wallet configuration
- Some tests require actual blockchain interaction (marked with ⚠️)
- IPFS tests use mocks to avoid external dependencies

