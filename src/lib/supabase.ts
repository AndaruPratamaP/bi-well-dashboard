import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pegawai, MCURecord, MCUDetail } from '../types/mcu';

const LOCAL_STORAGE_SUPABASE_URL = 'bi_well_supabase_url';
const LOCAL_STORAGE_SUPABASE_KEY = 'bi_well_supabase_key';
const LOCAL_STORAGE_EXTRA_DATA = 'bi_well_extra_mcu_data';

// Helper to get active Supabase credentials (from env or localStorage)
export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(LOCAL_STORAGE_SUPABASE_URL) || '';
  const localKey = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY) || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey
  };
}

// Save credentials from UI
export function setSupabaseCredentials(url: string, key: string) {
  if (url) localStorage.setItem(LOCAL_STORAGE_SUPABASE_URL, url.trim());
  else localStorage.removeItem(LOCAL_STORAGE_SUPABASE_URL);

  if (key) localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, key.trim());
  else localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY);
}

// Create or return Supabase client instance
let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
}

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: 'URL atau Anon Key Supabase belum diisi.' };
  }

  try {
    const { error } = await client.from('parameter_referensi').select('id_param').limit(1);
    if (error) {
      return { ok: false, message: `Koneksi gagal: ${error.message}` };
    }
    return { ok: true, message: 'Koneksi ke Supabase Cloud berhasil terhubung!' };
  } catch (err: any) {
    return { ok: false, message: `Koneksi error: ${err.message || err}` };
  }
}

/**
 * Simpan data MCU ke Supabase Cloud
 */
export async function saveMCURecordToSupabase(
  pegawai: Pegawai,
  record: MCURecord,
  details: MCUDetail[]
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();

  if (!client) {
    // Fallback save to LocalStorage
    saveExtraDataLocally(pegawai, record, details);
    return { success: true };
  }

  try {
    // 1. Upsert Pegawai
    const { error: empError } = await client.from('pegawai').upsert({
      nip: pegawai.NIP,
      nama: pegawai.Nama,
      jenis_kelamin: pegawai.Jenis_Kelamin,
      tanggal_lahir: pegawai.Tanggal_Lahir,
      departemen: pegawai.Departemen
    });
    if (empError) throw empError;

    // 2. Upsert MCU Record
    const { error: recError } = await client.from('mcu_records').upsert({
      id_mcu: record.ID_MCU,
      nip: record.NIP,
      tanggal_mcu: record.Tanggal_MCU,
      tahun: record.Tahun
    });
    if (recError) throw recError;

    // 3. Insert MCU Details
    const detailRows = details.map(d => ({
      id_detail: d.ID_Detail,
      id_mcu: d.ID_MCU,
      id_param: d.ID_Param,
      nilai_hasil: d.Nilai_Hasil,
      status: d.Status
    }));

    const { error: detError } = await client.from('mcu_details').upsert(detailRows);
    if (detError) throw detError;

    // Also cache locally for offline speed
    saveExtraDataLocally(pegawai, record, details);

    return { success: true };
  } catch (err: any) {
    console.error('Error saving to Supabase:', err);
    // Fallback locally
    saveExtraDataLocally(pegawai, record, details);
    return {
      success: false,
      error: err.message || 'Gagal menyimpan ke Supabase Cloud, data disimpan di penyimpanan lokal browser.'
    };
  }
}

/**
 * Ambil data tambahan dari Supabase Cloud saat inisialisasi
 */
export async function fetchCloudMCURecords(): Promise<{
  pegawai: Pegawai[];
  mcu_records: MCURecord[];
  mcu_details: MCUDetail[];
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [empRes, recRes, detRes] = await Promise.all([
      client.from('pegawai').select('*'),
      client.from('mcu_records').select('*'),
      client.from('mcu_details').select('*')
    ]);

    if (empRes.error || recRes.error || detRes.error) {
      console.warn('Cloud fetch notice:', empRes.error || recRes.error || detRes.error);
      return null;
    }

    const pegawai: Pegawai[] = (empRes.data || []).map((e: any) => ({
      NIP: e.nip,
      Nama: e.nama,
      Jenis_Kelamin: e.jenis_kelamin,
      Tanggal_Lahir: e.tanggal_lahir,
      Departemen: e.departemen
    }));

    const mcu_records: MCURecord[] = (recRes.data || []).map((r: any) => ({
      ID_MCU: r.id_mcu,
      NIP: r.nip,
      Tanggal_MCU: r.tanggal_mcu,
      Tahun: r.tahun
    }));

    const mcu_details: MCUDetail[] = (detRes.data || []).map((d: any) => ({
      ID_Detail: d.id_detail,
      ID_MCU: d.id_mcu,
      ID_Param: d.id_param,
      Nilai_Hasil: Number(d.nilai_hasil),
      Status: d.status
    }));

    return { pegawai, mcu_records, mcu_details };
  } catch (err) {
    console.warn('Could not load cloud records:', err);
    return null;
  }
}

// -------------------------------------------------------------
// Local Storage Fallback Cache
// -------------------------------------------------------------

export interface ExtraStoredData {
  pegawai: Pegawai[];
  mcu_records: MCURecord[];
  mcu_details: MCUDetail[];
}

export function getExtraDataLocally(): ExtraStoredData {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXTRA_DATA);
    if (!raw) return { pegawai: [], mcu_records: [], mcu_details: [] };
    return JSON.parse(raw);
  } catch {
    return { pegawai: [], mcu_records: [], mcu_details: [] };
  }
}

export function saveExtraDataLocally(pegawai: Pegawai, record: MCURecord, details: MCUDetail[]) {
  const current = getExtraDataLocally();

  // Deduplicate pegawai by NIP
  const empIdx = current.pegawai.findIndex(p => p.NIP === pegawai.NIP);
  if (empIdx >= 0) {
    current.pegawai[empIdx] = pegawai;
  } else {
    current.pegawai.push(pegawai);
  }

  // Deduplicate record by ID_MCU
  const recIdx = current.mcu_records.findIndex(r => r.ID_MCU === record.ID_MCU);
  if (recIdx >= 0) {
    current.mcu_records[recIdx] = record;
  } else {
    current.mcu_records.push(record);
  }

  // Deduplicate details by ID_Detail
  for (const det of details) {
    const detIdx = current.mcu_details.findIndex(d => d.ID_Detail === det.ID_Detail);
    if (detIdx >= 0) {
      current.mcu_details[detIdx] = det;
    } else {
      current.mcu_details.push(det);
    }
  }

  localStorage.setItem(LOCAL_STORAGE_EXTRA_DATA, JSON.stringify(current));
}

export function clearExtraDataLocally() {
  localStorage.removeItem(LOCAL_STORAGE_EXTRA_DATA);
}
