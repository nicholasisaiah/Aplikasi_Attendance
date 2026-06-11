// FILE: lib/pages/attendance/attendance_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/attendance_provider.dart';
import '../../widgets/custom_button.dart';
import '../../models/attendance_model.dart';
import 'attendance_detail_page.dart';

class AttendancePage extends ConsumerStatefulWidget {
  const AttendancePage({super.key});

  @override
  ConsumerState<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends ConsumerState<AttendancePage> {
  bool _showDetail = false;

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final attendanceState = ref.watch(attendanceProvider);

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

        if (_showDetail) {
          return AttendanceDetailPage(
            onBack: () {
              setState(() {
                _showDetail = false;
              });
            },
          );
        }

        // Calculate actual attendance percentage
        String percentageText = '100%';
        attendanceState.stats.whenData((stats) {
          final hadir = stats[AttendanceStatus.hadir] ?? 0;
          final izin = stats[AttendanceStatus.izin] ?? 0;
          final sakit = stats[AttendanceStatus.sakit] ?? 0;
          final tanpaKeterangan = stats[AttendanceStatus.tanpaKeterangan] ?? 0;
          
          final total = hadir + izin + sakit + tanpaKeterangan;
          if (total > 0) {
            final double percent = (hadir / total) * 100;
            percentageText = '${percent.round()}%';
          }
        });

        return RefreshIndicator(
          onRefresh: () => ref.read(attendanceProvider.notifier).refresh(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
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
                  user.fullName,
                  style: GoogleFonts.nunito(
                    fontSize: 16,
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  user.className ?? 'Belum ada kelas',
                  style: GoogleFonts.nunito(
                    fontSize: 16,
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 36),
                Text(
                  'Persentase Kehadiran',
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  percentageText,
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
          ),
        );
      },
    );
  }
}
