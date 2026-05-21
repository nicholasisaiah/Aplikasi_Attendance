import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email dan password harus diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Gagal memuat sesi pengguna.');
      }

      // Check role in profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileErr) throw profileErr;

      if (profile.role !== 'admin' && profile.role !== 'teacher') {
        // Access denied
        await supabase.auth.signOut();
        throw new Error('Akses Ditolak: Hanya Admin atau Guru yang dapat masuk ke panel ini.');
      }

      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logo}>A</div>
          <h2 style={styles.title}>ASISI ATTENDANCE</h2>
          <p style={styles.subtitle}>Log in to admin dashboard</p>
        </div>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="admin@asisi.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-workspace)',
    padding: '20px',
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1.5px solid var(--border-color)',
    padding: '36px',
    boxShadow: 'var(--card-shadow)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logo: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: '24px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 4px 12px rgba(155, 101, 45, 0.25)',
  },
  title: {
    fontSize: '20px',
    fontWeight: '900',
    color: 'var(--text-dark)',
    marginBottom: '4px',
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  errorAlert: {
    padding: '12px 16px',
    backgroundColor: 'var(--color-danger-bg)',
    border: '1px solid var(--color-danger)',
    color: 'var(--color-danger)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
};
