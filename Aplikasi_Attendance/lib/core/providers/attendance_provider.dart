import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/attendance_model.dart';
import '../services/attendance_service.dart';
import 'auth_provider.dart';

final attendanceServiceProvider = Provider<AttendanceService>((ref) => AttendanceService());

class AttendanceState {
  final AsyncValue<List<AttendanceRecord>> history;
  final AsyncValue<Map<AttendanceStatus, int>> stats;
  final AsyncValue<AttendanceRecord?> today;

  AttendanceState({
    required this.history,
    required this.stats,
    required this.today,
  });

  AttendanceState copyWith({
    AsyncValue<List<AttendanceRecord>>? history,
    AsyncValue<Map<AttendanceStatus, int>>? stats,
    AsyncValue<AttendanceRecord?>? today,
  }) {
    return AttendanceState(
      history: history ?? this.history,
      stats: stats ?? this.stats,
      today: today ?? this.today,
    );
  }
}

class AttendanceNotifier extends StateNotifier<AttendanceState> {
  final AttendanceService _service;
  final String _studentId;

  AttendanceNotifier(this._service, this._studentId)
      : super(AttendanceState(
          history: const AsyncValue.loading(),
          stats: const AsyncValue.loading(),
          today: const AsyncValue.loading(),
        )) {
    if (_studentId.isNotEmpty) {
      refresh();
      _subscribeToRealtime();
    }
  }

  void _subscribeToRealtime() {
    _service.streamAttendance(_studentId).listen((event) {
      refresh();
    });
  }

  Future<void> refresh() async {
    await Future.wait([
      fetchHistory(),
      fetchStats(),
      fetchToday(),
    ]);
  }

  Future<void> fetchHistory({int? month, int? year}) async {
    if (_studentId.isEmpty) return;
    try {
      final records = await _service.getAttendanceRecords(_studentId, month: month, year: year);
      state = state.copyWith(history: AsyncValue.data(records));
    } catch (e, st) {
      state = state.copyWith(history: AsyncValue.error(e, st));
    }
  }

  Future<void> fetchStats() async {
    if (_studentId.isEmpty) return;
    try {
      final stats = await _service.getAttendanceStats(_studentId);
      state = state.copyWith(stats: AsyncValue.data(stats));
    } catch (e, st) {
      state = state.copyWith(stats: AsyncValue.error(e, st));
    }
  }

  Future<void> fetchToday() async {
    if (_studentId.isEmpty) return;
    try {
      final todayRecord = await _service.getTodayAttendance(_studentId);
      state = state.copyWith(today: AsyncValue.data(todayRecord));
    } catch (e, st) {
      state = state.copyWith(today: AsyncValue.error(e, st));
    }
  }
}

final attendanceProvider = StateNotifierProvider<AttendanceNotifier, AttendanceState>((ref) {
  final service = ref.watch(attendanceServiceProvider);
  final auth = ref.watch(authProvider);
  final studentId = auth.value?.id ?? '';
  return AttendanceNotifier(service, studentId);
});
