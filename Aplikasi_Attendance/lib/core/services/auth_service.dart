import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/user_model.dart';
import 'supabase_service.dart';

class AuthService {
  final SupabaseClient _client = SupabaseService.client;

  // Sign in with email and password
  Future<UserProfile> signInWithPassword(String email, String password) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      if (response.user == null) {
        throw Exception('Gagal melakukan autentikasi.');
      }
      
      // Fetch user profile
      return await getUserProfile(response.user!.id);
    } catch (e) {
      rethrow;
    }
  }

  // Get user profile by ID
  Future<UserProfile> getUserProfile(String userId) async {
    try {
      final data = await _client
          .from('profiles')
          .select('*, classes:classes!profiles_class_id_fkey(*)')
          .eq('id', userId)
          .single();
      
      return UserProfile.fromJson(data);
    } catch (e) {
      throw Exception('Gagal memuat profil pengguna: $e');
    }
  }

  // Check current session
  Future<UserProfile?> checkSession() async {
    final session = _client.auth.currentSession;
    if (session == null) {
      return null;
    }
    try {
      return await getUserProfile(session.user.id);
    } catch (_) {
      return null;
    }
  }

  // Sign out
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  // Update FCM token
  Future<void> updateFcmToken(String token) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    
    await _client
        .from('profiles')
        .update({'fcm_token': token})
        .eq('id', userId);
  }
}
