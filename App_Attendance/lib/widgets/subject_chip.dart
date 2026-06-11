// FILE: lib/widgets/subject_chip.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SubjectChip extends StatelessWidget {
  final String label;
  final Color color;
  final double fontSize;

  const SubjectChip({
    super.key,
    required this.label,
    required this.color,
    this.fontSize = 11,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        label,
        style: GoogleFonts.nunito(
          fontSize: fontSize,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}
