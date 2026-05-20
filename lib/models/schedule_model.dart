// FILE: lib/models/schedule_model.dart

import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

class ScheduleEntry {
  final String time;
  final String subject;
  final Color color;

  const ScheduleEntry({
    required this.time,
    required this.subject,
    required this.color,
  });
}

class DaySchedule {
  final String day;
  final List<ScheduleEntry> entries;

  const DaySchedule({
    required this.day,
    required this.entries,
  });
}

class DummyScheduleData {
  static const List<String> days = [
    'SENIN',
    'SELASA',
    'RABU',
    'KAMIS',
    'JUMAT',
  ];

  static final Map<String, List<ScheduleEntry>> scheduleMap = {
    'SENIN': [
      ScheduleEntry(
          time: '07.00 - 07.40',
          subject: 'Olahraga',
          color: AppColors.olahraga),
      ScheduleEntry(
          time: '07.40 - 08.20',
          subject: 'Olahraga',
          color: AppColors.olahraga),
      ScheduleEntry(
          time: '08.20 - 09.00', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '09.00 - 09.40', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '10.00 - 10.40',
          subject: 'Bahasa Indonesia',
          color: AppColors.bahasaIndonesia),
      ScheduleEntry(
          time: '10.40 - 11.20',
          subject: 'Bahasa Indonesia',
          color: AppColors.bahasaIndonesia),
      ScheduleEntry(
          time: '11.20 - 12.00', subject: 'BK', color: AppColors.bk),
      ScheduleEntry(
          time: '12.15 - 12.55', subject: 'BK', color: AppColors.bk),
      ScheduleEntry(
          time: '12.55 - 13.35', subject: 'AIJ', color: AppColors.asj),
      ScheduleEntry(
          time: '13.35 - 14.15', subject: 'AIJ', color: AppColors.asj),
    ],
    'SELASA': [
      ScheduleEntry(
          time: '07.00 - 07.40',
          subject: 'Olahraga',
          color: AppColors.olahraga),
      ScheduleEntry(
          time: '07.40 - 08.20',
          subject: 'Olahraga',
          color: AppColors.olahraga),
      ScheduleEntry(
          time: '08.20 - 09.00', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '09.00 - 09.40', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '10.00 - 10.40',
          subject: 'Bahasa Indonesia',
          color: AppColors.bahasaIndonesia),
      ScheduleEntry(
          time: '10.40 - 11.20', subject: 'BK', color: AppColors.bk),
      ScheduleEntry(
          time: '12.15 - 12.55', subject: 'AIJ', color: AppColors.asj),
      ScheduleEntry(
          time: '12.55 - 13.35', subject: 'AIJ', color: AppColors.asj),
    ],
    'RABU': [
      ScheduleEntry(
          time: '07.00 - 07.40', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '07.40 - 08.20', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '08.20 - 09.00',
          subject: 'Bahasa Indonesia',
          color: AppColors.bahasaIndonesia),
      ScheduleEntry(
          time: '09.00 - 09.40', subject: 'BK', color: AppColors.bk),
      ScheduleEntry(
          time: '10.00 - 10.40', subject: 'AIJ', color: AppColors.asj),
      ScheduleEntry(
          time: '10.40 - 11.20', subject: 'AIJ', color: AppColors.asj),
    ],
    'KAMIS': [
      ScheduleEntry(
          time: '07.00 - 07.40',
          subject: 'Bahasa Indonesia',
          color: AppColors.bahasaIndonesia),
      ScheduleEntry(
          time: '07.40 - 08.20',
          subject: 'Bahasa Indonesia',
          color: AppColors.bahasaIndonesia),
      ScheduleEntry(
          time: '08.20 - 09.00', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '09.00 - 09.40', subject: 'BK', color: AppColors.bk),
      ScheduleEntry(
          time: '10.00 - 10.40',
          subject: 'Olahraga',
          color: AppColors.olahraga),
      ScheduleEntry(
          time: '12.15 - 12.55', subject: 'AIJ', color: AppColors.asj),
    ],
    'JUMAT': [
      ScheduleEntry(
          time: '07.00 - 07.40', subject: 'BK', color: AppColors.bk),
      ScheduleEntry(
          time: '07.40 - 08.20', subject: 'AI', color: AppColors.ai),
      ScheduleEntry(
          time: '08.20 - 09.00', subject: 'AIJ', color: AppColors.asj),
      ScheduleEntry(
          time: '09.00 - 09.40', subject: 'AIJ', color: AppColors.asj),
    ],
  };
}
