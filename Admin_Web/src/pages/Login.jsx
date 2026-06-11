import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
    // Force light mode on login page
    setTheme('light');
  }, [navigate, setTheme]);

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '390px' }}>
        
        {/* LOGO */}
        <img 
          src="/smk-asisi-logo.png" 
          alt="SMK Asisi Logo" 
          style={{ width: '250px', height: 'auto', marginBottom: '30px', objectFit: 'contain' }} 
        />

        {errorMsg && (
          <div style={styles.errorAlert}>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* WHITE CARD */}
        <div style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderRadius: '28px', 
          border: '1.5px solid #D7CCB7', 
          padding: '30px 26px', 
          width: '100%',
          marginBottom: '32px' 
        }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '900', 
            color: 'var(--text-dark)', 
            textAlign: 'center', 
            marginBottom: '30px' 
          }}>
            Login
          </h2>

          <form id="login-form" onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  borderRadius: '40px', 
                  textAlign: 'center', 
                  padding: '16px', 
                  fontSize: '15px', 
                  fontWeight: '700',
                  borderColor: '#D7CCB7',
                  borderWidth: '1.6px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  borderRadius: '40px', 
                  textAlign: 'center', 
                  padding: '16px', 
                  fontSize: '15px', 
                  fontWeight: '700',
                  borderColor: '#D7CCB7',
                  borderWidth: '1.6px'
                }}
              />
            </div>
          </form>
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          form="login-form"
          className="btn btn-primary"
          style={{ 
            width: '300px', 
            padding: '16px', 
            fontSize: '20px', 
            borderRadius: '24px', 
            fontWeight: '800',
            backgroundColor: '#9B652D',
            border: 'none',
            color: 'white',
            cursor: 'pointer'
          }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

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
    backgroundColor: 'var(--bg-card)',
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
