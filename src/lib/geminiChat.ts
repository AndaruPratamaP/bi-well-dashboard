import { getGeminiApiKey, getAvailableGeminiModels } from './geminiParser';
import {
  getEmployeesStatusForYear,
  getDepartmentRiskDemographics,
  paramMap,
  PARAMETER_EXPLANATIONS
} from '../utils/mcuAnalytics';
import { AuthUser } from '../types/auth';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
}

/**
 * Membangun konteks data sistem yang dinamis untuk prompt Gemini AI
 */
export function buildChatSystemInstruction(
  year: number = 2026,
  currentUser?: AuthUser | null,
  selectedNip?: string
): string {
  // 1. Data Agregat Organisasi
  const statuses = getEmployeesStatusForYear(year);
  const totalEmployees = statuses.length;

  const kelasA = statuses.filter(s => s.healthClass === 'Kelas A').length;
  const kelasB = statuses.filter(s => s.healthClass === 'Kelas B').length;
  const kelasC = statuses.filter(s => s.healthClass === 'Kelas C').length;
  const kelasD = statuses.filter(s => s.healthClass === 'Kelas D').length;

  const pctA = totalEmployees > 0 ? ((kelasA / totalEmployees) * 100).toFixed(1) : '0';
  const pctB = totalEmployees > 0 ? ((kelasB / totalEmployees) * 100).toFixed(1) : '0';
  const pctC = totalEmployees > 0 ? ((kelasC / totalEmployees) * 100).toFixed(1) : '0';
  const pctD = totalEmployees > 0 ? ((kelasD / totalEmployees) * 100).toFixed(1) : '0';

  const deptStats = getDepartmentRiskDemographics(year);
  const deptSummary = deptStats
    .map(
      d =>
        `- ${d.departemen}: Total ${d.totalPegawai} pegawai (Kelas A: ${d.kelasACount}, Kelas B: ${d.kelasBCount}, Kelas C: ${d.kelasCCount}, Kelas D: ${d.kelasDCount} [${d.kelasDPct}% risiko tinggi])`
    )
    .join('\n');

  // 2. Info 11 Parameter BI-WELL
  const paramList = Array.from(paramMap.values())
    .map(p => {
      const expl = PARAMETER_EXPLANATIONS[p.ID_Param];
      return `- [${p.ID_Param}] ${p.Nama_Parameter} (${p.Kategori}): Rujukan ${p.Min_Normal} - ${p.Max_Normal} ${p.Satuan}. ${
        expl ? expl.explanation : ''
      }`;
    })
    .join('\n');

  // 3. Konteks Pegawai Tertentu jika ada
  let employeeContext = '';
  if (selectedNip) {
    const empStatus = statuses.find(s => s.nip === selectedNip);
    if (empStatus) {
      employeeContext = `
Konteks Pegawai yang Sedang Dilihat di Layar:
- NIP: ${empStatus.nip}
- Nama: ${empStatus.nama}
- Departemen: ${empStatus.departemen}
- Usia: ${empStatus.usia} tahun
- Klaster Kesehatan (${year}): ${empStatus.healthClass}
- Tingkat Risiko: ${empStatus.riskLevel}
- Parameter Abnormal/Perhatian: ${
        empStatus.abnormalParams.length > 0
          ? empStatus.abnormalParams.map(p => `${p.nama} (${p.nilai} ${p.satuan}, status: ${p.status})`).join(', ')
          : 'Tidak ada (Semua parameter dalam batas rujukan)'
      }
`;
    }
  }

  return `
Kamu adalah "BI-WELL AI Copilot", asisten kecerdasan buatan resmi untuk platform BI-WELL (Bank Indonesia Employee Wellness & Lab Analytics Dashboard).
Karaktermu: Sangat profesional, ramah, berbasis data ilmiah, solutif, dan mudah dipahami oleh pegawai maupun pimpinan Bank Indonesia.

Peran & Tanggung Jawabmu (Hybrid Copilot):
1. SEBAGAI ASISTEN ANALITIK DATA ORGANISASI:
   - Menjawab pertanyaan pimpinan/DSDM mengenai statistik kesehatan pegawai BI, perbandingan risiko antar departemen, tren kesehatan tahun ${year}, dan memberikan rekomendasi program intervensi kesehatan korporat.
2. SEBAGAI ASISTEN EDUKASI KESEHATAN PEGAWAI:
   - Menjelaskan arti hasil laboratorium, makna rentang rujukan, penyebab nilai naik/turun, serta saran pola makan (diet sehat), olahraga, dan modifikasi gaya hidup untuk menjaga kebugaran.

ATURAN KLASIFIKASI KLASTER KESEHATAN PEGAWAI (KELAS A - D):
- Kelas A: 0 parameter di luar rujukan (Sehat Prima).
- Kelas B: 1 parameter di luar rujukan (Risiko Rendah / Catatan Ringan).
- Kelas C: 2 - 3 parameter di luar rujukan (Risiko Sedang).
- Kelas D: Lebih dari 3 parameter di luar rujukan (Risiko Tinggi / Perhatian Khusus Faskes).

DATA AKTUAL POPULASI PEGAWAI BANK INDONESIA (TAHUN ${year}):
- Total Populasi MCU: ${totalEmployees} Pegawai
- Distribusi Klaster:
  * Kelas A (Sehat Prima): ${kelasA} pegawai (${pctA}%)
  * Kelas B (Risiko Rendah): ${kelasB} pegawai (${pctB}%)
  * Kelas C (Risiko Sedang): ${kelasC} pegawai (${pctC}%)
  * Kelas D (Risiko Tinggi): ${kelasD} pegawai (${pctD}%)

RINGKASAN PER DEPARTEMEN TAHUN ${year}:
${deptSummary}

STANDAR 11 PARAMETER LAB BI-WELL:
${paramList}
${employeeContext}

PANDUAN MENJAWAB:
- Jawablah dalam Bahasa Indonesia yang santun, runtut, dan terstruktur dengan rapi (gunakan bullet points, bold untuk angka/poin penting).
- Untuk pertanyaan analitik data, selalu gunakan angka fakta aktual di atas.
- Untuk pertanyaan medis/kesehatan, berikan edukasi yang jelas, solutif, serta sertakan catatan singkat/disclaimer etis bahwa informasi ini bersifat edukatif dan pegawai disarankan tetap berkonsultasi dengan Dokter Faskes BI jika memerlukan penanganan medis lanjutan.
- Jawaban harus padat, informatif, dan tidak bertele-tele.
`;
}

/**
 * Mengirim pesan ke model Gemini 1.5 Flash dan mengembalikan respons teks
 */
export async function sendChatMessageToGemini(
  messages: ChatMessage[],
  year: number = 2026,
  currentUser?: AuthUser | null,
  selectedNip?: string
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'API Key Google Gemini belum dikonfigurasi. Silakan masukkan API Key Anda di menu Pengaturan AI.'
    );
  }

  const systemInstruction = buildChatSystemInstruction(year, currentUser, selectedNip);

  // Gemini API mewajibkan percakapan multi-turn selalu dimulai oleh pesan role 'user'
  // Singkirkan pesan greeting sistem yang ber-role 'model'
  const chatTurns = messages.filter(m => m.id !== 'msg-welcome' && m.text.trim().length > 0);
  const firstUserIdx = chatTurns.findIndex(m => m.sender === 'user');
  const validTurns = firstUserIdx !== -1 ? chatTurns.slice(firstUserIdx) : [];

  const turnsToSend = validTurns.length > 0 ? validTurns.slice(-10) : [
    { sender: 'user', text: messages[messages.length - 1]?.text || 'Halo' }
  ];

  const contents = turnsToSend.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1200,
      topP: 0.95
    }
  };

  // Dapatkan daftar model yang benar-benar didukung oleh akun pengguna secara dinamis
  const candidateModels = await getAvailableGeminiModels(apiKey);

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.error?.message || `HTTP ${response.status}`;
        lastError = new Error(errMsg);
        // Jika model 404 atau tidak didukung di endpoint ini, coba model berikutnya
        if (response.status === 404 || errMsg.includes('not found') || errMsg.includes('not supported')) {
          continue;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Tidak ada respons teks yang dihasilkan dari AI.');
      }

      return text;
    } catch (err: any) {
      lastError = err;
      if (err.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('not supported'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Gagal menghubungi layanan Google Gemini.');
}

/**
 * Fallback jawaban cerdas untuk demonstrasi offline / cepat jika belum ada API Key
 */
export function getOfflineDemoResponse(query: string, year: number = 2026): string {
  const lower = query.toLowerCase();

  if (lower.includes('klaster') || lower.includes('kelas') || lower.includes('a-d')) {
    return `### Klasifikasi Klaster Kesehatan Pegawai (Kelas A - D)
Sistem **BI-WELL** mengelompokkan kondisi kesehatan pegawai secara objektif berdasarkan jumlah parameter laboratorium yang berada di luar rentang rujukan:

* **Kelas A (Sehat Prima)**: 0 parameter di luar rujukan. Kondisi fisik dan metabolisme sangat baik.
* **Kelas B (Risiko Rendah)**: Terdapat 1 parameter di luar rujukan (contoh: kolesterol sedikit meningkat). Perlu evaluasi mandiri dan pola hidup sehat.
* **Kelas C (Risiko Sedang)**: Terdapat 2 - 3 parameter di luar rujukan. Disarankan mengikuti pendampingan gaya hidup dari tim kesehatan.
* **Kelas D (Risiko Tinggi / Perhatian Khusus)**: Lebih dari 3 parameter di luar rujukan. Memerlukan atensi khusus dan evaluasi klinis mendalam oleh Dokter Faskes BI.`;
  }

  if (lower.includes('ringkasan') || lower.includes('2026') || lower.includes('populasi') || lower.includes('statistik')) {
    return `### Ringkasan Kesehatan Pegawai Bank Indonesia (${year})
Berdasarkan data terkini pada dashboard:

* **Total Pegawai MCU**: 60 Pegawai aktif
* **Distribusi Klaster**:
  - **Kelas A**: 17 pegawai (28.3%) - Sehat Prima
  - **Kelas B**: 18 pegawai (30.0%) - Risiko Rendah
  - **Kelas C**: 18 pegawai (30.0%) - Risiko Sedang
  - **Kelas D**: 7 pegawai (11.7%) - Perhatian Khusus
* **Temuan Utama**: Sebagian besar catatan luar rujukan didominasi oleh indikator Profil Lipid (Kolesterol Total) dan Asam Urat.`;
  }

  if (lower.includes('kolesterol') || lower.includes('asam urat') || lower.includes('gula') || lower.includes('tips') || lower.includes('makan')) {
    return `### Rekomendasi Pengendalian Kolesterol & Asam Urat
Berikut panduan praktis berbasis pedoman kesehatan kerja Bank Indonesia:

1. **Pengendalian Kolesterol Total**:
   - Kurangi konsumsi lemak jenuh & lemak trans (gorengan, jeroan, santan pekat, kuning telur berlebih).
   - Perbanyak asupan serat larut (*soluble fiber*) dari oatmeal, apel, pepaya, dan sayuran hijau.
   - Ganti sumber lemak jahat dengan lemak baik (alpukat, kacang almond, minyak zaitun).

2. **Pengendalian Asam Urat (*Uric Acid*)**:
   - Batasi makanan tinggi purin (daging merah, emping melinjo, kerang, seafood olahan, dan ekstrak ragi).
   - Cukupi kebutuhan air putih minimal 2 - 2.5 liter per hari untuk membantu ginjal melarutkan dan mengeluarkan asam urat.
   - Hindari konsumsi minuman berpemanis sirup fruktosa tinggi dan soda.

3. **Aktivitas Fisik & Istirahat**:
   - Lakukan aktivitas aerobik ringan minimal 30 menit sehari (150 menit per minggu).
   - Pastikan tidur cukup 7–8 jam per malam untuk menjaga sensitivitas insulin dan metabolisme sel tubuh.

*Catatan: Informasi ini bersifat edukatif. Tetap konsultasikan dengan Dokter Faskes Bank Indonesia untuk rekomendasi medis spesifik.*`;
  }

  if (lower.includes('departemen') || lower.includes('risiko tertinggi')) {
    return `### Analisis Risiko Antar Departemen (${year})
Berdasarkan data agregat:
* **Departemen dengan Pegawai Kelas D Terbanyak**: Departemen Pengelolaan Devisa (**DPD**) dan Departemen Sumber Daya Manusia (**DSDM**).
* **Rekomendasi Intervensi**: DSDM disarankan menyelenggarakan program *Corporate Wellness* seperti senam berkala, penyediaan katering sehat di lingkungan kerja, dan seminar nutrisi kerja.`;
  }

  return `Halo! Saya adalah **BI-WELL AI Copilot**. Saya dapat membantu Anda dengan:
- Menganalisis statistik populasi kesehatan pegawai BI (Klaster A-D, komparasi departemen).
- Memberikan penjelasan edukatif mengenai 11 parameter hasil lab MCU.
- Memberikan tips gaya hidup sehat bagi pegawai.

*Silakan tanyakan hal yang ingin Anda ketahui atau klik salah satu tombol pertanyaan cepat di atas!*`;
}
