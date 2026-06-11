import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/supabase_service.dart';

class SchoolSettings {
  final String schoolName;
  final String adminName;
  final String adminWaNumber;

  SchoolSettings({
    required this.schoolName,
    required this.adminName,
    required this.adminWaNumber,
  });

  factory SchoolSettings.fromJson(Map<String, dynamic> json) {
    return SchoolSettings(
      schoolName: json['school_name'] ?? 'SMK Asisi',
      adminName: json['admin_name'] ?? 'Tata Usaha',
      adminWaNumber: json['admin_wa_number'] ?? '',
    );
  }
}

final settingsProvider = FutureProvider<SchoolSettings>((ref) async {
  final client = SupabaseService.client;
  final data = await client.from('school_settings').select('*').limit(1).single();
  return SchoolSettings.fromJson(data);
});
