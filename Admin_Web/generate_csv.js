import fs from 'fs';

const firstNames = ["Budi", "Andi", "Siti", "Ayu", "Joko", "Rina", "Dewi", "Eko", "Putri", "Bayu", "Fajar", "Dian", "Agus", "Lia", "Rizky", "Mega", "Hendra", "Nur", "Tari", "Aditya"];
const lastNames = ["Santoso", "Wijaya", "Pratama", "Siregar", "Hidayat", "Saputra", "Kusuma", "Setiawan", "Lestari", "Nugroho", "Gunawan", "Utami", "Syahputra", "Sari", "Pangestu"];
const classes = ["X TKJ", "X AKL", "X TSM", "XI TKJ", "XI AKL", "XI TSM", "XII TKJ", "XII AKL", "XII TSM"];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate exactly 85 unique students
const students = [];
for (let i = 0; i < 85; i++) {
  const name = `${firstNames[getRandomInt(0, firstNames.length - 1)]} ${lastNames[getRandomInt(0, lastNames.length - 1)]}`;
  students.push({
    id: 1000 + i,
    name: name,
    className: classes[getRandomInt(0, classes.length - 1)]
  });
}

// Generate last 30 days up to today
const dates = [];
for (let i = 29; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dates.push(dateStr);
}

const rows = [];
rows.push("ID,Nama,Kelas,Tanggal,Waktu_Masuk,Waktu_Keluar");

// Generate varied data for 30 days
for (let d = 0; d < dates.length; d++) {
  const date = dates[d];
  const shuffled = [...students].sort(() => 0.5 - Math.random());
  
  // Varied absence logic:
  // Most days have 0 to 8 students absent.
  // Sometimes (10% chance) all 85 are present.
  // Sometimes (10% chance) high absence (up to 15 students).
  let presentCount;
  const rand = Math.random();
  if (rand < 0.1) {
    presentCount = 85; // 100% attendance
  } else if (rand > 0.9) {
    presentCount = getRandomInt(70, 77); // High absence
  } else {
    presentCount = getRandomInt(78, 84); // Normal absence
  }
  
  for (let i = 0; i < presentCount; i++) {
    const student = shuffled[i];
    
    // Simulate check in time
    // 80% on time (06:30 - 06:55), 20% late (07:01 - 07:15)
    let isLate = Math.random() < 0.2;
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
    
    rows.push(`${student.id},${student.name},${student.className},${date},${checkIn},${checkOut}`);
  }
}

fs.writeFileSync('attendance_data.csv', rows.join('\n'));
console.log(`Generated ${rows.length - 1} rows of attendance data across 7 days for 85 unique students.`);
