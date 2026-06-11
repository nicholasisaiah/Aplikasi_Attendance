# sekolah_asisi

Code sql untuk menambah akun murid:

UPDATE profiles
SET 
  full_name = 'Budi Santoso',
  nisn = '222310199',
  role = 'student',
  class_id = 'a0e8f000-0000-0000-0000-000000000001', -- Menghubungkan Budi ke kelas XII TKJ 1 (dari data bawaan)
  fingerprint_id = 1 -- Memberi Budi ID sidik jari bernilai 1
WHERE id = 'UID_SISWA_YANG_DI_COPY';
