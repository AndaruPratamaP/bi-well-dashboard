import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Users,
  Activity,
  AlertTriangle,
  Heart,
  TrendingUp,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  availableYears,
  departmentList,
  data,
  getEmployeesStatusForYear,
  getDepartmentRiskDemographics,
  getAgeGroupClassDemographics,
  getTop5AbnormalParameters,
  getAnnualParameterAverages,
  paramMap
} from '../../utils/mcuAnalytics';
import { EmployeeMCUStatus } from '../../types/mcu';

interface AdminDashboardProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  onSelectEmployee: (nip: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  selectedYear,
  onYearChange,
  onSelectEmployee
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('Semua');
  const [selectedTrendParam, setSelectedTrendParam] = useState<string>('P01'); // Default BMI
  const [showConfidentialList, setShowConfidentialList] = useState<boolean>(false);

  // 1. Filtered employee status list for selected year and dept
  const employeeStatuses: EmployeeMCUStatus[] = useMemo(() => {
    return getEmployeesStatusForYear(selectedYear, selectedDept);
  }, [selectedYear, selectedDept]);

  // Total Employees
  const totalEmployees = employeeStatuses.length;

  // Class counts (Kelas A, B, C, D)
  const kelasACount = employeeStatuses.filter(e => e.healthClass === 'Kelas A').length;
  const kelasBCount = employeeStatuses.filter(e => e.healthClass === 'Kelas B').length;
  const kelasCCount = employeeStatuses.filter(e => e.healthClass === 'Kelas C').length;
  const kelasDCount = employeeStatuses.filter(e => e.healthClass === 'Kelas D').length;

  // Self-explanatory metrics: exact percentages
  const kelasAPct = totalEmployees > 0 ? ((kelasACount / totalEmployees) * 100).toFixed(1) : '0.0';
  const kelasBPct = totalEmployees > 0 ? ((kelasBCount / totalEmployees) * 100).toFixed(1) : '0.0';
  const kelasCPct = totalEmployees > 0 ? ((kelasCCount / totalEmployees) * 100).toFixed(1) : '0.0';
  const kelasDPct = totalEmployees > 0 ? ((kelasDCount / totalEmployees) * 100).toFixed(1) : '0.0';

  // 2. Department Demographics (100% Stacked Bar Chart with Kelas A - D)
  // When selectedDept !== 'Semua', returns only that single department centered in chart
  const deptRiskStats = useMemo(() => {
    return getDepartmentRiskDemographics(selectedYear, selectedDept);
  }, [selectedYear, selectedDept]);

  const deptStackedBarOption = useMemo(() => {
    const depts = deptRiskStats.map(d => d.departemen);
    const aPcts = deptRiskStats.map(d => d.kelasAPct);
    const bPcts = deptRiskStats.map(d => d.kelasBPct);
    const cPcts = deptRiskStats.map(d => d.kelasCPct);
    const dPcts = deptRiskStats.map(d => d.kelasDPct);

    const isSingleDept = selectedDept !== 'Semua';

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const deptName = params[0].name;
          const stat = deptRiskStats.find(d => d.departemen === deptName);
          let html = `<div class="font-bold text-slate-800 mb-1.5 pb-1 border-b border-slate-200">${deptName} (Total: ${stat?.totalPegawai} Pegawai)</div>`;
          params.forEach(p => {
            const color = p.color;
            let count = 0;
            if (p.seriesName.includes('Kelas A')) count = stat?.kelasACount || 0;
            else if (p.seriesName.includes('Kelas B')) count = stat?.kelasBCount || 0;
            else if (p.seriesName.includes('Kelas C')) count = stat?.kelasCCount || 0;
            else if (p.seriesName.includes('Kelas D')) count = stat?.kelasDCount || 0;

            html += `
              <div class="flex items-center justify-between gap-4 text-xs py-0.5">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
                  <span class="text-slate-600">${p.seriesName}</span>
                </span>
                <span class="font-bold text-slate-900">${p.value}% (${count} org)</span>
              </div>
            `;
          });
          return html;
        }
      },
      legend: {
        top: 'bottom',
        data: ['Kelas A (0 Abnormal)', 'Kelas B (1 Abnormal)', 'Kelas C (2-3 Abnormal)', 'Kelas D (>3 Abnormal)'],
        textStyle: { color: '#475569', fontSize: 11 }
      },
      grid: {
        left: isSingleDept ? '20%' : '3%',
        right: isSingleDept ? '20%' : '4%',
        bottom: '14%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: depts,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#1e293b', fontWeight: 600, fontSize: isSingleDept ? 13 : 11 }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#64748b'
        },
        splitLine: { lineStyle: { stroke: '#f1f5f9', type: 'dashed' } }
      },
      series: [
        {
          name: 'Kelas A (0 Abnormal)',
          type: 'bar',
          stack: 'totalDept',
          barMaxWidth: 70,
          barWidth: isSingleDept ? 65 : undefined,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#10b981', borderRadius: [0, 0, 4, 4] },
          data: aPcts
        },
        {
          name: 'Kelas B (1 Abnormal)',
          type: 'bar',
          stack: 'totalDept',
          barMaxWidth: 70,
          barWidth: isSingleDept ? 65 : undefined,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#3b82f6' },
          data: bPcts
        },
        {
          name: 'Kelas C (2-3 Abnormal)',
          type: 'bar',
          stack: 'totalDept',
          barMaxWidth: 70,
          barWidth: isSingleDept ? 65 : undefined,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#f59e0b' },
          data: cPcts
        },
        {
          name: 'Kelas D (>3 Abnormal)',
          type: 'bar',
          stack: 'totalDept',
          barMaxWidth: 70,
          barWidth: isSingleDept ? 65 : undefined,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
          data: dPcts
        }
      ]
    };
  }, [deptRiskStats, selectedDept]);

  // 3. Age Groups vs Health Classes (100% Stacked Bar Chart)
  // Sumbu X: Usia (<30, 30<X<40, 40<X<50, 50<)
  // Sumbu Y: Persentase orang (0 - 100%)
  // Kategori Stacked: Kelas A, Kelas B, Kelas C, Kelas D
  const ageGroupClassStats = useMemo(() => {
    return getAgeGroupClassDemographics(selectedYear, selectedDept);
  }, [selectedYear, selectedDept]);

  const ageStackedBarOption = useMemo(() => {
    const ageLabels = ageGroupClassStats.map(a => a.ageGroup);
    const aPcts = ageGroupClassStats.map(a => a.kelasAPct);
    const bPcts = ageGroupClassStats.map(a => a.kelasBPct);
    const cPcts = ageGroupClassStats.map(a => a.kelasCPct);
    const dPcts = ageGroupClassStats.map(a => a.kelasDPct);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const groupName = params[0].name;
          const stat = ageGroupClassStats.find(a => a.ageGroup === groupName);
          let html = `<div class="font-bold text-slate-800 mb-1.5 pb-1 border-b border-slate-200">Rentang Usia: ${groupName} (Total: ${stat?.total} Pegawai)</div>`;
          if (!stat || stat.total === 0) {
            html += `<div class="text-xs text-slate-400 italic py-1">Tidak ada pegawai pada rentang usia ini</div>`;
            return html;
          }
          params.forEach(p => {
            const color = p.color;
            let count = 0;
            if (p.seriesName.includes('Kelas A')) count = stat.kelasACount;
            else if (p.seriesName.includes('Kelas B')) count = stat.kelasBCount;
            else if (p.seriesName.includes('Kelas C')) count = stat.kelasCCount;
            else if (p.seriesName.includes('Kelas D')) count = stat.kelasDCount;

            html += `
              <div class="flex items-center justify-between gap-4 text-xs py-0.5">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
                  <span class="text-slate-600">${p.seriesName}</span>
                </span>
                <span class="font-bold text-slate-900">${p.value}% (${count} org)</span>
              </div>
            `;
          });
          return html;
        }
      },
      legend: {
        top: 'bottom',
        data: ['Kelas A (0 Abnormal)', 'Kelas B (1 Abnormal)', 'Kelas C (2-3 Abnormal)', 'Kelas D (>3 Abnormal)'],
        textStyle: { color: '#475569', fontSize: 11 }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '14%',
        top: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ageLabels,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#1e293b', fontWeight: 600, fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#64748b'
        },
        splitLine: { lineStyle: { stroke: '#f1f5f9', type: 'dashed' } }
      },
      series: [
        {
          name: 'Kelas A (0 Abnormal)',
          type: 'bar',
          stack: 'totalAge',
          barMaxWidth: 60,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#10b981', borderRadius: [0, 0, 4, 4] },
          data: aPcts
        },
        {
          name: 'Kelas B (1 Abnormal)',
          type: 'bar',
          stack: 'totalAge',
          barMaxWidth: 60,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#3b82f6' },
          data: bPcts
        },
        {
          name: 'Kelas C (2-3 Abnormal)',
          type: 'bar',
          stack: 'totalAge',
          barMaxWidth: 60,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#f59e0b' },
          data: cPcts
        },
        {
          name: 'Kelas D (>3 Abnormal)',
          type: 'bar',
          stack: 'totalAge',
          barMaxWidth: 60,
          emphasis: { focus: 'series' },
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] },
          data: dPcts
        }
      ]
    };
  }, [ageGroupClassStats]);

  // 4. Top 5 Parameter Abnormalities (Horizontal Bar Chart)
  const top5Abnormal = useMemo(() => {
    return getTop5AbnormalParameters(selectedYear, selectedDept);
  }, [selectedYear, selectedDept]);

  const horizontalBarOption = useMemo(() => {
    // Reverse for horizontal chart display from top to bottom
    const reversed = [...top5Abnormal].reverse();
    const categories = reversed.map(t => t.nama);
    const counts = reversed.map(t => t.count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          const item = reversed[params[0].dataIndex];
          return `
            <div class="font-bold text-slate-800 mb-1 pb-1 border-b border-slate-200">${item.nama}</div>
            <div class="text-xs text-slate-600">Kategori: <span class="font-medium">${item.kategori}</span></div>
            <div class="text-xs text-slate-600">Kasus Abnormal: <span class="font-bold text-red-600">${item.count} orang</span></div>
            <div class="text-xs text-slate-600">Prevalensi: <span class="font-semibold text-slate-800">${item.percentage}% dari populasi</span></div>
          `;
        }
      },
      grid: {
        left: '4%',
        right: '12%',
        top: '6%',
        bottom: '6%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { stroke: '#f1f5f9', type: 'dashed' } }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#1e293b',
          fontWeight: 600,
          formatter: (value: string) => (value.length > 16 ? value.slice(0, 15) + '...' : value)
        }
      },
      series: [
        {
          name: 'Jumlah Kasus Abnormal',
          type: 'bar',
          data: counts,
          label: {
            show: true,
            position: 'right',
            color: '#0f172a',
            fontWeight: 700,
            formatter: '{c} kasus'
          },
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#003876' },
                { offset: 1, color: '#2563eb' }
              ]
            },
            borderRadius: [0, 6, 6, 0]
          }
        }
      ]
    };
  }, [top5Abnormal]);

  // 5. Yearly Trend Chart (Multi-Line Chart for chosen parameter)
  const annualTrends = useMemo(() => {
    return getAnnualParameterAverages(selectedTrendParam, selectedDept);
  }, [selectedTrendParam, selectedDept]);

  const trendLineOption = useMemo(() => {
    const years = annualTrends.trends.map(t => t.year.toString());
    const values = annualTrends.trends.map(t => t.avg);
    const param = annualTrends.parameter;

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          const pt = params[0];
          return `
            <div class="font-bold text-slate-800 mb-1 pb-1 border-b border-slate-200">Tahun MCU ${pt.name}</div>
            <div class="text-xs text-slate-600">${param?.Nama_Parameter} (Rata-rata): <span class="font-bold text-bi-900">${pt.value} ${param?.Satuan}</span></div>
            <div class="text-xs text-slate-500 mt-1">Rentang Normal: ${param?.Min_Normal} - ${param?.Max_Normal} ${param?.Satuan}</div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '6%',
        top: '14%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#334155', fontWeight: 600 }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748b',
          formatter: `{value} ${param?.Satuan || ''}`
        },
        splitLine: { lineStyle: { stroke: '#f1f5f9', type: 'dashed' } }
      },
      series: [
        {
          name: `Rata-rata ${param?.Nama_Parameter}`,
          type: 'line',
          data: values,
          smooth: true,
          symbolSize: 8,
          lineStyle: {
            width: 3.5,
            color: '#003876'
          },
          itemStyle: {
            color: '#003876',
            borderWidth: 2,
            borderColor: '#ffffff'
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              param?.Min_Normal !== undefined && param.Min_Normal > 0
                ? {
                    yAxis: param.Min_Normal,
                    lineStyle: { color: '#10b981', type: 'dashed', width: 1.5 },
                    label: { formatter: `Min Normal (${param.Min_Normal})`, position: 'insideEndTop', color: '#059669', fontSize: 10 }
                  }
                : null,
              param?.Max_Normal !== undefined
                ? {
                    yAxis: param.Max_Normal,
                    lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 },
                    label: { formatter: `Batas Normal (${param.Max_Normal})`, position: 'insideEndTop', color: '#dc2626', fontSize: 10 }
                  }
                : null
            ].filter(Boolean)
          }
        }
      ]
    };
  }, [annualTrends]);

  // High risk employees (Kelas D: >3 abnormal) for confidential follow-up
  const highRiskEmployees = useMemo(() => {
    return employeeStatuses.filter(e => e.healthClass === 'Kelas D');
  }, [employeeStatuses]);

  return (
    <div className="space-y-8">
      
      {/* Top Bar: Filters & Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Dashboard Agregat Kesehatan Organisasi</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-bi-50 text-bi-800 border border-bi-200">
              DSDM Confidential
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ikhtisar komprehensif profil kesehatan pegawai Bank Indonesia (Anonimitas Agregat)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Filter */}
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

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600">Departemen:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-bi-900"
            >
              <option value="Semua">Semua Departemen ({data.pegawai.length})</option>
              {departmentList.map(dept => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scorecards (Top Row) - Fully Transparent & Self-Explanatory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Pegawai Mengikuti MCU */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-bi-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pegawai MCU
            </span>
            <div className="w-9 h-9 rounded-xl bg-bi-50 flex items-center justify-center text-bi-900">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalEmployees}</span>
            <span className="text-xs font-medium text-slate-500">Pegawai</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Partisipasi MCU {selectedYear}</span>
          </div>
        </div>

        {/* Card 2: Pegawai Sehat Prima (Kelas A) - Self-Explanatory Metric */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sehat Prima (Kelas A)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{kelasAPct}%</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {kelasACount} Pegawai
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            0 parameter abnormal (Fit to Work tanpa catatan)
          </p>
        </div>

        {/* Card 3: Prevalensi Risiko Tinggi (Kelas D) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Risiko Tinggi (Kelas D)
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-600">{kelasDPct}%</span>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
              {kelasDCount} Pegawai
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            &gt;3 parameter abnormal (Perhatian khusus dokter)
          </p>
        </div>

        {/* Card 4: Distribusi Klaster Kelas A - D */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-bi-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Distribusi Klaster Pegawai
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Kelas A (0 abn):
              </span>
              <span className="font-bold text-slate-900">{kelasACount} org ({kelasAPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Kelas B (1 abn):
              </span>
              <span className="font-bold text-slate-900">{kelasBCount} org ({kelasBPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Kelas C (2-3 abn):
              </span>
              <span className="font-bold text-slate-900">{kelasCCount} org ({kelasCPct}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Kelas D (&gt;3 abn):
              </span>
              <span className="font-bold text-slate-900">{kelasDCount} org ({kelasDPct}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Visualisasi Baris 1: Demografi Departemen & Demografi Usia (Grid 2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grafik 1: Demografi Risiko per Departemen (100% Stacked Bar Chart - Fokus Single Dept when filtered) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-900">
                {selectedDept !== 'Semua' ? `Demografi Klaster: ${selectedDept}` : 'Demografi Klaster per Departemen'}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {selectedDept !== 'Semua' ? 'Fokus Departemen' : '100% Stacked Bar'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {selectedDept !== 'Semua'
                ? `Fokus analisis proporsi Kelas A s/d D untuk departemen ${selectedDept} (${deptRiskStats[0]?.totalPegawai} pegawai).`
                : 'Proporsi klaster Kelas A (Hijau), Kelas B (Biru), Kelas C (Kuning), dan Kelas D (Merah) per departemen.'}
            </p>
          </div>

          <div className="h-80 w-full">
            <ReactECharts
              option={deptStackedBarOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>

        {/* Grafik 2: Distribusi Klaster Berdasarkan Kelompok Usia (100% Stacked Bar Chart) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-900">
                Distribusi Klaster Berdasarkan Usia
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bi-50 text-bi-900 border border-bi-200">
                Kohort Usia (100% Stacked)
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sumbu X mewakili kelompok usia (&lt;30, 30&lt;X&lt;40, 40&lt;X&lt;50, 50&lt;) dan sumbu Y persentase pegawai.
            </p>
          </div>

          <div className="h-80 w-full">
            <ReactECharts
              option={ageStackedBarOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>

      </div>

      {/* Visualisasi Baris 2: Top 5 Parameter Abnormalitas & Tren Tahunan (Grid 2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grafik 3: Top 5 Parameter Abnormalitas (Horizontal Bar Chart) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-900">
                Top 5 Parameter Abnormalitas
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bi-50 text-bi-900 border border-bi-200">
                Prioritas Intervensi
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Parameter medis dengan frekuensi kasus di luar rentang rujukan tertinggi di organisasi.
            </p>
          </div>

          <div className="h-80 w-full">
            <ReactECharts
              option={horizontalBarOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>

        {/* Grafik 4: Tren Rata-rata Parameter Tahunan (Multi-Line Chart) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-bi-900" />
                <h2 className="text-base font-bold text-slate-900">
                  Tren Rata-rata Tahunan (2024 - 2026)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTrendParam}
                  onChange={e => setSelectedTrendParam(e.target.value)}
                  className="text-xs font-bold px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-bi-900 focus:outline-none focus:ring-2 focus:ring-bi-900"
                >
                  {data.parameters.map(p => (
                    <option key={p.ID_Param} value={p.ID_Param}>
                      [{p.Kategori}] {p.Nama_Parameter} ({p.Satuan})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Pantau perkembangan rata-rata indikator kesehatan pegawai dari tahun ke tahun.
            </p>
          </div>

          <div className="h-80 w-full">
            <ReactECharts
              option={trendLineOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>

      </div>

      {/* Executive Health Action & High-Risk Medical Intervention Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Daftar Pegawai Perlu Perhatian Khusus (Klaster Kelas D / &gt; 3 Parameter Abnormal)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekomendasi tindak lanjut program konsultasi dokter spesialis & wellness coaching DSDM.
            </p>
          </div>

          <button
            onClick={() => setShowConfidentialList(!showConfidentialList)}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            {showConfidentialList ? 'Sembunyikan Rincian' : `Lihat Semua (${highRiskEmployees.length} Pegawai)`}
          </button>
        </div>

        {showConfidentialList && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3">NIP & Nama</th>
                  <th className="px-4 py-3">Departemen</th>
                  <th className="px-4 py-3">Usia / Gender</th>
                  <th className="px-4 py-3 text-center">Klaster & Abnormalitas</th>
                  <th className="px-4 py-3">Parameter yang Melebihi Batas Normal</th>
                  <th className="px-4 py-3 text-center">Status Kelayakan</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {highRiskEmployees.map(emp => (
                  <tr key={emp.nip} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {emp.nama}
                      <span className="block text-[11px] font-normal text-slate-500">NIP: {emp.nip}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{emp.departemen}</td>
                    <td className="px-4 py-3">
                      {emp.usia} th ({emp.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-700 text-xs">
                        {emp.healthClass} ({emp.abnormalCount} Parameter)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {emp.abnormalParams.map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-800 border border-red-200"
                          >
                            {p.nama}: {p.nilai} {p.satuan} ({p.status})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {emp.workFitnessStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectEmployee(emp.nip)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-bi-900 bg-bi-50 hover:bg-bi-100 border border-bi-200 rounded-lg transition-colors"
                      >
                        <span>Lihat Profil</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
