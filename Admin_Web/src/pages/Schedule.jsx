import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';

export default function Schedule() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDayNum, setSelectedDayNum] = useState(1); // 1 = Monday, 5 = Friday
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    dayOfWeek: 1,
    startTime: '07:30',
    endTime: '09:00'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const days = [
    { num: 1, label: 'Senin' },
    { num: 2, label: 'Selasa' },
    { num: 3, label: 'Rabu' },
    { num: 4, label: 'Kamis' },
    { num: 5, label: 'Jumat' }
  ];

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Fetch classes
      const { data: classData, error: classErr } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (classErr) throw classErr;
      setClasses(classData || []);

      if (classData && classData.length > 0) {
        setSelectedClassId(classData[0].id);
      }

      // 2. Fetch subjects
      const { data: subjectData, error: subjectErr } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectErr) throw subjectErr;
      setSubjects(subjectData || []);
    } catch (err) {
      console.error('Error fetching initial schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulesForClass = async () => {
    if (!selectedClassId) return;
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, subjects(*)')
        .eq('class_id', selectedClassId)
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSchedulesForClass();
  }, [selectedClassId]);

  const handleCreateClick = () => {
    setFormData({
      subjectId: subjects.length > 0 ? subjects[0].id : '',
      dayOfWeek: selectedDayNum,
      startTime: '07:30',
      endTime: '09:00'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.startTime || !formData.endTime) {
      setModalError('Seluruh field harus diisi.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      // Format to HH:MM:SS
      const formattedStartTime = formData.startTime.includes(':') && formData.startTime.split(':').length === 2 
        ? `${formData.startTime}:00` 
        : formData.startTime;
      const formattedEndTime = formData.endTime.includes(':') && formData.endTime.split(':').length === 2 
        ? `${formData.endTime}:00` 
        : formData.endTime;

      const payload = {
        class_id: selectedClassId,
        subject_id: formData.subjectId,
        day_of_week: formData.dayOfWeek,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        academic_year: '2025/2026'
      };

      const { error } = await supabase
        .from('schedules')
        .insert(payload);

      if (error) throw error;

      setIsModalOpen(false);
      fetchSchedulesForClass();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan jadwal pelajaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (scheduleId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus slot jadwal pelajaran ini?')) {
      try {
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', scheduleId);

        if (error) throw error;
        fetchSchedulesForClass();
      } catch (err) {
        alert('Gagal menghapus jadwal: ' + err.message);
      }
    }
  };

  const currentDaySchedules = schedules.filter(s => s.day_of_week === selectedDayNum);

  // Helper to strip seconds from time e.g. "07:30:00" -> "07.30"
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : timeStr;
  };

  return (
    <div className="page-container">
      <div style={styles.header}>
        <div>
          <h1>Jadwal Pelajaran</h1>
          <p>Atur slot pelajaran mingguan siswa berdasarkan kelas masing-masing.</p>
        </div>
        {selectedClassId && (
          <button className="btn btn-primary" onClick={handleCreateClick}>
            <Plus size={16} />
            <span>Tambah Pelajaran</span>
          </button>
        )}
      </div>

      {/* Class Selector Dropdown */}
      <div style={styles.classSelectorBar}>
        <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>Pilih Kelas: </span>
        <select
          className="form-control"
          style={{ width: '220px', display: 'inline-block' }}
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.major})</option>
          ))}
        </select>
      </div>

      {/* Weekday Tabs */}
      <div style={styles.tabContainer}>
        {days.map(d => (
          <button
            key={d.num}
            onClick={() => setSelectedDayNum(d.num)}
            style={{
              ...styles.tabButton,
              borderBottom: selectedDayNum === d.num ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: selectedDayNum === d.num ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: selectedDayNum === d.num ? '800' : '600',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Timetable Card/List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Memuat jadwal...</h3>
        </div>
      ) : (
        <div style={styles.scheduleBoard}>
          {currentDaySchedules.length === 0 ? (
            <div style={styles.emptyBoard}>
              <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h3>Tidak Ada Jadwal Hari Ini</h3>
              <p>Tidak ada mata pelajaran yang terjadwal untuk hari ini.</p>
            </div>
          ) : (
            <div style={styles.scheduleGrid}>
              {currentDaySchedules.map(slot => (
                <div key={slot.id} style={styles.scheduleCard}>
                  {/* Color Banner */}
                  <div style={{ ...styles.cardBanner, backgroundColor: slot.subjects?.color || 'var(--color-primary)' }} />
                  
                  {/* Card Content */}
                  <div style={styles.cardContent}>
                    <h3 style={styles.subjectName}>{slot.subjects?.name || 'Mata Pelajaran'}</h3>
                    <div style={styles.timeInfo}>
                      <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <button 
                    onClick={() => handleDeleteClick(slot.id)} 
                    style={styles.deleteBtn}
                    title="Hapus Jadwal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tambah Jadwal Pelajaran</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {modalError && (
              <div style={styles.modalError}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label className="form-label">Mata Pelajaran</label>
                {subjects.length === 0 ? (
                  <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>
                    Warning: Belum ada mata pelajaran terdaftar di database.
                  </p>
                ) : (
                  <select
                    className="form-control"
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    required
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Hari</label>
                <select
                  className="form-control"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                >
                  {days.map(d => (
                    <option key={d.num} value={d.num}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Jam Mulai</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jam Selesai</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || subjects.length === 0}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  classSelectorBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1.5px solid var(--border-color)',
    marginBottom: '24px',
    boxShadow: 'var(--card-shadow)',
  },
  tabContainer: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1.5px solid var(--border-color)',
    marginBottom: '24px',
  },
  tabButton: {
    background: 'none',
    border: 'none',
    padding: '12px 24px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  scheduleBoard: {
    minHeight: '260px',
  },
  emptyBoard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: '#FFFFFF',
    border: '1.5px dashed var(--border-color)',
    borderRadius: '16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
  },
  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1.5px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardBanner: {
    height: '8px',
    width: '100%',
  },
  cardContent: {
    padding: '20px',
    paddingRight: '48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  subjectName: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--text-dark)',
    margin: 0,
  },
  timeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  deleteBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  modalError: {
    padding: '10px 14px',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '1.5px solid var(--color-danger)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '16px',
  }
};
