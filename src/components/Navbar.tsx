import React from 'react';
import {
  HeartPulse,
  Users,
  User,
  LogOut,
  Database,
  RefreshCw
} from 'lucide-react';
import { AuthUser } from '../types/auth';
import { useMCUData } from '../context/MCUDataContext';

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
  const { isSyncing, cloudConnected } = useMCUData();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <img
                src="/logo-bi-well-emblem.png"
                alt="BI-WELL Logo"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-bi-950 font-sans">
                  BI-WELL
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bi-50 text-bi-900 border border-bi-200">
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

          {/* User Profile & Cloud Status */}
          <div className="flex items-center gap-3">
            {/* Cloud Sync Status Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-600">
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3 h-3 text-bi-900 animate-spin" />
                  <span>Sinkronisasi...</span>
                </>
              ) : cloudConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>Cloud Active</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Local Data</span>
                </>
              )}
            </div>
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
