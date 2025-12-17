/**
 * DashboardLayout.tsx
 * Minimalist dark mode layout inspired by usetool.bar
 * Ultra-clean sidebar + header design
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Issue Record', icon: '📝' },
  { path: '/history', label: 'History', icon: '📊' },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex">
      {/* Minimalist Sidebar */}
      <aside className="w-56 bg-dark-surface border-r border-dark-border flex flex-col">
        {/* Logo Area */}
        <div className="p-6 border-b border-dark-border">
          <h1 className="text-xl font-medium tracking-tight">MedChainID</h1>
          <p className="text-xs text-text-secondary mt-1">Verifiable Records</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-2 rounded-md
                  transition-colors duration-150 text-sm
                  ${
                    isActive
                      ? 'bg-dark-card text-text-primary border border-dark-border'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover'
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-dark-border text-xs text-text-muted">
          <p>Powered by Aptos</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="h-16 bg-dark-surface border-b border-dark-border flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-text-secondary">
              {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          {/* User Menu & Wallet Button - Far Right */}
          <div className="flex items-center gap-4">
            <UserMenu />
            <WalletSelector />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
