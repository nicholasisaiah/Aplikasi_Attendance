import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/schedule_model.dart';
import '../services/schedule_service.dart';
import 'auth_provider.dart';

final scheduleServiceProvider = Provider<ScheduleService>((ref) => ScheduleService());

final scheduleProvider = FutureProvider<List<ScheduleEntry>>((ref) async {
  final service = ref.watch(scheduleServiceProvider);
  final auth = ref.watch(authProvider);
  
  // Wait until user profile is loaded
  final user = auth.value;
  if (user == null || user.classId == null || user.classId!.isEmpty) {
    return [];
  }
  
  return service.getClassSchedule(user.classId!);
});

final todayScheduleProvider = FutureProvider<List<ScheduleEntry>>((ref) async {
  final service = ref.watch(scheduleServiceProvider);
  final auth = ref.watch(authProvider);
  
  final user = auth.value;
  if (user == null || user.classId == null || user.classId!.isEmpty) {
    return [];
  }
  
  return service.getTodaySchedule(user.classId!);
});
