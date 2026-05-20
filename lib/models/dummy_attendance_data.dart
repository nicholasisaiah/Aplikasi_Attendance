// FILE: lib/models/dummy_attendance_data.dart

import 'attendance_model.dart';

class DummyAttendanceData {
  static const List<AttendanceRecord> records = [
    AttendanceRecord(date: '8/5/2026', status: AttendanceStatus.hadir),
    AttendanceRecord(date: '9/5/2026', status: AttendanceStatus.hadir),
    AttendanceRecord(date: '12/5/2026', status: AttendanceStatus.tidakHadir),
    AttendanceRecord(date: '13/5/2026', status: AttendanceStatus.hadir),
    AttendanceRecord(date: '14/5/2026', status: AttendanceStatus.hadir),
    AttendanceRecord(date: '15/5/2026', status: AttendanceStatus.tidakHadir),
    AttendanceRecord(date: '16/5/2026', status: AttendanceStatus.hadir),
    AttendanceRecord(date: '19/5/2026', status: AttendanceStatus.hadir),
    AttendanceRecord(date: '20/5/2026', status: AttendanceStatus.tidakHadir),
    AttendanceRecord(date: '21/5/2026', status: AttendanceStatus.hadir),
    AttendanceRecord(date: '22/5/2026', status: AttendanceStatus.hadir),
  ];
}
