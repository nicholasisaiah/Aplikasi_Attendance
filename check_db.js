const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODg5MzksImV4cCI6MjA5NDg2NDkzOX0.n74RzFCC_qyDHuQZE1qNCqXRUyiHCrlOgwMpz5dYxgM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Fetching attendances...");
  const { data: attendances, error: aErr } = await supabase
    .from('attendances')
    .select('*, profiles(full_name)')
    .limit(10);
  
  if (aErr) console.error("Attendances error:", aErr);
  else console.log("Attendances in DB:", JSON.stringify(attendances, null, 2));
}

main();
