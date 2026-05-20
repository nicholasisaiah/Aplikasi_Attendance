// FILE: lib/pages/home/home_page.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/app_constants.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Greeting section
          _buildGreetingSection(),
          const SizedBox(height: 24),
          // Announcements Section
          _buildCapsuleTitle('Pengumuman'),
          const SizedBox(height: 12),
          _buildGreyPlaceholder(height: 140),
          const SizedBox(height: 24),
          // Today's Schedule Section
          _buildCapsuleTitle('Jadwal Hari Ini'),
          const SizedBox(height: 12),
          _buildGreyPlaceholder(height: 140),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildGreetingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Selamat pagi 👋',
          style: GoogleFonts.nunito(
            fontSize: 25,
            fontWeight: FontWeight.w600,
            color: AppColors.textDark,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          AppConstants.studentName,
          style: GoogleFonts.nunito(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: AppColors.textDark,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          AppConstants.studentClassFull,
          style: GoogleFonts.nunito(
            fontSize: 15,
            color: AppColors.textDark,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildCapsuleTitle(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primaryBrown,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: GoogleFonts.nunito(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }

  Widget _buildGreyPlaceholder({double height = 140}) {
    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFD9D9D9), // Perfect mockup-matching grey
        borderRadius: BorderRadius.circular(12),
      ),
    );
  }
}

