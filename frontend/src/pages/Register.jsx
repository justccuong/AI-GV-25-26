import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, UserPlus } from 'lucide-react';
import { getApiErrorMessage, registerUser } from '../api/axiosClient';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await registerUser(email, password);
      localStorage.setItem('access_token', data.access_token);
      navigate('/workspace');
    } catch (error) {
      window.alert(getApiErrorMessage(error, 'Đăng ký thất bại. Email này có thể đã được sử dụng.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_38%),linear-gradient(180deg,_#020617,_#0f172a_48%,_#020617)] px-4 py-8">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            EduMind Studio
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Tạo tài khoản</h1>
          <p className="mt-3 text-sm text-slate-400">Khởi tạo không gian làm việc riêng để lưu sơ đồ, đồng bộ lịch sử và làm việc cùng trợ lý AI.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Mail className="h-4 w-4 text-cyan-300" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                placeholder="ban@example.com"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Mật khẩu</span>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Lock className="h-4 w-4 text-cyan-300" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                placeholder="Chọn mật khẩu an toàn"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {submitting ? 'Đang tạo tài khoản...' : 'Bắt đầu ngay'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
