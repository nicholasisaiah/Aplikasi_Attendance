import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://coplcrymjcofwohudpzp.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI4ODkzOSwiZXhwIjoyMDk0ODY0OTM5fQ.PrL99xbpiL0SMzqXkehR3SR3CwD1S2mVfNNoFUB47PA';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Clearing attendances...');
  const { error: attError } = await supabase.from('attendances').delete().not('student_id', 'is', null);
  if (attError) console.error('Error clearing attendances:', attError);

  console.log('Fetching students to delete...');
  const { data: profiles } = await supabase.from('profiles').select('id').eq('role', 'student');
  
  if (profiles && profiles.length > 0) {
    console.log(`Deleting ${profiles.length} students...`);
    for (const p of profiles) {
      await supabase.auth.admin.deleteUser(p.id);
    }
  }
  
  console.log('Database cleaned up!');
}

main();
