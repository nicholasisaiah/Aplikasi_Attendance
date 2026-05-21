// FILE: lib/models/schedule_model.dart

import 'package:flutter/material.dart';

class ScheduleEntry {
  final String id;
  final String time;
  final String subject;
  final Color color;
  final int dayOfWeek; // 1: Monday, 5: Friday

  const ScheduleEntry({
    required this.id,
    required this.time,
    required this.subject,
    required this.color,
    required this.dayOfWeek,
  });

  factory ScheduleEntry.fromJson(Map<String, dynamic> json) {
    final subjectJson = json['subjects'] as Map<String, dynamic>? ?? {};
    final subjectName = subjectJson['name'] as String? ?? 'Mata Pelajaran';
    final colorHex = subjectJson['color'] as String? ?? '#795548';

    // Format HH:MM:SS to HH.MM
    final startTimeRaw = json['start_time'] as String? ?? '07:00:00';
    final endTimeRaw = json['end_time'] as String? ?? '08:00:00';
    
    final startParts = startTimeRaw.split(':');
    final endParts = endTimeRaw.split(':');
    
    final startTimeFormatted = startParts.length >= 2 ? '${startParts[0]}.${startParts[1]}' : '07.00';
    final endTimeFormatted = endParts.length >= 2 ? '${endParts[0]}.${endParts[1]}' : '08.00';

    return ScheduleEntry(
      id: json['id'] as String? ?? '',
      time: '$startTimeFormatted - $endTimeFormatted',
      subject: subjectName,
      color: _parseColor(colorHex),
      dayOfWeek: json['day_of_week'] as int? ?? 1,
    );
  }

  static Color _parseColor(String hex) {
    try {
      final buffer = StringBuffer();
      if (hex.length == 6 || hex.length == 7) buffer.write('ff');
      buffer.write(hex.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return const Color(0xFF795548); // default brown/cream tone color
    }
  }
}

class DaySchedule {
  final String day;
  final List<ScheduleEntry> entries;

  const DaySchedule({
    required this.day,
    required this.entries,
  });
  
  static String getDayName(int dayNum) {
    switch (dayNum) {
      case 1:
        return 'SENIN';
      case 2:
        return 'SELASA';
      case 3:
        return 'RABU';
      case 4:
        return 'KAMIS';
      case 5:
        return 'JUMAT';
      default:
        return 'SENIN';
    }
  }
}
