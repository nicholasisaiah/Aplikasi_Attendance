// FILE: lib/models/attendance_model.dart

class AttendanceRecord {
  final String date;
  final AttendanceStatus status;

  const AttendanceRecord({
    required this.date,
    required this.status,
  });
}

enum AttendanceStatus {
  hadir,
  tidakHadir;

  String get label {
    switch (this) {
      case AttendanceStatus.hadir:
        return 'Hadir';
      case AttendanceStatus.tidakHadir:
        return 'Tidak Hadir';
    }
  }
}
