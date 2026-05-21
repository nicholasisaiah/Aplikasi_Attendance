import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODg5MzksImV4cCI6MjA5NDg2NDkzOX0.n74RzFCC_qyDHuQZE1qNCqXRUyiHCrlOgwMpz5dYxgM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, classes:classes!profiles_class_id_fkey(*)')
    .eq('id', '39c3298c-fb1c-40a9-9e19-995f7576255e')
    .single();

  console.log("Data:", data);
  console.log("Error:", error);
}

main();
