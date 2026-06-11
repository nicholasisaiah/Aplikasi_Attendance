// FILE: lib/models/attendance_model.dart

class AttendanceRecord {
  final String id;
  final String studentId;
  final String date; // YYYY-MM-DD
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final AttendanceStatus status;
  final bool isLate;
  final String? notes;
  final String method;

  const AttendanceRecord({
    required this.id,
    required this.studentId,
    required this.date,
    this.checkInTime,
    this.checkOutTime,
    required this.status,
    required this.isLate,
    this.notes,
    required this.method,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id'] as String,
      studentId: json['student_id'] as String,
      date: json['date'] as String,
      checkInTime: json['check_in_time'] != null 
          ? DateTime.parse(json['check_in_time'] as String).toLocal()
          : null,
      checkOutTime: json['check_out_time'] != null
          ? DateTime.parse(json['check_out_time'] as String).toLocal()
          : null,
      status: AttendanceStatus.fromString(json['status'] as String),
      isLate: json['is_late'] as bool? ?? false,
      notes: json['notes'] as String?,
      method: json['method'] as String? ?? 'csv_import',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'student_id': studentId,
      'date': date,
      'check_in_time': checkInTime?.toIso8601String(),
      'check_out_time': checkOutTime?.toIso8601String(),
      'status': status.name,
      'is_late': isLate,
      'notes': notes,
      'method': method,
    };
  }
}

enum AttendanceStatus {
  hadir,
  izin,
  sakit,
  tanpaKeterangan;

  String get label {
    switch (this) {
      case AttendanceStatus.hadir:
        return 'Hadir';
      case AttendanceStatus.izin:
        return 'Izin';
      case AttendanceStatus.sakit:
        return 'Sakit';
      case AttendanceStatus.tanpaKeterangan:
        return 'Tidak Hadir';
    }
  }

  // Helper to map DB string values ('hadir', 'izin', 'sakit', 'tanpa_keterangan')
  static AttendanceStatus fromString(String statusStr) {
    switch (statusStr) {
      case 'hadir':
        return AttendanceStatus.hadir;
      case 'izin':
        return AttendanceStatus.izin;
      case 'sakit':
        return AttendanceStatus.sakit;
      case 'tanpa_keterangan':
      default:
        return AttendanceStatus.tanpaKeterangan;
    }
  }

  String get dbValue {
    switch (this) {
      case AttendanceStatus.hadir:
        return 'hadir';
      case AttendanceStatus.izin:
        return 'izin';
      case AttendanceStatus.sakit:
        return 'sakit';
      case AttendanceStatus.tanpaKeterangan:
        return 'tanpa_keterangan';
    }
  }
}
