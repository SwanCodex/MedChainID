# MedChainID Frontend - Visual Guide 🎨

## 📸 Dashboard Preview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌────────────────┬───────────────────────────────────────────────────┐│
│  │                │                                                     ││
│  │  MedChainID   │  Issue Record     [🟢 0x1a2b...3c4d] [Disconnect] ││
│  │  Verifiable    │                                                     ││
│  │  Records      ├─────────────────────────────────────────────────────┤│
│  │               │                                                     ││
│  │  📝 Issue     │     ╔════════════════════════════════════════╗    ││
│  │  ┃ Record     │     ║  Issue New Medical Token              ║    ││
│  │  ┃            │     ║  Upload a document, encrypt it, and   ║    ││
│  │               │     ║  mint it as a verifiable token        ║    ││
│  │  📊 History   │     ╠════════════════════════════════════════╣    ││
│  │               │     ║                                        ║    ││
│  │               │     ║  Record Type                           ║    ││
│  │               │     ║  [Birth Certificate           ▼]       ║    ││
│  │               │     ║                                        ║    ││
│  │               │     ║  Document Upload                       ║    ││
│  │               │     ║  ┌────────────────────────────────┐  ║    ││
│  │               │     ║  │         📁                      │  ║    ││
│  │  Powered by   │     ║  │  Drop your file here or        │  ║    ││
│  │  Aptos        │     ║  │  click to browse               │  ║    ││
│  │  v1.0.0       │     ║  │  Supports PDF, JPG, PNG        │  ║    ││
│  │               │     ║  └────────────────────────────────┘  ║    ││
│  │               │     ║                                        ║    ││
│  │               │     ║  [ Process & Mint Token ]             ║    ││
│  │               │     ║                                        ║    ││
│  │               │     ╚════════════════════════════════════════╝    ││
│  │               │                                                     ││
│  └───────────────┴─────────────────────────────────────────────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Colors:
 - Background: Pure Black (#000000)
 - Cards: Dark Gray (#141414)
 - Borders: Subtle Gray (#333333)
 - Text: Pure White (#ffffff)
 - Button: White background, Black text
```

## 🎨 Color Swatches

```
┌─────────────┐
│  #000000    │  Background (Pure Black)
└─────────────┘

┌─────────────┐
│  #0a0a0a    │  Surface (Deep Gray)
└─────────────┘

┌─────────────┐
│  #141414    │  Cards (Lighter Gray)
└─────────────┘

┌─────────────┐
│  #333333    │  Borders (Subtle Gray)
└─────────────┘

┌─────────────┐
│  #ffffff    │  Text Primary (Pure White)
└─────────────┘

┌─────────────┐
│  #a0a0a0    │  Text Secondary (Light Gray)
└─────────────┘

┌─────────────┐
│  #666666    │  Text Muted (Medium Gray)
└─────────────┘
```

## 📊 History Page

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌────────────────┬───────────────────────────────────────────────────┐│
│  │                │                                                     ││
│  │  MedChainID   │  History          [🟢 0x1a2b...3c4d] [Disconnect] ││
│  │                │                                                     ││
│  │  📝 Issue     ├─────────────────────────────────────────────────────┤│
│  │  Record       │                                                     ││
│  │               │  Transaction History                                ││
│  │  📊 History   │  View all minted medical tokens from your wallet   ││
│  │  ┃            │                                                     ││
│  │               │  ╔══════════════════════════════════════════════╗  ││
│  │               │  ║ Token ID  | Type         | Date    | Status ║  ││
│  │               │  ╠══════════════════════════════════════════════╣  ││
│  │               │  ║ 0x1a2b... | Birth Cert.  | 12/17   | Minted ║  ││
│  │               │  ║───────────────────────────────────────────────║  ││
│  │  Powered by   │  ║ 0x2b3c... | Insurance    | 12/16   | Minted ║  ││
│  │  Aptos        │  ║───────────────────────────────────────────────║  ││
│  │  v1.0.0       │  ║ 0x3c4d... | Medicine     | 12/15   | Minted ║  ││
│  │               │  ╚══════════════════════════════════════════════╝  ││
│  │               │                                                     ││
│  │               │  ┌──────────┐ ┌──────────┐ ┌──────────┐          ││
│  │               │  │  Total   │ │This Month│ │ Success  │          ││
│  │               │  │    3     │ │    3     │ │   100%   │          ││
│  │               │  └──────────┘ └──────────┘ └──────────┘          ││
│  └───────────────┴─────────────────────────────────────────────────────┘│
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Design Elements

### 1. Sidebar (224px)
```
├─ Logo Area (48px padding)
│  └─ "MedChainID" + tagline
├─ Navigation (16px padding)
│  ├─ 📝 Issue Record (active: bordered)
│  └─ 📊 History
└─ Footer (16px padding)
   └─ "Powered by Aptos" + version
```

### 2. Header (64px height)
```
┌──────────────────────────────────────────┐
│ [Page Title]              [Wallet Button] │
└──────────────────────────────────────────┘
```

### 3. Cards
```css
Background: #141414
Border: 1px solid #333333
Radius: 8px (rounded-lg)
Padding: 32px (p-8)
```

### 4. Buttons
```css
Primary (White):
  Background: #ffffff
  Text: #000000
  Hover: #e5e5e5

Secondary (Dark):
  Background: #141414
  Border: #333333
  Text: #a0a0a0
  Hover: Border → #666666, Text → #ffffff
```

### 5. Status Badges
```
✅ Minted:  Green (#10b981) on dark green background
⏳ Pending: Yellow (#eab308) on dark yellow background
❌ Failed:  Red (#ef4444) on dark red background
```

## 📏 Spacing System

```
Tailwind Units Used:
- gap-2  → 8px
- gap-3  → 12px
- gap-4  → 16px
- gap-6  → 24px
- p-4    → 16px padding
- p-6    → 24px padding
- p-8    → 32px padding
- mb-2   → 8px margin-bottom
- mb-3   → 12px margin-bottom
- mb-6   → 24px margin-bottom
```

## 🖱️ Interactive States

### Hover Effects
```
Sidebar Links:
  Default: text-text-secondary (gray)
  Hover: text-text-primary (white) + bg-dark-hover
  Active: border-dark-border + bg-dark-card

Table Rows:
  Default: transparent
  Hover: bg-dark-hover (#1a1a1a)

Buttons:
  Primary: bg-white → bg-gray-200
  Secondary: border-dark-border → border-text-muted
```

### Focus States
```css
All interactive elements:
  outline: 2px solid rgba(255, 255, 255, 0.3)
  outline-offset: 2px
```

## 🎭 Typography

```
Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto

Heading Sizes:
- h1: 2.5rem (40px) - Logo
- h2: 1.25rem (20px) - Page titles
- h3: 1.125rem (18px) - Card headers

Body Sizes:
- Base: 0.875rem (14px) - Most text
- Small: 0.75rem (12px) - Labels, meta
- Tiny: 0.625rem (10px) - Footer

Font Weights:
- Medium: 500 - Headers, labels
- Normal: 400 - Body text
- Mono: Courier New - Hashes, addresses
```

## 🎨 Component Anatomy

### File Upload Area
```
┌────────────────────────────────────┐
│         📁                          │  ← Icon (4xl)
│  Drop your file here or             │  ← Primary text (sm)
│  click to browse                    │
│  Supports PDF, JPG, PNG (Max 10MB) │  ← Secondary text (xs)
└────────────────────────────────────┘

States:
- Default: border-dark-border
- Hover: border-text-secondary
- Dragging: border-text-primary + bg-dark-hover
- With File: Show file name + size
```

### Wallet Button
```
Connected:
┌─────────────────────────┬─────────────┐
│ [🟢] 0x1a2b...3c4d     │ [Disconnect] │
└─────────────────────────┴─────────────┘

Disconnected:
┌─────────────────┐
│ [Connect Wallet] │
└─────────────────┘
```

### Success Notification
```
╔════════════════════════════════════════╗
║ ✅ Token Minted Successfully!         ║
║ Hash: 0x1a2b3c...                     ║
║ IPFS: QmXyZ123...                     ║
║ TX: 0xabc123...                       ║
╚════════════════════════════════════════╝

Background: rgba(16, 185, 129, 0.1)
Border: 1px solid rgba(16, 185, 129, 0.3)
Text: #34d399
```

## 🌐 Responsive Breakpoints

```
Desktop (1024px+):
  ✅ Full sidebar visible
  ✅ Wide tables
  ✅ Multi-column layouts

Tablet (768px - 1023px):
  🚧 Collapsible sidebar
  🚧 Adjusted table columns
  🚧 Stack stats cards

Mobile (< 768px):
  🚧 Hidden sidebar (hamburger menu)
  🚧 Vertical table layout
  🚧 Single column stats
```

**Note**: Current version optimized for desktop. Mobile implementation pending.

---

**This design achieves the usetool.bar aesthetic**: Ultra-clean, professional, no-nonsense interface for serious medical record management. 🖤
