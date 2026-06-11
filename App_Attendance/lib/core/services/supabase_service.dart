import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  // TODO: Replace with your actual Supabase URL and Anon Key
  static const String supabaseUrl = 'https://coplcrymjcofwohudpzp.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcGxjcnltamNvZndvaHVkcHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODg5MzksImV4cCI6MjA5NDg2NDkzOX0.n74RzFCC_qyDHuQZE1qNCqXRUyiHCrlOgwMpz5dYxgM';

  static Future<void> initialize() async {
    // If the user hasn't replaced the placeholders, we won't crash the app immediately on startup, 
    // but we will print a warning.
    if (supabaseUrl == 'YOUR_SUPABASE_URL' || supabaseAnonKey == 'YOUR_SUPABASE_ANON_KEY') {
      debugPrint('WARNING: Please configure your Supabase URL and Anon Key in lib/core/services/supabase_service.dart');
      return;
    }
    
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
