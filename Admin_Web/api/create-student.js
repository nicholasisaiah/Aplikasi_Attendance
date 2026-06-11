import { createClient } from '@supabase/supabase-js';

/**
 * Vercel Serverless Function: Create Student Account
 * 
 * POST /api/create-student
 * Headers: { Authorization: "Bearer <admin_access_token>" }
 * Body:    { fullName, nisn, fingerprintId, classId, password }
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
  const { fullName, nisn, fingerprintId, classId, password } = req.body || {};

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
  }

  if (!fingerprintId && fingerprintId !== 0) {
    return res.status(400).json({ error: 'Fingerprint ID wajib diisi untuk pembuatan akun.' });
  }

  const fpId = parseInt(fingerprintId);
  if (isNaN(fpId) || fpId < 0) {
    return res.status(400).json({ error: 'Fingerprint ID harus berupa angka positif.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  const email = `siswa.${fpId}@smkasisi.sch.id`;

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
      return res.status(403).json({ error: 'Akses ditolak. Hanya Admin atau Guru yang dapat membuat akun siswa.' });
    }

    // --- Step 3: Create user with Service Role Key ---
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if fingerprint_id already exists in profiles
    const { data: existingFp, error: fpCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('fingerprint_id', fpId)
      .maybeSingle();

    if (fpCheckError) {
      console.error('Error checking fingerprint:', fpCheckError.message);
    }

    if (existingFp) {
      return res.status(409).json({ 
        error: `Fingerprint ID ${fpId} sudah digunakan oleh siswa "${existingFp.full_name}". Gunakan ID lain.` 
      });
    }

    // Check if NISN already exists (if provided)
    if (nisn && nisn.trim()) {
      const { data: existingNisn } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('nisn', nisn.trim())
        .maybeSingle();

      if (existingNisn) {
        return res.status(409).json({ 
          error: `NISN "${nisn}" sudah digunakan oleh siswa "${existingNisn.full_name}".` 
        });
      }
    }

    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        role: 'student',
        nisn: nisn ? nisn.trim() : null,
      },
    });

    if (createError) {
      console.error('Failed to create user:', createError.message);

      if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
        return res.status(409).json({ 
          error: `Email ${email} sudah terdaftar. Fingerprint ID ${fpId} kemungkinan sudah digunakan.` 
        });
      }

      return res.status(500).json({ error: `Gagal membuat akun: ${createError.message}` });
    }

    // --- Step 4: Update profile with class_id and fingerprint_id ---
    const updatePayload = {
      fingerprint_id: fpId,
    };

    if (classId) {
      updatePayload.class_id = classId;
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', newUser.user.id);

    if (updateError) {
      console.error('Profile update warning:', updateError.message);
      // Don't fail the entire request — user was already created
    }

    return res.status(201).json({
      success: true,
      message: 'Akun siswa berhasil dibuat.',
      student: {
        id: newUser.user.id,
        email: email,
        fullName: fullName.trim(),
        fingerprintId: fpId,
        nisn: nisn ? nisn.trim() : null,
        classId: classId || null,
      },
    });

  } catch (err) {
    console.error('Unexpected error in create-student:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
}
