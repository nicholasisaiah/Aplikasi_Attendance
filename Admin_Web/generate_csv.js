import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://coplcrymjcofwohudpzp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4ODkzOSwiZXhwIjoyMDk0ODY0OTM5fQ.PrL99xbpiL0SMzqXkehR3SR3CwD1S2mVfNNoFUB47PA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Fetching student profiles from database...");
  const { data: students, error: err } = await supabase
    .from('profiles')
    .select('fingerprint_id, full_name, classes:classes!profiles_class_id_fkey(name)')
    .eq('role', 'student')
    .not('fingerprint_id', 'is', null);

  if (err) {
    console.error("Error fetching students:", err);
    process.exit(1);
  }

  console.log(`Fetched ${students.length} students from DB.`);

  // Generate last 30 days up to June 11, 2026
  const dates = [];
  const today = new Date("2026-06-11T12:00:00"); // Standardize to June 11, 2026
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dates.push(dateStr);
  }

  const rows = [];
  rows.push("ID,Nama,Kelas,Tanggal,Waktu_Masuk,Waktu_Keluar");

  // Generate varied data for 30 days
  for (let d = 0; d < dates.length; d++) {
    const date = dates[d];
    
    // Shuffle students to simulate varied daily attendance
    const shuffled = [...students].sort(() => 0.5 - Math.random());
    
    // Most days have 0 to 8 students absent (not tapped at all)
    // Sometimes (10% chance) 100% attendance
    // Sometimes (10% chance) high absence (up to 15 students)
    let presentCount;
    const rand = Math.random();
    if (rand < 0.1) {
      presentCount = students.length;
    } else if (rand > 0.9) {
      presentCount = getRandomInt(students.length - 15, students.length - 8);
    } else {
      presentCount = getRandomInt(students.length - 7, students.length - 1);
    }
    
    for (let i = 0; i < presentCount; i++) {
      const student = shuffled[i];
      const fid = student.fingerprint_id;
      const name = student.full_name;
      const className = student.classes?.name || 'Umum';

      // Simulate check in time
      // 85% on time (06:30 - 06:55), 15% late (07:01 - 07:15)
      let isLate = Math.random() < 0.15;
      let hIn = isLate ? "07" : "06";
      let mIn = isLate ? getRandomInt(1, 15).toString().padStart(2, '0') : getRandomInt(30, 55).toString().padStart(2, '0');
      let sIn = getRandomInt(0, 59).toString().padStart(2, '0');
      let checkIn = `${hIn}:${mIn}:${sIn}`;
      
      // Simulate check out time
      // 95% complete scan out, 5% incomplete (forget to scan out)
      let isComplete = Math.random() < 0.95;
      let checkOut = "";
      if (isComplete) {
        let hOut = getRandomInt(14, 15).toString();
        let mOut = getRandomInt(0, 30).toString().padStart(2, '0');
        let sOut = getRandomInt(0, 59).toString().padStart(2, '0');
        checkOut = `${hOut}:${mOut}:${sOut}`;
      }
      
      rows.push(`${fid},${name},${className},${date},${checkIn},${checkOut}`);
    }
  }

  fs.writeFileSync('attendance_data.csv', rows.join('\n'));
  console.log(`Successfully generated ${rows.length - 1} rows of attendance data across 30 days (up to June 11, 2026) for ${students.length} students in attendance_data.csv.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
