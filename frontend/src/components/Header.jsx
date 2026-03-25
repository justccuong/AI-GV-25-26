import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftOpen,
  Settings,
  Sparkles,
  UserCircle2,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

function decodeTokenEmail() {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.sub || null;
  } catch {
    return null;
  }
}

function deriveProfileName(email) {
  if (!email) {
    return 'Người dùng EduMind';
  }

  const local = email.split('@')[0] || '';
  return local
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStoredProfileName(email) {
  return localStorage.getItem('profile_name') || deriveProfileName(email);
}

function resolvePageTitle(pathname) {
  if (pathname.startsWith('/diagrams')) {
    return 'Sơ đồ của tôi';
  }

  if (pathname.startsWith('/settings')) {
    return 'Cài đặt';
  }

  if (pathname.startsWith('/editor/')) {
    return 'Mindmap Editor';
  }

  return 'Không gian vẽ';
}

function NavPill({ active, label, onClick, fullWidth = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200',
        fullWidth ? 'w-full text-left' : '',
        active
          ? 'bg-cyan-400/15 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.22)]'
          : 'text-slate-300 hover:bg-white/5 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setProfileRefreshTick] = useState(0);
  const isLoggedIn = !!localStorage.getItem('access_token');
  const email = decodeTokenEmail();
  const profileName = getStoredProfileName(email);

  useEffect(() => {
    const syncProfile = () => setProfileRefreshTick((current) => current + 1);

    window.addEventListener('storage', syncProfile);
    window.addEventListener('profile-updated', syncProfile);

    return () => {
      window.removeEventListener('storage', syncProfile);
      window.removeEventListener('profile-updated', syncProfile);
    };
  }, []);

  const initials = useMemo(() => {
    const source = profileName || email || 'AI';
    const letters = source
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2);

    return (letters || 'AI').toUpperCase();
  }, [email, profileName]);

  const pageTitle = useMemo(() => resolvePageTitle(location.pathname), [location.pathname]);
  const isWorkspaceActive = location.pathname.startsWith('/workspace') || location.pathname.startsWith('/editor/');
  const isDiagramsActive = location.pathname.startsWith('/diagrams');
  const isSettingsActive = location.pathname.startsWith('/settings');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('profile_name');
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const navigateAndClose = (path) => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    navigate(path);
  };

  return (
    <header className="relative z-40 border-b border-white/10 bg-slate-950/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={() => navigate('/workspace')}
          className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 transition-transform hover:scale-[1.01]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.95),_rgba(14,116,144,0.85)_55%,_rgba(15,23,42,0.95))] shadow-[0_12px_30px_rgba(8,145,178,0.24)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <div className="min-w-0 text-left">
            <p className="truncate text-[10px] uppercase tracking-[0.26em] text-cyan-300/75">
              EduMind Studio
            </p>
            <p className="truncate text-sm font-semibold text-white">{pageTitle}</p>
          </div>
        </button>

        {isLoggedIn && (
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
            <NavPill active={isWorkspaceActive} label="Không gian vẽ" onClick={() => navigate('/workspace')} />
            <NavPill active={isDiagramsActive} label="Sơ đồ của tôi" onClick={() => navigate('/diagrams')} />
            <NavPill active={isSettingsActive} label="Cài đặt" onClick={() => navigate('/settings')} />
          </nav>
        )}

        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 lg:hidden"
              aria-label="Mở menu điều hướng"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}

          {isLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.08]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-semibold text-slate-950">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="max-w-40 truncate text-sm font-medium text-white">{profileName}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-[calc(100%+0.65rem)] w-72 rounded-3xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                        <UserCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{profileName}</p>
                        <p className="text-xs text-slate-400">{email || 'Không có email'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => navigateAndClose('/diagrams')}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
                      >
                        <PanelLeftOpen className="h-4 w-4 text-cyan-300" />
                        Sơ đồ của tôi
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateAndClose('/settings')}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
                      >
                        <Settings className="h-4 w-4 text-cyan-300" />
                        Cài đặt tài khoản
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-rose-200 transition-colors hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {isLoggedIn && isMobileMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 px-3 py-3 backdrop-blur-xl lg:hidden">
          <div className="space-y-2">
            <NavPill active={isWorkspaceActive} label="Không gian vẽ" onClick={() => navigateAndClose('/workspace')} fullWidth />
            <NavPill active={isDiagramsActive} label="Sơ đồ của tôi" onClick={() => navigateAndClose('/diagrams')} fullWidth />
            <NavPill active={isSettingsActive} label="Cài đặt tài khoản" onClick={() => navigateAndClose('/settings')} fullWidth />
          </div>
        </div>
      )}
    </header>
  );
}
