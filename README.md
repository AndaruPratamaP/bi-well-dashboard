# BI-WELL (BI-Employee Wellness Platform)

Aplikasi Dashboard Kesehatan Pegawai Bank Indonesia yang dibangun berdasarkan **Software Design Document (SDD) - BI WELL** dan data riil MCU dari `Dummy_Dataset_MCU_BI.xlsx`.

🌐 **Live Deployed App**: [https://bi-well-mcu.surge.sh](https://bi-well-mcu.surge.sh)

---

## Fitur Utama

### 1. Sistem Login Role Sederhana (Tanpa Auth Rumit)
- **Portal Masuk Terpadu**:
  - **Portal Pegawai**: Memilih identitas salah satu dari 50 pegawai Bank Indonesia untuk mengakses data personal MCU miliknya sendiri. Akses terhadap dashboard admin dibatasi untuk melindungi privasi organisasi.
  - **Portal Administrator DSDM**: Satu klik masuk sebagai Admin DSDM dengan hak akses penuh ke seluruh analitik agregat, demografi risiko, dan investigasi klinis per pegawai.
  - **Akun Demo Cepat**: Disediakan tombol jalan pintas satu klik untuk menguji berbagai profil kesehatan:
    - 🔐 *Admin DSDM* (Akses Agregat Organisasi)
    - 👤 *Pegawai 1* (Kategori Sehat - 0 abnormal)
    - 👤 *Pegawai 2* (Risiko Ringan - 1 s.d 3 abnormal)
    - 👤 *Pegawai 3* (Risiko Tinggi - > 3 abnormal)
  - **Status Pengguna & Tombol Keluar**: Header navbar menampilkan identitas dan chip role akun yang sedang login, serta tombol *Keluar* untuk berganti peran.

### 2. Tampilan Admin DSDM (Dashboard Agregat)
- **Bird-eye View**: Memantau kondisi kesehatan organisasi secara menyeluruh dengan perlindungan kerahasiaan medis perorangan (anonimisasi agregat).
- **Filter Interaktif**:
  - Filter Rentang Waktu (MCU 2024, 2025, 2026).
  - Filter Departemen (Semua, BINS, DTI, DPD, DSDM, DKEB, DKOM).
- **Scorecards**:
  - Total Pegawai Mengikuti MCU (headcount & tingkat partisipasi).
  - Indeks Kesehatan Organisasi (%) (persentase parameter lab berada pada batas normal).
  - Prevalensi Risiko Tinggi (jumlah dan persentase pegawai dengan >3 parameter abnormal).
  - Distribusi Status Keseluruhan (Sehat, Risiko Ringan, Risiko Tinggi).
- **Visualisasi Grafik (Apache ECharts)**:
  - **Demografi Risiko per Departemen**: *100% Stacked Bar Chart* membagi proporsi Sehat (Hijau), Risiko Ringan (Kuning), dan Risiko Tinggi (Merah).
  - **Top 5 Parameter Abnormalitas**: *Horizontal Bar Chart* menampilkan 5 parameter medis dengan frekuensi kasus abnormal tertinggi di organisasi untuk memandu prioritas intervensi DSDM.
  - **Tren Rata-rata Parameter Tahunan**: *Multi-Line Chart* (2024 - 2026) dengan dropdown pemilihan parameter dinamis (BMI, Kolesterol, Glukosa, SGPT, dll) lengkap dengan garis batas rujukan normal (*markLine*).
- **Tabel Intervensi Medis Khusus**:
  - Daftar pegawai risiko tinggi (>3 parameter abnormal) yang memerlukan evaluasi klinis/coaching wellness, dilengkapi tombol *jump-to-profile* langsung ke dashboard individu.

### 3. Tampilan Individu (Dashboard Time-Series Pegawai)
- **Employee Switcher**: Memilih dan mencari pegawai (50 pegawai) berdasarkan Nama, NIP, atau Departemen (hanya aktif pada role Admin).
- **Header Profil**:
  - Avatar, Nama, NIP, Departemen, Usia, dan Tanggal Lahir.
  - Badge Status MCU Terakhir: *Fit to Work* (Hijau), *Fit to Work with Note* (Kuning), atau *Unfit / Perlu Konsultasi Dokter* (Merah).
- **Quick Vitals Cards**:
  - 4 Parameter Utama: BMI, Tekanan Darah (Sistolik/Diastolik), Gula Darah Puasa, dan Kolesterol Total.
  - *Trend Arrow*: Panah merah ke atas jika naik, panah hijau ke bawah jika turun dibanding tahun lalu (sesuai spesifikasi SDD).
- **Interactive Time-Series Chart (Line Chart with Reference Bands)**:
  - Pemilih parameter medis per kategori (Kimia Darah, Fisik, Hematologi).
  - Sumbu X: Tanggal/Tahun MCU (2024, 2025, 2026).
  - Sumbu Y: Nilai Hasil.
  - **Visual Kritis SDD**: *Shaded Area / Band* hijau transparan sebagai penanda Rentang Normal.
  - **Data Points SDD**: Titik bernilai di dalam band normal berwarna biru korporat; titik di luar batas (abnormal) berubah menjadi merah terang dengan label angka nilai.
- **Tabel Data Laboratorium Collapsible**:
  - Kelompok kategori: Fisik, Hematologi, Kimia Darah (bisa di-expand/collapse).
  - Nilai di luar normal dicetak tebal dengan warna merah.
  - Fitur pembanding 3 tahun riwayat pemeriksaan (2024, 2025, 2026) berdampingan.

---

## Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Vite 5
- **Styling**: Tailwind CSS, Lucide React Icons
- **Visualisasi Data**: Apache ECharts (`echarts` & `echarts-for-react`)
- **Deployment**: Surge.sh (Free global CDN static publishing)

---

## Cara Menjalankan Secara Lokal

1. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di: [http://localhost:3000](http://localhost:3000)

2. **Build untuk Produksi & Deploy**:
   ```bash
   npm run build
   npx surge dist bi-well-mcu.surge.sh
   ```
