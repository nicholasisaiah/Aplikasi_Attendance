// FILE: lib/pages/main_page.dart

import 'package:flutter/material.dart';
import '../widgets/sidebar_widget.dart';
import '../widgets/top_bar_widget.dart';
import 'home/home_page.dart';
import 'attendance/attendance_page.dart';
import 'schedule/schedule_page.dart';
import 'account/account_page.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage>
    with SingleTickerProviderStateMixin {
  SidebarTab _activeTab = SidebarTab.home;
  late AnimationController _pageAnimController;
  late Animation<double> _pageFadeAnim;

  @override
  void initState() {
    super.initState();
    _pageAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _pageFadeAnim = CurvedAnimation(
      parent: _pageAnimController,
      curve: Curves.easeOut,
    );
    _pageAnimController.forward();
  }

  @override
  void dispose() {
    _pageAnimController.dispose();
    super.dispose();
  }

  void _onTabChanged(SidebarTab tab) {
    if (_activeTab == tab) return;
    _pageAnimController.reset();
    setState(() {
      _activeTab = tab;
    });
    _pageAnimController.forward();
  }

  Widget _buildPage() {
    switch (_activeTab) {
      case SidebarTab.home:
        return const HomePage();
      case SidebarTab.attendance:
        return const AttendancePage();
      case SidebarTab.schedule:
        return const SchedulePage();
      case SidebarTab.account:
        return const AccountPage();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Left sidebar
          SidebarWidget(
            activeTab: _activeTab,
            onTabChanged: _onTabChanged,
          ),
          // Main content
          Expanded(
            child: Column(
              children: [
                // Top bar
                TopBarWidget(
                  onMenuTap: () {
                    // Optional: show drawer or menu
                  },
                ),
                // Page content
                Expanded(
                  child: FadeTransition(
                    opacity: _pageFadeAnim,
                    child: _buildPage(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
