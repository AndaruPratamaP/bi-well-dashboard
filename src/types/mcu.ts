export type Gender = 'L' | 'P';
export type Department = 'BINS' | 'DEIH' | 'DPD' | 'DSDM' | 'DKEM' | 'DKOM' | string;
export type ParamCategory = 'Fisik' | 'Hematologi' | 'Kimia Darah';
export type ParamStatus = 'Normal' | 'High' | 'Low';
export type HealthClass = 'Kelas A' | 'Kelas B' | 'Kelas C' | 'Kelas D';
export type RiskLevel = 'Sehat' | 'Risiko Ringan' | 'Risiko Tinggi';
export type WorkFitnessStatus = 'Fit to Work' | 'Fit to Work with Note' | 'Unfit';

export interface Pegawai {
  NIP: string;
  Nama: string;
  Jenis_Kelamin: Gender;
  Tanggal_Lahir: string;
  Departemen: Department;
}

export interface ParameterReferensi {
  ID_Param: string;
  Kategori: ParamCategory;
  Nama_Parameter: string;
  Satuan: string;
  Min_Normal: number;
  Max_Normal: number;
}

export interface MCURecord {
  ID_MCU: string;
  NIP: string;
  Tanggal_MCU: string;
  Tahun: number;
}

export interface MCUDetail {
  ID_Detail: string;
  ID_MCU: string;
  ID_Param: string;
  Nilai_Hasil: number;
  Status: ParamStatus;
}

export interface MCUFullData {
  pegawai: Pegawai[];
  parameters: ParameterReferensi[];
  mcu_records: MCURecord[];
  mcu_details: MCUDetail[];
}

export interface EmployeeMCUStatus {
  nip: string;
  nama: string;
  departemen: string;
  jenisKelamin: Gender;
  usia: number;
  tahun: number;
  tanggalMcu: string;
  idMcu: string;
  abnormalCount: number;
  healthClass: HealthClass;
  riskLevel: RiskLevel;
  workFitnessStatus: WorkFitnessStatus;
  abnormalParams: {
    nama: string;
    nilai: number;
    satuan: string;
    status: ParamStatus;
    rujukan: string;
  }[];
}

export interface DepartmentRiskStats {
  departemen: string;
  totalPegawai: number;
  kelasACount: number;
  kelasAPct: number;
  kelasBCount: number;
  kelasBPct: number;
  kelasCCount: number;
  kelasCPct: number;
  kelasDCount: number;
  kelasDPct: number;
  sehatCount: number;
  sehatPct: number;
  ringanCount: number;
  ringanPct: number;
  tinggiCount: number;
  tinggiPct: number;
}

export interface AgeGroupClassStats {
  ageGroup: '< 30' | '30 ≤ X < 40' | '40 ≤ X < 50' | '> 50';
  total: number;
  kelasACount: number;
  kelasAPct: number;
  kelasBCount: number;
  kelasBPct: number;
  kelasCCount: number;
  kelasCPct: number;
  kelasDCount: number;
  kelasDPct: number;
}

export interface AbnormalParamStats {
  paramId: string;
  nama: string;
  kategori: string;
  count: number;
  satuan: string;
  percentage: number;
}

export interface QuickVital {
  label: string;
  paramId: string;
  currentValue: number;
  previousValue?: number;
  delta?: number;
  unit: string;
  status: ParamStatus;
  isUp: boolean;
  isDown: boolean;
  refRange: string;
  formattedDisplay?: string;
}
