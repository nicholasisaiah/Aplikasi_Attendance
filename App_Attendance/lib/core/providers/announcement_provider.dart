import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/announcement_model.dart';
import '../services/announcement_service.dart';
import 'auth_provider.dart';

final announcementServiceProvider = Provider<AnnouncementService>((ref) => AnnouncementService());

class AnnouncementNotifier extends StateNotifier<AsyncValue<List<Announcement>>> {
  final AnnouncementService _service;
  final String? _classId;

  AnnouncementNotifier(this._service, this._classId) : super(const AsyncValue.loading()) {
    fetchAnnouncements();
    _subscribeToRealtime();
  }

  void _subscribeToRealtime() {
    _service.streamAnnouncements().listen((event) {
      fetchAnnouncements();
    });
  }

  Future<void> fetchAnnouncements() async {
    try {
      final list = await _service.getAnnouncements(_classId);
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final announcementProvider = StateNotifierProvider<AnnouncementNotifier, AsyncValue<List<Announcement>>>((ref) {
  final service = ref.watch(announcementServiceProvider);
  final auth = ref.watch(authProvider);
  final classId = auth.value?.classId;
  return AnnouncementNotifier(service, classId);
});
