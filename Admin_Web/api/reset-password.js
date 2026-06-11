import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Function: Reset Student Password
 * 
 * POST /api/reset-password
 * Headers: { Authorization: "Bearer <admin_access_token>" }
 * Body:    { studentId: string, newPassword: string }
 * 
 * Security:
 * - SERVICE_ROLE_KEY is stored as a Vercel server-side env variable (no VITE_ prefix)
 * - Admin session is verified via the Authorization header
 * - Only users with role 'admin' or 'teacher' can call this endpoint
 */

export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // --- Read Environment Variables (server-side only) ---
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !supabaseAnonKey) {
    console.error('Missing environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // --- Validate Authorization Header ---
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  // --- Validate Request Body ---
  const { studentId, newPassword } = req.body || {};

  if (!studentId || !newPassword) {
    return res.status(400).json({ error: 'studentId dan newPassword wajib diisi.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  try {
    // --- Step 1: Verify admin session using Anon Key client ---
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: { user: callerUser }, error: userError } = await supabaseAnon.auth.getUser(accessToken);

    if (userError || !callerUser) {
      return res.status(401).json({ error: 'Sesi tidak valid. Silakan login ulang.' });
    }

    // --- Step 2: Check if the caller is admin or teacher ---
    const { data: callerProfile, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (profileError || !callerProfile) {
      return res.status(403).json({ error: 'Gagal memverifikasi peran pengguna.' });
    }

    if (callerProfile.role !== 'admin' && callerProfile.role !== 'teacher') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya Admin atau Guru yang dapat mereset password.' });
    }

    // --- Step 3: Reset the student's password using Service Role Key ---
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(studentId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Failed to reset password:', updateError.message);
      return res.status(500).json({ error: `Gagal mereset password: ${updateError.message}` });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Password berhasil direset.' 
    });

  } catch (err) {
    console.error('Unexpected error in reset-password:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}
