-- =========================================================================
-- DATABASE SCHEMA FOR EDUATTEND (SEKOLAH ASISI)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SCHOOL SETTINGS
CREATE TABLE IF NOT EXISTS school_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT DEFAULT 'SMK Asisi',
    late_threshold TIME DEFAULT '07:00:00',
    admin_wa_number TEXT,
    academic_year TEXT DEFAULT '2025/2026',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,           -- e.g. "XII TKJ"
    section TEXT,                 -- e.g. "12"
    major TEXT,                   -- e.g. "Teknik Komputer Jaringan"
    homeroom_teacher_id UUID,     -- Will be referenced to profiles after profiles is created
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    nisn TEXT UNIQUE,
    fingerprint_id INT UNIQUE, -- Mapped to physical fingerprint reader enrollment ID
    role TEXT NOT NULL DEFAULT 'student' 
        CHECK (role IN ('student', 'admin', 'teacher', 'parent')),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    parent_of UUID[] DEFAULT '{}', -- For parents to track their kids
    phone TEXT,
    avatar_url TEXT,
    fcm_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update homeroom_teacher_id reference in classes table
ALTER TABLE classes 
ADD CONSTRAINT fk_classes_teacher 
FOREIGN KEY (homeroom_teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,          -- Hex color code (e.g. "#4CAF50")
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCHEDULES
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1: Monday, 5: Friday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ATTENDANCES
CREATE TABLE IF NOT EXISTS attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'hadir' 
        CHECK (status IN ('hadir', 'izin', 'sakit', 'tanpa_keterangan')),
    is_late BOOLEAN DEFAULT false,
    notes TEXT,
    method TEXT DEFAULT 'csv_import' 
        CHECK (method IN ('manual', 'csv_import')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 7. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    emoji TEXT DEFAULT '📢',
    image_url TEXT,
    target_classes UUID[],        -- Array of class_ids, NULL/empty means all classes
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- AUTOMATIC PROFILE CREATION ON USER SIGN UP (TRIGGER)
-- =========================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, nisn, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'nisn',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute function on new signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- INITIAL SEED DATA FOR SIMULATION
-- =========================================================================

-- 1. Insert Default School Settings
INSERT INTO school_settings (school_name, late_threshold, admin_wa_number, academic_year)
VALUES ('SMK Asisi Jakarta', '07:00:00', '6281234567890', '2025/2026')
ON CONFLICT DO NOTHING;

-- 2. Insert Classes
INSERT INTO classes (id, name, section, major, academic_year) VALUES
('a0e8f000-0000-0000-0000-000000000001', 'XII TKJ 1', 'XII', 'Teknik Komputer Jaringan', '2025/2026'),
('a0e8f000-0000-0000-0000-000000000002', 'XII TKJ 2', 'XII', 'Teknik Komputer Jaringan', '2025/2026'),
('a0e8f000-0000-0000-0000-000000000003', 'XI RPL 1', 'XI', 'Rekayasa Perangkat Lunak', '2025/2026')
ON CONFLICT DO NOTHING;

-- 3. Insert Subjects
INSERT INTO subjects (id, name, color) VALUES
('b0e8f000-0000-0000-0000-000000000001', 'Matematika', '#E57373'),
('b0e8f000-0000-0000-0000-000000000002', 'Bahasa Indonesia', '#64B5F6'),
('b0e8f000-0000-0000-0000-000000000003', 'Bahasa Inggris', '#81C784'),
('b0e8f000-0000-0000-0000-000000000004', 'Komputer Jaringan', '#FFD54F'),
('b0e8f000-0000-0000-0000-000000000005', 'Pendidikan Pancasila', '#BA68C8')
ON CONFLICT DO NOTHING;

-- 4. Insert Schedules for XII TKJ 1 (Monday to Friday)
INSERT INTO schedules (class_id, subject_id, day_of_week, start_time, end_time, academic_year) VALUES
-- Monday
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000001', 1, '07:30:00', '09:00:00', '2025/2026'),
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000002', 1, '09:15:00', '10:45:00', '2025/2026'),
-- Tuesday
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000004', 2, '07:30:00', '11:30:00', '2025/2026'),
-- Wednesday
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000003', 3, '07:30:00', '09:00:00', '2025/2026'),
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000005', 3, '09:15:00', '10:45:00', '2025/2026'),
-- Thursday
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000004', 4, '07:30:00', '11:30:00', '2025/2026'),
-- Friday
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000001', 5, '07:30:00', '09:00:00', '2025/2026'),
('a0e8f000-0000-0000-0000-000000000001', 'b0e8f000-0000-0000-0000-000000000003', 5, '09:15:00', '10:45:00', '2025/2026')
ON CONFLICT DO NOTHING;

-- 5. Insert Announcements
INSERT INTO announcements (title, content, emoji, is_published, published_at) VALUES
('Rapat Orang Tua Murid', 'Undangan menghadiri rapat sosialisasi kelulusan kelas XII pada Sabtu, 24 Mei 2026 pukul 09:00 di Aula Sekolah.', '🏫', true, NOW()),
('Pengumuman Libur Hari Raya', 'Sehubungan dengan hari besar keagamaan, kegiatan belajar mengajar ditiadakan dari tanggal 27-29 Mei 2026.', '🌙', true, NOW()),
('Ujian Akhir Semester Genap', 'Ujian Akhir Semester Genap akan dilaksanakan secara serentak mulai tanggal 8 Juni hingga 15 Juni 2026. Persiapkan diri Anda.', '📝', true, NOW())
ON CONFLICT DO NOTHING;
