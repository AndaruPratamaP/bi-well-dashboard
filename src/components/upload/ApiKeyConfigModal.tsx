import React, { useState } from 'react';
import {
  X,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  getGeminiApiKey,
  setGeminiApiKey
} from '../../lib/geminiParser';
import {
  getSupabaseCredentials,
  setSupabaseCredentials,
  testSupabaseConnection
} from '../../lib/supabase';

interface ApiKeyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ApiKeyConfigModal: React.FC<ApiKeyConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey());
  const initialSupabase = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabase.url);
  const [supabaseKey, setSupabaseKey] = useState(initialSupabase.key);

  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setTestResult(null);
    // Temporary save to test
    setSupabaseCredentials(supabaseUrl, supabaseKey);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setTestingSupabase(false);
  };

  const handleSave = () => {
    setGeminiApiKey(geminiKey);
    setSupabaseCredentials(supabaseUrl, supabaseKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaved?.();
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setGeminiKey('');
    setSupabaseUrl('');
    setSupabaseKey('');
    setGeminiApiKey('');
    setSupabaseCredentials('', '');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bi-50 flex items-center justify-center text-bi-900">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Konfigurasi Cloud & AI (Opsional)</h2>
              <p className="text-[11px] text-slate-500">Kunci disimpan aman di penyimpanan lokal browser Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Info Banner */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-bi-900 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block">100% Gratis & Bebas Overbilling</span>
              <span>
                Jika tidak diisi, sistem otomatis berjalan dalam <strong>Smart Demo Mode</strong> (simulasi ekstraksi AI & penyimpanan browser lokal).
              </span>
            </div>
          </div>

          {/* Section 1: Gemini AI Studio */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Google Gemini API Key (Free Tier)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-bi-900 hover:underline flex items-center gap-1"
              >
                <span>Dapatkan API Key Gratis</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900 font-mono text-slate-800"
            />
            <p className="text-[11px] text-slate-500">
              Digunakan untuk model <strong>Gemini 1.5 Flash</strong> membaca dokumen PDF/scan hasil lab secara otomatis.
            </p>
          </div>

          {/* Section 2: Supabase */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                Supabase PostgreSQL Cloud (Free Tier)
              </label>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">Project URL:</span>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900 font-mono text-slate-800"
              />
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">Anon Public Key:</span>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900 font-mono text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={testingSupabase || !supabaseUrl || !supabaseKey}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-colors"
              >
                {testingSupabase && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Uji Koneksi Supabase</span>
              </button>

              {testResult && (
                <div
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    testResult.ok ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate max-w-[220px]">{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Hapus Kunci
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-bi-900 hover:bg-bi-800 rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Konfigurasi</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
