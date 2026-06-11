// FILE: lib/pages/schedule/schedule_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/theme/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/schedule_provider.dart';
import '../../models/schedule_model.dart';

class SchedulePage extends ConsumerStatefulWidget {
  const SchedulePage({super.key});

  @override
  ConsumerState<SchedulePage> createState() => _SchedulePageState();
}

class _SchedulePageState extends ConsumerState<SchedulePage> {
  String _selectedDay = 'SENIN';

  final List<String> _days = [
    'SENIN',
    'SELASA',
    'RABU',
    'KAMIS',
    'JUMAT',
  ];

  int _getDayOfWeekNumber(String day) {
    switch (day) {
      case 'SENIN':
        return 1;
      case 'SELASA':
        return 2;
      case 'RABU':
        return 3;
      case 'KAMIS':
        return 4;
      case 'JUMAT':
        return 5;
      default:
        return 1;
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final scheduleState = ref.watch(scheduleProvider);

    return authState.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (err, _) => Scaffold(
        body: Center(child: Text('Terjadi kesalahan: $err')),
      ),
      data: (user) {
        if (user == null) {
          return const Scaffold(
            body: Center(child: Text('Pengguna tidak ditemukan.')),
          );
        }

        return Scaffold(
          backgroundColor: AppColors.background,
          body: RefreshIndicator(
            onRefresh: () => ref.refresh(scheduleProvider.future),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Student details header (mockup exact)
                  Text(
                    user.fullName,
                    style: GoogleFonts.nunito(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    user.className ?? 'Belum ada kelas',
                    style: GoogleFonts.nunito(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'Tahun Ajaran: 2025/2026',
                    style: GoogleFonts.nunito(
                      fontSize: 14,
                      color: AppColors.textGray,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Dropdown day selector using PopupMenuButton to prevent overlap behind schedule table
                  PopupMenuButton<String>(
                    offset: const Offset(0, 32),
                    position: PopupMenuPosition.under,
                    surfaceTintColor: Colors.transparent,
                    color: const Color(0xFFFEFDF9),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: const BorderSide(color: Colors.black, width: 1.2),
                    ),
                    onSelected: (String day) {
                      setState(() {
                        _selectedDay = day;
                      });
                    },
                    itemBuilder: (BuildContext context) {
                      return _days.map((day) {
                        final isSelected = day == _selectedDay;
                        return PopupMenuItem<String>(
                          value: day,
                          height: 38,
                          padding: EdgeInsets.zero,
                          child: Container(
                            width: 120,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            color: isSelected ? const Color(0xFFE8EBCF) : Colors.transparent,
                            child: Text(
                              day,
                              style: GoogleFonts.nunito(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                color: AppColors.textDark,
                              ),
                            ),
                          ),
                        );
                      }).toList();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEFDF9),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.black54, width: 1.2),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _selectedDay,
                            style: GoogleFonts.nunito(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.keyboard_arrow_down_rounded,
                            size: 18,
                            color: AppColors.textDark,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Schedule table or loading skeleton
                  scheduleState.when(
                    loading: () => _buildShimmerSchedule(),
                    error: (err, _) => Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Text('Gagal memuat jadwal pelajaran: $err'),
                      ),
                    ),
                    data: (allEntries) {
                      final dayNum = _getDayOfWeekNumber(_selectedDay);
                      final List<ScheduleEntry> entries = allEntries
                          .where((item) => item.dayOfWeek == dayNum)
                          .toList();

                      const double rowHeight = 44.0;
                      final displayEntriesCount = entries.isEmpty ? 1 : entries.length;

                      return Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.black, width: 1.2),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 1. Hari column (vertical span)
                            Container(
                              width: 60,
                              decoration: const BoxDecoration(
                                border: Border(
                                  right: BorderSide(color: Colors.black, width: 1.2),
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Header
                                  Container(
                                    height: 38,
                                    width: double.infinity,
                                    color: const Color(0xFFF5D695), // Gold header
                                    alignment: Alignment.center,
                                    child: Text(
                                      'Hari',
                                      style: GoogleFonts.nunito(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    height: 0.8,
                                    color: Colors.black,
                                  ),
                                  // Vertically centered text for the day name
                                  SizedBox(
                                    height: displayEntriesCount * rowHeight,
                                    child: Center(
                                      child: Text(
                                        _selectedDay.substring(0, 1) + _selectedDay.substring(1).toLowerCase(),
                                        style: GoogleFonts.nunito(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.textDark,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // 2. Right Table (Waktu & Mata Pelajaran)
                            Expanded(
                              child: Table(
                                columnWidths: const {
                                  0: FlexColumnWidth(1.2),
                                  1: FlexColumnWidth(1.8),
                                },
                                children: [
                                  // Header Row
                                  TableRow(
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFF5D695),
                                    ),
                                    children: [
                                      Container(
                                        height: 38,
                                        alignment: Alignment.center,
                                        decoration: const BoxDecoration(
                                          border: Border(
                                            right: BorderSide(color: Colors.black, width: 1),
                                            bottom: BorderSide(color: Colors.black, width: 1.2),
                                          ),
                                        ),
                                        child: Text(
                                          'Waktu',
                                          style: GoogleFonts.nunito(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800,
                                            color: Colors.black,
                                          ),
                                        ),
                                      ),
                                      Container(
                                        height: 38,
                                        alignment: Alignment.center,
                                        decoration: const BoxDecoration(
                                          border: Border(
                                            bottom: BorderSide(color: Colors.black, width: 1.2),
                                          ),
                                        ),
                                        child: Text(
                                          'Mata Pelajaran',
                                          style: GoogleFonts.nunito(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800,
                                            color: Colors.black,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  // Data Rows
                                  if (entries.isEmpty)
                                    TableRow(
                                      children: [
                                        Container(
                                          height: rowHeight,
                                          alignment: Alignment.center,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFFEFDF9),
                                            border: Border(
                                              right: BorderSide(color: Colors.black, width: 1),
                                            ),
                                          ),
                                          child: Text(
                                            '-',
                                            style: GoogleFonts.nunito(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          height: rowHeight,
                                          alignment: Alignment.center,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFFEFDF9),
                                          ),
                                          child: Text(
                                            'Tidak Ada Kelas',
                                            style: GoogleFonts.nunito(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.grey.shade500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    )
                                  else
                                    ...entries.asMap().entries.map((entry) {
                                      final i = entry.key;
                                      final e = entry.value;
                                      final isLast = i == entries.length - 1;

                                      return TableRow(
                                        children: [
                                          // Waktu Cell
                                          Container(
                                            height: rowHeight,
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFEFDF9),
                                              border: Border(
                                                right: const BorderSide(color: Colors.black, width: 1),
                                                bottom: isLast
                                                    ? BorderSide.none
                                                    : const BorderSide(color: Colors.black, width: 1),
                                              ),
                                            ),
                                            child: Text(
                                              e.time,
                                              style: GoogleFonts.nunito(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.textDark,
                                              ),
                                            ),
                                          ),
                                          // Mata Pelajaran Cell (color-filled)
                                          Container(
                                            height: rowHeight,
                                            alignment: Alignment.center,
                                            decoration: BoxDecoration(
                                              color: e.color,
                                              border: Border(
                                                bottom: isLast
                                                    ? BorderSide.none
                                                    : const BorderSide(color: Colors.black, width: 1),
                                              ),
                                            ),
                                            child: Text(
                                              e.subject,
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.nunito(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                        ],
                                      );
                                    }),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildShimmerSchedule() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade300,
      highlightColor: Colors.grey.shade100,
      child: Container(
        width: double.infinity,
        height: 200,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black, width: 1.2),
          color: Colors.white,
        ),
      ),
    );
  }
}
