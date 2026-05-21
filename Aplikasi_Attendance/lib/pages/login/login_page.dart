// FILE: lib/pages/login/login_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/custom_button.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _emailController =
      TextEditingController();

  final TextEditingController _passwordController =
      TextEditingController();

  bool _obscurePassword = true;
  bool _showContact = false;
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
    _emailController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Email dan password wajib diisi.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await ref.read(authProvider.notifier).login(email, password);
      
      if (!mounted) return;

      final user = ref.read(authProvider).value;
      if (user != null) {
        if (user.role == 'admin' || user.role == 'teacher') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Admin/Guru silakan gunakan browser untuk masuk ke Dashboard.'),
              backgroundColor: Colors.orange,
            ),
          );
          await ref.read(authProvider.notifier).logout();
        } else {
          Navigator.pushReplacementNamed(context, AppConstants.routeMain);
        }
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = e.toString().replaceAll('Exception:', '');
        if (errorMsg.contains('Invalid login credentials')) {
          errorMsg = 'Email atau password salah.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Login gagal: $errorMsg'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _openWhatsApp(String number) async {
    final uri = Uri.parse('https://wa.me/$number');

    if (await canLaunchUrl(uri)) {
      await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
    }
  }

  void _toggleView() {
    _animController.reverse().then((_) {
      setState(() {
        _showContact = !_showContact;
      });

      _animController.forward();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F3ED),

      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 26),

            child: FadeTransition(
              opacity: _fadeAnim,

              child: Column(
                children: [
                  const SizedBox(height: 40),

                  // =========================
                  // PURE LOGO ONLY
                  // =========================

                  Center(
                    child: Image.asset(
                      'assets/images/SMK Asisi.png',
                      width: 250,
                      fit: BoxFit.contain,
                    ),
                  ),

                  const SizedBox(height: 30),

                  // =========================
                  // LOGIN PAGE
                  // =========================

                  if (!_showContact) ...[
                    Container(
                      constraints: const BoxConstraints(
                        maxWidth: 390,
                      ),

                      padding: const EdgeInsets.symmetric(
                        horizontal: 26,
                        vertical: 30,
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
                        crossAxisAlignment:
                            CrossAxisAlignment.center,

                        children: [
                          Text(
                            'Login',

                            textAlign: TextAlign.center,

                            style: GoogleFonts.nunito(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF2E1B12),
                            ),
                          ),

                          const SizedBox(height: 30),

                          // =========================
                          // EMAIL
                          // =========================

                          TextField(
                            controller: _emailController,

                            keyboardType:
                                TextInputType.emailAddress,

                            textAlign: TextAlign.center,

                            style: GoogleFonts.nunito(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF2E1B12),
                            ),

                            decoration: InputDecoration(
                              hintText: 'Email',

                              hintStyle: GoogleFonts.nunito(
                                color: Colors.grey.shade500,
                                fontWeight: FontWeight.w600,
                              ),

                              filled: true,
                              fillColor: Colors.white,

                              contentPadding:
                                  const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 20,
                              ),

                              border: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(40),

                                borderSide: const BorderSide(
                                  color: Color(0xFFD7CCB7),
                                  width: 1.6,
                                ),
                              ),

                              enabledBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(40),

                                borderSide: const BorderSide(
                                  color: Color(0xFFD7CCB7),
                                  width: 1.6,
                                ),
                              ),

                              focusedBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(40),

                                borderSide: const BorderSide(
                                  color: Color(0xFF9B652D),
                                  width: 1.8,
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 18),

                          // =========================
                          // PASSWORD
                          // =========================

                          TextField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,

                            textAlign: TextAlign.center,

                            style: GoogleFonts.nunito(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF2E1B12),
                            ),

                            decoration: InputDecoration(
                              hintText: 'Password',

                              hintStyle: GoogleFonts.nunito(
                                color: Colors.grey.shade500,
                                fontWeight: FontWeight.w600,
                              ),

                              filled: true,
                              fillColor: Colors.white,

                              contentPadding:
                                  const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 20,
                              ),

                              suffixIcon: Padding(
                                padding:
                                    const EdgeInsets.only(right: 12),

                                child: GestureDetector(
                                  onTap: () {
                                    setState(() {
                                      _obscurePassword =
                                          !_obscurePassword;
                                    });
                                  },

                                  child: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                              ),

                              border: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(40),

                                borderSide: const BorderSide(
                                  color: Color(0xFFD7CCB7),
                                  width: 1.6,
                                ),
                              ),

                              enabledBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(40),

                                borderSide: const BorderSide(
                                  color: Color(0xFFD7CCB7),
                                  width: 1.6,
                                ),
                              ),

                              focusedBorder: OutlineInputBorder(
                                borderRadius:
                                    BorderRadius.circular(40),

                                borderSide: const BorderSide(
                                  color: Color(0xFF9B652D),
                                  width: 1.8,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // =========================
                    // BUTTON
                    // =========================

                    SizedBox(
                      width: 300,

                      child: _isLoading
                          ? const Center(
                              child: CircularProgressIndicator(
                                color: Color(0xFF9B652D),
                              ),
                            )
                          : CustomButton(
                              label: 'Login',
                              borderRadius: 24,
                              verticalPadding: 16,
                              fontSize: 20,
                              onPressed: _handleLogin,
                            ),
                    ),

                    const SizedBox(height: 22),

                    GestureDetector(
                      onTap: _toggleView,

                      child: Text(
                        'tidak punya akun!',

                        style: GoogleFonts.nunito(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ]

                  // =========================
                  // CONTACT PAGE
                  // =========================

                  else ...[
                    Container(
                      constraints: const BoxConstraints(
                        maxWidth: 390,
                      ),

                      padding: const EdgeInsets.symmetric(
                        horizontal: 26,
                        vertical: 34,
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
                          Text(
                            'Hubungi Tata Usaha\nuntuk pembuatan akun',

                            textAlign: TextAlign.center,

                            style: GoogleFonts.nunito(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF2E1B12),
                              height: 1.5,
                            ),
                          ),

                          const SizedBox(height: 28),

                          SizedBox(
                            width: double.infinity,

                            child: WhatsAppButton(
                              label: AppConstants.tatausaha,
                              borderRadius: 30,
                              onPressed: () {
                                _openWhatsApp(
                                  AppConstants.tatausahaWa,
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    GestureDetector(
                      onTap: _toggleView,

                      child: Text(
                        'sudah punya akun?',

                        style: GoogleFonts.nunito(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}