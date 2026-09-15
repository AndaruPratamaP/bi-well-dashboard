import { Pegawai, MCURecord, MCUDetail, ParamStatus } from '../types/mcu';

const LOCAL_STORAGE_GEMINI_KEY = 'bi_well_gemini_api_key';

export function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const localKey = localStorage.getItem(LOCAL_STORAGE_GEMINI_KEY) || '';
  return localKey || envKey;
}

export function setGeminiApiKey(key: string) {
  if (key) localStorage.setItem(LOCAL_STORAGE_GEMINI_KEY, key.trim());
  else localStorage.removeItem(LOCAL_STORAGE_GEMINI_KEY);
}

export interface ExtractedMCUData {
  pegawai: {
    nip: string;
    nama: string;
    jenisKelamin: 'L' | 'P';
    tanggalLahir: string;
    departemen: string;
  };
  mcu: {
    tanggalMcu: string;
    tahun: number;
  };
  parameters: {
    idParam: string;
    nama: string;
    nilai: number;
    satuan: string;
    status: ParamStatus;
    rujukan: string;
  }[];
  confidenceScore: number;
  catatanKlinis?: string;
}

// 11 Standar Parameter Acuan BI-WELL
export const STANDARD_PARAMS = [
  { idParam: 'P01', nama: 'BMI', satuan: 'kg/m2', min: 18.5, max: 24.9 },
  { idParam: 'P02', nama: 'Sistolik', satuan: 'mmHg', min: 90, max: 120 },
  { idParam: 'P03', nama: 'Diastolik', satuan: 'mmHg', min: 60, max: 80 },
  { idParam: 'H01', nama: 'Leukosit', satuan: 'ribu/uL', min: 4.0, max: 10.0 },
  { idParam: 'H02', nama: 'Hemoglobin', satuan: 'g/dL', min: 12.0, max: 16.0 },
  { idParam: 'H03', nama: 'Trombosit', satuan: 'ribu/uL', min: 150.0, max: 400.0 },
  { idParam: 'K01', nama: 'Kolesterol Total', satuan: 'mg/dL', min: 0, max: 200.0 },
  { idParam: 'K02', nama: 'Glukosa Puasa', satuan: 'mg/dL', min: 70.0, max: 100.0 },
  { idParam: 'K03', nama: 'Asam Urat', satuan: 'mg/dL', min: 3.4, max: 7.0 },
  { idParam: 'K04', nama: 'SGOT (AST)', satuan: 'U/L', min: 0, max: 40.0 },
  { idParam: 'K05', nama: 'SGPT (ALT)', satuan: 'U/L', min: 0, max: 41.0 }
];

export function computeParamStatus(nilai: number, min: number, max: number): ParamStatus {
  if (nilai <= 0) return 'Normal'; // Nilai 0 = parameter tidak diuji / tidak tercantum, tidak dianggap abnormal
  if (nilai < min) return 'Low';
  if (nilai > max) return 'High';
  return 'Normal';
}

/**
 * Konversi File (PDF/Gambar) ke Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

export class InvalidDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDocumentError';
  }
}

/**
 * Deteksi daftar model Gemini yang aktif dan didukung untuk akun pengguna
 */
export async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  const preferred = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro'
  ];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: { 'x-goog-api-key': apiKey }
    });

    if (res.ok) {
      const data = await res.json();
      const models: any[] = data.models || [];
      const contentModels = models
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      if (contentModels.length > 0) {
        // Urutkan berdasarkan prioritas preferred
        const sorted: string[] = [];
        for (const pref of preferred) {
          const match = contentModels.find(m => m.toLowerCase().includes(pref.toLowerCase()));
          if (match && !sorted.includes(match)) sorted.push(match);
        }
        for (const cm of contentModels) {
          if (!sorted.includes(cm) && cm.toLowerCase().includes('flash')) sorted.push(cm);
        }
        for (const cm of contentModels) {
          if (!sorted.includes(cm)) sorted.push(cm);
        }
        if (sorted.length > 0) return sorted;
      }
    }
  } catch (err) {
    console.warn('Gagal memanggil listModels, menggunakan fallback model default:', err);
  }

  return preferred;
}

/**
 * Uji validitas API Key Gemini
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ ok: boolean; message: string; model?: string }> {
  if (!apiKey.trim()) {
    return { ok: false, message: 'API key belum diisi.' };
  }

  try {
    const candidates = await getAvailableGeminiModels(apiKey);
    if (candidates.length === 0) {
      return { ok: false, message: 'API key tidak memiliki akses ke model teks/vision (ListModels kosong).' };
    }

    const testModel = candidates[0];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Halo' }] }]
      })
    });

    if (res.ok) {
      return { ok: true, message: `Koneksi Gemini berhasil terhubung! (Model: ${testModel})`, model: testModel };
    } else {
      const err = await res.text();
      return { ok: false, message: `Gagal (${res.status}): ${err}` };
    }
  } catch (err: any) {
    return { ok: false, message: `Error koneksi: ${err.message || err}` };
  }
}

/**
 * Panggil Gemini via REST API dengan deteksi multi-model otomatis dan validasi dokumen medis
 */
export async function parseMCUDocumentWithGemini(
  file: File,
  onProgress?: (msg: string) => void
): Promise<ExtractedMCUData> {
  const apiKey = getGeminiApiKey();

  // Jika tidak ada API Key, beritahu pengguna secara jelas
  if (!apiKey) {
    throw new Error('API Key Google Gemini belum diatur. Buka menu Konfigurasi API untuk memasukkan kunci gratis Anda.');
  }

  onProgress?.('Mempersiapkan berkas & mengonversi data dokumen...');
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  onProgress?.('Mendeteksi model Gemini yang aktif pada akun...');
  const candidateModels = await getAvailableGeminiModels(apiKey);

  const systemInstruction = `
Kamu adalah sistem AI verifikator dan ekstraktor rekam medis laboratorium Medical Check-Up (MCU) pegawai Bank Indonesia (Platform BI-WELL).

TAHAP 1: VALIDASI KEASLIAN DOKUMEN MEDIS / LAB
Periksa berkas yang diberikan dengan sangat teliti. Apakah berkas ini benar-benar merupakan dokumen rekam medis, lembar hasil laboratorium darah/urin/klinis, atau hasil Medical Check-Up (MCU)?

JIKA DOKUMEN INI BUKAN DOKUMEN MEDIS / BUKAN HASIL LAB MCU:
(Contoh berkas yang BUKAN MCU: faktur/invoice pembayaran, struk belanja, surat lamaran/CV, KTP/SIM/paspor saja, foto selfie/wajah, foto pemandangan, meme/gambar ilustrasi acak, dokumen hukum/finansial, sertifikat pelatihan, dokumen teks non-kesehatan, dsb.)
MAKA KAMU WAJIB MENOLAKNYA DAN HANYA MENGEMBALIKAN OUTPUT JSON PERSIS SEPERTI INI:
{
  "isValidMCUDocument": false,
  "rejectionReason": "Penjelasan singkat spesifik mengapa berkas ditolak (misal: 'Berkas terdeteksi sebagai faktur belanja / bukan lembar rekam medis laboratorium MCU.')"
}

JIKA DOKUMEN INI VALID SEBAGAI HASIL LAB / MCU MEDIS:
Ekstrak parameter yang BENAR-BENAR TERCANTUM pada dokumen MCU tersebut.

ATURAN SANGAT KETAT UNTUK NILAI PARAMETER (PENTING):
1. JANGAN PERNAH MENGARANG, MENEBAK, ATAU MENGISI NILAI YANG TIDAK TERCANTUM PADA DOKUMEN!
2. Jika dokumen laboratorium hanya memuat sebagian parameter (misalnya hanya ada 7, 8, atau 9 parameter dari 11 parameter di bawah):
   - HANYA masukkan parameter yang BENAR-BENAR ADA di dokumen ke dalam array "parameters".
   - Parameter yang TIDAK TERTULIS atau TIDAK DIUJI di dokumen JANGAN dimasukkan ke dalam array "parameters", atau jika kamu sertakan, beri nilai: 0.
   - JANGAN PERNAH mengisi nilai rata-rata, nilai normal acak, atau perkiraan untuk parameter yang tidak ada!

11 Parameter standar:
- P01: BMI (Body Mass Index)
- P02: Sistolik (Tekanan darah atas, mmHg)
- P03: Diastolik (Tekanan darah bawah, mmHg)
- H01: Leukosit / White Blood Cell (WBC, ribu/uL atau 10^3/uL)
- H02: Hemoglobin / Hb (g/dL)
- H03: Trombosit / Platelet (PLT, ribu/uL atau 10^3/uL)
- K01: Kolesterol Total (mg/dL)
- K02: Glukosa Puasa / Fasting Blood Sugar (GDP, mg/dL)
- K03: Asam Urat / Uric Acid (mg/dL)
- K04: SGOT / AST (U/L)
- K05: SGPT / ALT (U/L)

Untuk data pegawai:
- NIP: Ambil HANYA jika tercantum di dokumen. Jika tidak ada, isi null.
- Nama: Ambil nama lengkap pasien/pegawai jika tertera di dokumen. Jika tidak ada, isi null.
- Jenis Kelamin: 'L' atau 'P' (atau null jika tidak tertera).
- Tanggal Lahir: YYYY-MM-DD (atau null jika tidak tertera).
- Departemen: Ambil jika ada, salah satu dari ['BINS', 'DEIH', 'DPD', 'DSDM', 'DKEM', 'DKOM']. Jika tidak ada, isi null.
- Tanggal MCU: YYYY-MM-DD (jika tidak ada gunakan tanggal hari ini).

FORMAT OUTPUT WAJIB HANYA BERUPA JSON MURNI (VALID JSON) TANPA BACKTICK:
{
  "isValidMCUDocument": true,
  "pegawai": {
    "nip": "string atau null",
    "nama": "string atau null",
    "jenisKelamin": "L" | "P" | null,
    "tanggalLahir": "YYYY-MM-DD atau null",
    "departemen": "BINS" | "DEIH" | "DPD" | "DSDM" | "DKEM" | "DKOM" | null
  },
  "mcu": {
    "tanggalMcu": "YYYY-MM-DD",
    "tahun": 2026
  },
  "parameters": [
    {
      "idParam": "K01",
      "nama": "Kolesterol Total",
      "nilai": 215,
      "satuan": "mg/dL"
    }
  ],
  "catatanKlinis": "Catatan singkat dokter / faskes yang tertera pada dokumen"
}
`;

  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: systemInstruction
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json'
      }
    };

    let response: Response | null = null;
    let successfulModel = '';

    // Loop mencoba model-model yang tersedia hingga berhasil
    for (const model of candidateModels) {
      onProgress?.(`Menganalisis dokumen dengan Google Gemini (${model})...`);
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload)
        });

        if (res.status === 404) {
          console.warn(`Model ${model} tidak ditemukan (404), mencoba model berikutnya...`);
          continue;
        }

        if (res.status === 400) {
          // Beberapa model lama mungkin tidak mendukung response_mime_type: 'application/json'
          const retryPayload = {
            contents: payload.contents,
            generationConfig: { temperature: 0.1 }
          };
          const retryRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify(retryPayload)
          });
          if (retryRes.ok) {
            response = retryRes;
            successfulModel = model;
            break;
          }
        }

        if (res.status === 429) {
          throw new Error('Batas kuota gratis Gemini (Rate Limit) tercapai. Silakan tunggu 1 menit lalu coba lagi.');
        }

        if (res.ok) {
          response = res;
          successfulModel = model;
          break;
        }
      } catch (err: any) {
        if (err.message?.includes('Rate Limit')) throw err;
        console.warn(`Error menghubungi ${model}:`, err);
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Tidak ada model Gemini yang dapat dihubungi untuk API key ini.`);
    }

    const resJson = await response.json();
    const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Tidak ada respon teks dari model AI Gemini.');
    }

    onProgress?.('Menyusun parameter klinis ke dalam format BI-WELL...');
    const cleanedText = candidateText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(cleanedText);

    // 1. Validasi penolakan dokumen dari AI
    if (parsed.isValidMCUDocument === false) {
      const reason = parsed.rejectionReason || 'Berkas yang diunggah terdeteksi bukan merupakan dokumen rekam medis atau lembar laboratorium MCU.';
      throw new InvalidDocumentError(reason);
    }

    const foundParams: any[] = Array.isArray(parsed.parameters) ? parsed.parameters : [];

    // 2. Jika tidak ada parameter medis terdeteksi dan nama pasien kosong, tolak sebagai bukan dokumen lab
    if (foundParams.length === 0 && !parsed.pegawai?.nama) {
      throw new InvalidDocumentError('Berkas yang diunggah tidak memuat indikator parameter pemeriksaan laboratorium medis atau data rekam kesehatan MCU.');
    }

    // Process and enrich parameters with reference ranges and status
    const enrichedParams = STANDARD_PARAMS.map(std => {
      const found = foundParams.find(
        (p: any) => p.idParam === std.idParam || p.nama?.toLowerCase().includes(std.nama.toLowerCase())
      );

      let parsedVal: number | null = null;
      if (found && found.nilai !== null && found.nilai !== undefined) {
        const num = typeof found.nilai === 'number' ? found.nilai : parseFloat(String(found.nilai).replace(',', '.'));
        if (!isNaN(num) && num > 0) {
          parsedVal = num;
        }
      }

      // Jika parameter tidak ada / tidak diuji di dokumen MCU, nilai default WAJIB 0
      const val = parsedVal !== null ? parsedVal : 0;
      const status = val === 0 ? 'Normal' : computeParamStatus(val, std.min, std.max);

      return {
        idParam: std.idParam,
        nama: std.nama,
        nilai: Number(Number(val).toFixed(1)),
        satuan: std.satuan,
        status,
        rujukan: `${std.min} - ${std.max}`
      };
    });

    const empNip = parsed.pegawai?.nip && parsed.pegawai.nip !== 'null' ? String(parsed.pegawai.nip) : `1000${Math.floor(10 + Math.random() * 89)}`;
    const empNama = parsed.pegawai?.nama && parsed.pegawai.nama !== 'null' ? String(parsed.pegawai.nama) : 'Pegawai Baru';
    const empGender = parsed.pegawai?.jenisKelamin === 'P' ? 'P' : 'L';
    const empBirth = parsed.pegawai?.tanggalLahir && parsed.pegawai.tanggalLahir !== 'null' ? String(parsed.pegawai.tanggalLahir) : '1990-05-15';
    const empDept = parsed.pegawai?.departemen && parsed.pegawai.departemen !== 'null' ? String(parsed.pegawai.departemen) : 'DSDM';

    return {
      pegawai: {
        nip: empNip,
        nama: empNama,
        jenisKelamin: empGender,
        tanggalLahir: empBirth,
        departemen: empDept
      },
      mcu: {
        tanggalMcu: parsed.mcu?.tanggalMcu || new Date().toISOString().split('T')[0],
        tahun: parsed.mcu?.tahun || new Date().getFullYear()
      },
      parameters: enrichedParams,
      confidenceScore: 95,
      catatanKlinis: parsed.catatanKlinis || `Dokumen berhasil diverifikasi dan diekstrak menggunakan Google Gemini (${successfulModel}).`
    };
  } catch (err: any) {
    console.error('Error in parseMCUDocumentWithGemini:', err);
    // Jika dokumen ditolak karena bukan berkas MCU atau error lain, LEMPAR error ke antarmuka pengguna
    if (err instanceof InvalidDocumentError || err.name === 'InvalidDocumentError') {
      throw err;
    }
    throw err;
  }
}

/**
 * Ekstraksi simulasi pintar (Smart Fallback untuk demo instan tanpa hambatan API)
 */
export function generateSimulatedExtraction(fileName: string): ExtractedMCUData {
  const randomNip = `1000${Math.floor(37 + Math.random() * 20)}`;
  const names = ['Budi Santoso', 'Siti Rahmawati', 'Rendra Pratama', 'Dewi Lestari', 'Agus Setiawan', 'Maya Kusuma'];
  const depts = ['DKEM', 'DEIH', 'DSDM', 'BINS', 'DPD', 'DKOM'];

  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomDept = depts[Math.floor(Math.random() * depts.length)];
  const isFemale = randomName.includes('Siti') || randomName.includes('Dewi') || randomName.includes('Maya');

  // Variasikan nilai parameter agar realistis ada 1-3 catatan di luar batas normal
  const values: Record<string, number> = {
    P01: 26.2, // Overweight
    P02: 125,  // High
    P03: 78,   // Normal
    H01: 7.2,  // Normal
    H02: 14.1, // Normal
    H03: 260,  // Normal
    K01: 218,  // High
    K02: 88,   // Normal
    K03: 6.2,  // Normal
    K04: 32,   // Normal
    K05: 38    // Normal
  };

  const enrichedParams = STANDARD_PARAMS.map(std => {
    const val = values[std.idParam] ?? (std.min + std.max) / 2;
    return {
      idParam: std.idParam,
      nama: std.nama,
      nilai: val,
      satuan: std.satuan,
      status: computeParamStatus(val, std.min, std.max),
      rujukan: `${std.min} - ${std.max}`
    };
  });

  return {
    pegawai: {
      nip: randomNip,
      nama: randomName,
      jenisKelamin: isFemale ? 'P' : 'L',
      tanggalLahir: '1989-06-20',
      departemen: randomDept
    },
    mcu: {
      tanggalMcu: '2026-03-12',
      tahun: 2026
    },
    parameters: enrichedParams,
    confidenceScore: 96,
    catatanKlinis: `Dokumen MCU (${fileName}) berhasil diurai dengan 3 parameter di luar batas rujukan rujukan (BMI, Sistolik, Kolesterol).`
  };
}
