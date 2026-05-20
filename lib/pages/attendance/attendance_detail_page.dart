// FILE: lib/pages/attendance/attendance_detail_page.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../models/attendance_model.dart';
import '../../models/dummy_attendance_data.dart';

class AttendanceDetailPage extends StatelessWidget {
  final VoidCallback onBack;

  const AttendanceDetailPage({
    super.key,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header info (mockup exact layout)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppConstants.studentName,
                      style: GoogleFonts.nunito(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      AppConstants.studentClassFull,
                      style: GoogleFonts.nunito(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Presentase = ${AppConstants.attendancePercent}',
                      style: GoogleFonts.nunito(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: AppColors.primaryBrown),
                onPressed: onBack,
                tooltip: 'Kembali',
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Table with exact mockup styling: thin black borders, gold headers, green/red cells
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.black, width: 1.2),
            ),
            child: Table(
              columnWidths: const {
                0: FlexColumnWidth(1.2),
                1: FlexColumnWidth(1),
              },
              children: [
                // Header row
                TableRow(
                  decoration: const BoxDecoration(
                    color: Color(0xFFF5D695), // Sand/gold background matching mockup
                  ),
                  children: [
                    _buildHeaderCell('Tanggal', showRightBorder: true),
                    _buildHeaderCell('Keterangan', showRightBorder: false),
                  ],
                ),
                // Data Rows
                ...DummyAttendanceData.records.asMap().entries.map((entry) {
                  final i = entry.key;
                  final record = entry.value;
                  final isLast = i == DummyAttendanceData.records.length - 1;

                  return TableRow(
                    children: [
                      // Date Cell
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          border: Border(
                            right: const BorderSide(color: Colors.black, width: 1),
                            bottom: isLast
                                ? BorderSide.none
                                : const BorderSide(color: Colors.black, width: 1),
                          ),
                        ),
                        child: Text(
                          record.date,
                          style: GoogleFonts.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textDark,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      // Status Cell (filled with red or green)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: record.status == AttendanceStatus.hadir
                              ? const Color(0xFF5ED95E) // Bright light green matching mockup Hadir
                              : const Color(0xFFFF2B2B), // Red matching mockup Tidak Hadir
                          border: Border(
                            bottom: isLast
                                ? BorderSide.none
                                : const BorderSide(color: Colors.black, width: 1),
                          ),
                        ),
                        child: Text(
                          record.status == AttendanceStatus.hadir ? 'Hadir' : 'Tidak Hadir',
                          style: GoogleFonts.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: record.status == AttendanceStatus.hadir
                                ? Colors.black
                                : Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Kembali text link at the bottom of the table
          Center(
            child: TextButton.icon(
              icon: const Icon(Icons.arrow_back_rounded, size: 16, color: AppColors.primaryBrown),
              label: Text(
                'Kembali',
                style: GoogleFonts.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryBrown,
                ),
              ),
              onPressed: onBack,
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildHeaderCell(String label, {required bool showRightBorder}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: Border(
          right: showRightBorder
              ? const BorderSide(color: Colors.black, width: 1)
              : BorderSide.none,
          bottom: const BorderSide(color: Colors.black, width: 1.2),
        ),
      ),
      child: Text(
        label,
        style: GoogleFonts.nunito(
          fontSize: 13,
          fontWeight: FontWeight.w800,
          color: Colors.black,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

