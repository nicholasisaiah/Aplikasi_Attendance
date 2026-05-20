// FILE: lib/pages/attendance/attendance_page.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../widgets/custom_button.dart';
import 'attendance_detail_page.dart';

class AttendancePage extends StatefulWidget {
  const AttendancePage({super.key});

  @override
  State<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends State<AttendancePage> {
  bool _showDetail = false;

  @override
  Widget build(BuildContext context) {
    if (_showDetail) {
      return AttendanceDetailPage(
        onBack: () {
          setState(() {
            _showDetail = false;
          });
        },
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Attendance',
            style: GoogleFonts.nunito(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            AppConstants.studentName,
            style: GoogleFonts.nunito(
              fontSize: 16,
              color: AppColors.textDark,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            AppConstants.studentClassFull,
            style: GoogleFonts.nunito(
              fontSize: 16,
              color: AppColors.textDark,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 36),
          Text(
            'Presentase',
            style: GoogleFonts.nunito(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            AppConstants.attendancePercent,
            style: GoogleFonts.nunito(
              fontSize: 84,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
              height: 1.0,
            ),
          ),
          const SizedBox(height: 44),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: CustomButton(
              label: 'Cek Detail',
              borderRadius: 20,
              fontSize: 16,
              onPressed: () {
                setState(() {
                  _showDetail = true;
                });
              },
            ),
          ),
        ],
      ),
    );
  }
}

