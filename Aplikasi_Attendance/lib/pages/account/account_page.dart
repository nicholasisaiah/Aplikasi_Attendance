// FILE: lib/pages/account/account_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/settings_provider.dart';
import '../../widgets/custom_button.dart';
import 'change_password_page.dart';

class AccountPage extends ConsumerWidget {
  const AccountPage({super.key});

  Future<void> _openWhatsApp(String number) async {
    final uri = Uri.parse('https://wa.me/$number');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      // Fallback: try launching directly without canLaunchUrl check
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _handleLogout(BuildContext context, WidgetRef ref) {
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
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, AppConstants.routeLogin);
              }
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
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final settingsAsync = ref.watch(settingsProvider);

    return authState.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('Gagal memuat profil: $err')),
      data: (user) {
        if (user == null) {
          return const Center(child: Text('Profil tidak ditemukan.'));
        }

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
                          user.fullName.isNotEmpty ? user.fullName.substring(0, 1) : 'U',
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
                      user.fullName,
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
                      'NISN: ${user.nisn ?? '-'}',
                      style: GoogleFonts.nunito(
                        fontSize: 12,
                        color: AppColors.textGray,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      'Tahun Ajaran: 2025/2026',
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
              _buildDetailRow('Kelas', user.className ?? '-'),
              _buildDivider(),
              _buildDetailRow('Jurusan', user.major ?? '-'),
              _buildDivider(),
              _buildDetailRow('Wali Kelas', user.homeroomTeacher ?? '-'),

              const SizedBox(height: 26),

              // --- Change password button ---
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const ChangePasswordPage(),
                    ),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.cardBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: AppColors.border.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: AppColors.primaryBrown.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.lock_outline_rounded,
                          size: 18,
                          color: AppColors.primaryBrown,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Ubah Password',
                          style: GoogleFonts.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                          ),
                        ),
                      ),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 20,
                        color: AppColors.textGray.withValues(alpha: 0.5),
                      ),
                    ],
                  ),
                ),
              ),

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
                contactName: user.homeroomTeacher ?? 'Belum ditentukan',
                phoneNumber: user.homeroomTeacherPhone,
                onTap: user.homeroomTeacherPhone != null && user.homeroomTeacherPhone!.isNotEmpty
                    ? () => _openWhatsApp(user.homeroomTeacherPhone!)
                    : null,
              ),
              const SizedBox(height: 10),
              settingsAsync.when(
                data: (settings) => _buildHelpRow(
                  label: 'Tata Usaha',
                  contactName: settings.adminName,
                  phoneNumber: settings.adminWaNumber,
                  onTap: () => _openWhatsApp(settings.adminWaNumber),
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => const SizedBox(),
              ),

              const SizedBox(height: 28),

              // --- Red Logout button ---
              CustomButton(
                label: 'Logout',
                backgroundColor: AppColors.redLogout,
                onPressed: () => _handleLogout(context, ref),
                fontSize: 16,
              ),

              const SizedBox(height: 20),
            ],
          ),
        );
      },
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
    String? phoneNumber,
    required VoidCallback? onTap,
  }) {
    final bool isEnabled = onTap != null;
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 220) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.nunito(
                    fontSize: 13,
                    color: AppColors.textGray,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  width: double.infinity,
                  child: WhatsAppButton(
                    label: contactName,
                    onPressed: onTap,
                  ),
                ),
                if (!isEnabled)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Nomor belum diisi oleh admin',
                      style: GoogleFonts.nunito(
                        fontSize: 10,
                        color: Colors.grey.shade500,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
              ],
            ),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
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
            ),
            if (!isEnabled)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Nomor belum diisi oleh admin',
                  style: GoogleFonts.nunito(
                    fontSize: 10,
                    color: Colors.grey.shade500,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
