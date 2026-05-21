import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase } from '../supabase';
import { Upload, FileText, CheckCircle2, AlertCircle, Download, ArrowRight } from 'lucide-react';

export default function CsvImport() {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [studentsMap, setStudentsMap] = useState({}); // fingerprint_id -> student profile
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState(null); // { success: X, errors: Y, details: [...] }
  const [schoolSettings, setSchoolSettings] = useState({ lateThreshold: '07:00:00' });

  useEffect(() => {
    // 1. Fetch all student profiles to map fingerprint_id -> profile
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, fingerprint_id, class_id, classes:classes!profiles_class_id_fkey(name)')
        .eq('role', 'student');
      
      if (!error && data) {
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

  const calculateIsLate = (timestampStr) => {
    try {
      // Expecting format: YYYY-MM-DD HH:MM:SS or ISO
      const dateObj = new Date(timestampStr.replace(' ', 'T'));
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes();
      const seconds = dateObj.getSeconds();
      
      const checkInSecs = hours * 3600 + minutes * 60 + seconds;
      
      // Convert threshold e.g. "07:00:00" to seconds
      const thresholdParts = schoolSettings.lateThreshold.split(':');
      const thresholdSecs = parseInt(thresholdParts[0]) * 3600 + parseInt(thresholdParts[1]) * 60 + parseInt(thresholdParts[2] || 0);
      
      return checkInSecs > thresholdSecs;
    } catch (e) {
      // Default fallback: if hour is 7 or more, mark late
      return true;
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setLoading(true);
    setImportStatus(null);

    let successCount = 0;
    let errorCount = 0;
    const details = [];

    // Process row by row
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const rawFid = row.FingerprintID || row.fingerprint_id || row.EnrollID;
      const rawTime = row.Timestamp || row.timestamp || row.DateTime;

      if (!rawFid || !rawTime) {
        errorCount++;
        details.push({
          row: i + 1,
          status: 'error',
          message: 'Kolom FingerprintID atau Timestamp tidak ditemukan.'
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

      try {
        const timeObj = new Date(rawTime.replace(' ', 'T'));
        const dateStr = rawTime.split(' ')[0] || rawTime.split('T')[0];
        const isLate = calculateIsLate(rawTime);

        // Perform Upsert in database
        const payload = {
          student_id: student.id,
          date: dateStr,
          check_in_time: timeObj.toISOString(),
          status: 'hadir',
          is_late: isLate,
          method: 'csv_import'
        };

        // Suppressing conflict and updating check_in_time
        const { error } = await supabase
          .from('attendances')
          .upsert(payload, { onConflict: 'student_id,date' });

        if (error) throw error;

        successCount++;
        details.push({
          row: i + 1,
          status: 'success',
          studentName: student.full_name,
          className: student.classes?.name || 'Umum',
          time: rawTime.split(' ')[1] || rawTime.split('T')[1],
          isLate
        });
      } catch (err) {
        errorCount++;
        details.push({
          row: i + 1,
          status: 'error',
          message: err.message || 'Gagal menyimpan data absensi ke Supabase.'
        });
      }
    }

    setImportStatus({
      success: successCount,
      errors: errorCount,
      details
    });
    setLoading(false);
  };

  const handleDownloadSample = () => {
    // Generate simple mock CSV with students mapped to simulate fingerprint output
    const headers = 'FingerprintID,Timestamp\n';
    
    // Check if we have registered students with fingerprint IDs to make sample valid
    const fIds = Object.keys(studentsMap);
    let rows = '';
    
    const today = new Date().toISOString().split('T')[0];

    if (fIds.length > 0) {
      // Row 1: Ontime
      rows += `${fIds[0]},${today} 06:45:00\n`;
      // Row 2: Late
      if (fIds.length > 1) {
        rows += `${fIds[1]},${today} 07:15:30\n`;
      }
      // Row 3: Ontime limit
      if (fIds.length > 2) {
        rows += `${fIds[2]},${today} 06:58:12\n`;
      }
    } else {
      // Fallback defaults
      rows += `1,${today} 06:45:00\n`;
      rows += `2,${today} 07:15:30\n`;
    }
    
    // Add an invalid row for testing error handler
    rows += `99,${today} 07:05:00\n`;

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fingerprint_simulasi_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* Drag & Drop Upload Zone */}
      <div style={styles.uploadCard}>
        <div style={styles.uploadZone}>
          <Upload size={40} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Pilih File CSV Log Sidik Jari</h3>
          <p style={{ fontSize: '13px', marginBottom: '16px' }}>Format kolom: FingerprintID, Timestamp (YYYY-MM-DD HH:MM:SS)</p>
          
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

          <div style={styles.previewTableWrapper}>
            <table className="admin-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Baris</th>
                  <th>Fingerprint ID</th>
                  <th>Siswa Mapped</th>
                  <th>Kelas Mapped</th>
                  <th>Timestamp Scan</th>
                  <th>Status Jam</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.slice(0, 5).map((row, index) => {
                  const fid = parseInt(row.FingerprintID || row.fingerprint_id || row.EnrollID);
                  const time = row.Timestamp || row.timestamp || row.DateTime;
                  const student = studentsMap[fid];
                  const isLate = time ? calculateIsLate(time) : false;

                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: '700' }}>{fid}</td>
                      <td>{student ? student.full_name : <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>Tidak Dikenal</span>}</td>
                      <td>{student ? (student.classes?.name || 'Umum') : '-'}</td>
                      <td>{time}</td>
                      <td>
                        {student ? (
                          isLate ? (
                            <span className="badge badge-warning" style={{ fontSize: '10px' }}>Terlambat</span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '10px' }}>Tepat Waktu</span>
                          )
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '10px' }}>Gagal Map</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {parsedData.length > 5 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Menampilkan 5 dari {parsedData.length} baris...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Sukses Diupload</span>
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

          <div style={styles.logWrapper}>
            <h4 style={{ marginBottom: '10px' }}>Detail Log Baris</h4>
            <div style={styles.logList}>
              {importStatus.details.map((detail, idx) => (
                <div 
                  key={idx} 
                  style={{
                    ...styles.logItem,
                    backgroundColor: detail.status === 'success' ? '#F4F9F4' : '#FFF5F5',
                    borderColor: detail.status === 'success' ? '#D5ECD5' : '#FCDCD5'
                  }}
                >
                  <span style={{ fontWeight: '800', width: '80px', color: 'var(--text-muted)' }}>Baris {detail.row}</span>
                  {detail.status === 'success' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                      <span style={{ color: 'var(--color-success)', fontWeight: '800' }}>[SUKSES]</span>
                      <span>
                        Absen <strong>{detail.studentName}</strong> ({detail.className}) jam {detail.time?.substring(0, 5)} - 
                        {detail.isLate ? (
                          <strong style={{ color: 'var(--color-warning)' }}> Terlambat</strong>
                        ) : (
                          <strong style={{ color: 'var(--color-success)' }}> Tepat Waktu</strong>
                        )}
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    marginBottom: '20px',
  },
  previewTableWrapper: {
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
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
    gridTemplateColumns: '1fr 1fr',
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
  logWrapper: {
    marginTop: '20px',
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '260px',
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
  }
};
