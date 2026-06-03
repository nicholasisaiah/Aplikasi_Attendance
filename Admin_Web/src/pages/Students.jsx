import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Search, Edit2, Trash2, AlertTriangle, UserPlus, Check } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nisn: '',
    classId: '',
    fingerprintId: ''
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentsAndClasses = async () => {
    try {
      setLoading(true);
      // Fetch classes for dropdowns and display
      const { data: classData, error: classErr } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (classErr) throw classErr;
      setClasses(classData || []);

      // Fetch profiles with role = student and join classes
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*, classes:classes!profiles_class_id_fkey(*)')
        .eq('role', 'student')
        .order('full_name');

      if (profileErr) throw profileErr;
      setStudents(profileData || []);
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsAndClasses();
  }, []);

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.full_name || '',
      nisn: student.nisn || '',
      classId: student.class_id || '',
      fingerprintId: student.fingerprint_id || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName) {
      setModalError('Nama lengkap wajib diisi.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const updatePayload = {
        full_name: formData.fullName,
        nisn: formData.nisn || null,
        class_id: formData.classId || null,
        fingerprint_id: formData.fingerprintId ? parseInt(formData.fingerprintId) : null
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', editingStudent.id);

      if (error) throw error;

      setIsModalOpen(false);
      fetchStudentsAndClasses();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan data siswa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (studentId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini juga akan menghapus seluruh data absensinya.')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', studentId);
        
        if (error) throw error;
        fetchStudentsAndClasses();
      } catch (err) {
        alert('Gagal menghapus siswa: ' + err.message);
      }
    }
  };

  // Filter students based on search query and class selection
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn?.includes(searchQuery) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = selectedClassFilter === '' || student.class_id === selectedClassFilter;
    
    return matchesSearch && matchesClass;
  });

  return (
    <div className="page-container">
      <div style={styles.header}>
        <div>
          <h1>Data Siswa</h1>
          <p>Manajemen data siswa, kelas, dan nomor sidik jari (Fingerprint ID).</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={styles.filterSection}>
        <div style={styles.searchBox}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari nama, NISN, atau email siswa..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '200px' }}
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Student List Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Memuat data siswa...</h3>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>NISN</th>
                <th>Email</th>
                <th>Kelas</th>
                <th>Fingerprint ID</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                    Tidak ada data siswa yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: '700' }}>{student.full_name}</td>
                    <td>{student.nisn || '-'}</td>
                    <td>{student.fingerprint_id ? `siswa.${student.fingerprint_id}@smkasisi.sch.id` : '-'}</td>
                    <td>
                      {student.classes ? (
                        <span className="badge badge-info">{student.classes.name}</span>
                      ) : (
                        <span className="badge badge-danger">Belum Ada Kelas</span>
                      )}
                    </td>
                    <td>
                      {student.fingerprint_id !== null ? (
                        <span style={styles.fingerprintBadge}>
                          <Check size={12} color="var(--color-success)" />
                          <span>ID: {student.fingerprint_id}</span>
                        </span>
                      ) : (
                        <span style={styles.fingerprintWarning}>
                          <AlertTriangle size={12} color="var(--color-warning)" />
                          <span>Belum Diatur</span>
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={styles.actionGroup}>
                        <button
                          onClick={() => handleEditClick(student)}
                          style={styles.actionBtnEdit}
                          title="Edit Siswa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(student.id)}
                          style={styles.actionBtnDelete}
                          title="Hapus Siswa"
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

      {/* Edit Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Data Siswa</h3>
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
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">NISN</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contoh: 0054298132"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kelas</label>
                <select
                  className="form-control"
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                >
                  <option value="">Pilih Kelas...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.major}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fingerprint ID (Hardware Mapping)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Nomor ID sidik jari di mesin, misal: 1"
                  value={formData.fingerprintId}
                  onChange={(e) => setFormData({ ...formData, fingerprintId: e.target.value })}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  ID ini harus sesuai dengan ID pendaftaran sidik jari siswa di perangkat fisik.
                </small>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
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
  filterSection: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--bg-card)',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0 14px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    height: '40px',
    fontSize: '14px',
    color: 'var(--text-dark)',
  },
  fingerprintBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
  },
  fingerprintWarning: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
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
    transition: 'background-color 0.2s',
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
