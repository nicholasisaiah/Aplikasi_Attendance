// FILE: lib/widgets/top_bar_widget.dart

import 'package:flutter/material.dart';

class TopBarWidget extends StatelessWidget {
  final VoidCallback? onMenuTap;

  const TopBarWidget({
    super.key,
    this.onMenuTap,
  });

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Container(
      padding: EdgeInsets.only(
        top: topPadding + 12,
        left: 24,
        right: 24,
        bottom: 16,
      ),

      child: Row(
        children: [
          // BIG LEFT LOGO
          Image.asset(
            'assets/images/SMK Asisi.png',
            width: 180,
            fit: BoxFit.contain,
          ),
        ],
      ),
    );
  }
}