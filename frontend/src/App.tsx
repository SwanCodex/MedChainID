import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletProvider } from './components/WalletProvider';
import Dashboard from './pages/Dashboard';
import Issuer from './pages/Issuer';
import Verifier from './pages/Verifier';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <h1>🏥 MedChainID</h1>
              <p>Decentralized Medical Record Verification</p>
            </div>
            <nav className="nav">
              <Link to="/">Dashboard</Link>
              <Link to="/issuer">Issue Token</Link>
              <Link to="/verifier">Verify Token</Link>
            </nav>
          </header>

          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/issuer" element={<Issuer />} />
              <Route path="/verifier" element={<Verifier />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>Built on Aptos Blockchain | Privacy-First Healthcare</p>
          </footer>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
