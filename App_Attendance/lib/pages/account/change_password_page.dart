// FILE: lib/pages/account/change_password_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/custom_button.dart';

class ChangePasswordPage extends ConsumerStatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  ConsumerState<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends ConsumerState<ChangePasswordPage>
    with SingleTickerProviderStateMixin {
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;

  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOut,
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleChangePassword() async {
    final newPassword = _newPasswordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (newPassword.isEmpty || confirmPassword.isEmpty) {
      _showSnackBar('Semua field wajib diisi.', isError: true);
      return;
    }

    if (newPassword.length < 6) {
      _showSnackBar('Password minimal 6 karakter.', isError: true);
      return;
    }

    if (newPassword != confirmPassword) {
      _showSnackBar('Konfirmasi password tidak cocok.', isError: true);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      await authService.changePassword(newPassword);

      if (!mounted) return;

      _showSnackBar('Password berhasil diubah!', isError: false);

      // Wait briefly then go back
      await Future.delayed(const Duration(milliseconds: 1200));
      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = e.toString().replaceAll('Exception:', '').trim();
        _showSnackBar('Gagal mengubah password: $errorMsg', isError: true);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showSnackBar(String message, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.nunito(fontWeight: FontWeight.w700),
        ),
        backgroundColor: isError ? Colors.red : AppColors.primaryBrown,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String hint,
    required bool obscure,
    required VoidCallback onToggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      textAlign: TextAlign.center,
      style: GoogleFonts.nunito(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: AppColors.textDark,
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.nunito(
          color: Colors.grey.shade500,
          fontWeight: FontWeight.w600,
        ),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 20,
        ),
        suffixIcon: Padding(
          padding: const EdgeInsets.only(right: 12),
          child: GestureDetector(
            onTap: onToggle,
            child: Icon(
              obscure
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: Colors.grey.shade500,
            ),
          ),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(40),
          borderSide: const BorderSide(
            color: Color(0xFFD7CCB7),
            width: 1.6,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(40),
          borderSide: const BorderSide(
            color: Color(0xFFD7CCB7),
            width: 1.6,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(40),
          borderSide: const BorderSide(
            color: Color(0xFF9B652D),
            width: 1.8,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: Column(
            children: [
              // --- Top Bar ---
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 20,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Ubah Password',
                      style: GoogleFonts.nunito(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                ),
              ),

              // --- Content ---
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 26),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),

                      // Lock icon
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: AppColors.primaryBrown.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.lock_outline_rounded,
                          size: 30,
                          color: AppColors.primaryBrown,
                        ),
                      ),

                      const SizedBox(height: 16),

                      Text(
                        'Buat password baru',
                        style: GoogleFonts.nunito(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textDark,
                        ),
                      ),

                      const SizedBox(height: 6),

                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text(
                          'Password baru minimal 6 karakter. Pastikan password yang mudah diingat.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.nunito(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textGray,
                            height: 1.5,
                          ),
                        ),
                      ),

                      const SizedBox(height: 30),

                      // White card with password fields
                      Container(
                        constraints: const BoxConstraints(maxWidth: 390),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 26,
                          vertical: 28,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: const Color(0xFFD7CCB7),
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          children: [
                            _buildPasswordField(
                              controller: _newPasswordController,
                              hint: 'Password Baru',
                              obscure: _obscureNew,
                              onToggle: () {
                                setState(() => _obscureNew = !_obscureNew);
                              },
                            ),

                            const SizedBox(height: 18),

                            _buildPasswordField(
                              controller: _confirmPasswordController,
                              hint: 'Konfirmasi Password',
                              obscure: _obscureConfirm,
                              onToggle: () {
                                setState(
                                  () => _obscureConfirm = !_obscureConfirm,
                                );
                              },
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Save button
                      SizedBox(
                        width: 300,
                        child: _isLoading
                            ? const Center(
                                child: CircularProgressIndicator(
                                  color: AppColors.primaryBrown,
                                ),
                              )
                            : CustomButton(
                                label: 'Simpan Password Baru',
                                borderRadius: 24,
                                verticalPadding: 16,
                                fontSize: 18,
                                onPressed: _handleChangePassword,
                              ),
                      ),

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
