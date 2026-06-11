import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4ODkzOSwiZXhwIjoyMDk0ODY0OTM5fQ.PrL99xbpiL0SMzqXkehR3SR3CwD1S2mVfNNoFUB47PA';
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

const academicYear = '2025/2026';

const timeBlocks = [
  { start: '07:30:00', end: '09:00:00' },
  { start: '09:15:00', end: '10:45:00' },
  { start: '11:00:00', end: '12:30:00' },
  { start: '13:00:00', end: '14:30:00' }
];

// Helper to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to shuffle an array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  console.log('Fetching classes and subjects...');
  const { data: classes } = await supabase.from('classes').select('id, name, major');
  const { data: subjects } = await supabase.from('subjects').select('id, name');

  if (!subjects || subjects.length === 0) {
    console.error("No subjects found!");
    return;
  }

  console.log('Clearing existing schedules...');
  await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Generating randomized schedules...');
  const schedulesToInsert = [];

  for (const cls of classes) {
    // For each day of the week (1 to 5)
    for (let day = 1; day <= 5; day++) {
      // Pick random number of blocks per day (between 2 and 4)
      const numBlocks = getRandomInt(2, 4);
      
      let lastSubjectId = null;
      
      for (let blockIndex = 0; blockIndex < numBlocks; blockIndex++) {
        // Try to pick a subject different from the previous block
        let availableSubjects = subjects.filter(s => s.id !== lastSubjectId);
        if (availableSubjects.length === 0) availableSubjects = subjects;
        
        const randomSubject = availableSubjects[getRandomInt(0, availableSubjects.length - 1)];
        lastSubjectId = randomSubject.id;
        
        const block = timeBlocks[blockIndex];

        schedulesToInsert.push({
          class_id: cls.id,
          subject_id: randomSubject.id,
          day_of_week: day,
          start_time: block.start,
          end_time: block.end,
          academic_year: academicYear
        });
      }
    }
  }

  console.log(`Inserting ${schedulesToInsert.length} schedules...`);
  const chunkSize = 100;
  for (let i = 0; i < schedulesToInsert.length; i += chunkSize) {
    const chunk = schedulesToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('schedules').insert(chunk);
    if (error) {
      console.error('Error inserting schedules:', error);
    }
  }

  console.log('Done generating varied schedules!');
}

main();
