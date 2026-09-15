import React, { useState } from 'react';
import {
  HeartPulse,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthUser } from '../../types/auth';
import { employeeMap } from '../../utils/mcuAnalytics';

interface LoginPortalProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setErrorMsg('Silakan masukkan NIP/Username dan Password.');
      return;
    }

    // 1. Admin Authentication: username "admin" and password "admin"
    if (u.toLowerCase() === 'admin' && p === 'admin') {
      onLogin({
        role: 'admin',
        nama: 'Administrator DSDM',
        departemen: 'Departemen Sumber Daya Manusia'
      });
      return;
    }

    // 2. Employee Authentication: username must be a valid NIP and password "pegawai"
    if (p === 'pegawai') {
      const emp = employeeMap.get(u);
      if (emp) {
        onLogin({
          role: 'employee',
          nip: emp.NIP,
          nama: emp.Nama,
          departemen: emp.Departemen,
          avatarInitials: emp.Nama.split(' ').map(n => n[0]).join('').slice(0, 2)
        });
        return;
      } else {
        setErrorMsg(`NIP "${u}" tidak terdaftar dalam data pegawai.`);
        return;
      }
    }

    // 3. Fallback error
    setErrorMsg('NIP / Username atau Password salah.');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-bi-900 p-6 text-white text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-2">
            <HeartPulse className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">BI-WELL</h1>
          <p className="text-xs text-bi-200 mt-0.5">
            Platform Kesehatan Pegawai Bank Indonesia
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <h2 className="text-base font-bold text-slate-900 text-center mb-4">
            Masuk ke Akun
          </h2>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan NIP atau admin"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bi-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bi-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-bi-900 hover:bg-bi-800 text-white font-semibold text-xs transition-colors"
            >
              <span>Masuk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
