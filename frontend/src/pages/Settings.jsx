import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, Settings2, UserCircle2 } from 'lucide-react';

import { getApiErrorMessage, getCurrentProfile, updateCurrentProfile } from '../api/axiosClient';

function getLocalProfileName(email) {
  const storedName = localStorage.getItem('profile_name');
  if (storedName) {
    return storedName;
  }

  if (!email) {
    return 'Người dùng EduMind';
  }

  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Settings() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', success: '' });

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const profile = await getCurrentProfile();

        if (!isActive) {
          return;
        }

        setForm({
          name: getLocalProfileName(profile.email),
          email: profile.email || '',
        });
        setStatus({ loading: false, saving: false, error: '', success: '' });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStatus({
          loading: false,
          saving: false,
          error: getApiErrorMessage(error, 'Không thể tải thông tin tài khoản.'),
          success: '',
        });
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const initials = useMemo(() => {
    const source = form.name || form.email || 'AI';
    return source
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [form.email, form.name]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: '', success: '' }));

    try {
      const profile = await updateCurrentProfile({
        email: form.email.trim(),
        name: form.name.trim(),
      });

      const resolvedName = form.name.trim() || profile.name || getLocalProfileName(profile.email);
      setForm({
        name: resolvedName,
        email: profile.email,
      });
      localStorage.setItem('profile_name', resolvedName);
      if (profile.access_token) {
        localStorage.setItem('access_token', profile.access_token);
      }
      window.dispatchEvent(new Event('profile-updated'));
      setStatus({
        loading: false,
        saving: false,
        error: '',
        success: 'Đã cập nhật thông tin tài khoản.',
      });
    } catch (error) {
      setStatus({
        loading: false,
        saving: false,
        error: getApiErrorMessage(error, 'Không thể cập nhật thông tin tài khoản.'),
        success: '',
      });
    }
  };

  return (
    <div className="shell-page-pad h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.1),_transparent_38%),linear-gradient(180deg,_#020617,_#0f172a_50%,_#020617)] px-4 text-slate-100 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="shell-page-hero mb-6 border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200">
            <Settings2 className="h-3.5 w-3.5" />
            Cài đặt tài khoản
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Thông tin hồ sơ người dùng</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Trang này cho phép xem và cập nhật thông tin cơ bản của tài khoản. Tên hiển thị hiện được dùng như alias ở phía frontend để header và các thành phần giao diện thân thiện hơn.
          </p>
        </div>

        {status.error && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {status.error}
          </div>
        )}

        {status.success && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            {status.success}
          </div>
        )}

        {status.loading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-sm text-slate-300 shadow-xl backdrop-blur-xl">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải hồ sơ tài khoản...
          </div>
        ) : (
          <div className="page-profile-grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-500 text-2xl font-semibold text-slate-950 shadow-[0_18px_45px_rgba(14,165,233,0.24)]">
                  {initials}
                </div>
                <div className="mt-4 flex items-center gap-2 text-cyan-200">
                  <UserCircle2 className="h-4 w-4" />
                  Hồ sơ hiện tại
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">{form.name || 'Người dùng EduMind'}</h2>
                <p className="mt-1 text-sm text-slate-400">{form.email || 'Chưa có email'}</p>
              </div>
            </aside>

            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl"
            >
              <div className="grid gap-5">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">Tên hiển thị</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nhập tên hiển thị"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-200">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="you@example.com"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/40"
                  />
                </label>

                <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-sm leading-7 text-slate-300">
                  Email sẽ được cập nhật ở backend nếu hợp lệ. Tên hiển thị hiện được lưu như thông tin hồ sơ nhẹ ở frontend để phục vụ giao diện người dùng.
                </div>

                <button
                  type="submit"
                  disabled={status.saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {status.saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
