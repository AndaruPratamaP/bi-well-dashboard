import React, { useState, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  User,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building,
  Search,
  Sliders,
  History,
  Info
} from 'lucide-react';
import {
  data,
  employeeMap,
  paramMap,
  calculateAge,
  availableYears,
  getEmployeesStatusForYear,
  getEmployeeQuickVitals,
  getEmployeeTimeSeries,
  getEmployeeLabTable,
  PARAMETER_EXPLANATIONS
} from '../../utils/mcuAnalytics';
import { ParamCategory } from '../../types/mcu';
import { useMCUData } from '../../context/MCUDataContext';

interface IndividualDashboardProps {
  selectedNip: string;
  onSelectNip: (nip: string) => void;
  selectedYear: number;
  onYearChange?: (year: number) => void;
  isEmployeeRole?: boolean;
}

export const IndividualDashboard: React.FC<IndividualDashboardProps> = ({
  selectedNip,
  onSelectNip,
  selectedYear,
  onYearChange,
  isEmployeeRole = false
}) => {
  const { fullData, dataRevision } = useMCUData();

  // Selected parameter for time-series chart (default: K05 SGPT (ALT) as mentioned in SDD example)
  const [selectedParamId, setSelectedParamId] = useState<string>('K05');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Fisik: true,
    Hematologi: true,
    'Kimia Darah': true
  });
  const [showHistoryColumns, setShowHistoryColumns] = useState<boolean>(true);
  const [activeTooltip, setActiveTooltip] = useState<{
    paramId: string;
    x: number;
    y: number;
  } | null>(null);

  // Automatically dismiss floating tooltip when scrolling or on Escape key
  useEffect(() => {
    const handleScroll = () => {
      if (activeTooltip) setActiveTooltip(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTooltip(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTooltip]);

  // Current employee
  const currentEmployee = useMemo(() => {
    return employeeMap.get(selectedNip) || fullData.pegawai[0] || data.pegawai[0];
  }, [selectedNip, dataRevision, fullData.pegawai]);

  // All employees for dropdown/search
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return fullData.pegawai;
    const term = searchTerm.toLowerCase();
    return fullData.pegawai.filter(
      e =>
        e.Nama.toLowerCase().includes(term) ||
        e.NIP.includes(term) ||
        e.Departemen.toLowerCase().includes(term)
    );
  }, [searchTerm, fullData.pegawai]);

  // Status for selected year
  const employeeStatus = useMemo(() => {
    const statuses = getEmployeesStatusForYear(selectedYear);
    return statuses.find(s => s.nip === currentEmployee.NIP);
  }, [currentEmployee, selectedYear, dataRevision]);

  // Quick Vitals
  const quickVitals = useMemo(() => {
    return getEmployeeQuickVitals(currentEmployee.NIP, selectedYear);
  }, [currentEmployee, selectedYear, dataRevision]);

  // Time Series Chart Data
  const timeSeriesData = useMemo(() => {
    return getEmployeeTimeSeries(currentEmployee.NIP, selectedParamId);
  }, [currentEmployee, selectedParamId, dataRevision]);

  // Collapsible Lab Tables
  const labTableCategories = useMemo(() => {
    return getEmployeeLabTable(currentEmployee.NIP, selectedYear);
  }, [currentEmployee, selectedYear, dataRevision]);

  // Toggle category collapse
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Build ECharts Option for Time Series Chart with Reference Bands
  const timeSeriesOption = useMemo(() => {
    const param = timeSeriesData.parameter;
    const series = timeSeriesData.series;

    if (!param) return {};

    // Format dates for X-Axis (e.g., "11 Mar 2024")
    const xDates = series.map(s => {
      const d = new Date(s.tanggal);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    });

    // Determine min and max for chart Y axis to give nice padding around reference bands
    const values = series.map(s => (s.nilai !== null ? s.nilai : 0));
    const allNumbers = [...values, param.Min_Normal, param.Max_Normal].filter(v => v !== null && !isNaN(v));
    const minVal = Math.min(...allNumbers);
    const maxVal = Math.max(...allNumbers);
    const yMin = Math.max(0, Math.floor(minVal * 0.8));
    const yMax = Math.ceil(maxVal * 1.2);

    // Format data points:
    // SDD Rule: "Jika titik nilai berada di dalam band hijau, titik berwarna biru. Jika titik berada di atas/bawah band hijau, titik berubah menjadi merah terang dengan label angka."
    const chartPoints = series.map(item => {
      const isNormal = item.isNormal;
      return {
        value: item.nilai,
        name: item.tanggal,
        itemStyle: {
          color: isNormal ? '#004E5B' : '#ef4444', // Dark Teal if normal, bright red if abnormal (severity preserved)
          borderColor: '#ffffff',
          borderWidth: 2
        },
        label: {
          show: !isNormal, // show label with number if abnormal
          position: 'top',
          formatter: '{c}',
          color: '#dc2626',
          fontWeight: 'bold',
          fontSize: 12,
          distance: 6
        }
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const pt = params[0];
          const item = series[pt.dataIndex];
          const isNormal = item.isNormal;
          return `
            <div class="font-bold text-slate-800 mb-1 pb-1 border-b border-slate-200">MCU: ${pt.name}</div>
            <div class="text-xs text-slate-600">Hasil: <span class="font-bold ${isNormal ? 'text-bi-900' : 'text-red-600'}">${pt.value} ${param.Satuan}</span></div>
            <div class="text-xs text-slate-600">Rentang Normal: <span class="font-semibold text-emerald-700">${param.Min_Normal} - ${param.Max_Normal} ${param.Satuan}</span></div>
            <div class="text-xs mt-1">Status: <span class="font-bold px-1.5 py-0.5 rounded text-[11px] ${isNormal ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">${item.status}</span></div>
          `;
        }
      },
      grid: {
        left: '4%',
        right: '4%',
        top: '12%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xDates,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#334155', fontWeight: 600 }
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLabel: {
          color: '#64748b',
          formatter: `{value} ${param.Satuan}`
        },
        splitLine: { lineStyle: { stroke: '#f1f5f9', type: 'dashed' } }
      },
      series: [
        {
          name: param.Nama_Parameter,
          type: 'line',
          data: chartPoints,
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: {
            width: 3,
            color: '#0E8B96' // BI-WELL Teal
          },
          // SDD Critical Rule: "Harus ada Shaded Area / Band berwarna Hijau transparan di background grafik sebagai penanda Rentang Normal"
          markArea: {
            silent: true,
            itemStyle: {
              color: 'rgba(16, 185, 129, 0.16)' // Hijau transparan lembut
            },
            data: [
              [
                {
                  name: `Rentang Normal (${param.Min_Normal} - ${param.Max_Normal} ${param.Satuan})`,
                  yAxis: param.Min_Normal,
                  label: {
                    position: 'insideTopRight',
                    color: '#059669',
                    fontSize: 11,
                    fontWeight: 600,
                    distance: 6
                  }
                },
                {
                  yAxis: param.Max_Normal
                }
              ]
            ]
          }
        }
      ]
    };
  }, [timeSeriesData]);

  // Format date to Indonesian string
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      
      {/* Top Selector & Employee Switcher Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Dashboard Time-Series Pegawai</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Personal Tracking
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perkembangan indikator kesehatan personal pegawai lintas tahun dibandingkan standar rujukan medis
          </p>
        </div>

        {/* Controls: Year & Employee Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {onYearChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Tahun MCU:</span>
              <select
                value={selectedYear}
                onChange={e => onYearChange(Number(e.target.value))}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-bi-900"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>
                    MCU {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isEmployeeRole ? (
            <>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Pilih Pegawai:</span>
              </div>
              <div className="relative">
                <select
                  value={currentEmployee.NIP}
                  onChange={e => onSelectNip(e.target.value)}
                  className="text-xs font-bold px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-bi-900 max-w-[280px] truncate"
                >
                  {filteredEmployees.map(emp => (
                    <option key={emp.NIP} value={emp.NIP}>
                      {emp.Nama} (NIP: {emp.NIP}) - {emp.Departemen}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
              <span>Data Pribadi: {currentEmployee.Nama} ({currentEmployee.NIP})</span>
            </div>
          )}
        </div>
      </div>

      {/* Header: Profile & Work Fitness Status Badge */}
      <div className="bg-gradient-to-r from-bi-900 to-bi-800 rounded-2xl p-6 text-white shadow-lg shadow-bi-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Avatar & Identitas */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white text-2xl font-black shadow-inner">
              {currentEmployee.Nama.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {currentEmployee.Nama}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                  {currentEmployee.Jenis_Kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bi-100">
                <span className="flex items-center gap-1.5">
                  <span className="text-bi-300">NIP:</span>
                  <span className="font-semibold text-white">{currentEmployee.NIP}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-bi-300" />
                  <span className="font-semibold text-white">{currentEmployee.Departemen}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-bi-300" />
                  <span>Usia: {calculateAge(currentEmployee.Tanggal_Lahir, selectedYear)} tahun ({formatIndoDate(currentEmployee.Tanggal_Lahir)})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Klaster Kesehatan Pegawai */}
          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-bi-200 font-medium mb-1.5">
              Klaster MCU ({selectedYear})
            </span>
            <div className="flex items-center gap-2">
              <div className={`px-4 py-2 rounded-xl text-base font-extrabold border backdrop-blur flex items-center gap-2.5 shadow-sm ${
                employeeStatus?.healthClass === 'Kelas A'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                  : employeeStatus?.healthClass === 'Kelas B'
                  ? 'bg-blue-500/20 border-blue-400/40 text-blue-100'
                  : employeeStatus?.healthClass === 'Kelas C'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                  : 'bg-red-500/20 border-red-400/40 text-red-100'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  employeeStatus?.healthClass === 'Kelas A'
                    ? 'bg-emerald-400'
                    : employeeStatus?.healthClass === 'Kelas B'
                    ? 'bg-blue-400'
                    : employeeStatus?.healthClass === 'Kelas C'
                    ? 'bg-amber-400'
                    : 'bg-red-400'
                }`}></span>
                <span>{employeeStatus?.healthClass || 'Kelas A'}</span>
              </div>
            </div>
            <span className="text-[11px] text-bi-200 mt-1.5">
              {employeeStatus?.abnormalCount === 0
                ? 'Semua indikator dalam rentang rujukan'
                : `${employeeStatus?.abnormalCount} indikator di luar rentang rujukan`}
            </span>
          </div>

        </div>
      </div>

      {/* Quick Vitals (4 Cards) with YoY Trend Arrows */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Quick Vitals (Metrik Utama MCU Terkini)</span>
            <span className="text-xs font-normal text-slate-500">
              Dibandingkan MCU {selectedYear - 1}
            </span>
          </h3>
          <span className="text-[11px] text-slate-400">
            *Panah merah naik, panah hijau turun vs tahun lalu
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickVitals.map((vital, idx) => {
            const isAbnormal = vital.status !== 'Normal';
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-sm ${
                  isAbnormal ? 'border-red-300 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 line-clamp-1">
                    {vital.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isAbnormal ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {vital.status}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {vital.formattedDisplay || vital.currentValue}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{vital.unit}</span>
                </div>

                {/* Trend Arrow (SDD Rule: panah merah ke atas jika naik, panah hijau ke bawah jika turun) */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {vital.isUp ? (
                      <span className="inline-flex items-center font-bold text-red-600">
                        <ArrowUp className="w-3.5 h-3.5 mr-0.5" />
                        +{Math.abs(vital.delta || 0)} {vital.unit}
                      </span>
                    ) : vital.isDown ? (
                      <span className="inline-flex items-center font-bold text-emerald-600">
                        <ArrowDown className="w-3.5 h-3.5 mr-0.5" />
                        -{Math.abs(vital.delta || 0)} {vital.unit}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Tetap (0.0)</span>
                    )}
                    <span className="text-slate-400 text-[10px]">vs {selectedYear - 1}</span>
                  </div>

                  <span className="text-[10px] text-slate-400">Ruj: {vital.refRange}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visualisasi Time-Series Chart (Line Chart with Reference Bands) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-bi-900" />
              <h2 className="text-base font-bold text-slate-900">
                Interactive Time-Series Chart (Riwayat Lab & Rentang Normal)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Area hijau transparan menunjukkan batas normal rujukan medis. Titik biru = normal, titik merah terang = di luar batas.
            </p>
          </div>

          {/* Parameter Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Pilih Parameter:</span>
            <select
              value={selectedParamId}
              onChange={e => setSelectedParamId(e.target.value)}
              className="text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-bi-900 focus:outline-none focus:ring-2 focus:ring-bi-900"
            >
              <optgroup label="Kimia Darah">
                {data.parameters
                  .filter(p => p.Kategori === 'Kimia Darah')
                  .map(p => (
                    <option key={p.ID_Param} value={p.ID_Param}>
                      {p.Nama_Parameter} ({p.Satuan})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Fisik">
                {data.parameters
                  .filter(p => p.Kategori === 'Fisik')
                  .map(p => (
                    <option key={p.ID_Param} value={p.ID_Param}>
                      {p.Nama_Parameter} ({p.Satuan})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Hematologi">
                {data.parameters
                  .filter(p => p.Kategori === 'Hematologi')
                  .map(p => (
                    <option key={p.ID_Param} value={p.ID_Param}>
                      {p.Nama_Parameter} ({p.Satuan})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* ECharts Chart Container */}
        <div className="h-80 w-full">
          <ReactECharts
            option={timeSeriesOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>

      {/* Data Table: Collapsible per Category (SDD Rule) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rincian Hasil Laboratorium Lengkap ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tabel collapsible per kategori. Nilai di luar rentang rujukan dicetak tebal dengan warna merah.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoryColumns(!showHistoryColumns)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showHistoryColumns ? 'Tampilkan 1 Tahun Saja' : 'Bandingkan 3 Tahun (2024 - 2026)'}</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {labTableCategories.map(catGroup => {
            const isExpanded = expandedCategories[catGroup.kategori] ?? true;
            const categoryAbnormals = catGroup.rows.filter(r => r.isAbnormal).length;

            return (
              <div key={catGroup.kategori} className="transition-colors">
                {/* Category Header (Click to Expand / Collapse) */}
                <button
                  onClick={() => toggleCategory(catGroup.kategori)}
                  className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-800">
                      {catGroup.kategori}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({catGroup.rows.length} parameter)
                    </span>
                    {categoryAbnormals > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                        {categoryAbnormals} Catatan
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
                        <tr>
                          <th className="px-5 py-3">Jenis Pemeriksaan</th>
                          {showHistoryColumns ? (
                            <>
                              <th className={`px-4 py-3 text-center ${selectedYear === 2024 ? 'bg-bi-100/70 font-black text-bi-950 border-x border-bi-200' : ''}`}>
                                Hasil 2024
                              </th>
                              <th className={`px-4 py-3 text-center ${selectedYear === 2025 ? 'bg-bi-100/70 font-black text-bi-950 border-x border-bi-200' : ''}`}>
                                Hasil 2025
                              </th>
                              <th className={`px-4 py-3 text-center ${selectedYear === 2026 ? 'bg-bi-100/70 font-black text-bi-950 border-x border-bi-200' : ''}`}>
                                Hasil 2026
                              </th>
                            </>
                          ) : (
                            <th className="px-4 py-3 text-center bg-bi-50/50">Hasil {selectedYear}</th>
                          )}
                          <th className="px-4 py-3 text-center">Nilai Rujukan</th>
                          <th className="px-4 py-3 text-center">Satuan</th>
                          <th className="px-4 py-3 text-center">Status ({selectedYear})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {catGroup.rows.map(row => {
                          const isCurrentAbnormal = row.isAbnormal;
                          const hist2024 = row.history.find(h => h.tahun === 2024);
                          const hist2025 = row.history.find(h => h.tahun === 2025);
                          const hist2026 = row.history.find(h => h.tahun === 2026);
                          const paramInfo = PARAMETER_EXPLANATIONS[row.idParam];

                          return (
                            <tr
                              key={row.idParam}
                              className={`hover:bg-slate-50 transition-colors ${
                                isCurrentAbnormal ? 'bg-red-50/30' : ''
                              }`}
                            >
                              <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span>{row.namaParameter}</span>
                                  {paramInfo && (
                                    <button
                                      type="button"
                                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
                                        activeTooltip?.paramId === row.idParam
                                          ? 'bg-bi-700 text-white ring-2 ring-bi-200'
                                          : 'bg-slate-100 hover:bg-bi-100 text-slate-400 hover:text-bi-700'
                                      }`}
                                      onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setActiveTooltip({
                                          paramId: row.idParam,
                                          x: rect.right + 10,
                                          y: rect.top + rect.height / 2
                                        });
                                      }}
                                      onMouseLeave={() => setActiveTooltip(null)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        if (activeTooltip?.paramId === row.idParam) {
                                          setActiveTooltip(null);
                                        } else {
                                          setActiveTooltip({
                                            paramId: row.idParam,
                                            x: rect.right + 10,
                                            y: rect.top + rect.height / 2
                                          });
                                        }
                                      }}
                                      aria-label={`Informasi medis ${row.namaParameter}`}
                                    >
                                      <Info className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {showHistoryColumns ? (
                                <>
                                  <td
                                    className={`px-4 py-3 text-center ${
                                      hist2024?.status !== 'Normal' ? 'font-extrabold text-red-600' : 'text-slate-700 font-medium'
                                    } ${selectedYear === 2024 ? 'bg-bi-50/50 border-x border-bi-100 font-bold' : ''}`}
                                  >
                                    {hist2024 ? hist2024.nilai : '-'}
                                  </td>
                                  <td
                                    className={`px-4 py-3 text-center ${
                                      hist2025?.status !== 'Normal' ? 'font-extrabold text-red-600' : 'text-slate-700 font-medium'
                                    } ${selectedYear === 2025 ? 'bg-bi-50/50 border-x border-bi-100 font-bold' : ''}`}
                                  >
                                    {hist2025 ? hist2025.nilai : '-'}
                                  </td>
                                  <td
                                    className={`px-4 py-3 text-center ${
                                      hist2026?.status !== 'Normal' ? 'font-extrabold text-red-600' : 'text-slate-700 font-medium'
                                    } ${selectedYear === 2026 ? 'bg-bi-50/50 border-x border-bi-100 font-bold' : ''}`}
                                  >
                                    {hist2026 ? hist2026.nilai : '-'}
                                  </td>
                                </>
                              ) : (
                                <td
                                  className={`px-4 py-3 text-center ${
                                    isCurrentAbnormal
                                      ? 'font-extrabold text-red-600 text-sm bg-red-100/50'
                                      : 'font-bold text-slate-900 bg-bi-50/30'
                                  }`}
                                >
                                  {row.hasilTerpilih}
                                </td>
                              )}

                              <td className="px-4 py-3 text-center text-slate-600 font-medium">
                                {row.nilaiRujukan}
                              </td>

                              <td className="px-4 py-3 text-center text-slate-500">
                                {row.satuan}
                              </td>

                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                    row.status === 'Normal'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {row.status === 'High' ? 'H (High)' : row.status === 'Low' ? 'L (Low)' : 'Normal'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Medical Explanation Card (Positioned fixed so it is never clipped by overflow-hidden or tables) */}
      {activeTooltip && PARAMETER_EXPLANATIONS[activeTooltip.paramId] && (() => {
        const info = PARAMETER_EXPLANATIONS[activeTooltip.paramId];
        const cardHeight = 220;
        const cardWidth = 320;
        
        let top = activeTooltip.y - 70;
        if (typeof window !== 'undefined') {
          if (top + cardHeight > window.innerHeight - 16) {
            top = window.innerHeight - cardHeight - 16;
          }
          if (top < 16) top = 16;
        }

        let left = activeTooltip.x;
        if (typeof window !== 'undefined' && left + cardWidth > window.innerWidth - 16) {
          left = activeTooltip.x - cardWidth - 24;
        }

        return (
          <div
            style={{
              position: 'fixed',
              top: `${top}px`,
              left: `${left}px`,
              zIndex: 99999
            }}
            className="w-80 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 pointer-events-none transition-all duration-150"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-700 pb-2 mb-2.5">
              <div>
                <div className="text-xs font-bold text-bi-200 leading-snug">{info.fullName}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Kode: <span className="font-semibold text-slate-300">{activeTooltip.paramId}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bi-700 text-white whitespace-nowrap shadow-sm">
                Info Medis
              </span>
            </div>

            <p className="text-[11px] text-slate-200 leading-relaxed mb-3 font-normal">
              {info.explanation}
            </p>

            <div className="text-[10px] text-emerald-300 font-medium bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-700/60 flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓ Rujukan:</span>
              <span className="leading-snug">{info.normalInfo}</span>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
