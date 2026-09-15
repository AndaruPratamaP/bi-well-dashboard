-- ==============================================================================
-- BI-WELL Dashboard: Supabase PostgreSQL Schema
-- Jalankan skrip ini di: Supabase Project Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tabel Master Pegawai
CREATE TABLE IF NOT EXISTS pegawai (
    nip VARCHAR(20) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jenis_kelamin CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
    tanggal_lahir DATE NOT NULL,
    departemen VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Master Parameter Referensi Klinis
CREATE TABLE IF NOT EXISTS parameter_referensi (
    id_param VARCHAR(10) PRIMARY KEY,
    kategori VARCHAR(50) NOT NULL,
    nama_parameter VARCHAR(100) NOT NULL,
    satuan VARCHAR(20) NOT NULL,
    min_normal NUMERIC(8,2) NOT NULL,
    max_normal NUMERIC(8,2) NOT NULL
);

-- 3. Tabel Header Rekam MCU
CREATE TABLE IF NOT EXISTS mcu_records (
    id_mcu VARCHAR(30) PRIMARY KEY,
    nip VARCHAR(20) REFERENCES pegawai(nip) ON DELETE CASCADE,
    tanggal_mcu DATE NOT NULL,
    tahun INT NOT NULL,
    dokumen_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Detail Hasil Lab Parameter MCU
CREATE TABLE IF NOT EXISTS mcu_details (
    id_detail VARCHAR(40) PRIMARY KEY,
    id_mcu VARCHAR(30) REFERENCES mcu_records(id_mcu) ON DELETE CASCADE,
    id_param VARCHAR(10) REFERENCES parameter_referensi(id_param),
    nilai_hasil NUMERIC(8,2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Normal', 'High', 'Low'))
);

-- Buat Index untuk performa query agregasi
CREATE INDEX IF NOT EXISTS idx_mcu_records_tahun ON mcu_records(tahun);
CREATE INDEX IF NOT EXISTS idx_mcu_records_nip ON mcu_records(nip);
CREATE INDEX IF NOT EXISTS idx_mcu_details_id_mcu ON mcu_details(id_mcu);
CREATE INDEX IF NOT EXISTS idx_mcu_details_param ON mcu_details(id_param);

-- Insert 11 Parameter Standar BI-WELL jika belum ada
INSERT INTO parameter_referensi (id_param, kategori, nama_parameter, satuan, min_normal, max_normal) VALUES
('P01', 'Fisik', 'BMI', 'kg/m2', 18.5, 24.9),
('P02', 'Fisik', 'Sistolik', 'mmHg', 90, 120),
('P03', 'Fisik', 'Diastolik', 'mmHg', 60, 80),
('H01', 'Hematologi', 'Leukosit', 'ribu/uL', 4.0, 10.0),
('H02', 'Hematologi', 'Hemoglobin', 'g/dL', 12.0, 16.0),
('H03', 'Hematologi', 'Trombosit', 'ribu/uL', 150.0, 400.0),
('K01', 'Kimia Darah', 'Kolesterol Total', 'mg/dL', 0, 200.0),
('K02', 'Kimia Darah', 'Glukosa Puasa', 'mg/dL', 70.0, 100.0),
('K03', 'Kimia Darah', 'Asam Urat', 'mg/dL', 3.4, 7.0),
('K04', 'Kimia Darah', 'SGOT (AST)', 'U/L', 0, 40.0),
('K05', 'Kimia Darah', 'SGPT (ALT)', 'U/L', 0, 41.0)
ON CONFLICT (id_param) DO NOTHING;

-- Aktifkan Row Level Security (RLS)
ALTER TABLE pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_referensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcu_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcu_details ENABLE ROW LEVEL SECURITY;

-- Buat Policy Akses Anonim (Bisa Baca & Tambah Data untuk Keperluan Dashboard Demo)
CREATE POLICY "Allow public read on pegawai" ON pegawai FOR SELECT USING (true);
CREATE POLICY "Allow public insert on pegawai" ON pegawai FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on pegawai" ON pegawai FOR UPDATE USING (true);

CREATE POLICY "Allow public read on parameter_referensi" ON parameter_referensi FOR SELECT USING (true);

CREATE POLICY "Allow public read on mcu_records" ON mcu_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert on mcu_records" ON mcu_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on mcu_details" ON mcu_details FOR SELECT USING (true);
CREATE POLICY "Allow public insert on mcu_details" ON mcu_details FOR INSERT WITH CHECK (true);
