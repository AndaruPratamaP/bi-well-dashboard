import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { ExtractedMCUData, STANDARD_PARAMS, computeParamStatus } from '../../lib/geminiParser';
import { ParamStatus } from '../../types/mcu';

interface DocumentReviewProps {
  extractedData: ExtractedMCUData;
  file: File | null;
  onConfirm: (data: ExtractedMCUData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const DocumentReview: React.FC<DocumentReviewProps> = ({
  extractedData,
  file,
  onConfirm,
  onCancel,
  isSaving
}) => {
  // Local editable state
  const [nip, setNip] = useState(extractedData.pegawai.nip);
  const [nama, setNama] = useState(extractedData.pegawai.nama);
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>(extractedData.pegawai.jenisKelamin);
  const [tanggalLahir, setTanggalLahir] = useState(extractedData.pegawai.tanggalLahir);
  const [departemen, setDepartemen] = useState(extractedData.pegawai.departemen);
  const [tanggalMcu, setTanggalMcu] = useState(extractedData.mcu.tanggalMcu);

  // Editable parameters
  const [params, setParams] = useState(extractedData.parameters);

  // Preview URL for image files
  const filePreviewUrl = useMemo(() => {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // Clean up object URL
  React.useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Handle value change for a specific parameter
  const handleParamValueChange = (idParam: string, rawVal: string) => {
    const num = parseFloat(rawVal);
    const std = STANDARD_PARAMS.find(s => s.idParam === idParam);
    const min = std ? std.min : 0;
    const max = std ? std.max : 100;

    setParams(prev =>
      prev.map(p => {
        if (p.idParam === idParam) {
          const validNum = isNaN(num) ? 0 : num;
          const status: ParamStatus = computeParamStatus(validNum, min, max);
          return {
            ...p,
            nilai: validNum,
            status
          };
        }
        return p;
      })
    );
  };

  // Counts of abnormal / out-of-range parameters
  const abnormalCount = useMemo(() => {
    return params.filter(p => p.status !== 'Normal').length;
  }, [params]);

  const handleSave = () => {
    const finalData: ExtractedMCUData = {
      pegawai: {
        nip: nip.trim() || '100037',
        nama: nama.trim() || 'Pegawai Baru',
        jenisKelamin,
        tanggalLahir: tanggalLahir || '1990-01-01',
        departemen: departemen || 'DSDM'
      },
      mcu: {
        tanggalMcu: tanggalMcu || new Date().toISOString().split('T')[0],
        tahun: parseInt((tanggalMcu || '').split('-')[0], 10) || 2026
      },
      parameters: params,
      confidenceScore: extractedData.confidenceScore,
      catatanKlinis: extractedData.catatanKlinis
    };

    onConfirm(finalData);
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Top Banner: Verification Notice */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Human-in-the-Loop Verification</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Akurasi AI: {extractedData.confidenceScore}%
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Tinjau dan koreksi angka hasil ekstraksi dokumen sebelum dimasukkan secara resmi ke populasi data MCU organisasi.
            </p>
          </div>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2 self-start sm:self-auto">
          <AlertTriangle className={`w-4 h-4 ${abnormalCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          <span>
            {abnormalCount === 0
              ? 'Semua Parameter Normal'
              : `${abnormalCount} Parameter di Luar Rujukan`}
          </span>
        </div>
      </div>

      {/* Main Grid: Split Screen (Left: Document Preview, Right: Editable Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[460px]">
        {/* Left Column: Document File Info & Visual Preview (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Pratinjau Berkas Asli
            </span>

            {/* File details card */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bi-50 flex items-center justify-center text-bi-900 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {file?.name || 'Dokumen_MCU_Hasil_Lab.pdf'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Dokumen Medis'} • Terverifikasi Optik
                </span>
              </div>
            </div>

            {/* Image preview or PDF Placeholder */}
            {filePreviewUrl ? (
              <div className="rounded-xl border border-slate-300 overflow-hidden bg-white max-h-72 flex items-center justify-center">
                <img
                  src={filePreviewUrl}
                  alt="Dokumen Lab MCU"
                  className="object-contain max-h-72 w-full"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 bg-white flex flex-col items-center justify-center text-center space-y-2">
                <FileText className="w-12 h-12 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Format Dokumen PDF</span>
                <span className="text-[11px] text-slate-500 max-w-xs">
                  Seluruh halaman dokumen telah dipindai dan dikonversi menjadi data teks oleh AI.
                </span>
              </div>
            )}

            {/* AI Notes */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-bi-900" />
                <span>Catatan Ekstraksi:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                {extractedData.catatanKlinis || 'Data parameter telah dicocokkan dengan standar 11 indikator BI-WELL.'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kerahasiaan data terlindungi enkripsi internal</span>
          </div>
        </div>

        {/* Right Column: Editable Employee Profile & Lab Parameters (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-5 overflow-y-auto max-h-[600px]">
          {/* Section A: Identitas Pegawai */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              1. Identitas Pegawai & Tanggal MCU
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Pegawai:</label>
                <input
                  type="text"
                  value={nip}
                  onChange={e => setNip(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Departemen:</label>
                <select
                  value={departemen}
                  onChange={e => setDepartemen(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900"
                >
                  <option value="DKEM">DKEM</option>
                  <option value="DEIH">DEIH</option>
                  <option value="DSDM">DSDM</option>
                  <option value="BINS">BINS</option>
                  <option value="DPD">DPD</option>
                  <option value="DKOM">DKOM</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Kelamin:</label>
                <select
                  value={jenisKelamin}
                  onChange={e => setJenisKelamin(e.target.value as 'L' | 'P')}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Lahir:</label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={e => setTanggalLahir(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal MCU:</label>
                <input
                  type="date"
                  value={tanggalMcu}
                  onChange={e => setTanggalMcu(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-bi-900 text-bi-900"
                />
              </div>
            </div>
          </div>

          {/* Section B: Tabel 11 Parameter Klinis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Rincian 11 Parameter Hasil Laboratorium
              </h4>
              <span className="text-[11px] text-slate-500">
                Nilai dapat disesuaikan langsung jika diperlukan
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5">Parameter</th>
                    <th className="px-3 py-2.5 text-center">Nilai Hasil</th>
                    <th className="px-3 py-2.5 text-center">Satuan</th>
                    <th className="px-3 py-2.5 text-center">Rentang Rujukan</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {params.map(p => {
                    const isAbnormal = p.status !== 'Normal';
                    return (
                      <tr
                        key={p.idParam}
                        className={`transition-colors ${
                          isAbnormal ? 'bg-amber-50/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-3 py-2 font-medium text-slate-800">
                          <span>{p.nama}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">[{p.idParam}]</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={p.nilai}
                            onChange={e => handleParamValueChange(p.idParam, e.target.value)}
                            className={`w-20 text-center text-xs font-bold px-2 py-1 rounded-lg border ${
                              isAbnormal
                                ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500'
                                : 'border-slate-300 bg-white text-slate-800 focus:ring-bi-900'
                            } focus:outline-none focus:ring-2`}
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-[11px] text-slate-500 font-mono">
                          {p.satuan}
                        </td>
                        <td className="px-3 py-2 text-center text-[11px] text-slate-600">
                          {p.rujukan}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Normal'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : p.status === 'High'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Batal / Unggah Berkas Lain</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-bi-900 hover:bg-bi-800 rounded-xl shadow-md transition-all disabled:opacity-50 hover:shadow-lg"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyimpan ke Database...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi & Simpan ke Database</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
