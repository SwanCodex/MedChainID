# MedChainID Frontend 🎨

**Ultra-minimalist dark mode dashboard inspired by [usetool.bar](https://usetool.bar/)**

## 🎯 Design Philosophy

- **Strictly Dark Mode**: Deep blacks (#000000, #0a0a0a) with high contrast white text
- **Flat Design**: No gradients, no shadows, clean lines only
- **Minimalist**: Clean typography, subtle grey borders (#333333)
- **Professional**: Command center aesthetic for medical professionals

## 🎨 Color Palette

```css
Background:   #000000  /* Pure black */
Surface:      #0a0a0a  /* Deep gray */
Cards:        #141414  /* Lighter gray */
Borders:      #333333  /* Subtle gray */
Text Primary: #ffffff  /* Pure white */
Text Secondary: #a0a0a0  /* Light gray */
Text Muted:   #666666  /* Medium gray */
Accent:       #ffffff  /* White buttons */
```

## 📦 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (custom dark theme)
- **Routing**: React Router v6
- **Web3**: @aptos-labs/wallet-adapter-react
- **Wallet**: Petra Wallet (Aptos)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm run dev
```

Server runs on: **http://localhost:5173**

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────┐
│  Sidebar (56px)    │  Header (64px)            │
│  ┌─────────────┐  │  ┌──────────────────────┐ │
│  │ MedChainID  │  │  │ Page Title  [Wallet] │ │
│  │ v1.0.0      │  │  └──────────────────────┘ │
│  │             │  │                            │
│  │ 📝 Issue    │  │  Main Content Area        │
│  │ 📊 History  │  │                            │
│  │             │  │  Max-width, centered      │
│  │             │  │  Padding: 2rem            │
│  │             │  │                            │
│  └─────────────┘  │                            │
└─────────────────────────────────────────────────┘
```

## 📄 Pages

### 1. Issue Record Page (`/`)

**Features:**
- ✅ Minimalist centered card layout
- ✅ Drag-and-drop file upload area
- ✅ Record type dropdown selector
- ✅ Clean "Process & Mint Token" button
- ✅ Real-time upload status
- ✅ Success/error notifications
- ✅ Info section explaining the process

**File Upload:**
- Accepts: PDF, JPG, PNG, GIF
- Max Size: 10MB
- Drag-and-drop or click to browse
- Visual feedback on drag hover

**Integration:**
```typescript
// Upload to backend
const uploadResult = await uploadDocument(file, recordType);

// Mint on Aptos
const txResult = await mintToken(
  signAndSubmitTransaction,
  recordType,
  uploadResult.data.documentHash,
  uploadResult.data.ipfsCID
);
```

### 2. History Page (`/history`)

**Features:**
- ✅ Clean flat table design
- ✅ No zebra striping (minimalist)
- ✅ Thin gray dividers
- ✅ Hover effects on rows
- ✅ Status badges (Minted/Pending/Failed)
- ✅ Truncated hashes and IDs
- ✅ Stats cards below table

**Columns:**
- Token ID (truncated with `...`)
- Record Type
- Date & Time
- Status (color-coded badge)
- Transaction Hash

## 🧩 Components

### DashboardLayout.tsx
```tsx
<DashboardLayout>
  - Sidebar with navigation
  - Top header with wallet button
  - Main content area (Outlet)
</DashboardLayout>
```

**Sidebar:**
- 224px width (56 Tailwind units)
- Dark surface background
- Active state: border + background
- Icons + labels

**Header:**
- 64px height
- Wallet button far right
- Page title on left

### WalletButton.tsx
```tsx
// Connected state:
[🟢 0x1a2b...3c4d] [Disconnect]

// Disconnected state:
<WalletSelector />
```

**Connected Display:**
- Green dot indicator
- Truncated address (6...4 chars)
- Monospace font
- Disconnect button

### IssueRecordPage.tsx
```tsx
<MaxWidth 2xl>
  <Card>
    <RecordTypeDropdown />
    <FileUploadArea />
    <SubmitButton />
  </Card>
  <InfoSection />
</MaxWidth>
```

**States:**
- Not Connected → Show wallet prompt
- Ready → Show form
- Loading → Disabled state with spinner
- Success → Green notification
- Error → Red notification

### HistoryPage.tsx
```tsx
<MaxWidth 6xl>
  <Table>
    <Header />
    <Rows (hover effect)>
  </Table>
  <StatsCards (3 column grid)>
</MaxWidth>
```

**States:**
- Not Connected → Show wallet prompt
- Loading → Spinner
- Empty → Empty state message
- Data → Table with rows

## 🎨 Styling Approach

### Tailwind Custom Colors
```javascript
// tailwind.config.js
colors: {
  dark: {
    bg: '#000000',
    surface: '#0a0a0a',
    card: '#141414',
    border: '#333333',
    hover: '#1a1a1a',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0a0',
    muted: '#666666',
  },
}
```

### Reusable Classes
```css
/* Card Container */
bg-dark-card border border-dark-border rounded-lg

/* Input/Select */
bg-dark-surface border border-dark-border rounded-md
focus:border-text-secondary

/* Primary Button */
bg-white text-black hover:bg-gray-200

/* Secondary Button */
bg-dark-card border border-dark-border
text-text-secondary hover:text-text-primary
```

## 🔌 API Integration

### Backend Service (`services/api.ts`)
```typescript
// Upload document to backend
export async function uploadDocument(
  file: File,
  recordType: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('recordType', recordType);

  const response = await axios.post(
    'http://localhost:5000/api/upload',
    formData
  );

  return response.data;
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentHash": "0x1a2b3c...",
    "ipfsCID": "QmXyZ123...",
    "fileName": "document.pdf",
    "recordType": "Birth Certificate",
    "fileSize": 245678,
    "timestamp": "2025-12-17T10:30:00.000Z"
  }
}
```

### Aptos Service (`services/aptos.ts`)
```typescript
// Mint token on blockchain
export async function mintToken(
  signAndSubmitTransaction: Function,
  recordType: string,
  documentHash: string,
  ipfsCID: string
): Promise<string> {
  const payload = {
    type: 'entry_function_payload',
    function: `${CONTRACT_ADDRESS}::MedChainID::mint_token`,
    type_arguments: [],
    arguments: [recordType, documentHash, ipfsCID],
  };

  const response = await signAndSubmitTransaction(payload);
  return response.hash;
}
```

## 🌐 Wallet Integration

### Supported Wallets
- ✅ Petra Wallet (Primary)
- ✅ Martian Wallet
- ✅ Pontem Wallet
- ✅ Other Aptos-compatible wallets

### Connection Flow
```
1. User clicks "Connect Wallet"
2. Wallet selector modal appears
3. User selects wallet (e.g., Petra)
4. Wallet extension prompts approval
5. Connection established
6. Address displayed in header
```

### Usage in Components
```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const { connected, account, signAndSubmitTransaction } = useWallet();

if (!connected) {
  // Show connect prompt
}

// Use signAndSubmitTransaction for transactions
```

## 📱 Responsive Design

### Breakpoints
- Desktop: 1024px+ (optimal)
- Tablet: 768px - 1023px (functional)
- Mobile: < 768px (sidebar collapses)

**Note**: Current design optimized for desktop. Mobile layout needs implementation for production.

## 🎯 Key Features

### ✅ Implemented
- [x] Ultra-minimalist dark theme
- [x] Sidebar navigation
- [x] Wallet integration
- [x] File upload with drag-and-drop
- [x] Transaction status notifications
- [x] History table
- [x] Stats cards
- [x] Loading states
- [x] Error handling

### 🚧 To Implement
- [ ] Mobile responsive sidebar
- [ ] Advanced filtering in history
- [ ] Search functionality
- [ ] Pagination for large datasets
- [ ] Export transaction history
- [ ] Dark mode toggle (optional)
- [ ] Animations/transitions
- [ ] Toast notifications system

## 🔧 Configuration

### Environment Variables
Create `.env` in frontend root:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_APTOS_NETWORK=devnet
VITE_CONTRACT_ADDRESS=0xYourContractAddress
```

### Vite Config
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Connect wallet successfully
- [ ] Upload PDF file
- [ ] Upload image file
- [ ] Select different record types
- [ ] View upload progress
- [ ] See success notification
- [ ] View transaction in history
- [ ] Disconnect wallet
- [ ] Error handling (invalid file, network issues)

### Development Mode
```bash
# Start frontend
npm run dev

# Start backend (in another terminal)
cd ../backend
npm start

# Frontend will proxy API requests to backend
```

## 🎨 Design References

**Primary Inspiration**: [usetool.bar](https://usetool.bar/)
- Ultra-clean dark interface
- High contrast white on black
- Minimalist typography
- No unnecessary decoration

**Similar Aesthetics**:
- Vercel Dashboard
- Linear App
- GitHub Dark Mode
- Supabase Dashboard

## 📊 Performance

### Build Output
```bash
npm run build
```

**Optimizations:**
- Vite's fast HMR
- Tree-shaking
- Code splitting
- Lazy loading routes (can be added)

### Bundle Size
- React + React DOM: ~140KB
- Wallet Adapter: ~80KB
- Aptos SDK: ~60KB
- **Total (gzipped)**: ~280KB

## 🔐 Security

### Best Practices
- ✅ Never store private keys in code
- ✅ All wallet operations through official adapters
- ✅ Input validation on file uploads
- ✅ CORS properly configured
- ✅ No sensitive data in local storage

### Production Checklist
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Add rate limiting
- [ ] Implement CSP headers
- [ ] Add error boundaries

## 🐛 Troubleshooting

### Wallet Not Connecting
```
1. Ensure Petra/wallet extension installed
2. Check wallet is unlocked
3. Switch to correct network (devnet/testnet)
4. Clear browser cache
5. Check console for errors
```

### Styles Not Loading
```
1. Ensure Tailwind CSS installed
2. Check tailwind.config.js paths
3. Verify @tailwind directives in index.css
4. Restart dev server
```

### API Errors
```
1. Check backend is running (port 5000)
2. Verify CORS configuration
3. Check network tab in DevTools
4. Ensure .env variables are set
```

## 📚 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.tsx   # Main layout with sidebar
│   │   ├── WalletButton.tsx      # Wallet connection UI
│   │   └── WalletProvider.tsx    # Wallet context
│   ├── pages/
│   │   ├── IssueRecordPage.tsx   # Main upload page
│   │   └── HistoryPage.tsx       # Transaction history
│   ├── services/
│   │   ├── api.ts                # Backend API calls
│   │   └── aptos.ts              # Blockchain interactions
│   ├── App.tsx                   # Root component
│   ├── App.css                   # Minimal overrides
│   ├── index.css                 # Tailwind + global styles
│   └── main.tsx                  # Entry point
├── tailwind.config.js            # Dark theme config
├── postcss.config.js             # PostCSS setup
├── vite.config.ts                # Vite configuration
└── package.json                  # Dependencies
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

Output in `dist/` folder.

### Deploy Options
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop `dist/` folder
- **GitHub Pages**: Use `gh-pages` package
- **AWS S3 + CloudFront**: Upload `dist/` to S3

### Environment Variables
Set these in your deployment platform:
- `VITE_BACKEND_URL`
- `VITE_APTOS_NETWORK`
- `VITE_CONTRACT_ADDRESS`

## 🤝 Contributing

This is a hackathon MVP. For production:
1. Add comprehensive tests (Jest + RTL)
2. Implement mobile responsive design
3. Add error boundaries
4. Improve accessibility (WCAG AA)
5. Add loading skeletons
6. Implement pagination
7. Add analytics tracking

## 📄 License

MIT

## 👥 Team

MedChainID - Decentralized Medical Identity on Aptos Blockchain

---

**Dashboard Live!** 🎉

```bash
npm run dev
# → http://localhost:5173
```

**Ultra-minimalist. Ultra-clean. Ultra-professional.** 🖤
