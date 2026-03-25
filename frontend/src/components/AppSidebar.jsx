import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Settings,
  Sparkles,
  UserCircle2,
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

function NavItem({ active, collapsed, icon, label, description, onClick }) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={[
        'group flex w-full items-center gap-3 rounded-[1.35rem] border px-3 py-3 text-left transition-all duration-200',
        collapsed ? 'justify-center px-0' : '',
        active
          ? 'border-cyan-400/30 bg-cyan-400/14 text-white shadow-[0_12px_30px_rgba(34,211,238,0.14)]'
          : 'border-white/6 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.05] hover:text-white',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] transition-colors',
          active ? 'bg-cyan-400/16 text-cyan-200' : 'bg-white/[0.04] text-slate-300 group-hover:text-cyan-200',
        ].join(' ')}
      >
        <IconComponent className="h-4 w-4" />
      </div>

      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="truncate text-xs text-slate-400">{description}</p>
        </div>
      )}
    </button>
  );
}

function SidebarContent({ collapsed, isMobile, onCloseMobile, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setProfileRefreshTick] = useState(0);
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

  const isWorkspaceActive =
    location.pathname.startsWith('/workspace') || location.pathname.startsWith('/editor/');
  const isDiagramsActive = location.pathname.startsWith('/diagrams');
  const isSettingsActive = location.pathname.startsWith('/settings');

  const navigateAndMaybeClose = (path) => {
    navigate(path);
    onCloseMobile?.();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('profile_name');
    onCloseMobile?.();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col border-r border-white/8 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96))] px-3 py-3 text-slate-100 shadow-[18px_0_45px_rgba(2,6,23,0.24)] backdrop-blur-2xl">
      <div className="mb-4 flex items-center gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-3 py-3">
        <button
          type="button"
          onClick={() => navigateAndMaybeClose('/workspace')}
          className={[
            'flex min-w-0 flex-1 items-center gap-3 text-left',
            collapsed && !isMobile ? 'justify-center' : '',
          ].join(' ')}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.95),_rgba(14,116,144,0.85)_58%,_rgba(15,23,42,0.96))] shadow-[0_18px_40px_rgba(8,145,178,0.32)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-[0.28em] text-cyan-300/80">
                EduMind Studio
              </p>
              <p className="truncate text-sm font-semibold text-white">Compact Workspace</p>
            </div>
          )}
        </button>

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-white/8 bg-white/[0.03] text-slate-200 transition-colors hover:bg-white/[0.08]"
            aria-label="Đóng thanh điều hướng"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden h-10 w-10 items-center justify-center rounded-[1rem] border border-white/8 bg-white/[0.03] text-slate-200 transition-colors hover:bg-white/[0.08] lg:flex"
            aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="mb-4 px-1">
        {!collapsed || isMobile ? (
          <p className="px-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">Navigation</p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem
          active={isWorkspaceActive}
          collapsed={collapsed && !isMobile}
          icon={Sparkles}
          label="Không gian vẽ"
          description="Editor và canvas làm việc"
          onClick={() => navigateAndMaybeClose('/workspace')}
        />
        <NavItem
          active={isDiagramsActive}
          collapsed={collapsed && !isMobile}
          icon={LayoutGrid}
          label="Sơ đồ của tôi"
          description="Thư viện sơ đồ đã lưu"
          onClick={() => navigateAndMaybeClose('/diagrams')}
        />
        <NavItem
          active={isSettingsActive}
          collapsed={collapsed && !isMobile}
          icon={Settings}
          label="Cài đặt"
          description="Hồ sơ và tùy chỉnh tài khoản"
          onClick={() => navigateAndMaybeClose('/settings')}
        />
      </nav>

      <div
        className={[
          'mt-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-3',
          collapsed && !isMobile ? 'flex flex-col items-center gap-3 px-2' : '',
        ].join(' ')}
      >
        <div className={collapsed && !isMobile ? '' : 'flex items-center gap-3'}>
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[1rem] bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-slate-950">
            {initials}
          </div>

          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profileName}</p>
              <p className="truncate text-xs text-slate-400">{email || 'Không có email'}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          className={[
            'mt-3 flex items-center justify-center gap-2 rounded-[1rem] border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/16',
            collapsed && !isMobile ? 'w-full px-0' : 'w-full',
          ].join(' ')}
        >
          <LogOut className="h-4 w-4" />
          {(!collapsed || isMobile) && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );
}

export default function AppSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}) {
  const desktopWidth = collapsed ? '5.5rem' : '15.5rem';

  return (
    <>
      <aside className="app-sidebar hidden lg:flex" style={{ width: desktopWidth }}>
        <SidebarContent
          collapsed={collapsed}
          isMobile={false}
          onCloseMobile={onCloseMobile}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {mobileOpen && (
        <>
          <button
            type="button"
            onClick={onCloseMobile}
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
            aria-label="Đóng điều hướng"
          />
          <aside className="app-sidebar-mobile lg:hidden">
            <SidebarContent
              collapsed={false}
              isMobile
              onCloseMobile={onCloseMobile}
              onToggleCollapse={onToggleCollapse}
            />
          </aside>
        </>
      )}
    </>
  );
}
