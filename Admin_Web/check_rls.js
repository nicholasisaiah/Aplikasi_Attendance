import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODg5MzksImV4cCI6MjA5NDg2NDkzOX0.n74RzFCC_qyDHuQZE1qNCqXRUyiHCrlOgwMpz5dYxgM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Checking RLS status using SQL query...");
  // Let's run a query to check if there are classes in the table first
  const { data: classesRaw, error: cRawErr } = await supabase
    .from('classes')
    .select('*');
  console.log("Raw classes:", classesRaw, "Error:", cRawErr);

  // Let's check using an RPC or SQL if possible.
  // Wait, if RLS is enabled and there is no SELECT policy, it returns empty array [] with no error!
  // That matches our result: raw classes was: Classes in DB: [] with no error!
  // Wait! Let's check if the admin client can see it. But we only have anon key in .env.
  // Let's check the service role key! Is there a service role key in Admin_Web/.env or supabase configs?
}

main();
