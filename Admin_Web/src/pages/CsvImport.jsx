import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../supabase';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, ArrowRight, UserX, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CsvImport() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [studentsMap, setStudentsMap] = useState({}); // fingerprint_id -> student profile
  const [allStudents, setAllStudents] = useState([]); // all student profiles
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [schoolSettings, setSchoolSettings] = useState({ lateThreshold: '07:00:00' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // 1. Fetch all student profiles
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, fingerprint_id, class_id, classes:classes!profiles_class_id_fkey(name)')
        .eq('role', 'student');
      
      if (!error && data) {
        setAllStudents(data);
        const mapping = {};
        data.forEach(student => {
          if (student.fingerprint_id !== null) {
            mapping[student.fingerprint_id] = student;
          }
        });
        setStudentsMap(mapping);
      }
    };

    // 2. Fetch school settings to get late threshold
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('late_threshold')
        .single();
      
      if (!error && data && data.late_threshold) {
        setSchoolSettings({ lateThreshold: data.late_threshold });
      }
    };

    fetchStudents();
    fetchSettings();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportStatus(null);
      setParsedData([]);
      setCurrentPage(1);
      
      // Parse file preview
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data);
        },
        error: (err) => {
          alert('Gagal membaca file CSV: ' + err.message);
        }
      });
    }
  };

  // Check if time string (HH:MM:SS) is late
  const isTimeLate = (timeStr) => {
    try {
      const parts = timeStr.split(':');
      const checkInSecs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2] || 0);
      
      const thresholdParts = schoolSettings.lateThreshold.split(':');
      const thresholdSecs = parseInt(thresholdParts[0]) * 3600 + parseInt(thresholdParts[1]) * 60 + parseInt(thresholdParts[2] || 0);
      
      return checkInSecs > thresholdSecs;
    } catch (e) {
      return true;
    }
  };

  // Extract row data from the new CSV format
  const extractRowData = (row) => {
    const rawFid = row.ID || row.FingerprintID || row.fingerprint_id || row.EnrollID;
    const rawDate = row.Tanggal || row.Date || row.date;
    const rawCheckIn = row.Waktu_Masuk || row.Timestamp || row.timestamp;
    const rawCheckOut = row.Waktu_Keluar || null;
    const rawName = row.Nama || row.Name || null;
    const rawClass = row.Kelas || row.Class || null;

    return { rawFid, rawDate, rawCheckIn, rawCheckOut, rawName, rawClass };
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setLoading(true);
    setImportStatus(null);

    let successCount = 0;
    let errorCount = 0;
    let absentCount = 0;
    const details = [];

    // Track which students are present per date
    const presentStudentsByDate = {}; // { 'YYYY-MM-DD': Set of student_id }
    const uniqueDates = new Set();

    // Payloads to bulk upsert
    const upsertPayloads = [];

    // Phase 1: Process CSV rows
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const { rawFid, rawDate, rawCheckIn, rawCheckOut } = extractRowData(row);

      if (!rawFid || !rawDate || !rawCheckIn) {
        errorCount++;
        details.push({
          row: i + 1,
          status: 'error',
          message: 'Kolom ID, Tanggal, atau Waktu_Masuk tidak ditemukan/kosong.'
        });
        continue;
      }

      const fId = parseInt(rawFid);
      const student = studentsMap[fId];

      if (!student) {
        errorCount++;
        details.push({
          row: i + 1,
          status: 'error',
          message: `Fingerprint ID: ${fId} tidak terdaftar pada siswa mana pun.`
        });
        continue;
      }

      const dateStr = rawDate.trim();
      const checkInTimeStr = rawCheckIn.trim();
      const checkOutTimeStr = rawCheckOut ? rawCheckOut.trim() : null;

      // Hadir = punya Waktu_Masuk DAN Waktu_Keluar
      const isFullyPresent = checkInTimeStr && checkOutTimeStr;

      // Build ISO timestamps
      const checkInISO = new Date(`${dateStr}T${checkInTimeStr}`).toISOString();
      const checkOutISO = checkOutTimeStr ? new Date(`${dateStr}T${checkOutTimeStr}`).toISOString() : null;

      const isLate = isTimeLate(checkInTimeStr);

      upsertPayloads.push({
        student_id: student.id,
        date: dateStr,
        check_in_time: checkInISO,
        check_out_time: checkOutISO,
        status: isFullyPresent ? 'hadir' : 'tanpa_keterangan',
        is_late: isFullyPresent ? isLate : false,
        method: 'csv_import',
        notes: isFullyPresent ? null : 'Hanya scan masuk, tidak scan keluar'
      });

      // Track present student for this date
      uniqueDates.add(dateStr);
      if (!presentStudentsByDate[dateStr]) {
        presentStudentsByDate[dateStr] = new Set();
      }
      presentStudentsByDate[dateStr].add(student.id);

      if (isFullyPresent) {
        successCount++;
        details.push({
          row: i + 1,
          status: 'success',
          studentName: student.full_name,
          className: student.classes?.name || 'Umum',
          time: checkInTimeStr.substring(0, 5),
          isLate
        });
      } else {
        absentCount++;
        details.push({
          row: i + 1,
          status: 'incomplete',
          studentName: student.full_name,
          className: student.classes?.name || 'Umum',
          time: checkInTimeStr.substring(0, 5)
        });
      }
    }

    // Phase 2: Auto-fill absent students for each unique date
    for (const dateStr of uniqueDates) {
      const presentIds = presentStudentsByDate[dateStr] || new Set();
      const absentStudents = allStudents.filter(s => !presentIds.has(s.id));

      for (const student of absentStudents) {
        upsertPayloads.push({
          student_id: student.id,
          date: dateStr,
          check_in_time: null,
          check_out_time: null,
          status: 'tanpa_keterangan',
          is_late: false,
          method: 'csv_import',
          notes: null
        });

        absentCount++;
        details.push({
          row: '-',
          status: 'absent',
          studentName: student.full_name,
          className: student.classes?.name || 'Umum',
          date: dateStr
        });
      }
    }

    // Phase 3: Execute Bulk Upsert
    if (upsertPayloads.length > 0) {
      try {
        const { error } = await supabase
          .from('attendances')
          .upsert(upsertPayloads, { onConflict: 'student_id,date', ignoreDuplicates: false });

        if (error) throw error;
      } catch (err) {
        // If bulk fails, mark everything as error
        console.error("Bulk upsert failed", err);
        errorCount += upsertPayloads.length;
        successCount = 0;
        absentCount = 0;
        details.length = 0; // Clear details
        details.push({
          row: '-',
          status: 'error',
          message: err.message || 'Gagal menyimpan data absensi secara massal ke Supabase.'
        });
      }
    }

    setImportStatus({
      success: successCount,
      errors: errorCount,
      absent: absentCount,
      dates: [...uniqueDates],
      details
    });
    setLoading(false);
  };

  const handleDownloadSample = () => {
    const headers = 'ID,Nama,Kelas,Tanggal,Waktu_Masuk,Waktu_Keluar\n';
    
    const fIds = Object.keys(studentsMap);
    let rows = '';
    
    const today = new Date().toISOString().split('T')[0];

    if (fIds.length > 0) {
      const s1 = studentsMap[fIds[0]];
      rows += `${fIds[0]},${s1.full_name},${s1.classes?.name || 'Umum'},${today},06:45:00,14:00:00\n`;
      if (fIds.length > 1) {
        const s2 = studentsMap[fIds[1]];
        rows += `${fIds[1]},${s2.full_name},${s2.classes?.name || 'Umum'},${today},07:15:30,14:05:00\n`;
      }
    } else {
      rows += `1204,Zeki Tampubolon,XII AKL,${today},06:54:32,14:09:04\n`;
      rows += `1340,Uci Batubara,X TKJ,${today},06:33:32,14:04:03\n`;
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_data_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview helper: extract and check a row
  const previewRow = (row) => {
    const { rawFid, rawDate, rawCheckIn, rawCheckOut, rawName, rawClass } = extractRowData(row);
    const fId = rawFid ? parseInt(rawFid) : NaN;
    const student = studentsMap[fId];
    const checkOutStr = rawCheckOut ? rawCheckOut.trim() : '';
    const isFullyPresent = rawCheckIn && checkOutStr;
    const isLate = rawCheckIn ? isTimeLate(rawCheckIn.trim()) : false;
    return { fId, rawDate, rawCheckIn, rawCheckOut, rawName, rawClass, student, isLate, isFullyPresent };
  };

  return (
    <div className="page-container">
      <div style={styles.header}>
        <div>
          <h1>Import Log Mesin Sidik Jari</h1>
          <p>Unggah file CSV hasil ekspor dari perangkat mesin sidik jari sekolah Anda.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleDownloadSample}>
          <Download size={16} />
          <span>Unduh CSV Simulasi</span>
        </button>
      </div>

      {/* Upload Zone */}
      <div style={styles.uploadCard}>
        <div style={styles.uploadZone}>
          <Upload size={40} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Pilih File CSV Log Sidik Jari</h3>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>Format kolom: ID, Nama, Kelas, Tanggal, Waktu_Masuk, Waktu_Keluar</p>
          
          <input
            type="file"
            accept=".csv"
            id="csv-file-input"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="csv-file-input" className="btn btn-primary">
            Cari File...
          </label>
        </div>
      </div>

      {/* File preview and upload action */}
      {parsedData.length > 0 && !importStatus && (
        <div style={styles.previewCard}>
          <div style={styles.previewHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '15px' }}>File Terpilih: {file?.name} ({parsedData.length} baris log)</h3>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleImport}
              disabled={loading}
            >
              {loading ? 'Mengimpor...' : 'Proses & Upload Absensi'}
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Info: auto-fill absent */}
          <div style={styles.infoBox}>
            <UserX size={16} color="var(--color-info)" />
            <span>Siswa dianggap <strong>Hadir</strong> jika memiliki <strong>Waktu Masuk dan Waktu Keluar</strong>. Siswa yang hanya scan masuk atau tidak ada di CSV akan ditandai sebagai <strong>Tanpa Keterangan (Alfa)</strong>.</span>
          </div>

          <div style={styles.previewTableWrapper}>
            <table className="admin-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Baris</th>
                  <th>ID</th>
                  <th>Nama (CSV)</th>
                  <th>Siswa Mapped</th>
                  <th>Tanggal</th>
                  <th>Masuk</th>
                  <th>Keluar</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, index) => {
                  const { fId, rawDate, rawCheckIn, rawCheckOut, rawName, student, isLate, isFullyPresent } = previewRow(row);

                  return (
                    <tr key={index}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td style={{ fontWeight: '700' }}>{fId}</td>
                      <td>{rawName || '-'}</td>
                      <td>{student ? student.full_name : <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>Tidak Dikenal</span>}</td>
                      <td>{rawDate || '-'}</td>
                      <td>{rawCheckIn || '-'}</td>
                      <td>{rawCheckOut || '-'}</td>
                      <td>
                        {!student ? (
                          <span className="badge badge-danger" style={{ fontSize: '10px' }}>Gagal Map</span>
                        ) : !isFullyPresent ? (
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>Tidak Lengkap</span>
                        ) : isLate ? (
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>Terlambat</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '10px' }}>Tepat Waktu</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {parsedData.length > itemsPerPage && (
            <div style={styles.paginationWrapper}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, parsedData.length)} dari {parsedData.length} baris
              </span>
              <div style={styles.paginationButtons}>
                <button 
                  style={styles.pageBtn} 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>{currentPage} / {Math.ceil(parsedData.length / itemsPerPage)}</span>
                <button 
                  style={styles.pageBtn} 
                  disabled={currentPage === Math.ceil(parsedData.length / itemsPerPage)}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(parsedData.length / itemsPerPage)))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Status Report */}
      {importStatus && (
        <div style={styles.reportCard}>
          <div style={styles.reportHeader}>
            <h3>Laporan Hasil Import</h3>
            <span className="badge badge-info">Selesai</span>
          </div>

          <div style={styles.reportStatsGrid}>
            <div style={{ ...styles.reportStat, borderColor: 'var(--color-success)' }}>
              <CheckCircle2 color="var(--color-success)" size={24} />
              <div>
                <h2 style={{ color: 'var(--color-success)' }}>{importStatus.success}</h2>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Hadir (dari CSV)</span>
              </div>
            </div>

            <div style={{ ...styles.reportStat, borderColor: 'var(--color-warning)' }}>
              <UserX color="var(--color-warning)" size={24} />
              <div>
                <h2 style={{ color: 'var(--color-warning)' }}>{importStatus.absent}</h2>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Ditandai Tidak Hadir</span>
              </div>
            </div>

            <div style={{ ...styles.reportStat, borderColor: importStatus.errors > 0 ? 'var(--color-danger)' : 'var(--border-color)' }}>
              <AlertCircle color={importStatus.errors > 0 ? 'var(--color-danger)' : 'var(--text-muted)'} size={24} />
              <div>
                <h2 style={{ color: importStatus.errors > 0 ? 'var(--color-danger)' : 'var(--text-dark)' }}>{importStatus.errors}</h2>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Gagal/Error</span>
              </div>
            </div>
          </div>

          {importStatus.dates && importStatus.dates.length > 0 && (
            <div style={styles.datesInfo}>
              <span style={{ fontWeight: '800', marginRight: '8px' }}>Tanggal diproses:</span>
              {importStatus.dates.map(d => (
                <span key={d} className="badge badge-info" style={{ marginRight: '6px', fontSize: '11px' }}>{d}</span>
              ))}
            </div>
          )}

          <div style={styles.logWrapper}>
            <h4 style={{ marginBottom: '10px' }}>Detail Log</h4>
            <div style={styles.logList}>
              {importStatus.details.map((detail, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.logItem,
                    backgroundColor: detail.status === 'success' ? '#F4F9F4' : detail.status === 'absent' || detail.status === 'incomplete' ? '#FFF8F0' : '#FFF5F5',
                    borderColor: detail.status === 'success' ? '#D5ECD5' : detail.status === 'absent' || detail.status === 'incomplete' ? '#F5DEB3' : '#FCDCD5'
                  }}
                >
                  {detail.row !== '-' && (
                    <span style={{ fontWeight: '800', width: '80px', color: 'var(--text-muted)' }}>Baris {detail.row}</span>
                  )}
                  {detail.status === 'success' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                      <span style={{ color: 'var(--color-success)', fontWeight: '800' }}>[HADIR]</span>
                      <span>
                        <strong>{detail.studentName}</strong> ({detail.className}) jam {detail.time} - 
                        {detail.isLate ? (
                          <strong style={{ color: 'var(--color-warning)' }}> Terlambat</strong>
                        ) : (
                          <strong style={{ color: 'var(--color-success)' }}> Tepat Waktu</strong>
                        )}
                      </span>
                    </div>
                  ) : detail.status === 'incomplete' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                      <span style={{ color: 'var(--color-warning)', fontWeight: '800' }}>[TIDAK LENGKAP]</span>
                      <span>
                        <strong>{detail.studentName}</strong> ({detail.className}) jam masuk {detail.time} — <em>tidak scan keluar</em>
                      </span>
                    </div>
                  ) : detail.status === 'absent' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                      <span style={{ color: 'var(--color-warning)', fontWeight: '800' }}>[ALFA]</span>
                      <span>
                        <strong>{detail.studentName}</strong> ({detail.className}) — tidak ada di CSV tanggal {detail.date}
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                      <span style={{ color: 'var(--color-danger)', fontWeight: '800' }}>[GAGAL]</span>
                      <span style={{ color: 'var(--color-danger)' }}>{detail.message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
  uploadCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1.5px solid var(--border-color)',
    padding: '40px',
    boxShadow: 'var(--card-shadow)',
    textAlign: 'center',
    marginBottom: '24px',
  },
  uploadZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    border: '2px dashed var(--color-primary)',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-workspace)',
  },
  previewCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1.5px solid var(--border-color)',
    padding: '24px',
    boxShadow: 'var(--card-shadow)',
    marginBottom: '24px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#EFF6FF',
    border: '1.5px solid #BFDBFE',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#1E40AF',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  previewTableWrapper: {
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  reportCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    border: '1.5px solid var(--border-color)',
    padding: '24px',
    boxShadow: 'var(--card-shadow)',
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1.5px solid var(--border-color)',
    paddingBottom: '14px',
  },
  reportStatsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '20px',
    marginBottom: '24px',
  },
  reportStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1.5px solid',
  },
  datesInfo: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-workspace)',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  logWrapper: {
    marginTop: '20px',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '360px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
  },
  paginationWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    padding: '0 8px',
  },
  paginationButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: 'var(--text-dark)',
  }
};
