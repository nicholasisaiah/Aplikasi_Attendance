import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4ODkzOSwiZXhwIjoyMDk0ODY0OTM5fQ.PrL99xbpiL0SMzqXkehR3SR3CwD1S2mVfNNoFUB47PA';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const teachersToCreate = [
  { name: 'Budi Santoso, S.Kom', phone: '6281234567801', classes: ['XII TKJ', 'XI TKJ', 'X TKJ'] },
  { name: 'Siti Aminah, S.Pd', phone: '6281234567802', classes: ['XII AKL', 'XI AKL', 'X AKL'] },
  { name: 'Ahmad Dahlan, S.T', phone: '6281234567803', classes: ['XII TSM', 'XI TSM', 'X TSM'] },
  { name: 'Rina Wijaya, S.Pd', phone: '6281234567804', classes: ['XII TKJ 1', 'XII TKJ 2', 'XI RPL 1'] }
];

async function main() {
  console.log('Seeding teachers...');
  const teacherProfiles = [];

  for (let i = 0; i < teachersToCreate.length; i++) {
    const t = teachersToCreate[i];
    const email = `guru${i+1}@smkasisi.sch.id`;
    
    // Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: email,
      password: 'AsisiGuru2026!',
      email_confirm: true,
      user_metadata: { full_name: t.name, role: 'teacher', phone: t.phone }
    });

    if (authErr) {
      console.error('Error creating user ' + t.name, authErr);
      continue;
    }

    const userId = authData.user.id;
    teacherProfiles.push({ id: userId, ...t });
    console.log(`Created teacher ${t.name} (${email})`);

    // Give the trigger some time to insert the profile
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('Assigning teachers to classes...');
  const { data: classesData } = await supabase.from('classes').select('id, name');

  for (const c of classesData) {
    // Find the teacher that matches this class
    const teacher = teacherProfiles.find(tp => tp.classes.includes(c.name));
    if (teacher) {
      await supabase.from('classes').update({ homeroom_teacher_id: teacher.id }).eq('id', c.id);
      console.log(`Assigned ${teacher.name} to class ${c.name}`);
    }
  }

  console.log('Done!');
}

main();
