import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    admin_name: "Tata Usaha",
    admin_wa_number: "",
    school_name: "SMK Asisi Jakarta",
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          admin_name: data.admin_name || "Tata Usaha",
          admin_wa_number: data.admin_wa_number || "",
          school_name: data.school_name || "SMK Asisi Jakarta",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ text: "", type: "" });
      
      const { data: existData } = await supabase
        .from("school_settings")
        .select("id")
        .limit(1)
        .single();
        
      if (existData?.id) {
        const { error } = await supabase
          .from("school_settings")
          .update({
            admin_name: settings.admin_name,
            admin_wa_number: settings.admin_wa_number,
            school_name: settings.school_name
          })
          .eq("id", existData.id);
          
        if (error) throw error;
      }
      
      setMessage({ text: "Pengaturan berhasil disimpan!", type: "success" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ text: "Gagal menyimpan pengaturan.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Memuat pengaturan...</h3>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={styles.header}>
        <div>
          <h1>Pengaturan</h1>
          <p>Kelola kontak Tata Usaha dan informasi umum sekolah.</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3>Kontak Tata Usaha</h3>
          <p>Informasi ini akan ditampilkan pada profil siswa di aplikasi mobile.</p>
        </div>

        <form onSubmit={handleSave} style={{ padding: '24px' }}>
          {message.text && (
            <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
              {message.text}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="school_name" className="form-label">
              Nama Sekolah
            </label>
            <input
              type="text"
              id="school_name"
              name="school_name"
              value={settings.school_name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="admin_name" className="form-label">
                Nama Kontak (Tata Usaha)
              </label>
              <input
                type="text"
                id="admin_name"
                name="admin_name"
                value={settings.admin_name}
                onChange={handleChange}
                placeholder="Contoh: Bpk. Budi (Tata Usaha)"
                className="form-control"
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="admin_wa_number" className="form-label">
                Nomor WhatsApp
              </label>
              <div style={{ display: 'flex' }}>
                <span style={styles.inputPrefix}>
                  +62
                </span>
                <input
                  type="text"
                  id="admin_wa_number"
                  name="admin_wa_number"
                  value={settings.admin_wa_number.replace(/^62/, '')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setSettings(prev => ({ ...prev, admin_wa_number: '62' + val }));
                  }}
                  placeholder="8123456789"
                  className="form-control"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  required
                />
              </div>
              <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>Mulai dari angka 8 (contoh: 812...)</p>
            </div>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>
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
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1.5px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
    overflow: 'hidden',
    maxWidth: '800px',
  },
  cardHeader: {
    padding: '20px 24px',
    backgroundColor: '#FDFBF8',
    borderBottom: '1.5px solid var(--border-color)',
  },
  row: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  alertSuccess: {
    padding: '12px 16px',
    backgroundColor: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1.5px solid var(--color-success)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '20px',
  },
  alertError: {
    padding: '12px 16px',
    backgroundColor: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '1.5px solid var(--color-danger)',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '20px',
  },
  inputPrefix: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 14px',
    backgroundColor: '#F3EFE9',
    border: '1.5px solid var(--border-color)',
    borderRight: 'none',
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
    color: 'var(--text-muted)',
    fontWeight: '700',
    fontSize: '14px',
  }
};
