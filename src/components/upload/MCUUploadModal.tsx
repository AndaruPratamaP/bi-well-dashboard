import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  FileX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Database,
  Key,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Zap
} from 'lucide-react';
import {
  parseMCUDocumentWithGemini,
  ExtractedMCUData,
  getGeminiApiKey,
  generateSimulatedExtraction,
  InvalidDocumentError
} from '../../lib/geminiParser';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useMCUData } from '../../context/MCUDataContext';
import { DocumentReview } from './DocumentReview';
import { ApiKeyConfigModal } from './ApiKeyConfigModal';
import { Pegawai, MCURecord, MCUDetail } from '../../types/mcu';

interface MCUUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (nip: string) => void;
}

export const MCUUploadModal: React.FC<MCUUploadModalProps> = ({
  isOpen,
  onClose,
  onSelectEmployee
}) => {
  const { addMCURecord, totalEmployeesCount } = useMCUData();

  const [step, setStep] = useState<'upload' | 'scanning' | 'review' | 'success' | 'rejected'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedMCUData | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('Memulai pemindaian...');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedNip, setSavedNip] = useState<string>('');
  const [savedName, setSavedName] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const hasGeminiKey = Boolean(getGeminiApiKey());
  const hasSupabase = isSupabaseConfigured();

  // Reset modal state
  const handleResetModal = () => {
    setStep('upload');
    setFile(null);
    setExtractedData(null);
    setScanMessage('');
    setRejectionReason('');
    setIsSaving(false);
  };

  const handleClose = () => {
    handleResetModal();
    onClose();
  };

  // Start scanning process
  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setStep('scanning');
    setScanMessage('Memvalidasi dan menganalisis berkas dokumen...');

    try {
      const result = await parseMCUDocumentWithGemini(selectedFile, msg => {
        setScanMessage(msg);
      });
      setExtractedData(result);
      setStep('review');
    } catch (err: any) {
      console.error('Scan error:', err);
      const isInvalidDoc = err instanceof InvalidDocumentError || err.name === 'InvalidDocumentError';
      const isRateLimit =
        err.message?.includes('Rate Limit') ||
        err.message?.includes('429') ||
        err.message?.toLowerCase().includes('quota');

      const reasonMsg = isInvalidDoc
        ? err.message
        : isRateLimit
        ? 'Batas kuota gratis Google AI Studio (15 permintaan/menit) sedang terlampaui (Rate Limit). Silakan tunggu sekitar 60 detik agar kuota pulih otomatis, atau gunakan tombol "Uji Contoh Lab Medis Cepat" di bawah untuk demonstrasi instan tanpa memakan kuota.'
        : `Pemeriksaan dokumen tidak dapat diselesaikan: ${err.message || 'Format berkas tidak sesuai atau terjadi kendala saat verifikasi.'}`;
      setRejectionReason(reasonMsg);
      setStep('rejected');
    }
  };

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Fast Demo: One-click simulate
  const handleFastDemo = () => {
    const dummyFile = new File(['Dummy Lab Result'], 'Hasil_Lab_MCU_Prodia_2026.pdf', {
      type: 'application/pdf'
    });
    setFile(dummyFile);
    setStep('scanning');
    setScanMessage('Memproses dokumen contoh lab MCU...');
    setTimeout(() => {
      const fallback = generateSimulatedExtraction(dummyFile.name);
      setExtractedData(fallback);
      setStep('review');
    }, 1000);
  };

  // Handle final submission from DocumentReview
  const handleConfirmSave = async (data: ExtractedMCUData) => {
    setIsSaving(true);

    try {
      const pegawai: Pegawai = {
        NIP: data.pegawai.nip,
        Nama: data.pegawai.nama,
        Jenis_Kelamin: data.pegawai.jenisKelamin,
        Tanggal_Lahir: data.pegawai.tanggalLahir,
        Departemen: data.pegawai.departemen
      };

      const idMcu = `MCU_${data.pegawai.nip}_${data.mcu.tahun}`;
      const record: MCURecord = {
        ID_MCU: idMcu,
        NIP: data.pegawai.nip,
        Tanggal_MCU: data.mcu.tanggalMcu,
        Tahun: data.mcu.tahun
      };

      const details: MCUDetail[] = data.parameters.map((p, idx) => ({
        ID_Detail: `DET_${idMcu}_${idx + 1}`,
        ID_MCU: idMcu,
        ID_Param: p.idParam,
        Nilai_Hasil: p.nilai,
        Status: p.status
      }));

      await addMCURecord(pegawai, record, details);

      setSavedNip(data.pegawai.nip);
      setSavedName(data.pegawai.nama);
      setStep('success');
    } catch (err: any) {
      alert(`Gagal menyimpan data: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-bi-50 flex items-center justify-center p-1.5 border border-bi-200 shadow-2xs">
                <img src="/logo-bi-well-emblem.png" alt="BI-WELL" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Ekstraksi Dokumen MCU Berbasis AI</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bi-50 text-bi-900 border border-bi-200">
                    Gemini Flash Vision
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Unggah berkas hasil laboratorium (PDF / Foto Scan) untuk diekstrak otomatis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConfigOpen(true)}
                title="Pengaturan API & Database Cloud"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors border border-slate-200"
              >
                <Key className="w-3.5 h-3.5 text-bi-900" />
                <span className="hidden sm:inline">Konfigurasi API</span>
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* STEP 1: Upload File */}
            {step === 'upload' && (
              <div className="space-y-6">
                {/* Status Pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                    <span
                      className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    />
                    <span>
                      {hasGeminiKey
                        ? 'Google Gemini Flash: Terhubung'
                        : 'Google Gemini: Smart Demo Mode (Gratis)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                    <Database className="w-3 h-3 text-emerald-600" />
                    <span>
                      {hasSupabase
                        ? 'Supabase Cloud: Terhubung'
                        : 'Penyimpanan: Browser LocalStorage'}
                    </span>
                  </div>
                </div>

                {/* Dropzone Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    dragActive
                      ? 'border-bi-600 bg-bi-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-bi-400 hover:bg-slate-50/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <div className="w-16 h-16 rounded-2xl bg-bi-50 flex items-center justify-center text-bi-900 mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-8 h-8 text-bi-900" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Tarik dan lepaskan berkas MCU di sini
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    Mendukung berkas <strong>PDF hasil laboratorium</strong> multi-halaman atau foto scan (PNG, JPG) hingga 20 MB.
                  </p>

                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-bold text-bi-900 bg-white border border-bi-200 rounded-xl shadow-sm hover:bg-bi-50 transition-colors"
                  >
                    Pilih Berkas dari Komputer
                  </button>
                </div>

                {/* One-click Demo Button */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Ingin demonstrasi cepat tanpa mencari file?
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Gunakan contoh dokumen lab medis 1-klik untuk menguji alur ekstraksi AI & review seketika.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFastDemo}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-bi-900" />
                    <span>Uji Contoh Lab Cepat</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Scanning in Progress */}
            {step === 'scanning' && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
                {/* Modern Pulse Animation */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-bi-50 flex items-center justify-center text-bi-900 shadow-inner">
                    <Sparkles className="w-10 h-10 animate-pulse text-bi-900" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-bi-400 animate-ping opacity-30" />
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-base font-bold text-slate-900">
                    AI Sedang Menganalisis Dokumen Medis
                  </h3>
                  <p className="text-xs text-slate-600 min-h-[20px] font-medium transition-all">
                    {scanMessage}
                  </p>
                </div>

                {/* Progress Checklist */}
                <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Membaca teks optik (OCR Vision)</span>
                  </div>
                  <div className="flex items-center gap-2 text-bi-900 font-semibold">
                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                    <span>Mengekstrak 11 parameter laboratorium</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-medium">
                    <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Menghitung rentang rujukan klinis</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Human-in-the-loop Review */}
            {step === 'review' && extractedData && (
              <DocumentReview
                extractedData={extractedData}
                file={file}
                onConfirm={handleConfirmSave}
                onCancel={handleResetModal}
                isSaving={isSaving}
              />
            )}

            {/* STEP 4: Success Message */}
            {step === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-bold text-slate-900">
                    Data MCU Berhasil Disimpan!
                  </h3>
                  <p className="text-xs text-slate-600">
                    Rekam medis atas nama <strong>{savedName}</strong> (NIP: {savedNip}) telah ditambahkan ke database populasi organisasi.
                  </p>
                </div>

                {/* Info Card */}
                <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Total Populasi Pegawai:</span>
                    <span className="font-bold text-slate-900">{totalEmployeesCount} Pegawai</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500">Status Penyimpanan:</span>
                    <span className="font-bold text-emerald-700">
                      {hasSupabase ? 'Tersinkron ke Supabase Cloud' : 'Tersimpan di Browser Local'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Visualisasi Dashboard:</span>
                    <span className="font-bold text-bi-900">Grafik Terupdate Otomatis</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleResetModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
                  >
                    Unggah Dokumen Lain
                  </button>

                  {onSelectEmployee && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onSelectEmployee(savedNip);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-bi-900 hover:bg-bi-800 rounded-xl shadow transition-colors"
                    >
                      <span>Lihat Profil Pegawai</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Document Rejected (Not an MCU file or invalid) */}
            {step === 'rejected' && (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                  <FileX className="w-10 h-10 text-red-600" />
                </div>

                <div className="space-y-2 max-w-lg">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    Validasi Medis Gagal
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    Dokumen Ditolak: Bukan Berkas MCU yang Sah
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    AI mendeteksi bahwa berkas yang Anda unggah tidak memenuhi kriteria dokumen rekam medis atau lembar laboratorium MCU pegawai.
                  </p>
                </div>

                {/* Reason Card */}
                <div className="w-full max-w-lg bg-red-50/60 border border-red-200 rounded-2xl p-4 text-xs text-left space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-red-900 pb-2 border-b border-red-200/60">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Hasil Analisis AI:</span>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed font-medium">
                    {rejectionReason}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-red-200/40">
                    Berkas: <strong>{file?.name}</strong> ({file ? `${(file.size / 1024).toFixed(1)} KB` : ''})
                  </div>
                </div>

                {/* Guidance Card */}
                <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 text-left flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-bi-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-800">Kriteria Dokumen yang Didukung:</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Unggah berkas PDF atau foto scan hasil laboratorium resmi (seperti Prodia, Kimia Farma, atau RS rekanan) yang memuat nama pasien dan nilai parameter medis (Hematologi, Kimia Darah, atau Tanda Vital).
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-bi-900 hover:bg-bi-800 rounded-xl shadow transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Pilih Berkas MCU Lain</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFastDemo}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-bi-900" />
                    <span>Uji Contoh Lab Medis Cepat</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Key & Cloud Config Modal */}
      <ApiKeyConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
};
