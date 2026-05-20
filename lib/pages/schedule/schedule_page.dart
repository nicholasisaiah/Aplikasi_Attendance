// FILE: lib/pages/schedule/schedule_page.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../models/schedule_model.dart';

class SchedulePage extends StatefulWidget {
  const SchedulePage({super.key});

  @override
  State<SchedulePage> createState() => _SchedulePageState();
}

class _SchedulePageState extends State<SchedulePage> {
  String _selectedDay = 'SENIN';
  bool _isDropdownOpen = false;

  Color _getSubjectColor(String subject) {
    switch (subject.toLowerCase()) {
      case 'olahraga':
        return const Color(0xFFFF9E66); // Warm orange
      case 'ai':
      case 'asj':
      case 'aij':
        return const Color(0xFF1E88E5); // Deep blue
      case 'bahasa indonesia':
        return const Color(0xFFD32F2F); // Red
      case 'bk':
        return const Color(0xFF8B5A2B); // Orange-brown / gold-brown
      default:
        return AppColors.primaryBrown;
    }
  }

  @override
  Widget build(BuildContext context) {
    final entries = DummyScheduleData.scheduleMap[_selectedDay] ?? [];
    const double rowHeight = 38.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Student details header (mockup exact)
          Text(
            AppConstants.studentName,
            style: GoogleFonts.nunito(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
          Text(
            AppConstants.studentClassFull,
            style: GoogleFonts.nunito(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
          Text(
            AppConstants.academicYear,
            style: GoogleFonts.nunito(
              fontSize: 14,
              color: AppColors.textGray,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),

          // Dropdown day selector (mockup exact)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: () {
                  setState(() {
                    _isDropdownOpen = !_isDropdownOpen;
                  });
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
              if (_isDropdownOpen) ...[
                const SizedBox(height: 4),
                Container(
                  width: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEFDF9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.black, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: DummyScheduleData.days.map((day) {
                      final isSelected = day == _selectedDay;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedDay = day;
                            _isDropdownOpen = false;
                          });
                        },
                        child: Container(
                          width: double.infinity,
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
                    }).toList(),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 18),

          // Custom Schedule Table (mockup exact)
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.black, width: 1.2),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Hari column (vertical span)
                Container(
                  width: 50,
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
                        height: entries.length * rowHeight,
                        child: Center(
                          child: RotatedBox(
                            quarterTurns: 0,
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
                                color: _getSubjectColor(e.subject),
                                border: Border(
                                  bottom: isLast
                                      ? BorderSide.none
                                      : const BorderSide(color: Colors.black, width: 1),
                                ),
                              ),
                              child: Text(
                                e.subject,
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
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

