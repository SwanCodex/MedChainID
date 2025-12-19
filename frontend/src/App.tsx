/**
 * App.tsx
 * Main application entry point
 * Minimalist dark mode dashboard with wallet and Google auth integration
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './components/WalletProvider';
import DashboardLayout from './components/DashboardLayout';
import IssueRecordPage from './pages/IssueRecordPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<IssueRecordPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <WalletProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </WalletProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
