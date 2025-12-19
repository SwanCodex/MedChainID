/**
 * Layout.tsx
 * Main layout with navbar and content area
 */

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark-bg text-text-primary">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />
        <div className="absolute top-[30%] right-[5%] w-[35%] h-[35%] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[25%] h-[25%] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 pt-20 md:pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-border bg-dark-surface/50 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span>🏥</span>
            <span className="font-medium text-text-secondary">MedChainID</span>
            <span>•</span>
            <span>Secure Medical Records on Blockchain</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by</span>
            <span className="text-brand-primary font-medium">Aptos</span>
            <span>•</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
