import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Search, Edit2, Trash2, AlertTriangle, UserPlus, Check, KeyRound, Eye, EyeOff, Copy, CheckCircle, Plus } from 'lucide-react';
import { resolveMajor } from '../utils/majorUtils';

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

  // Create Student Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    nisn: '',
    fingerprintId: '',
    classId: '',
    password: 'AsisiSiswa2026!'
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(null); // holds created student info
  const [creating, setCreating] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStudent, setResetStudent] = useState(null);
  const [resetPassword, setResetPassword] = useState('AsisiSiswa2026!');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // --- Create Student Handlers ---
  const handleCreateClick = () => {
    setCreateFormData({
      fullName: '',
      nisn: '',
      fingerprintId: '',
      classId: '',
      password: 'AsisiSiswa2026!'
    });
    setShowCreatePassword(false);
    setCreateError('');
    setCreateSuccess(null);
    setCopiedEmail(false);
    setCopiedPassword(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createFormData.fullName.trim()) {
      setCreateError('Nama lengkap wajib diisi.');
      return;
    }
    if (!createFormData.fingerprintId && createFormData.fingerprintId !== 0) {
      setCreateError('Fingerprint ID wajib diisi untuk pembuatan akun.');
      return;
    }
    if (!createFormData.password || createFormData.password.length < 6) {
      setCreateError('Password minimal 6 karakter.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCreateError('Sesi Anda telah berakhir. Silakan login ulang.');
        return;
      }

      const response = await fetch('/api/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: createFormData.fullName,
          nisn: createFormData.nisn,
          fingerprintId: createFormData.fingerprintId,
          classId: createFormData.classId,
          password: createFormData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat akun siswa.');
      }

      setCreateSuccess({
        fullName: result.student.fullName,
        email: result.student.email,
        password: createFormData.password,
        fingerprintId: result.student.fingerprintId,
      });
      fetchStudentsAndClasses();
    } catch (err) {
      setCreateError(err.message || 'Gagal membuat akun siswa.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyEmail = () => {
    if (createSuccess?.email) {
      navigator.clipboard.writeText(createSuccess.email).then(() => {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      });
    }
  };

  const handleCopyCreatePassword = () => {
    if (createSuccess?.password) {
      navigator.clipboard.writeText(createSuccess.password).then(() => {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      });
    }
  };

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

  // --- Reset Password Handlers ---
  const handleResetPasswordClick = (student) => {
    setResetStudent(student);
    setResetPassword('AsisiSiswa2026!');
    setShowResetPassword(false);
    setResetError('');
    setResetSuccess('');
    setCopied(false);
    setIsResetModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPassword || resetPassword.length < 6) {
      setResetError('Password minimal 6 karakter.');
      return;
    }

    setResetting(true);
    setResetError('');
    setResetSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setResetError('Sesi Anda telah berakhir. Silakan login ulang.');
        return;
      }

      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          studentId: resetStudent.id,
          newPassword: resetPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mereset password.');
      }

      setResetSuccess(`Password berhasil direset untuk ${resetStudent.full_name}.`);
    } catch (err) {
      setResetError(err.message || 'Gagal mereset password.');
    } finally {
      setResetting(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(resetPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        <button className="btn btn-primary" onClick={handleCreateClick}>
          <Plus size={16} />
          <span>Tambah Siswa</span>
        </button>
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
                          onClick={() => handleResetPasswordClick(student)}
                          style={styles.actionBtnReset}
                          title="Reset Password"
                        >
                          <KeyRound size={14} />
                        </button>
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

      {/* Create Student Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => { if (!creating) setIsCreateModalOpen(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{createSuccess ? 'Akun Siswa Berhasil Dibuat' : 'Tambah Siswa Baru'}</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {createError && (
              <div style={styles.modalError}>
                {createError}
              </div>
            )}

            {!createSuccess ? (
              <form onSubmit={handleCreateSubmit}>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: Ahmad Rizki"
                    value={createFormData.fullName}
                    onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">NISN</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: 0054298132"
                    value={createFormData.nisn}
                    onChange={(e) => setCreateFormData({ ...createFormData, nisn: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fingerprint ID *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Nomor ID sidik jari di mesin, misal: 1"
                    value={createFormData.fingerprintId}
                    onChange={(e) => setCreateFormData({ ...createFormData, fingerprintId: e.target.value })}
                    required
                    min="0"
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    ID ini juga digunakan sebagai email login: <strong>siswa.{createFormData.fingerprintId || '?'}@smkasisi.sch.id</strong>
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Kelas</label>
                  <select
                    className="form-control"
                    value={createFormData.classId}
                    onChange={(e) => setCreateFormData({ ...createFormData, classId: e.target.value })}
                  >
                    <option value="">Pilih Kelas...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {resolveMajor(c.major)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={styles.passwordInputWrapper}>
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      className="form-control"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      placeholder="Masukkan password..."
                      style={{ paddingRight: '44px' }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      style={styles.passwordToggle}
                    >
                      {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                    Password default: <strong>AsisiSiswa2026!</strong> — Minimal 6 karakter.
                  </small>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={creating}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creating}
                    style={{ gap: '6px' }}
                  >
                    <UserPlus size={14} />
                    {creating ? 'Membuat Akun...' : 'Buat Akun Siswa'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={styles.createSuccessBox}>
                  <CheckCircle size={16} />
                  <span>Akun untuk <strong>{createSuccess.fullName}</strong> berhasil dibuat!</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Login</label>
                  <div style={styles.copyPasswordBox}>
                    <code style={{ flex: 1, fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>
                      {createSuccess.email}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      style={styles.copyButton}
                      title="Salin email"
                    >
                      {copiedEmail ? <CheckCircle size={14} color="var(--color-success)" /> : <Copy size={14} />}
                      <span style={{ fontSize: '12px' }}>{copiedEmail ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={styles.copyPasswordBox}>
                    <code style={{ flex: 1, fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>
                      {createSuccess.password}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCreatePassword}
                      style={styles.copyButton}
                      title="Salin password"
                    >
                      {copiedPassword ? <CheckCircle size={14} color="var(--color-success)" /> : <Copy size={14} />}
                      <span style={{ fontSize: '12px' }}>{copiedPassword ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div style={styles.credentialNote}>
                  <AlertTriangle size={14} color="var(--color-warning)" />
                  <span>Catat informasi di atas dan berikan kepada siswa. Password tidak dapat dilihat lagi setelah modal ini ditutup.</span>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                    <option key={c.id} value={c.id}>{c.name} - {resolveMajor(c.major)}</option>
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

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResetModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password Siswa</h3>
              <button 
                onClick={() => setIsResetModalOpen(false)} 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Student Info */}
            <div style={styles.resetStudentInfo}>
              <div style={styles.resetStudentAvatar}>
                {resetStudent?.full_name?.charAt(0) || 'S'}
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-dark)' }}>
                  {resetStudent?.full_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {resetStudent?.fingerprint_id ? `siswa.${resetStudent.fingerprint_id}@smkasisi.sch.id` : 'Email belum tersedia'}
                </div>
              </div>
            </div>

            {resetError && (
              <div style={styles.modalError}>
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div style={styles.resetSuccessBox}>
                <CheckCircle size={16} />
                <span>{resetSuccess}</span>
              </div>
            )}

            {!resetSuccess ? (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Password Baru</label>
                  <div style={styles.passwordInputWrapper}>
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      className="form-control"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Masukkan password baru..."
                      style={{ paddingRight: '44px' }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={styles.passwordToggle}
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                    Password default: <strong>AsisiSiswa2026!</strong> — Minimal 6 karakter.
                  </small>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsResetModalOpen(false)}
                    disabled={resetting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={resetting}
                    style={{ gap: '6px' }}
                  >
                    <KeyRound size={14} />
                    {resetting ? 'Mereset...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Password yang sudah di-set:</label>
                  <div style={styles.copyPasswordBox}>
                    <code style={{ flex: 1, fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>
                      {resetPassword}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      style={styles.copyButton}
                      title="Salin password"
                    >
                      {copied ? <CheckCircle size={14} color="var(--color-success)" /> : <Copy size={14} />}
                      <span style={{ fontSize: '12px' }}>{copied ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsResetModalOpen(false)}
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
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
  },
  actionBtnReset: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  resetStudentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: 'var(--bg-workspace)',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '1px solid var(--border-color)',
  },
  resetStudentAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resetSuccessBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1.5px solid var(--color-success)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '16px',
  },
  passwordInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  copyPasswordBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: 'var(--bg-workspace)',
    borderRadius: '8px',
    border: '1.5px solid var(--border-color)',
  },
  copyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-dark)',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '12px',
    transition: 'background-color 0.2s',
  },
  createSuccessBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1.5px solid var(--color-success)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '16px',
  },
  credentialNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    marginTop: '8px',
    lineHeight: '1.5',
  },
};
