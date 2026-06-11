/**
 * Daftar jurusan tetap SMK Asisi Jakarta.
 */
export const MAJOR_OPTIONS = [
  { value: 'Teknik Komputer Jaringan', label: 'Teknik Komputer Jaringan' },
  { value: 'Akuntansi dan Keuangan Lembaga', label: 'Akuntansi dan Keuangan Lembaga' },
  { value: 'Teknik Sepeda Motor', label: 'Teknik Sepeda Motor' },
  { value: 'Rekayasa Perangkat Lunak', label: 'Rekayasa Perangkat Lunak' },
];

/**
 * Mapping singkatan jurusan ke nama lengkap.
 */
const MAJOR_ABBREV_MAP = {
  'TKJ': 'Teknik Komputer Jaringan',
  'AKL': 'Akuntansi dan Keuangan Lembaga',
  'TSM': 'Teknik Sepeda Motor',
  'RPL': 'Rekayasa Perangkat Lunak',
};

/**
 * Resolve singkatan jurusan menjadi nama lengkap.
 * Jika sudah berupa nama lengkap atau tidak dikenali, return apa adanya.
 */
export const resolveMajor = (val) => {
  if (!val) return '';
  return MAJOR_ABBREV_MAP[val.toUpperCase()] || val;
};
