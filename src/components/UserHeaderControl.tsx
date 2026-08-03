import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserNotification } from '../lib/firebase';
import { User, Sun, ShieldCheck, LogIn, Contrast, Check, ChevronDown, Moon, Zap } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import AuthModal from './AuthModal';

export type ThemeMode = 'scientific-dark' | 'high-contrast';

interface UserHeaderControlProps {
  userProfile: UserProfile | null;
  notifications: UserNotification[];
  onOpenBriefing: () => void;
  onSelectNotificationAction?: (notification: UserNotification) => void;
}

export default function UserHeaderControl({
  userProfile,
  notifications,
  onOpenBriefing,
  onSelectNotificationAction
}: UserHeaderControlProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('synapse_theme_preference');
    return (saved === 'high-contrast' ? 'high-contrast' : 'scientific-dark');
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme === 'high-contrast') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('synapse_theme_preference', theme);
  }, [theme]);

  // Click outside listener for theme menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Morning Briefing Trigger */}
      <button
        onClick={onOpenBriefing}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
      >
        <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
        <span className="hidden sm:inline">Morning Briefing</span>
      </button>

      {/* Theme Preference Toggle Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            theme === 'high-contrast'
              ? 'bg-purple-950/40 text-purple-300 border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
          title="Toggle UI Theme Preference"
        >
          <Contrast className={`w-3.5 h-3.5 ${theme === 'high-contrast' ? 'text-purple-400' : 'text-sky-400'}`} />
          <span className="hidden lg:inline text-[11px] font-mono">
            {theme === 'high-contrast' ? 'High Contrast' : 'Scientific Dark'}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>

        {showThemeMenu && (
          <div className="absolute right-0 mt-2 w-52 bg-[#0D0F17] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[9.5px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
              UI Theme Preference
            </div>

            <button
              onClick={() => {
                setTheme('scientific-dark');
                setShowThemeMenu(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left font-sans transition-colors cursor-pointer ${
                theme === 'scientific-dark'
                  ? 'bg-sky-500/20 text-sky-200 font-bold border border-sky-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <div>
                  <div className="leading-none text-[11px]">Scientific Dark</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">Default Slate Palette</div>
                </div>
              </div>
              {theme === 'scientific-dark' && <Check className="w-3.5 h-3.5 text-sky-400" />}
            </button>

            <button
              onClick={() => {
                setTheme('high-contrast');
                setShowThemeMenu(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left font-sans transition-colors mt-1 cursor-pointer ${
                theme === 'high-contrast'
                  ? 'bg-purple-500/20 text-purple-200 font-bold border border-purple-500/40'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <div>
                  <div className="leading-none text-[11px]">High Contrast</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">Vivid Text & Borders</div>
                </div>
              </div>
              {theme === 'high-contrast' && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </button>
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter
        notifications={notifications}
        onOpenBriefing={onOpenBriefing}
        onSelectNotificationAction={onSelectNotificationAction}
      />

      {/* User Identity Chip */}
      <button
        onClick={() => setShowAuthModal(true)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-xs transition-all cursor-pointer"
      >
        <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 text-[10px] font-bold">
          {userProfile?.displayName?.[0]?.toUpperCase() || <User className="w-3 h-3" />}
        </div>

        <div className="hidden md:flex flex-col items-start leading-none text-left">
          <span className="text-slate-200 font-bold text-[11px]">
            {userProfile?.displayName || (userProfile?.isAnonymous ? "Guest Scholar" : "Sign In")}
          </span>
          <span className="text-[9px] font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
            {userProfile ? "Firestore Connected" : "Guest Mode"}
          </span>
        </div>
      </button>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        userProfile={userProfile}
      />
    </div>
  );
}
