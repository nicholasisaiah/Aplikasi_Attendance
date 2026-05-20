// FILE: lib/widgets/app_logo_widget.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/theme/app_colors.dart';
import '../core/constants/app_constants.dart';

class AppLogoWidget extends StatelessWidget {
  final double iconSize;
  final double titleFontSize;
  final double subtitleFontSize;
  final Color titleColor;

  const AppLogoWidget({
    super.key,
    this.iconSize = 52,
    this.titleFontSize = 15,
    this.subtitleFontSize = 9,
    this.titleColor = AppColors.primaryBrown,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // LOGO
        Image.asset(
          'assets/images/SMK Asisi.png',
          width: iconSize,
          height: iconSize,
          fit: BoxFit.contain,
        ),

        const SizedBox(width: 10),

        // TEXT
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              AppConstants.appName.toUpperCase(),
              style: GoogleFonts.nunito(
                fontSize: titleFontSize,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF7A4300),
                letterSpacing: 0.4,
                height: 1,
              ),
            ),

            const SizedBox(height: 2),

            Text(
              AppConstants.appSubtitle,
              style: GoogleFonts.dancingScript(
                fontSize: subtitleFontSize,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF7A4300),
                height: 1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}