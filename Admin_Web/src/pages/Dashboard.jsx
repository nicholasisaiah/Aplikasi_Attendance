import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight
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

const formatTime = (isoString) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    return '-';
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartOffset, setChartOffset] = useState(0);

  // Attendance Recap State
  const [recapDate, setRecapDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [recapRecords, setRecapRecords] = useState([]);
  const [recapLoading, setRecapLoading] = useState(false);

  const recapDateRef = useRef(recapDate);
  useEffect(() => {
    recapDateRef.current = recapDate;
  }, [recapDate]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', notes: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

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



    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (offset) => {
    try {
      const daysData = [];
      const datesList = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i - offset);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
        const dayDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const dayLabel = `${dayName}, ${dayDate}`;
        datesList.push({ dateStr, dayLabel });
      }

      const startDate = datesList[0].dateStr;
      const endDate = datesList[datesList.length - 1].dateStr;

      const { data: pastRecords, error: pastErr } = await supabase
        .from('attendances')
        .select('id, status, date')
        .gte('date', startDate)
        .lte('date', endDate);

      if (pastErr) throw pastErr;

      datesList.forEach(({ dateStr, dayLabel }) => {
        const dayRecs = pastRecords ? pastRecords.filter(r => r.date === dateStr) : [];
        const hadirCount = dayRecs.filter(r => r.status === 'hadir').length;
        const tidakHadirCount = dayRecs.filter(r => r.status !== 'hadir').length;

        daysData.push({
          name: dayLabel,
          Hadir: hadirCount,
          'Tidak Hadir': tidakHadirCount
        });
      });

      setChartData(daysData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    }
  };

  // Fetch attendance recap for a specific date
  const fetchRecapData = async (dateStr) => {
    setRecapLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*, profiles:profiles!student_id(full_name, classes:classes!profiles_class_id_fkey(name))')
        .eq('date', dateStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRecapRecords(data || []);
    } catch (err) {
      console.error('Error fetching recap:', err);
    } finally {
      setRecapLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up Realtime stream listener on 'attendances' table for all events
    const subscription = supabase
      .channel('realtime-attendances')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendances' },
        async () => {
          fetchDashboardData();
          fetchRecapData(recapDateRef.current);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    fetchRecapData(recapDate);
  }, [recapDate]);

  useEffect(() => {
    fetchChartData(chartOffset);
  }, [chartOffset]);

  // Date navigation helpers
  const shiftRecapDate = (days) => {
    const d = new Date(recapDate);
    d.setDate(d.getDate() + days);
    const newDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setRecapDate(newDateStr);
  };

  const formatRecapDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Status badge renderer
  const renderStatusBadge = (status, isLate) => {
    if (status === 'hadir' && isLate) {
      return <span className="badge badge-warning" style={{ fontSize: '10px' }}>Terlambat</span>;
    }
    if (status === 'hadir') {
      return <span className="badge badge-success" style={{ fontSize: '10px' }}>Hadir</span>;
    }
    if (status === 'sakit') {
      return <span className="badge badge-info" style={{ fontSize: '10px' }}>Sakit</span>;
    }
    if (status === 'izin') {
      return <span className="badge badge-info" style={{ fontSize: '10px' }}>Izin</span>;
    }
    // tanpa_keterangan / alfa
    return <span className="badge badge-danger" style={{ fontSize: '10px' }}>Alfa</span>;
  };

  // Edit modal handlers
  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditForm({
      status: record.status,
      notes: record.notes || ''
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.status) {
      setEditError('Status wajib dipilih.');
      return;
    }

    setEditSubmitting(true);
    setEditError('');

    try {
      const updatePayload = {
        status: editForm.status,
        notes: editForm.notes || null,
        is_late: false,
        check_in_time: null,
        check_out_time: null
      };

      const { error } = await supabase
        .from('attendances')
        .update(updatePayload)
        .eq('id', editingRecord.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      // Refresh recap data
      fetchRecapData(recapDate);
      // Refresh dashboard stats if editing today's record
      if (recapDate === getTodayDateStr()) {
        fetchDashboardData();
      }
    } catch (err) {
      setEditError(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setEditSubmitting(false);
    }
  };

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
          <p>Statistik kehadiran siswa hari ini.</p>
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

      {/* Chart Section - Full Width */}
      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <div style={styles.recapHeader}>
          <h3 style={styles.cardTitle}>Grafik Kehadiran Mingguan</h3>
          <div style={styles.dateNav}>
            <button 
              onClick={() => setChartOffset(prev => prev + 5)} 
              style={styles.dateNavBtn} 
              title="5 Hari Sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
              {chartOffset === 0 ? '5 Hari Terakhir' : `${chartOffset} Hari Sebelumnya`}
            </span>
            <button 
              onClick={() => setChartOffset(prev => Math.max(0, prev - 5))} 
              style={{
                ...styles.dateNavBtn,
                opacity: chartOffset === 0 ? 0.3 : 1,
                cursor: chartOffset === 0 ? 'not-allowed' : 'pointer'
              }}
              title="5 Hari Berikutnya"
              disabled={chartOffset === 0}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
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
                  backgroundColor: 'var(--bg-card)', 
                  borderRadius: '8px', 
                  border: '1.5px solid var(--border-color)',
                  fontFamily: 'var(--font-family)'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '700', paddingBottom: '20px' }} verticalAlign="top" />
              <Bar dataKey="Hadir" fill="#68B36B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Tidak Hadir" fill="#E57373" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance Recap Table */}
      <div style={{ ...styles.card, marginTop: '24px' }}>
        <div style={styles.recapHeader}>
          <h3 style={styles.cardTitle}>Rekap Absensi Harian</h3>
          <div style={styles.dateNav}>
            <button onClick={() => shiftRecapDate(-1)} style={styles.dateNavBtn} title="Hari Sebelumnya">
              <ChevronLeft size={18} />
            </button>
            <div 
              style={{ ...styles.dateDisplay, cursor: 'pointer' }}
              onClick={(e) => {
                const input = document.getElementById('recap-date-input');
                if (input && input.showPicker) {
                  input.showPicker();
                } else if (input) {
                  input.focus();
                }
              }}
              title="Pilih Tanggal"
            >
              <Calendar size={14} style={{ marginRight: '6px', color: 'var(--color-primary)' }} />
              <input
                id="recap-date-input"
                type="date"
                max={getTodayDateStr()}
                value={recapDate}
                onChange={(e) => setRecapDate(e.target.value)}
                style={styles.dateInput}
              />
              <span style={styles.dateLabelFull}>{formatRecapDate(recapDate)}</span>
            </div>
            <button 
              onClick={() => shiftRecapDate(1)} 
              style={{ 
                ...styles.dateNavBtn, 
                opacity: recapDate >= getTodayDateStr() ? 0.3 : 1,
                cursor: recapDate >= getTodayDateStr() ? 'not-allowed' : 'pointer'
              }} 
              title="Hari Berikutnya"
              disabled={recapDate >= getTodayDateStr()}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {recapLoading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Memuat data rekap...
          </div>
        ) : recapRecords.length === 0 ? (
          <div style={styles.emptyRecap}>
            <span style={{ fontSize: '28px', marginBottom: '8px' }}>📋</span>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tidak ada data absensi pada tanggal ini.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Status</th>
                  <th>Jam Masuk</th>
                  <th>Catatan</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recapRecords.map((rec, idx) => (
                  <tr key={rec.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: '700' }}>{rec.profiles?.full_name || '-'}</td>
                    <td>{rec.profiles?.classes?.name || '-'}</td>
                    <td>{renderStatusBadge(rec.status, rec.is_late)}</td>
                    <td>
                      {formatTime(rec.check_in_time)}
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.notes || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {rec.status !== 'hadir' ? (
                        <button
                          onClick={() => handleEditClick(rec)}
                          style={styles.actionBtnEdit}
                          title="Edit Keterangan Tidak Masuk"
                        >
                          <Edit2 size={14} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Status Absensi</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Student info */}
            <div style={styles.editStudentInfo}>
              <div style={styles.editAvatar}>
                {editingRecord?.profiles?.full_name?.substring(0, 1) || 'S'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>{editingRecord?.profiles?.full_name || 'Siswa'}</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{editingRecord?.profiles?.classes?.name || 'Kelas'} • {recapDate}</span>
              </div>
            </div>

            {editError && (
              <div style={styles.editError}>
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Keterangan Tidak Masuk</label>
                <select
                  className="form-control"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  required
                >
                  <option value="izin">📝 Izin</option>
                  <option value="sakit">🏥 Sakit</option>
                  <option value="tanpa_keterangan">❌ Tanpa Keterangan (Alfa)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan (opsional)</label>
                <textarea
                  className="form-control"
                  placeholder="Contoh: Surat dokter sudah diterima, Izin acara keluarga, dll."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    backgroundColor: 'var(--bg-card)',
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
  card: {
    backgroundColor: 'var(--bg-card)',
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
  // Recap Table styles
  recapHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
  },
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dateNavBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1.5px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    cursor: 'pointer',
    color: 'var(--text-dark)',
    transition: 'background-color 0.2s',
  },
  dateDisplay: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: 'var(--bg-workspace)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-dark)',
  },
  dateInput: {
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-dark)',
    cursor: 'pointer',
    outline: 'none',
    width: '0',
    padding: '0',
    opacity: 0,
    position: 'absolute',
  },
  dateLabelFull: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-dark)',
    cursor: 'pointer',
  },
  emptyRecap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    border: '1.5px dashed var(--border-color)',
    borderRadius: '12px',
  },
  actionBtnEdit: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--color-info-bg)',
    color: 'var(--color-info)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  // Edit modal styles
  editStudentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    backgroundColor: 'var(--bg-workspace)',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '1px solid var(--border-color)',
  },
  editAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-primary)',
    fontWeight: '900',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editError: {
    padding: '10px 14px',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '1.5px solid var(--color-danger)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '16px',
  },
};
