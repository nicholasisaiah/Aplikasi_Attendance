import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/attendance_model.dart';
import 'supabase_service.dart';

class AttendanceService {
  final SupabaseClient _client = SupabaseService.client;

  // Get attendance records for a student, optionally filtered by month and year
  Future<List<AttendanceRecord>> getAttendanceRecords(
    String studentId, {
    int? month,
    int? year,
  }) async {
    try {
      var query = _client.from('attendances').select().eq('student_id', studentId);

      // If month and year are specified, filter records
      if (month != null && year != null) {
        final startOfMonth = DateTime(year, month, 1).toIso8601String().substring(0, 10);
        // Date(year, month + 1, 0) gives last day of current month
        final endOfMonth = DateTime(year, month + 1, 0).toIso8601String().substring(0, 10);
        
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      }

      final List<dynamic> data = await query.order('date', ascending: false);
      return data.map((item) => AttendanceRecord.fromJson(item)).toList();
    } catch (e) {
      throw Exception('Gagal memuat riwayat absensi: $e');
    }
  }

  // Get attendance counts for statistics
  Future<Map<AttendanceStatus, int>> getAttendanceStats(String studentId) async {
    try {
      final List<dynamic> data = await _client
          .from('attendances')
          .select('status')
          .eq('student_id', studentId);
      
      int hadir = 0;
      int izin = 0;
      int sakit = 0;
      int tanpaKeterangan = 0;

      for (var row in data) {
        final status = AttendanceStatus.fromString(row['status'] as String);
        switch (status) {
          case AttendanceStatus.hadir:
            hadir++;
            break;
          case AttendanceStatus.izin:
            izin++;
            break;
          case AttendanceStatus.sakit:
            sakit++;
            break;
          case AttendanceStatus.tanpaKeterangan:
            tanpaKeterangan++;
            break;
        }
      }

      return {
        AttendanceStatus.hadir: hadir,
        AttendanceStatus.izin: izin,
        AttendanceStatus.sakit: sakit,
        AttendanceStatus.tanpaKeterangan: tanpaKeterangan,
      };
    } catch (e) {
      throw Exception('Gagal menghitung statistik absensi: $e');
    }
  }

  // Get today's attendance status
  Future<AttendanceRecord?> getTodayAttendance(String studentId) async {
    try {
      final todayStr = DateTime.now().toIso8601String().substring(0, 10);
      final List<dynamic> data = await _client
          .from('attendances')
          .select()
          .eq('student_id', studentId)
          .eq('date', todayStr);
      
      if (data.isEmpty) return null;
      return AttendanceRecord.fromJson(data.first);
    } catch (e) {
      throw Exception('Gagal memuat status absensi hari ini: $e');
    }
  }

  // Stream attendance changes for realtime sync
  Stream<List<Map<String, dynamic>>> streamAttendance(String studentId) {
    return _client
        .from('attendances')
        .stream(primaryKey: ['id'])
        .eq('student_id', studentId);
  }
}
