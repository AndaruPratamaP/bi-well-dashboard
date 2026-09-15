import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { IndividualDashboard } from './components/individual/IndividualDashboard';
import { LoginPortal } from './components/auth/LoginPortal';
import { AuthUser } from './types/auth';
import { ShieldCheck, HeartPulse } from 'lucide-react';
import { MCUDataProvider } from './context/MCUDataContext';
import { BIWellChatbot } from './components/chat/BIWellChatbot';

const STORAGE_KEY = 'bi_well_user_session';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<'admin' | 'individual'>('admin');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedNip, setSelectedNip] = useState<string>('100001');

  // Sync state when user logs in
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (user.role === 'employee' && user.nip) {
      setSelectedNip(user.nip);
      setActiveTab('individual');
    } else {
      setActiveTab('admin');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setActiveTab('admin');
  };

  // Adjust active tab if employee role
  useEffect(() => {
    if (currentUser?.role === 'employee') {
      setActiveTab('individual');
      if (currentUser.nip) {
        setSelectedNip(currentUser.nip);
      }
    }
  }, [currentUser]);

  // Handle drill-down from admin to specific employee
  const handleSelectEmployee = (nip: string) => {
    setSelectedNip(nip);
    setActiveTab('individual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not authenticated, render Login Portal
  if (!currentUser) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  const isEmployeeRole = currentUser.role === 'employee';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedYear={selectedYear}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'admin' && !isEmployeeRole ? (
          <AdminDashboard
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            onSelectEmployee={handleSelectEmployee}
          />
        ) : (
          <IndividualDashboard
            selectedNip={selectedNip}
            onSelectNip={setSelectedNip}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            isEmployeeRole={isEmployeeRole}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-bi-900" />
            <span className="font-semibold text-slate-700">BI-WELL Platform Kesehatan Pegawai</span>
            <span>—</span>
            <span>Departemen Sumber Daya Manusia (DSDM) Bank Indonesia</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Kerahasiaan Data Medis Terjaga
            </span>
            <span>© 2026 Bank Indonesia. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Chatbot (Option C: Hybrid Copilot) */}
      <BIWellChatbot
        activeYear={selectedYear}
        currentUser={currentUser}
        selectedNip={selectedNip}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MCUDataProvider>
      <AppContent />
    </MCUDataProvider>
  );
};

export default App;
