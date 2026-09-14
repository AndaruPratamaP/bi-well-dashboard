import React, { useState } from 'react';
import {
  HeartPulse,
  ShieldCheck,
  User,
  Users,
  Building,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AuthUser } from '../../types/auth';
import { data, employeeMap } from '../../utils/mcuAnalytics';

interface LoginPortalProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<'employee' | 'admin'>('employee');
  const [selectedNip, setSelectedNip] = useState<string>('100001'); // Default Pegawai 1
  const [searchTerm, setSearchTerm] = useState<string>('');

  const selectedEmployee = employeeMap.get(selectedNip) || data.pegawai[0];

  const filteredEmployees = data.pegawai.filter(
    e =>
      e.Nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.NIP.includes(searchTerm) ||
      e.Departemen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdminLogin = () => {
    onLogin({
      role: 'admin',
      nama: 'Administrator DSDM',
      departemen: 'Departemen Sumber Daya Manusia'
    });
  };

  const handleEmployeeLogin = (nip: string) => {
    const emp = employeeMap.get(nip) || selectedEmployee;
    onLogin({
      role: 'employee',
      nip: emp.NIP,
      nama: emp.Nama,
      departemen: emp.Departemen,
      avatarInitials: emp.Nama.split(' ').map(n => n[0]).join('').slice(0, 2)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-bi-950 to-bi-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-bi-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-bi-900 via-bi-800 to-bi-900 p-8 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white shadow-inner">
                <HeartPulse className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">BI-WELL</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Medical Portal
                  </span>
                </div>
                <p className="text-xs text-bi-200 mt-0.5">
                  Bank Indonesia Employee Wellness & Health Intelligence Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-bi-200 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sistem Kesehatan Pegawai BI</span>
            </div>
          </div>
        </div>

        {/* Role Selection Tabs */}
        <div className="p-6 sm:p-8">
          <div className="text-center max-w-lg mx-auto mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Pilih Portal Masuk
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Silakan pilih peran untuk mengakses dashboard analitik kesehatan MCU
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
            {/* Tab 1: Pegawai */}
            <button
              type="button"
              onClick={() => setSelectedRole('employee')}
              className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                selectedRole === 'employee'
                  ? 'border-bi-900 bg-bi-50/50 shadow-md ring-2 ring-bi-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-bi-100 flex items-center justify-center text-bi-900">
                  <User className="w-5 h-5" />
                </div>
                {selectedRole === 'employee' && (
                  <CheckCircle2 className="w-5 h-5 text-bi-900" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Portal Pegawai</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Akses hasil pemeriksaan lab, time-series grafik personal, dan riwayat MCU tahunan pribadi.
              </p>
            </button>

            {/* Tab 2: Admin DSDM */}
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-5 rounded-2xl border-2 text-left transition-all relative ${
                selectedRole === 'admin'
                  ? 'border-bi-900 bg-bi-50/50 shadow-md ring-2 ring-bi-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-900">
                  <Users className="w-5 h-5" />
                </div>
                {selectedRole === 'admin' && (
                  <CheckCircle2 className="w-5 h-5 text-bi-900" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Administrator DSDM</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Akses analitik agregat organisasi, demografi risiko, tren parameter, dan intervensi medis.
              </p>
            </button>
          </div>

          {/* Form Content Based on Selected Role */}
          <div className="max-w-xl mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-200">
            {selectedRole === 'employee' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Identitas Pegawai (50 Pegawai Terdaftar):
                  </label>
                  <div className="relative">
                    <select
                      value={selectedNip}
                      onChange={e => setSelectedNip(e.target.value)}
                      className="w-full text-xs font-bold p-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-bi-900 shadow-sm"
                    >
                      {data.pegawai.map(emp => (
                        <option key={emp.NIP} value={emp.NIP}>
                          {emp.Nama} (NIP: {emp.NIP}) — {emp.Departemen} ({emp.Jenis_Kelamin === 'L' ? 'L' : 'P'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Employee Preview Card */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-bi-900 text-white font-black text-sm flex items-center justify-center shadow">
                      {selectedEmployee.Nama.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {selectedEmployee.Nama}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>NIP: {selectedEmployee.NIP}</span>
                        <span>•</span>
                        <span className="font-semibold text-bi-800">{selectedEmployee.Departemen}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-bi-50 text-bi-900 border border-bi-200">
                    Akun Terverifikasi
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleEmployeeLogin(selectedNip)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bi-900 hover:bg-bi-800 text-white font-bold text-sm shadow-md shadow-bi-900/20 transition-all"
                >
                  <span>Masuk sebagai {selectedEmployee.Nama}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Akses Administrator Resmi DSDM</span>
                  </div>
                  <p className="text-purple-800 text-[11px] leading-relaxed">
                    Anda akan masuk sebagai Administrator Departemen Sumber Daya Manusia Bank Indonesia untuk memantau indeks kesehatan agregat seluruh 50 pegawai MCU.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAdminLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-sm shadow-md shadow-purple-900/20 transition-all"
                >
                  <span>Masuk sebagai Administrator DSDM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Access Badges */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Akses Cepat Pengujian Role Medis (One-Click Demo):</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleAdminLogin}
                className="px-2.5 py-1 text-[11px] font-semibold bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg transition-colors"
              >
                🔐 Admin DSDM
              </button>
              <button
                type="button"
                onClick={() => handleEmployeeLogin('100001')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition-colors"
              >
                👤 Pegawai 1 (Kategori Sehat)
              </button>
              <button
                type="button"
                onClick={() => handleEmployeeLogin('100003')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-red-100 hover:bg-red-200 text-red-900 rounded-lg transition-colors"
              >
                👤 Pegawai 3 (Risiko Tinggi &gt; 3 Abnormal)
              </button>
              <button
                type="button"
                onClick={() => handleEmployeeLogin('100002')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-colors"
              >
                👤 Pegawai 2 (Risiko Ringan)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
