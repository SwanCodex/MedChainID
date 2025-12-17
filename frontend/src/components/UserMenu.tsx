/**
 * UserMenu.tsx
 * User profile dropdown menu
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-dark-card border border-dark-border 
          hover:border-text-muted rounded-lg px-3 py-2 transition-colors duration-150"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
          flex items-center justify-center text-white text-sm font-medium">
          {getInitials(user.name)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-text-primary">{user.name}</div>
          <div className="text-xs text-text-secondary">{user.email}</div>
        </div>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-dark-surface border border-dark-border 
          rounded-lg shadow-xl py-2 z-50 animate-fade-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-dark-border">
            <div className="text-sm font-medium text-text-primary">{user.name}</div>
            <div className="text-xs text-text-secondary mt-1">{user.email}</div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/');
              }}
              className="w-full px-4 py-2 text-left text-sm text-text-primary 
                hover:bg-dark-hover transition-colors duration-150 flex items-center gap-3"
            >
              <span>📝</span>
              <span>Issue Records</span>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/history');
              }}
              className="w-full px-4 py-2 text-left text-sm text-text-primary 
                hover:bg-dark-hover transition-colors duration-150 flex items-center gap-3"
            >
              <span>📊</span>
              <span>History</span>
            </button>

            <div className="my-2 border-t border-dark-border"></div>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-400 
                hover:bg-dark-hover transition-colors duration-150 flex items-center gap-3"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
