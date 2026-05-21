// FILE: lib/pages/splash_page.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/constants/app_constants.dart';
import '../core/theme/app_colors.dart';
import '../core/providers/auth_provider.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _scaleAnim = Tween<double>(
      begin: 0.75,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack,
      ),
    );

    _fadeAnim = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOut,
      ),
    );

    _controller.forward();

    _checkSessionAndNavigate();
  }

  Future<void> _checkSessionAndNavigate() async {
    // Wait for the animation + splash duration
    await Future.delayed(const Duration(milliseconds: 2200));
    
    if (!mounted) return;

    // Refresh session or read auth provider value
    final user = ref.read(authProvider).value;
    
    if (user != null) {
      Navigator.pushReplacementNamed(
        context,
        AppConstants.routeMain,
      );
    } else {
      Navigator.pushReplacementNamed(
        context,
        AppConstants.routeLogin,
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,

      body: Center(
        child: FadeTransition(
          opacity: _fadeAnim,

          child: ScaleTransition(
            scale: _scaleAnim,

            child: Image.asset(
              'assets/images/SMK Asisi.png',
              width: 220,
              fit: BoxFit.contain,
            ),
          ),
        ),
      ),
    );
  }
}