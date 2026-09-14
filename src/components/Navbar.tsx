import React from 'react';
import { Activity, Users, User, ShieldCheck, Printer, HeartPulse, LogOut } from 'lucide-react';
import { AuthUser } from '../types/auth';

interface NavbarProps {
  activeTab: 'admin' | 'individual';
  onTabChange: (tab: 'admin' | 'individual') => void;
  selectedYear: number;
  currentUser: AuthUser;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  selectedYear,
  currentUser,
  onLogout
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-bi-900 flex items-center justify-center text-white shadow-md shadow-bi-900/20 flex-shrink-0">
              <HeartPulse className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-bi-900">
                  BI-WELL
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bi-50 text-bi-800 border border-bi-200 hidden sm:inline">
                  v2.0 MCU
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 hidden md:block">
                Bank Indonesia Wellness & Health Platform
              </p>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          {isAdmin ? (
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'bg-bi-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-bi-900 hover:bg-white/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Admin DSDM</span>
              </button>
              <button
                onClick={() => onTabChange('individual')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'individual'
                    ? 'bg-bi-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-bi-900 hover:bg-white/60'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Data Pegawai</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Portal Kesehatan Pribadi</span>
            </div>
          )}

          {/* Right User Status & Actions */}
          <div className="flex items-center gap-3">
            {/* User Profile Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className={`w-7 h-7 rounded-lg text-white font-black text-xs flex items-center justify-center ${
                isAdmin ? 'bg-purple-800' : 'bg-bi-900'
              }`}>
                {isAdmin ? 'AD' : (currentUser.avatarInitials || 'P')}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.nama}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isAdmin ? 'Admin DSDM' : `${currentUser.nip} • ${currentUser.departemen}`}
                </div>
              </div>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              title="Cetak atau Simpan Laporan PDF"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Keluar / Ganti Akun"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
