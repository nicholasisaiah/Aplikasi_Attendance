import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODg5MzksImV4cCI6MjA5NDg2NDkzOX0.n74RzFCC_qyDHuQZE1qNCqXRUyiHCrlOgwMpz5dYxgM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Seeding school_settings...");
  await supabase.from('school_settings').upsert({
    id: undefined,
    school_name: 'SMK Asisi Jakarta',
    late_threshold: '07:00:00',
    admin_wa_number: '6281234567890',
    academic_year: '2025/2026'
  });

  console.log("Seeding classes...");
  await supabase.from('classes').upsert([
    { id: 'a0e8f000-0000-0000-0000-000000000001', name: 'XII TKJ 1', section: 'XII', major: 'Teknik Komputer Jaringan', academic_year: '2025/2026' },
    { id: 'a0e8f000-0000-0000-0000-000000000002', name: 'XII TKJ 2', section: 'XII', major: 'Teknik Komputer Jaringan', academic_year: '2025/2026' },
    { id: 'a0e8f000-0000-0000-0000-000000000003', name: 'XI RPL 1', section: 'XI', major: 'Rekayasa Perangkat Lunak', academic_year: '2025/2026' }
  ]);

  console.log("Seeding subjects...");
  await supabase.from('subjects').upsert([
    { id: 'b0e8f000-0000-0000-0000-000000000001', name: 'Matematika', color: '#E57373' },
    { id: 'b0e8f000-0000-0000-0000-000000000002', name: 'Bahasa Indonesia', color: '#64B5F6' },
    { id: 'b0e8f000-0000-0000-0000-000000000003', name: 'Bahasa Inggris', color: '#81C784' },
    { id: 'b0e8f000-0000-0000-0000-000000000004', name: 'Komputer Jaringan', color: '#FFD54F' },
    { id: 'b0e8f000-0000-0000-0000-000000000005', name: 'Pendidikan Pancasila', color: '#BA68C8' }
  ]);

  console.log("Seeding schedules...");
  await supabase.from('schedules').upsert([
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000001', day_of_week: 1, start_time: '07:30:00', end_time: '09:00:00', academic_year: '2025/2026' },
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000002', day_of_week: 1, start_time: '09:15:00', end_time: '10:45:00', academic_year: '2025/2026' },
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000004', day_of_week: 2, start_time: '07:30:00', end_time: '11:30:00', academic_year: '2025/2026' },
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000003', day_of_week: 3, start_time: '07:30:00', end_time: '09:00:00', academic_year: '2025/2026' },
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000005', day_of_week: 3, start_time: '09:15:00', end_time: '10:45:00', academic_year: '2025/2026' },
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000004', day_of_week: 4, start_time: '07:30:00', end_time: '11:30:00', academic_year: '2025/2026' },
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000001', day_of_week: 5, start_time: '07:30:00', end_time: '09:00:00', academic_year: '2025/2026' },
    { class_id: 'a0e8f000-0000-0000-0000-000000000001', subject_id: 'b0e8f000-0000-0000-0000-000000000003', day_of_week: 5, start_time: '09:15:00', end_time: '10:45:00', academic_year: '2025/2026' }
  ]);

  console.log("Seeding announcements...");
  await supabase.from('announcements').upsert([
    { title: 'Rapat Orang Tua Murid', content: 'Undangan menghadiri rapat sosialisasi kelulusan kelas XII pada Sabtu, 24 Mei 2026 pukul 09:00 di Aula Sekolah.', emoji: '🏫', is_published: true, published_at: new Date().toISOString() },
    { title: 'Pengumuman Libur Hari Raya', content: 'Sehubungan dengan hari besar keagamaan, kegiatan belajar mengajar ditiadakan dari tanggal 27-29 Mei 2026.', emoji: '🌙', is_published: true, published_at: new Date().toISOString() },
    { title: 'Ujian Akhir Semester Genap', content: 'Ujian Akhir Semester Genap akan dilaksanakan secara serentak mulai tanggal 8 Juni hingga 15 Juni 2026. Persiapkan diri Anda.', emoji: '📝', is_published: true, published_at: new Date().toISOString() }
  ]);

  console.log("Done seeding database successfully!");
}

main();
