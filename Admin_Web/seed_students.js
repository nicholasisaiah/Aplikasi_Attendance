/**
 * ============================================================
 * SEED STUDENTS FROM ATTENDANCE CSV
 * ============================================================
 * Script ini membaca file CSV absensi dari mesin sidik jari,
 * mengekstrak daftar siswa unik, lalu mendaftarkan mereka
 * ke Supabase Auth + Profiles secara otomatis.
 *
 * Cara pakai:
 *   node seed_students.js ./path/to/attendance_data.csv
 *
 * Format CSV yang didukung:
 *   ID,Nama,Kelas,Tanggal,Waktu_Masuk,Waktu_Keluar
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ─── CONFIG ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://coplcrymjcofwohudpzp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4ODkzOSwiZXhwIjoyMDk0ODY0OTM5fQ.PrL99xbpiL0SMzqXkehR3SR3CwD1S2mVfNNoFUB47PA';
const DEFAULT_PASSWORD = 'AsisiSiswa2026!';
const EMAIL_DOMAIN = 'smkasisi.sch.id';

// ─── Supabase Admin Client ──────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// ─── Simple CSV Parser ──────────────────────────────────────
function parseCSV(content) {
  const lines = content.trim().split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

// ─── MAIN ───────────────────────────────────────────────────
async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error('❌ Cara pakai: node seed_students.js ./path/to/attendance_data.csv');
    process.exit(1);
  }

  const absolutePath = path.resolve(csvPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File tidak ditemukan: ${absolutePath}`);
    process.exit(1);
  }

  console.log('📄 Membaca CSV:', absolutePath);
  const csvContent = fs.readFileSync(absolutePath, 'utf-8');
  const rows = parseCSV(csvContent);
  console.log(`   Total baris CSV: ${rows.length}`);

  // ── Step 1: Extract unique students ───────────────────────
  const uniqueStudents = new Map(); // fingerprint_id -> { nama, kelas }

  for (const row of rows) {
    const fid = row.ID || row.FingerprintID;
    const nama = row.Nama || row.Name || '';
    const kelas = row.Kelas || row.Class || '';

    if (fid && !uniqueStudents.has(fid)) {
      uniqueStudents.set(fid, { nama, kelas });
    }
  }

  console.log(`👤 Siswa unik ditemukan: ${uniqueStudents.size}`);

  // ── Step 2: Fetch existing classes & create missing ones ──
  console.log('\n📚 Menyinkronkan data kelas...');
  const { data: existingClasses } = await supabase.from('classes').select('id, name');
  const classMap = new Map(); // class name -> class id
  (existingClasses || []).forEach(c => classMap.set(c.name, c.id));

  const uniqueClassNames = new Set();
  for (const { kelas } of uniqueStudents.values()) {
    if (kelas && !classMap.has(kelas)) {
      uniqueClassNames.add(kelas);
    }
  }

  if (uniqueClassNames.size > 0) {
    console.log(`   Membuat ${uniqueClassNames.size} kelas baru:`, [...uniqueClassNames].join(', '));
    for (const className of uniqueClassNames) {
      // Try to determine section and major from class name
      const section = className.match(/^(X{1,3}I{0,2}V?\s)/)?.[1]?.trim() || className.split(' ')[0] || '';
      const major = className.replace(section, '').trim() || '';

      const { data: newClass, error } = await supabase
        .from('classes')
        .insert({ name: className, section, major, academic_year: '2025/2026' })
        .select('id, name')
        .single();

      if (error) {
        console.error(`   ❌ Gagal membuat kelas "${className}":`, error.message);
      } else {
        classMap.set(newClass.name, newClass.id);
        console.log(`   ✅ Kelas "${className}" → ${newClass.id}`);
      }
    }
  } else {
    console.log('   Semua kelas sudah ada di database.');
  }

  // ── Step 3: Fetch already registered fingerprint_ids ──────
  console.log('\n🔍 Mengecek siswa yang sudah terdaftar...');
  const { data: existingProfiles } = await supabase
    .from('profiles')
    .select('fingerprint_id')
    .eq('role', 'student')
    .not('fingerprint_id', 'is', null);

  const registeredFids = new Set((existingProfiles || []).map(p => String(p.fingerprint_id)));
  const studentsToCreate = [];

  for (const [fid, info] of uniqueStudents) {
    if (!registeredFids.has(fid)) {
      studentsToCreate.push({ fid, ...info });
    }
  }

  console.log(`   Sudah terdaftar: ${registeredFids.size}`);
  console.log(`   Perlu didaftarkan: ${studentsToCreate.length}`);

  if (studentsToCreate.length === 0) {
    console.log('\n✅ Semua siswa sudah terdaftar! Tidak ada yang perlu dibuat.');
    return;
  }

  // ── Step 4: Create auth users + update profiles ───────────
  console.log(`\n🚀 Memulai pendaftaran ${studentsToCreate.length} siswa...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < studentsToCreate.length; i++) {
    const student = studentsToCreate[i];
    const email = `siswa.${student.fid}@${EMAIL_DOMAIN}`;
    const progress = `[${i + 1}/${studentsToCreate.length}]`;

    try {
      // Create auth user (bypasses email confirmation)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: student.nama,
          role: 'student',
        }
      });

      if (authError) {
        // If user already exists with this email, skip
        if (authError.message?.includes('already been registered')) {
          console.log(`${progress} ⏭️  ${student.nama} (${email}) — sudah ada, skip`);
          continue;
        }
        throw authError;
      }

      const userId = authData.user.id;

      // Update profile with fingerprint_id and class
      const classId = classMap.get(student.kelas) || null;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: student.nama,
          fingerprint_id: parseInt(student.fid),
          nisn: '006' + student.fid.toString().padStart(7, '0'),
          class_id: classId,
        })
        .eq('id', userId);

      if (profileError) {
        console.warn(`${progress} ⚠️  ${student.nama} — akun dibuat tapi gagal update profil: ${profileError.message}`);
      } else {
        console.log(`${progress} ✅ ${student.nama} (${student.kelas}) → FID: ${student.fid}`);
      }

      successCount++;
    } catch (err) {
      errorCount++;
      console.error(`${progress} ❌ ${student.nama}: ${err.message}`);
    }

    // Small delay to be nice to the API
    if (i % 20 === 0 && i > 0) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // ── Summary ───────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════');
  console.log('📊 RINGKASAN SEED');
  console.log('════════════════════════════════════════════');
  console.log(`   Total siswa di CSV  : ${uniqueStudents.size}`);
  console.log(`   Berhasil didaftarkan: ${successCount}`);
  console.log(`   Gagal               : ${errorCount}`);
  console.log(`   Sudah ada (skip)    : ${uniqueStudents.size - studentsToCreate.length}`);
  console.log('════════════════════════════════════════════');
  console.log(`\n📧 Email format : siswa.{FID}@${EMAIL_DOMAIN}`);
  console.log(`🔑 Password     : ${DEFAULT_PASSWORD}`);
  console.log('\n💡 Untuk demo Flutter, ubah password akun tertentu');
  console.log('   di Supabase Dashboard → Authentication → Users');
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
