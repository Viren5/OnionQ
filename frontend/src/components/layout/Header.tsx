import React, { useEffect, useState } from 'react';
import { Menu, Bell, ShieldCheck, MapPin, Search } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import type { User } from '../../types';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    authApi.getCurrentUser().then((res) => setUser(res.data)).catch(() => setUser(null));
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()
    : 'QI';

  return (
    <header className="h-16 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 md:hidden focus:outline-none"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Procurement Centre Indicator — fetched from user session */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700/60 text-xs text-gray-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-gray-400">Mandi:</span>
          <span className="font-medium text-gray-200">Onion Quality Inspection Platform</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search batch LOT, farmer, or variety..."
          className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition-colors"
        />
      </div>

      {/* Right Controls: Status & User */}
      <div className="flex items-center gap-3">
        {/* System State Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">AI Engine Ready</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 relative transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-gray-900" />
        </button>

        {/* User Profile — from real /auth/me endpoint */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-gray-950 shadow-sm shadow-amber-500/20">
            {initials}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-gray-200 leading-tight flex items-center gap-1">
              {user?.name || 'Quality Inspector'}
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider capitalize">
              {user?.role || 'Inspector'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
