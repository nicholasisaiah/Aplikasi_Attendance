import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/announcement_model.dart';
import 'supabase_service.dart';

class AnnouncementService {
  final SupabaseClient _client = SupabaseService.client;

  // Fetch announcements for a specific class (or global announcements)
  Future<List<Announcement>> getAnnouncements(String? classId) async {
    try {
      final List<dynamic> data = await _client
          .from('announcements')
          .select()
          .eq('is_published', true)
          .order('published_at', ascending: false);

      final List<Announcement> allAnnouncements = data
          .map((item) => Announcement.fromJson(item))
          .toList();

      // If classId is null (e.g. admin or parent with no linked class), return all global announcements
      if (classId == null) {
        return allAnnouncements.where((announcement) {
          final target = data.firstWhere((item) => item['id'] == announcement.id)['target_classes'];
          return target == null || (target as List).isEmpty;
        }).toList();
      }

      // Filter locally for simplicity and safety
      return allAnnouncements.where((announcement) {
        final rawItem = data.firstWhere((item) => item['id'] == announcement.id);
        final targetClasses = rawItem['target_classes'] as List?;
        
        // If target_classes is null or empty, it's a global announcement for everyone
        if (targetClasses == null || targetClasses.isEmpty) {
          return true;
        }
        
        // Check if user's classId is in targetClasses
        return targetClasses.contains(classId);
      }).toList();
    } catch (e) {
      throw Exception('Gagal memuat pengumuman: $e');
    }
  }

  // Realtime subscription stream
  Stream<List<Map<String, dynamic>>> streamAnnouncements() {
    return _client
        .from('announcements')
        .stream(primaryKey: ['id'])
        .eq('is_published', true);
  }
}
