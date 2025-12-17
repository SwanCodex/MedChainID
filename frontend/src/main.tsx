import React from 'react'
import ReactDOM from 'react-dom/client'
import { WalletProvider } from './components/WalletProvider'; // Import from Step 1
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider> {/* <--- WRAPPER HERE */}
      <App />
    </WalletProvider>
  </React.StrictMode>,
)