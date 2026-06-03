import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Clock, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar() {
  const [adminEmail, setAdminEmail] = useState('');
  const [timeString, setTimeString] = useState('');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Get current user email
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminEmail(user.email);
      }
    };
    fetchUser();

    // Live clock
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header style={styles.navbar}>
      <div style={styles.leftSection}>
        <h3 style={styles.welcomeText}>Selamat Datang di Portal Admin</h3>
        <span style={styles.dateText}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div style={styles.rightSection}>
        {/* Theme Toggle */}
        <button onClick={toggleTheme} style={styles.themeToggleBtn} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} color="var(--text-dark)" /> : <Moon size={18} color="var(--text-dark)" />}
        </button>

        {/* Live Clock Card */}
        <div style={styles.clockCard}>
          <Clock size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={styles.clockText}>{timeString}</span>
        </div>

        {/* User Card */}
        <div style={styles.userCard}>
          <div style={styles.avatar}>
            <User size={16} color="#FFFFFF" />
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>Administrator</span>
            <span style={styles.userEmail}>{adminEmail || 'admin@asisi.sch.id'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    height: 'var(--navbar-height)',
    background: 'repeating-linear-gradient(-45deg, rgba(155, 101, 45, 0.03), rgba(155, 101, 45, 0.03) 6px, transparent 6px, transparent 12px), linear-gradient(to right, var(--bg-workspace) 0%, var(--bg-card) 400px)',
    borderBottom: '1.5px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  welcomeText: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--text-dark)',
    margin: 0,
  },
  dateText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginTop: '2px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  themeToggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-workspace)',
    border: '1px solid var(--border-color)',
  },
  clockCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'var(--bg-workspace)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
  },
  clockText: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--text-dark)',
    fontFamily: 'monospace',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(155, 101, 45, 0.2)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--text-dark)',
  },
  userEmail: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
};
