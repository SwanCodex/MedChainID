/**
 * DashboardLayout.tsx
 * Minimalist dark mode layout inspired by usetool.bar
 * Ultra-clean sidebar + header design
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Issue Record', icon: '📝' },
  { path: '/my-records', label: 'My Records', icon: '👤' },
  { path: '/history', label: 'History', icon: '📊' },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Minimalist Sidebar */}
      <aside className="w-64 bg-dark-surface/80 backdrop-blur-xl border-r border-dark-border flex flex-col relative z-20 transition-all duration-300">
        {/* Logo Area */}
        <div className="p-8 border-b border-dark-border/50">
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-200">
            MedChainID
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-mono uppercase tracking-wider">Verifiable Records</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl
                  transition-all duration-200 text-sm font-medium group
                  ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover/50 hover:border hover:border-dark-border'
                  }
                `}
              >
                <span className={`text-lg transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_5px_currentColor]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-6 border-t border-dark-border/50 bg-black/20">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-mono">v1.0.0</span>
            <span className="flex items-center gap-1">
              Powered by <span className="font-semibold text-text-secondary">Aptos</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10 w-0">
        {/* Top Header Bar */}
        <header className="h-20 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border/50 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-text-primary tracking-wide">
              {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          {/* User Menu & Wallet Button - Far Right */}
          <div className="flex items-center gap-4">
            <UserMenu />
            <div className="h-8 w-px bg-dark-border/50 mx-2" />
            <WalletButton />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-border scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
