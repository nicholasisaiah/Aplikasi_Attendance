import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase, isConfigured } from './supabase';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Schedule from './pages/Schedule';
import Announcements from './pages/Announcements';
import CsvImport from './pages/CsvImport';
import Settings from './pages/Settings';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Configuration Setup Screen (Shown when placeholders are active)
function SetupGuide() {
  return (
    <div style={setupStyles.container}>
      <div style={setupStyles.card}>
        <div style={setupStyles.logo}>A</div>
        <h1 style={setupStyles.title}>Konfigurasi Supabase Diperlukan</h1>
        <p style={setupStyles.subtitle}>
          Aplikasi EduAttend memerlukan koneksi ke database Supabase Anda untuk dapat berjalan.
        </p>

        <div style={setupStyles.steps}>
          <div style={setupStyles.step}>
            <div style={setupStyles.stepNum}>1</div>
            <div style={setupStyles.stepText}>
              <strong>Jalankan Database Schema:</strong>
              <p>Salin seluruh isi file <code>supabase_schema.sql</code> di root workspace, lalu tempel dan jalankan di <strong>SQL Editor</strong> di dashboard Supabase Anda.</p>
            </div>
          </div>

          <div style={setupStyles.step}>
            <div style={setupStyles.stepNum}>2</div>
            <div style={setupStyles.stepText}>
              <strong>Buat File Konfigurasi Web (.env):</strong>
              <p>Buat file baru bernama <code>.env</code> di dalam folder <code>Admin_Web/</code> lalu masukkan kredensial Supabase Anda:</p>
              <pre style={setupStyles.code}>
{`VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}
              </pre>
            </div>
          </div>

          <div style={setupStyles.step}>
            <div style={setupStyles.stepNum}>3</div>
            <div style={setupStyles.stepText}>
              <strong>Konfigurasi Aplikasi Mobile:</strong>
              <p>Buka file <code>lib/core/services/supabase_service.dart</code> di proyek Flutter dan masukkan kredensial yang sama pada variabel <code>supabaseUrl</code> dan <code>supabaseAnonKey</code>.</p>
            </div>
          </div>

          <div style={setupStyles.step}>
            <div style={setupStyles.stepNum}>4</div>
            <div style={setupStyles.stepText}>
              <strong>Mulai Menggunakan:</strong>
              <p>Restart server dev web Anda. Anda dapat mendaftarkan akun di aplikasi mobile (secara otomatis akan menjadi akun siswa) atau langsung membuat akun Admin/Guru di tab <strong>Authentication</strong> Supabase Anda.</p>
            </div>
          </div>
        </div>

        <div style={setupStyles.footer}>
          <p>Setelah file <code>.env</code> dibuat dan server dijalankan ulang, halaman ini akan otomatis berganti ke halaman login admin.</p>
        </div>
      </div>
    </div>
  );
}

// Auth Guard Wrapper
function AuthGuard({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const location = useLocation();

  const addLog = (msg) => {
    console.log(`[AuthGuard] ${msg}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    if (!isConfigured) return;
    
    let active = true;

    const checkSession = async (currentSession) => {
      try {
        if (!currentSession) {
          if (active) {
            setSession(null);
            setRole(null);
            setLoading(false);
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile on auth check:", error);
          if (active) {
            // Assume admin temporarily if network error to avoid kicking out,
            // or just stay loading. But safest is to redirect without signout.
            setSession(null);
            setRole(null);
            setLoading(false);
          }
          return;
        }

        if (profile && (profile.role === 'admin' || profile.role === 'teacher')) {
          if (active) {
            setSession(currentSession);
            setRole(profile.role);
            setLoading(false);
          }
        } else {
          // Not authorized
          await supabase.auth.signOut();
          if (active) {
            setSession(null);
            setRole(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Auth check exception:", err);
        if (active) setLoading(false);
      }
    };

    // 1. Initial check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      checkSession(initialSession);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'INITIAL_SESSION') return;
      checkSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#0F172A', marginBottom: '8px' }}>Memeriksa otentikasi...</h3>
        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '24px' }}>Silakan tunggu sebentar.</p>
        
        {/* Diagnostic logs visible on screen */}
        <div style={{ width: '90%', maxWidth: '500px', backgroundColor: '#0F172A', color: '#38BDF8', padding: '16px', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div style={{ borderBottom: '1px solid #1E293B', paddingBottom: '6px', marginBottom: '8px', color: '#94A3B8', fontWeight: 'bold' }}>
            Diagnostic Logs:
          </div>
          {logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '4px', lineHeight: '1.4' }}>{log}</div>
          ))}
          {logs.length === 0 && <div style={{ color: '#64748B' }}>Menunggu log...</div>}
        </div>
      </div>
    );
  }

  // Redirect to login if no session or invalid role
  if (!session || (role !== 'admin' && role !== 'teacher')) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

// Layout wrapper for guarded pages
function DashboardLayout({ children }) {
  return (
    <div className="admin-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  if (!isConfigured) {
    return <SetupGuide />;
  }

  return (
    <ThemeProvider>
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Guarded Dashboard Routes */}
        <Route path="/" element={
          <AuthGuard>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </AuthGuard>
        } />
        <Route path="/siswa" element={
          <AuthGuard>
            <DashboardLayout>
              <Students />
            </DashboardLayout>
          </AuthGuard>
        } />
        <Route path="/kelas" element={
          <AuthGuard>
            <DashboardLayout>
              <Classes />
            </DashboardLayout>
          </AuthGuard>
        } />
        <Route path="/jadwal" element={
          <AuthGuard>
            <DashboardLayout>
              <Schedule />
            </DashboardLayout>
          </AuthGuard>
        } />
        <Route path="/pengumuman" element={
          <AuthGuard>
            <DashboardLayout>
              <Announcements />
            </DashboardLayout>
          </AuthGuard>
        } />
        <Route path="/import-csv" element={
          <AuthGuard>
            <DashboardLayout>
              <CsvImport />
            </DashboardLayout>
          </AuthGuard>
        } />
        <Route path="/pengaturan" element={
          <AuthGuard>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </AuthGuard>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

const setupStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-workspace)',
    padding: '24px',
    fontFamily: "'Nunito', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '680px',
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1.5px solid #E6DFD3',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(44, 38, 33, 0.05)',
  },
  logo: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#9B652D',
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#2C2621',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#8F8479',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  step: {
    display: 'flex',
    gap: '16px',
  },
  stepNum: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#FAF1E3',
    color: '#9B652D',
    fontWeight: '800',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: {
    fontSize: '14px',
    color: '#2C2621',
    lineHeight: '1.6',
    flex: 1,
  },
  code: {
    display: 'block',
    padding: '12px 16px',
    backgroundColor: '#FAF8F5',
    border: '1px solid #E6DFD3',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#2C2621',
    marginTop: '8px',
    whiteSpace: 'pre',
    overflowX: 'auto',
  },
  footer: {
    borderTop: '1px dashed #E6DFD3',
    paddingTop: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#8F8479',
  }
};
