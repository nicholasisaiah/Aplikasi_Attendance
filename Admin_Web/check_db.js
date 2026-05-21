import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODg5MzksImV4cCI6MjA5NDg2NDkzOX0.n74RzFCC_qyDHuQZE1qNCqXRUyiHCrlOgwMpz5dYxgM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Fetching profiles...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) console.error("Profiles error:", pErr);
  else console.log("Profiles in DB:", profiles);

  console.log("Fetching classes...");
  const { data: classes, error: cErr } = await supabase.from('classes').select('*');
  if (cErr) console.error("Classes error:", cErr);
  else console.log("Classes in DB:", classes);
}

main();
