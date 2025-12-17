/**
 * LoginPage.tsx
 * Google Authentication Login Page
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

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
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block bg-dark-surface border border-dark-border rounded-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-text-primary">MedChainID</h1>
            <p className="text-sm text-text-secondary mt-2">Verifiable Medical Records</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome Back</h2>
          <p className="text-sm text-text-secondary mb-8">
            Sign in to manage your medical records securely on the blockchain
          </p>

          {/* Google Sign-In Button */}
          <div className="flex flex-col gap-4">
            {/* Option 1: Client-side Google Sign-In */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-dark-surface text-text-muted">OR</span>
              </div>
            </div>

            {/* Option 2: Server-side OAuth flow */}
            <button
              onClick={handleRedirectLogin}
              className="w-full bg-dark-card border border-dark-border text-text-primary 
                hover:bg-dark-hover hover:border-text-muted rounded-lg px-4 py-3 text-sm font-medium
                transition-colors duration-150 flex items-center justify-center gap-3"
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
              Continue with Google OAuth
            </button>
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
          <div>
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-xs text-text-muted">Encrypted</div>
          </div>
          <div>
            <div className="text-2xl mb-1">⛓️</div>
            <div className="text-xs text-text-muted">Blockchain</div>
          </div>
          <div>
            <div className="text-2xl mb-1">✓</div>
            <div className="text-xs text-text-muted">Verified</div>
          </div>
        </div>
      </div>
    </div>
  );
}
