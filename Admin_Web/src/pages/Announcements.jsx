import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Plus, Trash2, Megaphone, Calendar, Send } from 'lucide-react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form/Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    emoji: '📢',
    targetClasses: [], // empty means all classes
    isPublished: true
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncementsAndClasses = async () => {
    try {
      setLoading(true);
      // 1. Fetch announcements
      const { data: annData, error: annErr } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (annErr) throw annErr;
      setAnnouncements(annData || []);

      // 2. Fetch classes for target selection
      const { data: classData, error: classErr } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (classErr) throw classErr;
      setClasses(classData || []);
    } catch (err) {
      console.error('Error fetching announcements data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncementsAndClasses();
  }, []);

  const handleCreateClick = () => {
    setFormData({
      title: '',
      content: '',
      emoji: '📢',
      targetClasses: [],
      isPublished: true
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleClassCheckboxChange = (classId) => {
    setFormData(prev => {
      const targets = [...prev.targetClasses];
      if (targets.includes(classId)) {
        return { ...prev, targetClasses: targets.filter(id => id !== classId) };
      } else {
        return { ...prev, targetClasses: [...targets, classId] };
      }
    });
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setModalError('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        emoji: formData.emoji || '📢',
        target_classes: formData.targetClasses.length > 0 ? formData.targetClasses : null,
        is_published: formData.isPublished,
        published_at: formData.isPublished ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('announcements')
        .insert(payload);

      if (error) throw error;

      setIsModalOpen(false);
      fetchAnnouncementsAndClasses();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan pengumuman.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = async (annId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      try {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', annId);

        if (error) throw error;
        fetchAnnouncementsAndClasses();
      } catch (err) {
        alert('Gagal menghapus pengumuman: ' + err.message);
      }
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Draft';
    const date = new Date(isoStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      <div style={styles.header}>
        <div>
          <h1>Pengumuman Sekolah</h1>
          <p>Kirimkan informasi, berita, dan pengumuman yang tersambung langsung ke aplikasi mobile siswa/orang tua.</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateClick}>
          <Plus size={16} />
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Memuat pengumuman...</h3>
        </div>
      ) : (
        <div style={styles.listContainer}>
          {announcements.length === 0 ? (
            <div style={styles.emptyContainer}>
              <Megaphone size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h3>Belum Ada Pengumuman</h3>
              <p>Klik tombol 'Buat Pengumuman' di atas untuk menyiarkan informasi pertama Anda.</p>
            </div>
          ) : (
            <div style={styles.annGrid}>
              {announcements.map(ann => (
                <div key={ann.id} style={styles.annCard}>
                  {/* Card Header */}
                  <div style={styles.cardHeader}>
                    <div style={styles.emojiCircle}>
                      <span style={{ fontSize: '20px' }}>{ann.emoji || '📢'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={styles.annTitle}>{ann.title}</h3>
                      <div style={styles.metaInfo}>
                        <Calendar size={12} />
                        <span>{formatDate(ann.published_at || ann.created_at)}</span>
                        {ann.target_classes ? (
                          <span className="badge badge-info" style={{ fontSize: '10px', marginLeft: '6px' }}>Kelas Khusus</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '10px', marginLeft: '6px' }}>Semua Kelas</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteClick(ann.id)}
                      style={styles.deleteBtn}
                      title="Hapus Pengumuman"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div style={styles.cardBody}>
                    <p style={styles.annContent}>{ann.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Buat Pengumuman Baru</h3>
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
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }} className="form-group">
                <div>
                  <label className="form-label">Emoji</label>
                  <select
                    className="form-control"
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  >
                    <option value="📢">📢 Pengumuman</option>
                    <option value="🏫">🏫 Sekolah</option>
                    <option value="📝">📝 Ujian</option>
                    <option value="🌙">🌙 Hari Libur</option>
                    <option value="🏆">🏆 Prestasi</option>
                    <option value="⚠️">⚠️ Peringatan</option>
                    <option value="🎉">🎉 Acara</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Judul Pengumuman</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Masukkan judul pengumuman..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Isi Pengumuman</label>
                <textarea
                  className="form-control"
                  rows="5"
                  placeholder="Ketik isi pengumuman secara lengkap di sini..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Kelas (Kosongkan untuk menyiarkan ke semua kelas)</label>
                <div style={styles.classesGrid}>
                  {classes.map(c => (
                    <label key={c.id} style={styles.classLabel}>
                      <input
                        type="checkbox"
                        checked={formData.targetClasses.includes(c.id)}
                        onChange={() => handleClassCheckboxChange(c.id)}
                        style={{ marginRight: '8px' }}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  style={{ marginRight: '10px', width: '18px', height: '18px' }}
                />
                <label htmlFor="isPublished" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)', cursor: 'pointer' }}>
                  Terbitkan Sekarang (Siswa langsung dapat melihat)
                </label>
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
                  <Send size={16} />
                  <span>{submitting ? 'Mengirim...' : 'Siarkan'}</span>
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
  listContainer: {
    minHeight: '260px',
  },
  emptyContainer: {
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
  annGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  annCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1.5px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
    padding: '24px',
    transition: 'transform 0.15s',
  },
  cardHeader: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  emojiCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-workspace)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  annTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--text-dark)',
    margin: 0,
  },
  metaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginTop: '4px',
  },
  deleteBtn: {
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
    alignSelf: 'center',
  },
  cardBody: {
    borderTop: '1px dashed var(--border-color)',
    paddingTop: '16px',
  },
  annContent: {
    fontSize: '14px',
    color: 'var(--text-dark)',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '10px',
    marginTop: '8px',
    padding: '12px',
    border: '1.5px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-workspace)',
    maxHeight: '140px',
    overflowY: 'auto',
  },
  classLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-dark)',
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
