import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { MAJOR_OPTIONS, resolveMajor } from '../utils/majorUtils';

const SECTION_OPTIONS = [
  { value: 'X', label: 'X (Kelas 10)' },
  { value: 'XI', label: 'XI (Kelas 11)' },
  { value: 'XII', label: 'XII (Kelas 12)' },
];

const SECTION_ORDER = { 'X': 1, 'XI': 2, 'XII': 3 };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSection, setFilterSection] = useState('');
  const [filterMajor, setFilterMajor] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    major: '',
    homeroomTeacherId: '',
    homeroomTeacherPhone: '',
    academicYear: '2025/2026'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClassesAndTeachers = async () => {
    try {
      setLoading(true);
      
      // Fetch classes and join homeroom teacher
      const { data: classData, error: classErr } = await supabase
        .from('classes')
        .select('*, profiles:homeroom_teacher_id(full_name, phone)')
        .order('name');

      if (classErr) throw classErr;
      setClasses(classData || []);

      // Fetch potential homeroom teachers (role = teacher or admin)
      const { data: teacherData, error: teacherErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('role', ['teacher', 'admin'])
        .order('full_name');

      if (teacherErr) throw teacherErr;
      setTeachers(teacherData || []);
    } catch (err) {
      console.error('Error fetching class data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndTeachers();
  }, []);

  const handleCreateClick = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      section: '',
      major: '',
      homeroomTeacherId: '',
      homeroomTeacherPhone: '',
      academicYear: '2025/2026'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (c) => {
    setEditingClass(c);
    setFormData({
      name: c.name || '',
      section: c.section || '',
      major: resolveMajor(c.major),
      homeroomTeacherId: c.homeroom_teacher_id || '',
      homeroomTeacherPhone: c.profiles?.phone || '',
      academicYear: c.academic_year || '2025/2026'
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.academicYear) {
      setModalError('Nama kelas dan tahun ajaran wajib diisi.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const payload = {
        name: formData.name,
        section: formData.section || null,
        major: formData.major || null,
        homeroom_teacher_id: formData.homeroomTeacherId || null,
        academic_year: formData.academicYear
      };

      if (editingClass) {
        // Update
        const { error } = await supabase
          .from('classes')
          .update(payload)
          .eq('id', editingClass.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('classes')
          .insert(payload);

        if (error) throw error;
      }

      // Update teacher phone number if a teacher is selected and phone is provided
      if (formData.homeroomTeacherId && formData.homeroomTeacherPhone) {
        const { error: phoneErr } = await supabase
          .from('profiles')
          .update({ phone: formData.homeroomTeacherPhone })
          .eq('id', formData.homeroomTeacherId);

        if (phoneErr) console.error('Gagal menyimpan nomor telepon guru:', phoneErr.message);
      }

      setIsModalOpen(false);
      fetchClassesAndTeachers();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data kelas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (classId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini juga akan memutuskan kelas dari siswa yang terdaftar di dalamnya.')) {
      try {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', classId);

        if (error) throw error;
        fetchClassesAndTeachers();
      } catch (err) {
        alert('Gagal menghapus kelas: ' + err.message);
      }
    }
  };

  // Build unique teacher list from loaded classes for filter dropdown
  const assignedTeachers = classes
    .filter(c => c.profiles?.full_name)
    .reduce((acc, c) => {
      const name = c.profiles.full_name;
      if (!acc.find(t => t.name === name)) acc.push({ id: c.homeroom_teacher_id, name });
      return acc;
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter classes based on dropdown selections
  const filteredClasses = classes.filter(c => {
    const matchSection = filterSection === '' || c.section === filterSection;
    const matchMajor = filterMajor === '' || resolveMajor(c.major) === filterMajor;
    const matchTeacher = filterTeacher === '' || c.homeroom_teacher_id === filterTeacher;
    return matchSection && matchMajor && matchTeacher;
  });

  return (
    <div className="page-container">
      <div style={styles.header}>
        <div>
          <h1>Data Kelas</h1>
          <p>Manajemen kelas, jurusan, dan penugasan Wali Kelas.</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateClick}>
          <Plus size={16} />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Filter Dropdowns */}
      <div style={styles.filterSection}>
        <select
          className="form-control"
          style={{ width: '160px' }}
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
        >
          <option value="">Semua Tingkat</option>
          {SECTION_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.value}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: '260px' }}
          value={filterMajor}
          onChange={(e) => setFilterMajor(e.target.value)}
        >
          <option value="">Semua Jurusan</option>
          {MAJOR_OPTIONS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          className="form-control"
          style={{ width: '200px' }}
          value={filterTeacher}
          onChange={(e) => setFilterTeacher(e.target.value)}
        >
          <option value="">Semua Wali Kelas</option>
          {assignedTeachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Memuat data kelas...</h3>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Kelas</th>
                <th>Tingkat</th>
                <th>Jurusan</th>
                <th>Wali Kelas</th>
                <th>No. HP Wali Kelas</th>
                <th>Tahun Ajaran</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    {classes.length === 0 ? "Belum ada kelas yang terdaftar. Klik 'Tambah Kelas' untuk membuat baru." : 'Tidak ada kelas yang cocok dengan filter.'}
                  </td>
                </tr>
              ) : (
                filteredClasses.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '700' }}>{c.name}</td>
                    <td>{c.section || '-'}</td>
                    <td>{resolveMajor(c.major) || '-'}</td>
                    <td>
                      {c.profiles ? (
                        <span style={styles.teacherBadge}>{c.profiles.full_name}</span>
                      ) : (
                        <span style={styles.noTeacher}>Belum Ditentukan</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', fontWeight: '700' }}>
                      {c.profiles?.phone || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>Belum diisi</span>}
                    </td>
                    <td>{c.academic_year}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={styles.actionGroup}>
                        <button
                          onClick={() => handleEditClick(c)}
                          style={styles.actionBtnEdit}
                          title="Edit Kelas"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c.id)}
                          style={styles.actionBtnDelete}
                          title="Hapus Kelas"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Class Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
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
                <label className="form-label">Nama Kelas</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: XII TKJ 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tingkat / Section</label>
                <select
                  className="form-control"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                >
                  <option value="">Pilih Tingkat...</option>
                  {SECTION_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jurusan</label>
                <select
                  className="form-control"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                >
                  <option value="">Pilih Jurusan...</option>
                  {MAJOR_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Wali Kelas</label>
                <select
                  className="form-control"
                  value={formData.homeroomTeacherId}
                  onChange={(e) => {
                    const selectedTeacherId = e.target.value;
                    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
                    setFormData({
                      ...formData,
                      homeroomTeacherId: selectedTeacherId,
                      homeroomTeacherPhone: selectedTeacher?.phone || ''
                    });
                  }}
                >
                  <option value="">Pilih Guru...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>

              {formData.homeroomTeacherId && (
                <div className="form-group">
                  <label className="form-label">No. Telepon Wali Kelas (WhatsApp)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: 628123456789"
                    value={formData.homeroomTeacherPhone}
                    onChange={(e) => setFormData({ ...formData, homeroomTeacherPhone: e.target.value })}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    Nomor ini akan ditampilkan di aplikasi siswa untuk tombol kontak WhatsApp. Format: 628xxxxxxxxxx
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Tahun Ajaran</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 2025/2026"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  required
                />
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
                  disabled={submitting}
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
    marginBottom: '28px',
  },
  filterSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  teacherBadge: {
    display: 'inline-flex',
    padding: '4px 10px',
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '800',
  },
  noTeacher: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontStyle: 'italic',
  },
  actionGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
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
  },
  actionBtnDelete: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    cursor: 'pointer',
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
