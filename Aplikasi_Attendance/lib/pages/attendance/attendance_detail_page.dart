// FILE: lib/pages/attendance/attendance_detail_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

import '../../core/theme/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/attendance_provider.dart';
import '../../models/attendance_model.dart';

class AttendanceDetailPage extends ConsumerWidget {
  final VoidCallback onBack;

  const AttendanceDetailPage({
    super.key,
    required this.onBack,
  });

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy', 'id_ID').format(date);
    } catch (_) {
      try {
        final date = DateTime.parse(dateStr);
        return DateFormat('dd MMM yyyy').format(date);
      } catch (_) {
        return dateStr;
      }
    }
  }

  Color _getStatusColor(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.hadir:
        return const Color(0xFF5ED95E); // Bright light green matching mockup Hadir
      case AttendanceStatus.izin:
        return const Color(0xFFFFA726); // Orange for permission
      case AttendanceStatus.sakit:
        return const Color(0xFF29B6F6); // Blue for sick
      case AttendanceStatus.tanpaKeterangan:
        return const Color(0xFFFF2B2B); // Red matching mockup Tidak Hadir
    }
  }

  Color _getStatusTextColor(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.hadir:
        return Colors.black;
      case AttendanceStatus.izin:
        return Colors.black;
      case AttendanceStatus.sakit:
        return Colors.black;
      case AttendanceStatus.tanpaKeterangan:
        return Colors.white;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final attendanceState = ref.watch(attendanceProvider);

    return authState.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('Gagal memuat profil: $err')),
      data: (user) {
        if (user == null) {
          return const Center(child: Text('Profil tidak ditemukan.'));
        }

        // Calculate percentage
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
                            user.fullName,
                            style: GoogleFonts.nunito(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user.className ?? 'Belum ada kelas',
                            style: GoogleFonts.nunito(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Persentase = $percentageText',
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
                
                // Table with thin black borders, gold headers, and status colors
                attendanceState.history.when(
                  loading: () => _buildShimmerTable(),
                  error: (err, _) => Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Text('Gagal memuat riwayat: $err'),
                    ),
                  ),
                  data: (records) {
                    if (records.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.black, width: 1.2),
                          color: Colors.white,
                        ),
                        child: Text(
                          'Belum ada riwayat absensi.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.nunito(
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      );
                    }

                    return Container(
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
                          ...records.asMap().entries.map((entry) {
                            final i = entry.key;
                            final record = entry.value;
                            final isLast = i == records.length - 1;

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
                                    _formatDate(record.date),
                                    style: GoogleFonts.nunito(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textDark,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                                // Status Cell (filled with status color)
                                Container(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(record.status),
                                    border: Border(
                                      bottom: isLast
                                          ? BorderSide.none
                                          : const BorderSide(color: Colors.black, width: 1),
                                    ),
                                  ),
                                  child: Text(
                                    record.status.label,
                                    style: GoogleFonts.nunito(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: _getStatusTextColor(record.status),
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                            );
                          }),
                        ],
                      ),
                    );
                  },
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
          ),
        );
      },
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

  Widget _buildShimmerTable() {
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
