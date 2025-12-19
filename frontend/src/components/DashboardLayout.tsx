/**
 * DashboardLayout.tsx
 * Professional dark mode layout
 * Enterprise-grade dashboard design
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import { FileText, History, Activity } from 'lucide-react';
import WalletButton from './WalletButton';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: typeof FileText;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Issue Record', icon: FileText },
  { path: '/history', label: 'History', icon: History },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex">
      {/* Minimalist Sidebar */}
      <aside className="w-56 bg-dark-surface border-r border-dark-border flex flex-col">
        {/* Logo Area */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-primary rounded flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-text-primary">MedChainID</h1>
              <p className="text-xs text-text-muted">Verifiable Records</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 mb-1 rounded
                  transition-all duration-150 text-sm group
                  ${
                    isActive
                      ? 'bg-dark-card text-text-primary border border-dark-border'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-primary'} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-dark-border">
          <div className="text-xs text-text-muted space-y-1">
            <p className="font-medium">Powered by Aptos</p>
            <p className="text-text-muted/60">Version 1.0.0</p>
          </div>
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
            <WalletButton />
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
