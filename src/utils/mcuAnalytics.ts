import mcuRawData from '../data/mcuData.json';
import {
  MCUFullData,
  Pegawai,
  ParameterReferensi,
  MCURecord,
  MCUDetail,
  RiskLevel,
  WorkFitnessStatus,
  EmployeeMCUStatus,
  DepartmentRiskStats,
  AbnormalParamStats,
  QuickVital
} from '../types/mcu';

export const data: MCUFullData = mcuRawData as MCUFullData;

// Map for quick parameter lookup
export const paramMap = new Map<string, ParameterReferensi>();
data.parameters.forEach(p => paramMap.set(p.ID_Param, p));

// Map for employee lookup
export const employeeMap = new Map<string, Pegawai>();
data.pegawai.forEach(e => employeeMap.set(e.NIP, e));

// Calculate age from birthdate
export function calculateAge(birthDateStr: string, asOfYear: number = 2026): number {
  const birthYear = parseInt(birthDateStr.split('-')[0], 10);
  return asOfYear - birthYear;
}

// Get all unique departments
export const departmentList = Array.from(new Set(data.pegawai.map(e => e.Departemen))).sort();

// Get all unique MCU years
export const availableYears = Array.from(new Set(data.mcu_records.map(r => r.Tahun))).sort((a, b) => b - a);

/**
 * Get full MCU details for a specific record
 */
export function getRecordDetails(mcuId: string): MCUDetail[] {
  return data.mcu_details.filter(d => d.ID_MCU === mcuId);
}

/**
 * Classify risk level based on abnormal count
 */
export function getRiskLevel(abnormalCount: number): RiskLevel {
  if (abnormalCount === 0) return 'Sehat';
  if (abnormalCount <= 3) return 'Risiko Ringan';
  return 'Risiko Tinggi';
}

/**
 * Determine work fitness status
 */
export function getWorkFitnessStatus(abnormalCount: number): WorkFitnessStatus {
  if (abnormalCount === 0) return 'Fit to Work';
  if (abnormalCount <= 3) return 'Fit to Work with Note';
  return 'Unfit';
}

/**
 * Get employee status list for a specific year and optional department filter
 */
export function getEmployeesStatusForYear(
  year: number,
  departmentFilter?: string
): EmployeeMCUStatus[] {
  // Find MCU records for the specified year
  const records = data.mcu_records.filter(r => r.Tahun === year);

  const results: EmployeeMCUStatus[] = [];

  for (const record of records) {
    const employee = employeeMap.get(record.NIP);
    if (!employee) continue;

    if (departmentFilter && departmentFilter !== 'Semua' && employee.Departemen !== departmentFilter) {
      continue;
    }

    const details = getRecordDetails(record.ID_MCU);
    const abnormalDetails = details.filter(d => d.Status !== 'Normal');

    const abnormalParams = abnormalDetails.map(d => {
      const p = paramMap.get(d.ID_Param)!;
      return {
        nama: p ? p.Nama_Parameter : d.ID_Param,
        nilai: d.Nilai_Hasil,
        satuan: p ? p.Satuan : '',
        status: d.Status,
        rujukan: p ? `${p.Min_Normal} - ${p.Max_Normal}` : ''
      };
    });

    const abnormalCount = abnormalDetails.length;
    const riskLevel = getRiskLevel(abnormalCount);
    const workFitnessStatus = getWorkFitnessStatus(abnormalCount);

    results.push({
      nip: employee.NIP,
      nama: employee.Nama,
      departemen: employee.Departemen,
      jenisKelamin: employee.Jenis_Kelamin,
      usia: calculateAge(employee.Tanggal_Lahir, year),
      tahun: year,
      tanggalMcu: record.Tanggal_MCU,
      idMcu: record.ID_MCU,
      abnormalCount,
      riskLevel,
      workFitnessStatus,
      abnormalParams
    });
  }

  return results;
}

/**
 * Calculate 100% Stacked Bar data for Department Risk Demographics
 */
export function getDepartmentRiskDemographics(year: number): DepartmentRiskStats[] {
  const departments = departmentList;
  const statusList = getEmployeesStatusForYear(year);

  return departments.map(dept => {
    const deptEmployees = statusList.filter(s => s.departemen === dept);
    const total = deptEmployees.length;

    if (total === 0) {
      return {
        departemen: dept,
        totalPegawai: 0,
        sehatCount: 0,
        sehatPct: 0,
        ringanCount: 0,
        ringanPct: 0,
        tinggiCount: 0,
        tinggiPct: 0
      };
    }

    const sehatCount = deptEmployees.filter(s => s.riskLevel === 'Sehat').length;
    const ringanCount = deptEmployees.filter(s => s.riskLevel === 'Risiko Ringan').length;
    const tinggiCount = deptEmployees.filter(s => s.riskLevel === 'Risiko Tinggi').length;

    return {
      departemen: dept,
      totalPegawai: total,
      sehatCount,
      sehatPct: parseFloat(((sehatCount / total) * 100).toFixed(1)),
      ringanCount,
      ringanPct: parseFloat(((ringanCount / total) * 100).toFixed(1)),
      tinggiCount,
      tinggiPct: parseFloat(((tinggiCount / total) * 100).toFixed(1))
    };
  });
}

/**
 * Calculate Top 5 Parameter Abnormalities for a given year & department filter
 */
export function getTop5AbnormalParameters(year: number, deptFilter?: string): AbnormalParamStats[] {
  const records = data.mcu_records.filter(r => {
    if (r.Tahun !== year) return false;
    if (deptFilter && deptFilter !== 'Semua') {
      const emp = employeeMap.get(r.NIP);
      return emp?.Departemen === deptFilter;
    }
    return true;
  });

  const recordIds = new Set(records.map(r => r.ID_MCU));
  const relevantDetails = data.mcu_details.filter(
    d => recordIds.has(d.ID_MCU) && d.Status !== 'Normal'
  );

  const counts = new Map<string, number>();
  for (const d of relevantDetails) {
    counts.set(d.ID_Param, (counts.get(d.ID_Param) || 0) + 1);
  }

  const stats: AbnormalParamStats[] = [];
  const totalEmployees = records.length || 1;

  counts.forEach((count, paramId) => {
    const p = paramMap.get(paramId);
    if (p) {
      stats.push({
        paramId,
        nama: p.Nama_Parameter,
        kategori: p.Kategori,
        satuan: p.Satuan,
        count,
        percentage: parseFloat(((count / totalEmployees) * 100).toFixed(1))
      });
    }
  });

  // Sort descending by count and take top 5
  return stats.sort((a, b) => b.count - a.count).slice(0, 5);
}

/**
 * Calculate Average Parameter Trends over years (2024, 2025, 2026)
 */
export function getAnnualParameterAverages(paramId: string, deptFilter?: string) {
  const years = [2024, 2025, 2026];
  const p = paramMap.get(paramId);

  const averages = years.map(yr => {
    const records = data.mcu_records.filter(r => {
      if (r.Tahun !== yr) return false;
      if (deptFilter && deptFilter !== 'Semua') {
        const emp = employeeMap.get(r.NIP);
        return emp?.Departemen === deptFilter;
      }
      return true;
    });

    const recordIds = new Set(records.map(r => r.ID_MCU));
    const details = data.mcu_details.filter(
      d => recordIds.has(d.ID_MCU) && d.ID_Param === paramId
    );

    if (details.length === 0) return { year: yr, avg: 0, count: 0 };

    const sum = details.reduce((acc, curr) => acc + curr.Nilai_Hasil, 0);
    return {
      year: yr,
      avg: parseFloat((sum / details.length).toFixed(2)),
      count: details.length
    };
  });

  return {
    parameter: p,
    trends: averages
  };
}

/**
 * Get Quick Vitals for an individual employee
 */
export function getEmployeeQuickVitals(nip: string, targetYear: number = 2026): QuickVital[] {
  const currentRecord = data.mcu_records.find(r => r.NIP === nip && r.Tahun === targetYear);
  const prevRecord = data.mcu_records.find(r => r.NIP === nip && r.Tahun === targetYear - 1);

  const currentDetails = currentRecord ? getRecordDetails(currentRecord.ID_MCU) : [];
  const prevDetails = prevRecord ? getRecordDetails(prevRecord.ID_MCU) : [];

  const getDetail = (details: MCUDetail[], paramId: string) => details.find(d => d.ID_Param === paramId);

  // 1. BMI (P01)
  const bmiCurr = getDetail(currentDetails, 'P01');
  const bmiPrev = getDetail(prevDetails, 'P01');
  const bmiP = paramMap.get('P01')!;

  // 2. Tekanan Darah: Sistolik (P02) & Diastolik (P03)
  const sisCurr = getDetail(currentDetails, 'P02');
  const sisPrev = getDetail(prevDetails, 'P02');
  const diaCurr = getDetail(currentDetails, 'P03');
  const diaPrev = getDetail(prevDetails, 'P03');

  // 3. Gula Darah Puasa (K02)
  const gdpCurr = getDetail(currentDetails, 'K02');
  const gdpPrev = getDetail(prevDetails, 'K02');
  const gdpP = paramMap.get('K02')!;

  // 4. Kolesterol Total (K01)
  const kolCurr = getDetail(currentDetails, 'K01');
  const kolPrev = getDetail(prevDetails, 'K01');
  const kolP = paramMap.get('K01')!;

  const vitals: QuickVital[] = [];

  // BMI
  if (bmiCurr) {
    const delta = bmiPrev ? parseFloat((bmiCurr.Nilai_Hasil - bmiPrev.Nilai_Hasil).toFixed(2)) : undefined;
    vitals.push({
      label: 'Indeks Massa Tubuh (BMI)',
      paramId: 'P01',
      currentValue: bmiCurr.Nilai_Hasil,
      previousValue: bmiPrev?.Nilai_Hasil,
      delta,
      unit: bmiP.Satuan,
      status: bmiCurr.Status,
      isUp: delta !== undefined && delta > 0,
      isDown: delta !== undefined && delta < 0,
      refRange: `${bmiP.Min_Normal} - ${bmiP.Max_Normal} ${bmiP.Satuan}`
    });
  }

  // Blood Pressure (composite card)
  if (sisCurr && diaCurr) {
    const sisDelta = sisPrev ? parseFloat((sisCurr.Nilai_Hasil - sisPrev.Nilai_Hasil).toFixed(1)) : 0;
    const bpStatus = (sisCurr.Status === 'High' || diaCurr.Status === 'High') ? 'High' : 
                     (sisCurr.Status === 'Low' || diaCurr.Status === 'Low') ? 'Low' : 'Normal';
    vitals.push({
      label: 'Tekanan Darah (Sistolik/Diastolik)',
      paramId: 'P02_P03',
      currentValue: sisCurr.Nilai_Hasil,
      formattedDisplay: `${sisCurr.Nilai_Hasil.toFixed(0)} / ${diaCurr.Nilai_Hasil.toFixed(0)}`,
      previousValue: sisPrev?.Nilai_Hasil,
      delta: sisDelta,
      unit: 'mmHg',
      status: bpStatus,
      isUp: sisDelta > 0,
      isDown: sisDelta < 0,
      refRange: '90-120 / 60-80 mmHg'
    });
  }

  // Fasting Blood Glucose
  if (gdpCurr) {
    const delta = gdpPrev ? parseFloat((gdpCurr.Nilai_Hasil - gdpPrev.Nilai_Hasil).toFixed(1)) : undefined;
    vitals.push({
      label: 'Gula Darah Puasa (GDP)',
      paramId: 'K02',
      currentValue: gdpCurr.Nilai_Hasil,
      previousValue: gdpPrev?.Nilai_Hasil,
      delta,
      unit: gdpP.Satuan,
      status: gdpCurr.Status,
      isUp: delta !== undefined && delta > 0,
      isDown: delta !== undefined && delta < 0,
      refRange: `${gdpP.Min_Normal} - ${gdpP.Max_Normal} ${gdpP.Satuan}`
    });
  }

  // Total Cholesterol
  if (kolCurr) {
    const delta = kolPrev ? parseFloat((kolCurr.Nilai_Hasil - kolPrev.Nilai_Hasil).toFixed(1)) : undefined;
    vitals.push({
      label: 'Kolesterol Total',
      paramId: 'K01',
      currentValue: kolCurr.Nilai_Hasil,
      previousValue: kolPrev?.Nilai_Hasil,
      delta,
      unit: kolP.Satuan,
      status: kolCurr.Status,
      isUp: delta !== undefined && delta > 0,
      isDown: delta !== undefined && delta < 0,
      refRange: `< ${kolP.Max_Normal} ${kolP.Satuan}`
    });
  }

  return vitals;
}

/**
 * Get Time-Series Lab Data for a specific employee and parameter
 */
export function getEmployeeTimeSeries(nip: string, paramId: string) {
  const p = paramMap.get(paramId);
  const records = data.mcu_records.filter(r => r.NIP === nip).sort((a, b) => a.Tahun - b.Tahun);

  const seriesData = records.map(rec => {
    const details = getRecordDetails(rec.ID_MCU);
    const match = details.find(d => d.ID_Param === paramId);
    return {
      idMcu: rec.ID_MCU,
      tanggal: rec.Tanggal_MCU,
      tahun: rec.Tahun,
      nilai: match ? match.Nilai_Hasil : null,
      status: match ? match.Status : 'Normal',
      isNormal: match ? match.Status === 'Normal' : true
    };
  });

  return {
    parameter: p,
    series: seriesData
  };
}

/**
 * Get Lab Results categorized for an employee in a given year
 */
export function getEmployeeLabTable(nip: string, year: number = 2026) {
  const records = data.mcu_records.filter(r => r.NIP === nip).sort((a, b) => a.Tahun - b.Tahun);
  const currentRecord = records.find(r => r.Tahun === year);

  if (!currentRecord) return [];

  const currentDetails = getRecordDetails(currentRecord.ID_MCU);
  const categories: ('Fisik' | 'Hematologi' | 'Kimia Darah')[] = ['Fisik', 'Hematologi', 'Kimia Darah'];

  return categories.map(cat => {
    const catParams = data.parameters.filter(p => p.Kategori === cat);
    const rows = catParams.map(p => {
      const detail = currentDetails.find(d => d.ID_Param === p.ID_Param);

      // Get history values for side-by-side view
      const history = records.map(r => {
        const d = data.mcu_details.find(dt => dt.ID_MCU === r.ID_MCU && dt.ID_Param === p.ID_Param);
        return {
          tahun: r.Tahun,
          nilai: d ? d.Nilai_Hasil : '-',
          status: d ? d.Status : 'Normal'
        };
      });

      return {
        idParam: p.ID_Param,
        namaParameter: p.Nama_Parameter,
        satuan: p.Satuan,
        minNormal: p.Min_Normal,
        maxNormal: p.Max_Normal,
        nilaiRujukan: `${p.Min_Normal} - ${p.Max_Normal}`,
        hasilTerpilih: detail ? detail.Nilai_Hasil : '-',
        status: detail ? detail.Status : 'Normal',
        isAbnormal: detail ? detail.Status !== 'Normal' : false,
        history
      };
    });

    return {
      kategori: cat,
      rows
    };
  });
}
