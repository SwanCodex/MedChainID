/**
 * DashboardLayout.tsx
 * Obsidian dark mode layout with SVG icons
 * Premium sidebar + header design
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';
import UserMenu from './UserMenu';

// SVG Icons
const Icons = {
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  hospital: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  database: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  )
};

interface NavItem {
  path: string;
  label: string;
  icon: JSX.Element;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Issue Record', icon: Icons.edit },
  { path: '/issuer', label: 'Hospital Issuer', icon: Icons.hospital },
  { path: '/patient', label: 'Patient Records', icon: Icons.user },
  { path: '/verifier', label: 'Verifier', icon: Icons.check },
  { path: '/history', label: 'History', icon: Icons.chart },
  { path: '/documents', label: 'Database', icon: Icons.database },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-brand-secondary/5 blur-[100px]" />
      </div>

      {/* Obsidian Sidebar */}
      <aside className="w-64 bg-dark-surface/80 backdrop-blur-xl border-r border-dark-border flex flex-col relative z-20 transition-all duration-300">
        {/* Logo Area */}
        <div className="p-8 border-b border-dark-border/50">
          <h1 className="text-2xl font-bold tracking-tight text-gradient-purple">
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
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-glow'
                      : 'text-text-secondary hover:text-text-primary hover:bg-dark-hover/50 hover:border hover:border-dark-border'
                  }
                `}
              >
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
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
        <div className="p-6 border-t border-dark-border/50 bg-dark-crust/50">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-mono">v1.0.0</span>
            <span className="flex items-center gap-1">
              Powered by <span className="font-semibold text-brand-primary">Aptos</span>
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
