import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODg5MzksImV4cCI6MjA5NDg2NDkzOX0.n74RzFCC_qyDHuQZE1qNCqXRUyiHCrlOgwMpz5dYxgM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Simulating fetchDashboardData chart loop...");
  const daysData = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
    
    // Fetch records for this date
    const { data: dayRecs, error: dayRecsErr } = await supabase
      .from('attendances')
      .select('id, status, is_late')
      .eq('date', dateStr);
      
    if (dayRecsErr) throw dayRecsErr;

    const hadirCount = dayRecs.filter(r => r.status === 'hadir').length;
    const tidakHadirCount = dayRecs.filter(r => r.status !== 'hadir').length;

    daysData.push({
      dateStr,
      name: dayLabel,
      Hadir: hadirCount,
      'Tidak Hadir': tidakHadirCount,
      raw: dayRecs
    });
  }
  console.log("Result:", JSON.stringify(daysData, null, 2));
}

check();
