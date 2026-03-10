/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LogOut, Settings as Gear } from 'lucide-react';
import { storageService } from '../services/storageService';
import GuardianSafe from './GuardianSafe';
import CelestialPath from './CelestialPath';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [isSafeOpen, setIsSafeOpen] = useState(false);

  useEffect(() => {
    storageService.checkResets();
  }, []);

  const handleLogout = () => {
    storageService.clearUserName();
    window.location.href = '/';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Persistent Header */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className={`p-2.5 rounded-xl transition-all ${isHome ? 'text-[var(--theme-color)] bg-white/5 shadow-[0_0_10px_var(--theme-glow)]' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            <Home size={20} />
          </button>
          
          <button 
            onClick={() => setIsSafeOpen(true)}
            className="p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            title="Guardian's Safe"
          >
            <Gear size={20} />
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="text-xs font-black text-[var(--theme-color)] uppercase tracking-widest hidden xs:block drop-shadow-[0_0_5px_var(--theme-glow)]">
            {storageService.getUserName()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Celestial Path Progress Bar */}
      <CelestialPath />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative overflow-y-auto scrollable-content p-4">
        {children}
      </main>

      {/* Guardian Safe Modal */}
      <GuardianSafe isOpen={isSafeOpen} onClose={() => setIsSafeOpen(false)} />
    </div>
  );
}
