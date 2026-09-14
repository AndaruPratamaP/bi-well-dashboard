import React, { useState } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Info
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
        setErrorMsg(`NIP "${u}" tidak terdaftar dalam database pegawai MCU.`);
        return;
      }
    }

    // 3. Fallback error
    setErrorMsg('NIP / Username atau Password salah. Periksa kembali kredensial Anda.');
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-bi-950 to-bi-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-bi-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-bi-900 via-bi-800 to-bi-900 p-7 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white shadow-inner mb-3">
            <HeartPulse className="w-8 h-8 text-emerald-400" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight">BI-WELL</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              MCU Portal
            </span>
          </div>
          
          <p className="text-xs text-bi-200">
            Bank Indonesia Employee Wellness & Health Platform
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-bi-200 bg-white/10 px-3 py-1 rounded-full border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Otentikasi Terpadu</span>
          </div>
        </div>

        {/* Unified Login Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-5 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan NIP (Pegawai) atau Username (Admin) beserta password
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input NIP / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIP / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="NIP (contoh: 100001) atau admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bi-900 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-bi-900 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bi-900 hover:bg-bi-800 text-white font-bold text-xs shadow-md shadow-bi-900/20 transition-all"
            >
              <span>Masuk ke Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Panduan Kredensial & Quick Fill */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-2">
              <Info className="w-3.5 h-3.5 text-bi-900" />
              <span>Petunjuk Akses Akun:</span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
              <div className="flex items-center justify-between">
                <span><strong>Admin DSDM:</strong></span>
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">admin / admin</span>
              </div>
              <div className="flex items-center justify-between">
                <span><strong>Pegawai BI:</strong></span>
                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">[NIP] / pegawai</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-slate-400 mb-1.5">Klik cepat untuk mengisi form:</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'admin')}
                  className="px-2 py-1 text-[10px] font-semibold bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg transition-colors"
                >
                  Admin (admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('100001', 'pegawai')}
                  className="px-2 py-1 text-[10px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition-colors"
                >
                  Pegawai 1 (100001)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('100002', 'pegawai')}
                  className="px-2 py-1 text-[10px] font-semibold bg-bi-100 hover:bg-bi-200 text-bi-900 rounded-lg transition-colors"
                >
                  Pegawai 2 (100002)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('100003', 'pegawai')}
                  className="px-2 py-1 text-[10px] font-semibold bg-red-100 hover:bg-red-200 text-red-900 rounded-lg transition-colors"
                >
                  Pegawai 3 (100003)
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
