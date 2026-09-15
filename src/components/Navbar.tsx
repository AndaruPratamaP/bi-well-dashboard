import React from 'react';
import { Activity, Users, User, ShieldCheck, HeartPulse, LogOut } from 'lucide-react';
import { AuthUser } from '../types/auth';

interface NavbarProps {
  activeTab: 'admin' | 'individual';
  onTabChange: (tab: 'admin' | 'individual') => void;
  selectedYear: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  selectedYear,
  currentUser,
  onLogout
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bi-900 flex items-center justify-center text-white shadow-md shadow-bi-900/20">
              <HeartPulse className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-bi-950">BI-WELL</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bi-50 text-bi-800 border border-bi-200">
                  MCU Analytics
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Bank Indonesia Employee Wellness
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Admin vs Individual) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {!isEmployee && (
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white text-bi-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Dashboard Agregat</span>
              </button>
            )}

            <button
              onClick={() => onTabChange('individual')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'individual'
                  ? 'bg-white text-bi-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isEmployee ? 'Profil Kesehatan Saya' : 'Profil Pegawai'}</span>
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-8 h-8 rounded-lg bg-bi-50 border border-bi-200 text-bi-900 flex items-center justify-center font-bold text-xs">
                  {currentUser.avatarInitials || (isAdmin ? 'AD' : 'BI')}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.nama}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isAdmin ? 'Admin DSDM' : `${currentUser.nip} • ${currentUser.departemen}`}
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Keluar / Ganti Akun"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
