// FILE: lib/widgets/sidebar_widget.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme/app_colors.dart';

enum SidebarTab {
  home,
  attendance,
  schedule,
  account,
}

class SidebarWidget extends StatefulWidget {
  final SidebarTab activeTab;
  final ValueChanged<SidebarTab> onTabChanged;

  const SidebarWidget({
    super.key,
    required this.activeTab,
    required this.onTabChanged,
  });

  @override
  State<SidebarWidget> createState() => _SidebarWidgetState();
}

class _SidebarWidgetState extends State<SidebarWidget>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;
  late AnimationController _animController;
  late Animation<double> _widthAnim;

  static const double _collapsedWidth = 56;
  static const double _expandedWidth = 180;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _widthAnim = Tween<double>(begin: _collapsedWidth, end: _expandedWidth)
        .animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _toggleSidebar() {
    setState(() {
      _isExpanded = !_isExpanded;
    });
    if (_isExpanded) {
      _animController.forward();
    } else {
      _animController.reverse();
    }
  }

  String _labelForTab(SidebarTab tab) {
    switch (tab) {
      case SidebarTab.home:
        return 'Beranda';
      case SidebarTab.attendance:
        return 'Absensi';
      case SidebarTab.schedule:
        return 'Jadwal';
      case SidebarTab.account:
        return 'Profil';
    }
  }

  IconData _iconForTab(SidebarTab tab) {
    switch (tab) {
      case SidebarTab.home:
        return Icons.home_rounded;
      case SidebarTab.attendance:
        return Icons.check_circle_outline_rounded;
      case SidebarTab.schedule:
        return Icons.calendar_month_rounded;
      case SidebarTab.account:
        return Icons.person_outline_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _widthAnim,
      builder: (context, child) {
        return Container(
          width: _widthAnim.value,
          color: AppColors.sidebar,
          child: SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 14),
                // Hamburger toggle button
                GestureDetector(
                  onTap: _toggleSidebar,
                  child: AnimatedRotation(
                    turns: _isExpanded ? 0.25 : 0,
                    duration: const Duration(milliseconds: 250),
                    child: const Icon(
                      Icons.menu_rounded,
                      color: AppColors.textDark,
                      size: 26,
                    ),
                  ),
                ),
                const SizedBox(height: 40),
                // Navigation items
                ...SidebarTab.values.map((tab) {
                  final isActive = widget.activeTab == tab;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: _SidebarMenuItem(
                      isActive: isActive,
                      isExpanded: _isExpanded,
                      label: _labelForTab(tab),
                      icon: _iconForTab(tab),
                      animValue: _animController.value,
                      onTap: () => widget.onTabChanged(tab),
                    ),
                  );
                }),
                const Spacer(),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SidebarMenuItem extends StatelessWidget {
  final bool isActive;
  final bool isExpanded;
  final String label;
  final IconData icon;
  final double animValue;
  final VoidCallback onTap;

  const _SidebarMenuItem({
    required this.isActive,
    required this.isExpanded,
    required this.label,
    required this.icon,
    required this.animValue,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // When collapsed: show dot only. When expanded: show icon + label row.
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(horizontal: 10),
        padding: EdgeInsets.symmetric(
          vertical: 10,
          horizontal: animValue > 0.3 ? 12 : 0,
        ),
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.primaryBrown.withValues(alpha: 0.15)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: animValue > 0.3
            // Expanded: icon + label
            ? Row(
                children: [
                  Icon(
                    icon,
                    color: isActive ? AppColors.primaryBrown : AppColors.textGray,
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Opacity(
                      opacity: animValue.clamp(0.0, 1.0),
                      child: Text(
                        label,
                        style: GoogleFonts.nunito(
                          fontSize: 14,
                          fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
                          color: isActive
                              ? AppColors.primaryBrown
                              : AppColors.textDark,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
              )
            // Collapsed: dot only
            : Center(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.primaryBrown : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isActive
                          ? AppColors.primaryBrown
                          : const Color(0xFFD4C9B0),
                      width: 1.5,
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}
