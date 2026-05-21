import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0
  });
  const [recentScans, setRecentScans] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to format date in YYYY-MM-DD
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const fetchDashboardData = async () => {
    try {
      const today = getTodayDateStr();

      // 1. Get total students count
      const { count: studentCount, error: countErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      
      if (countErr) throw countErr;

      // 2. Get today's attendance records
      const { data: todayRecords, error: todayErr } = await supabase
        .from('attendances')
        .select('*, profiles:profiles!student_id(full_name, classes:classes!profiles_class_id_fkey(name))')
        .eq('date', today);

      if (todayErr) throw todayErr;

      // Calculate stats
      const present = todayRecords.filter(r => r.status === 'hadir').length;
      const late = todayRecords.filter(r => r.status === 'hadir' && r.is_late).length;
      const absent = todayRecords.filter(r => r.status !== 'hadir').length;

      setStats({
        totalStudents: studentCount || 0,
        presentToday: present,
        lateToday: late,
        absentToday: absent
      });

      // Set recent scans (sort by scan_time desc)
      const sortedScans = [...todayRecords]
        .filter(r => r.status === 'hadir')
        .sort((a, b) => {
          if (!a.scan_time) return 1;
          if (!b.scan_time) return -1;
          return b.scan_time.localeCompare(a.scan_time);
        })
        .slice(0, 5);

      setRecentScans(sortedScans);

      // 3. Fetch past 5 days of attendance for the chart
      // Let's generate dates for the last 5 days
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
        const terlambatCount = dayRecs.filter(r => r.status === 'hadir' && r.is_late).length;
        const tidakHadirCount = dayRecs.filter(r => r.status !== 'hadir').length;

        daysData.push({
          name: dayLabel,
          Hadir: hadirCount,
          Terlambat: terlambatCount,
          Absen: tidakHadirCount
        });
      }

      setChartData(daysData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up Realtime stream listener on 'attendances' table
    const subscription = supabase
      .channel('realtime-attendances')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendances' },
        async (payload) => {
          const newRecord = payload.new;
          const today = getTodayDateStr();

          // Only react if the insert is for today
          if (newRecord.date === today) {
            // Fetch student profile info for the new record
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, classes:classes!profiles_class_id_fkey(name)')
              .eq('id', newRecord.student_id)
              .single();

            const completeRecord = {
              ...newRecord,
              profiles: profileData
            };

            // Prepend to recent scans
            if (newRecord.status === 'hadir') {
              setRecentScans(prev => [completeRecord, ...prev].slice(0, 5));
            }

            // Refresh stats counters
            setStats(prev => {
              const isHadir = newRecord.status === 'hadir';
              const isLate = newRecord.is_late;
              return {
                ...prev,
                presentToday: prev.presentToday + (isHadir ? 1 : 0),
                lateToday: prev.lateToday + (isHadir && isLate ? 1 : 0),
                absentToday: prev.absentToday + (!isHadir ? 1 : 0)
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Memuat data dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={styles.header}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Overview Absensi</h1>
          <p>Statistik kehadiran siswa real-time hari ini.</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div style={styles.statsGrid}>
        {/* Card 1: Total Siswa */}
        <div style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: '#E3F2FD' }}>
            <Users size={24} color="#1565C0" />
          </div>
          <div>
            <span style={styles.statLabel}>Total Siswa</span>
            <h2 style={styles.statValue}>{stats.totalStudents}</h2>
          </div>
        </div>

        {/* Card 2: Hadir Hari Ini */}
        <div style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: 'var(--color-success-bg)' }}>
            <CheckCircle size={24} color="var(--color-success)" />
          </div>
          <div>
            <span style={styles.statLabel}>Hadir Hari Ini</span>
            <h2 style={styles.statValue}>{stats.presentToday}</h2>
          </div>
        </div>

        {/* Card 3: Terlambat Hari Ini */}
        <div style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: 'var(--color-warning-bg)' }}>
            <Clock size={24} color="var(--color-warning)" />
          </div>
          <div>
            <span style={styles.statLabel}>Terlambat Hari Ini</span>
            <h2 style={styles.statValue}>{stats.lateToday}</h2>
          </div>
        </div>

        {/* Card 4: Absen Hari Ini */}
        <div style={styles.statCard}>
          <div style={{ ...styles.iconContainer, backgroundColor: 'var(--color-danger-bg)' }}>
            <AlertCircle size={24} color="var(--color-danger)" />
          </div>
          <div>
            <span style={styles.statLabel}>Izin/Sakit/Alpha</span>
            <h2 style={styles.statValue}>{stats.absentToday}</h2>
          </div>
        </div>
      </div>

      {/* Main Section: Chart + Realtime Feed */}
      <div style={styles.mainGrid}>
        {/* Left Column: Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Grafik Kehadiran Mingguan</h3>
          <div style={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EFEA" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} fontWeight={700} />
                <YAxis stroke="var(--text-muted)" fontSize={12} fontWeight={700} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderRadius: '8px', 
                    border: '1.5px solid var(--border-color)',
                    fontFamily: 'var(--font-family)'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '700' }} />
                <Bar dataKey="Hadir" fill="#5ED95E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Terlambat" fill="#FFA726" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Absen" fill="#FF2B2B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Real-time Scan Feed */}
        <div style={styles.card}>
          <div style={styles.feedHeader}>
            <h3 style={styles.cardTitle}>Aktivitas Scan Real-time</h3>
            <span className="badge badge-success" style={{ fontSize: '10px', animation: 'pulse 1.5s infinite' }}>Live</span>
          </div>
          
          <div style={styles.feedWrapper}>
            {recentScans.length === 0 ? (
              <div style={styles.emptyFeed}>
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>📡</span>
                <p style={{ fontSize: '13px' }}>Menunggu aktivitas scan hari ini...</p>
              </div>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} style={styles.feedItem}>
                  <div style={styles.feedAvatar}>
                    {scan.profiles?.full_name?.substring(0, 1) || 'S'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={styles.feedName}>{scan.profiles?.full_name || 'Siswa'}</h4>
                    <span style={styles.feedClass}>{scan.profiles?.classes?.name || 'Umum'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.feedTime}>{scan.scan_time ? scan.scan_time.substring(0, 5) : '00:00'}</div>
                    {scan.is_late ? (
                      <span className="badge badge-warning" style={{ fontSize: '9px', padding: '2px 6px' }}>Terlambat</span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>Tepat Waktu</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '28px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1.5px solid var(--border-color)',
    padding: '20px',
    boxShadow: 'var(--card-shadow)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: '2px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '900',
    margin: 0,
    color: 'var(--text-dark)',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1.5px solid var(--border-color)',
    padding: '24px',
    boxShadow: 'var(--card-shadow)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--text-dark)',
    marginBottom: '20px',
  },
  chartWrapper: {
    height: '300px',
    width: '100%',
  },
  feedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  feedWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyFeed: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '240px',
    color: 'var(--text-muted)',
    border: '1.5px dashed var(--border-color)',
    borderRadius: '12px',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-workspace)',
    border: '1px solid var(--border-color)',
    transition: 'transform 0.1s',
  },
  feedAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-primary)',
    fontWeight: '900',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedName: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--text-dark)',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  feedClass: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  feedTime: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--text-dark)',
    marginBottom: '2px',
  },
};
