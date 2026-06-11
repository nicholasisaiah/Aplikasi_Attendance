import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://coplcrymjcofwohudpzp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4ODkzOSwiZXhwIjoyMDk0ODY0OTM5fQ.PrL99xbpiL0SMzqXkehR3SR3CwD1S2mVfNNoFUB47PA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// Simple CSV Parser
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

// Check if time is late based on threshold
function isTimeLate(timeStr, thresholdStr = '07:00:00') {
  try {
    const parts = timeStr.split(':');
    const checkInSecs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2] || 0);
    
    const thresholdParts = thresholdStr.split(':');
    const thresholdSecs = parseInt(thresholdParts[0]) * 3600 + parseInt(thresholdParts[1]) * 60 + parseInt(thresholdParts[2] || 0);
    
    return checkInSecs > thresholdSecs;
  } catch (e) {
    return true;
  }
}

async function main() {
  const csvPath = './attendance_data.csv';
  const absolutePath = path.resolve(csvPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log('📄 Reading CSV:', absolutePath);
  const csvContent = fs.readFileSync(absolutePath, 'utf-8');
  const csvRows = parseCSV(csvContent);
  console.log(`   Loaded ${csvRows.length} attendance rows from CSV.`);

  // 1. Fetch school settings to get late threshold
  console.log('⚙️ Fetching school settings...');
  const { data: settings } = await supabase.from('school_settings').select('late_threshold').single();
  const lateThreshold = settings?.late_threshold || '07:00:00';
  console.log(`   Late threshold: ${lateThreshold}`);

  // 2. Fetch all student profiles to map fingerprint_id -> student profile UUID
  console.log('👤 Fetching student profiles...');
  const { data: students, error: sErr } = await supabase
    .from('profiles')
    .select('id, fingerprint_id, full_name')
    .eq('role', 'student')
    .not('fingerprint_id', 'is', null);

  if (sErr) {
    console.error("❌ Error fetching students from database:", sErr);
    process.exit(1);
  }

  const studentMap = new Map(); // fingerprint_id -> profile
  students.forEach(student => {
    studentMap.set(String(student.fingerprint_id), student);
  });
  console.log(`   Mapped ${studentMap.size} students from DB.`);

  // 3. Build payload list
  console.log('🔨 Preparing payloads...');
  const payloads = [];
  let skippedCount = 0;

  for (const row of csvRows) {
    const fid = row.ID;
    const dateStr = row.Tanggal;
    const rawCheckIn = row.Waktu_Masuk;
    const rawCheckOut = row.Waktu_Keluar;

    const student = studentMap.get(fid);
    if (!student) {
      skippedCount++;
      continue;
    }

    const isFullyPresent = rawCheckIn && rawCheckOut;
    const checkInISO = new Date(`${dateStr}T${rawCheckIn}`).toISOString();
    const checkOutISO = rawCheckOut ? new Date(`${dateStr}T${rawCheckOut}`).toISOString() : null;
    const isLate = isTimeLate(rawCheckIn, lateThreshold);

    payloads.push({
      student_id: student.id,
      date: dateStr,
      check_in_time: checkInISO,
      check_out_time: checkOutISO,
      status: isFullyPresent ? 'hadir' : 'tanpa_keterangan',
      is_late: isFullyPresent ? isLate : false,
      method: 'csv_import',
      notes: isFullyPresent ? null : 'Hanya scan masuk, tidak scan keluar'
    });
  }

  console.log(`   Payloads prepared: ${payloads.length}. Skipped unknown student IDs: ${skippedCount}`);

  // 4. Batch Upsert to Supabase
  console.log('\n🚀 Bulk upserting to Supabase (batches of 100)...');
  const batchSize = 100;
  let successCount = 0;

  for (let i = 0; i < payloads.length; i += batchSize) {
    const batch = payloads.slice(i, i + batchSize);
    const { error } = await supabase
      .from('attendances')
      .upsert(batch, { onConflict: 'student_id,date' });

    if (error) {
      console.error(`   ❌ Batch [${i} to ${i + batch.length}] failed:`, error.message);
    } else {
      successCount += batch.length;
      process.stdout.write(`   Upserted ${successCount}/${payloads.length} rows...\r`);
    }
  }

  console.log(`\n\n✅ Done! Successfully imported ${successCount} attendance records to database.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
