// FILE: lib/models/announcement_model.dart

import 'package:intl/intl.dart';

class Announcement {
  final String id;
  final String title;
  final String content;
  final String date; // formatted date (e.g. "12 Mei 2026")
  final String emoji;
  final String? imageUrl;

  const Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.date,
    required this.emoji,
    this.imageUrl,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    // Parse published_at or created_at
    final dateStr = json['published_at'] ?? json['created_at'] as String?;
    String formattedDate = '';
    if (dateStr != null) {
      try {
        final parsedDate = DateTime.parse(dateStr).toLocal();
        formattedDate = DateFormat('dd MMM yyyy', 'id_ID').format(parsedDate);
      } catch (_) {
        try {
          final parsedDate = DateTime.parse(dateStr).toLocal();
          formattedDate = DateFormat('dd MMM yyyy').format(parsedDate);
        } catch (_) {
          formattedDate = dateStr.substring(0, 10);
        }
      }
    } else {
      formattedDate = '-';
    }

    return Announcement(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      date: formattedDate,
      emoji: json['emoji'] as String? ?? '📢',
      imageUrl: json['image_url'] as String?,
    );
  }
}
