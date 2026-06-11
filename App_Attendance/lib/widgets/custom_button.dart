// FILE: lib/widgets/custom_button.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme/app_colors.dart';

class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final Color textColor;
  final double borderRadius;
  final double verticalPadding;
  final double fontSize;
  final double? width;
  final bool isFullWidth;

  const CustomButton({
    super.key,
    required this.label,
    this.onPressed,
    this.backgroundColor = AppColors.primaryBrown,
    this.textColor = AppColors.white,
    this.borderRadius = 12,
    this.verticalPadding = 14,
    this.fontSize = 15,
    this.width,
    this.isFullWidth = true,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: isFullWidth ? double.infinity : width,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: textColor,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          padding: EdgeInsets.symmetric(vertical: verticalPadding),
        ),
        child: Text(
          label,
          style: GoogleFonts.nunito(
            fontSize: fontSize,
            fontWeight: FontWeight.w700,
            color: textColor,
          ),
        ),
      ),
    );
  }
}

class WhatsAppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final double borderRadius;

  const WhatsAppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.borderRadius = 20,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accentGreen,
        foregroundColor: AppColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      child: Text(
        label,
        style: GoogleFonts.nunito(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.white,
        ),
      ),
    );
  }
}
