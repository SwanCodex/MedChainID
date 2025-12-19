/**
 * LoginPage.tsx
 * Google Authentication Login Page
 * Obsidian theme with SVG icons - no emojis
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

// SVG Icons
const Icons = {
  lock: (
    <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  chain: (
    <svg className="w-6 h-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  medical: (
    <svg className="w-12 h-12 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      // Send the Google token to your backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the JWT token
        login(data.token);
        navigate('/');
      } else {
        console.error('Login failed:', data.error);
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    alert('Google login failed. Please try again.');
  };

  const handleRedirectLogin = () => {
    // Redirect to backend Google OAuth flow
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center bg-dark-card border border-dark-border rounded-2xl p-8 mb-6 shadow-glow">
            {Icons.medical}
            <h1 className="text-3xl font-bold text-gradient-purple mt-4">MedChainID</h1>
            <p className="text-sm text-text-secondary mt-2">Verifiable Medical Records</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome Back</h2>
          <p className="text-sm text-text-secondary mb-8">
            Sign in to manage your medical records securely on the blockchain
          </p>

          {/* Google Sign-In Button */}
          <div className="flex flex-col gap-4">
            {/* Primary: Server-side OAuth flow (More Reliable) */}
            <button
              onClick={handleRedirectLogin}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary/90 hover:to-brand-secondary/90
                text-dark-crust rounded-xl px-4 py-3.5 text-sm font-semibold
                transition-all duration-200 flex items-center justify-center gap-3 shadow-glow"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-dark-card text-text-muted">OR USE CLIENT-SIDE</span>
              </div>
            </div>

            {/* Alternative: Client-side Google Sign-In (if origins are configured) */}
            <div className="flex justify-center opacity-75">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-dark-border">
            <p className="text-xs text-text-muted text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy.
              Your data is secured with blockchain technology and end-to-end encryption.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-dark-card/50 border border-dark-border/50 rounded-xl p-4">
            <div className="flex justify-center mb-2">{Icons.lock}</div>
            <div className="text-xs text-text-muted">Encrypted</div>
          </div>
          <div className="bg-dark-card/50 border border-dark-border/50 rounded-xl p-4">
            <div className="flex justify-center mb-2">{Icons.chain}</div>
            <div className="text-xs text-text-muted">Blockchain</div>
          </div>
          <div className="bg-dark-card/50 border border-dark-border/50 rounded-xl p-4">
            <div className="flex justify-center mb-2">{Icons.check}</div>
            <div className="text-xs text-text-muted">Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
}
