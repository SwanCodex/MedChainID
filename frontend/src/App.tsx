/**
 * App.tsx
 * Main application entry point
 * Minimalist dark mode dashboard with wallet integration
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './components/WalletProvider';
import DashboardLayout from './components/DashboardLayout';
import IssueRecordPage from './pages/IssueRecordPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<IssueRecordPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;
