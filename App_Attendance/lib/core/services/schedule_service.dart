import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/schedule_model.dart';
import 'supabase_service.dart';

class ScheduleService {
  final SupabaseClient _client = SupabaseService.client;

  // Fetch all schedules for a class, joining subjects
  Future<List<ScheduleEntry>> getClassSchedule(String classId) async {
    try {
      final List<dynamic> data = await _client
          .from('schedules')
          .select('*, subjects(*)')
          .eq('class_id', classId)
          .order('start_time', ascending: true);
      
      return data.map((item) => ScheduleEntry.fromJson(item)).toList();
    } catch (e) {
      throw Exception('Gagal memuat jadwal kelas: $e');
    }
  }

  // Get class schedule filtered by day of week (1: Monday, 5: Friday)
  Future<List<ScheduleEntry>> getClassScheduleByDay(String classId, int dayOfWeek) async {
    try {
      final List<dynamic> data = await _client
          .from('schedules')
          .select('*, subjects(*)')
          .eq('class_id', classId)
          .eq('day_of_week', dayOfWeek)
          .order('start_time', ascending: true);
      
      return data.map((item) => ScheduleEntry.fromJson(item)).toList();
    } catch (e) {
      throw Exception('Gagal memuat jadwal hari ini: $e');
    }
  }

  // Get today's class schedule (Monday = 1, Sunday = 7)
  Future<List<ScheduleEntry>> getTodaySchedule(String classId) async {
    final weekday = DateTime.now().weekday;
    // If weekend, return empty list
    if (weekday > 5) return [];
    return getClassScheduleByDay(classId, weekday);
  }
}
