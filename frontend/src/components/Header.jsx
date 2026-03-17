import React, { useMemo, useState } from 'react';
import { ChevronDown, LogOut, PanelLeftOpen, Settings, Sparkles, UserCircle2 } from 'lucide-react';
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

function NavPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-cyan-400/15 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
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
  const isLoggedIn = !!localStorage.getItem('access_token');
  const email = decodeTokenEmail();

  const initials = useMemo(() => {
    if (!email) {
      return 'AI';
    }

    return email.slice(0, 2).toUpperCase();
  }, [email]);

  const isWorkspaceActive = location.pathname.startsWith('/workspace') || location.pathname.startsWith('/editor/');
  const isDiagramsActive = location.pathname.startsWith('/diagrams');
  const isSettingsActive = location.pathname.startsWith('/settings');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsProfileOpen(false);
    navigate('/login');
  };

  return (
    <header className="relative z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/workspace')}
          className="flex items-center gap-4 rounded-2xl px-2 py-2 transition-transform hover:scale-[1.01]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.95),_rgba(14,116,144,0.85)_55%,_rgba(15,23,42,0.95))] shadow-[0_18px_45px_rgba(8,145,178,0.35)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">EduMind Studio</p>
            <h1 className="text-lg font-semibold tracking-tight text-white">Không gian Mindmap</h1>
          </div>
        </button>

        {isLoggedIn && (
          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
            <NavPill active={isWorkspaceActive} label="Không gian vẽ" onClick={() => navigate('/workspace')} />
            <NavPill active={isDiagramsActive} label="Sơ đồ của tôi" onClick={() => navigate('/diagrams')} />
            <NavPill active={isSettingsActive} label="Cài đặt" onClick={() => navigate('/settings')} />
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((value) => !value)}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-slate-950">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Đã đăng nhập</p>
                  <p className="max-w-52 truncate text-sm font-medium text-white">{email || 'Người dùng không gian vẽ'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] w-72 rounded-3xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl">
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                        <UserCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{email || 'Người dùng không gian vẽ'}</p>
                        <p className="text-xs text-slate-400">React Flow + trợ lý AI</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/diagrams');
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
                      >
                        <PanelLeftOpen className="h-4 w-4 text-cyan-300" />
                        Sơ đồ của tôi
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/settings');
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10"
                      >
                        <Settings className="h-4 w-4 text-cyan-300" />
                        Cài đặt
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
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02]"
              >
                Tạo tài khoản
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
