import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  Megaphone, 
  FileSpreadsheet, 
  LogOut 
} from 'lucide-react';
import { supabase } from '../supabase';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari Admin Dashboard?')) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/siswa', label: 'Data Siswa', icon: Users },
    { path: '/kelas', label: 'Data Kelas', icon: GraduationCap },
    { path: '/jadwal', label: 'Jadwal Pelajaran', icon: Calendar },
    { path: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
    { path: '/import-csv', label: 'Import CSV Log', icon: FileSpreadsheet },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoCircle}>A</div>
        <div>
          <h2 style={styles.brandTitle}>ASISI ATTENDANCE</h2>
          <span style={styles.brandSubtitle}>Admin Panel</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={styles.navMenu}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                fontWeight: isActive ? '800' : '600',
              })}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div style={styles.footer}>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--bg-sidebar)',
    color: 'var(--text-light)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
  },
  brandContainer: {
    height: 'var(--navbar-height)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  logoCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '15px',
    fontWeight: '900',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '0.5px',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  navMenu: {
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: 'var(--text-light)',
    fontSize: '14px',
    transition: 'background-color 0.2s, color 0.2s',
    textDecoration: 'none',
  },
  footer: {
    padding: '20px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  logoutButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px',
    borderRadius: '8px',
    border: '1.5px solid rgba(255, 255, 255, 0.15)',
    backgroundColor: 'transparent',
    color: '#FF8A8A',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
};
