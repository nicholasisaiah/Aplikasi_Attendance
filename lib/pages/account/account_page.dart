// FILE: lib/pages/account/account_page.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../widgets/custom_button.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  Future<void> _openWhatsApp(String number) async {
    final uri = Uri.parse('https://wa.me/$number');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.background,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Konfirmasi Logout',
          style: GoogleFonts.nunito(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        content: Text(
          'Apakah kamu yakin ingin keluar?',
          style: GoogleFonts.nunito(
            fontSize: 14,
            color: AppColors.textGray,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Batal',
              style: GoogleFonts.nunito(
                color: AppColors.textGray,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pushReplacementNamed(
                  context, AppConstants.routeLogin);
            },
            child: Text(
              'Logout',
              style: GoogleFonts.nunito(
                color: AppColors.redLogout,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- Profile header: avatar + centered student info ---
          Center(
            child: Column(
              children: [
                // Grey vertical rectangle avatar
                Container(
                  width: 80,
                  height: 104,
                  decoration: BoxDecoration(
                    color: const Color(0xFFB0B0B0),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      'FG',
                      style: GoogleFonts.nunito(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: AppColors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  AppConstants.studentName,
                  style: GoogleFonts.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                    height: 1.2,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 3),
                Text(
                  'NISN: ${AppConstants.studentNisn}',
                  style: GoogleFonts.nunito(
                    fontSize: 12,
                    color: AppColors.textGray,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  AppConstants.academicYear,
                  style: GoogleFonts.nunito(
                    fontSize: 12,
                    color: AppColors.textGray,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 26),

          // --- Student detail list, directly on cream background ---
          _buildDetailRow('Kelas', AppConstants.studentClass),
          _buildDivider(),
          _buildDetailRow('Jurusan', AppConstants.studentJurusan),
          _buildDivider(),
          _buildDetailRow('Wali Kelas', AppConstants.waliKelas),

          const SizedBox(height: 26),

          // --- Need help section ---
          Text(
            'Need help?',
            style: GoogleFonts.nunito(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 12),
          _buildHelpRow(
            label: 'Wali Kelas',
            contactName: AppConstants.waliKelas,
            onTap: () => _openWhatsApp(AppConstants.waliKelasWa),
          ),
          const SizedBox(height: 10),
          _buildHelpRow(
            label: 'Tata Usaha',
            contactName: AppConstants.tatausaha,
            onTap: () => _openWhatsApp(AppConstants.tatausahaWa),
          ),

          const SizedBox(height: 28),

          // --- Red Logout button ---
          Builder(
            builder: (context) => CustomButton(
              label: 'Logout',
              backgroundColor: AppColors.redLogout,
              onPressed: () => _handleLogout(context),
              fontSize: 16,
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$label: ',
            style: GoogleFonts.nunito(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textGray,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.nunito(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 1,
      color: AppColors.border.withValues(alpha: 0.6),
    );
  }

  Widget _buildHelpRow({
    required String label,
    required String contactName,
    required VoidCallback onTap,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.nunito(
            fontSize: 13,
            color: AppColors.textGray,
            fontWeight: FontWeight.w500,
          ),
        ),
        WhatsAppButton(
          label: contactName,
          onPressed: onTap,
        ),
      ],
    );
  }
}
