import 'dart:convert';

import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Stores the current server profile in `SharedPreferences`.
class SharedPrefsServerProfileStore implements ServerProfileStore {
  /// Creates a preferences-backed profile store.
  SharedPrefsServerProfileStore({
    Future<SharedPreferences> Function()? prefsFactory,
  }) : _prefsFactory = prefsFactory ?? SharedPreferences.getInstance;

  static const String _storageKey = 'subsonic_server_profile';

  final Future<SharedPreferences> Function() _prefsFactory;

  @override
  Future<ServerProfile?> read() async {
    final prefs = await _prefsFactory();
    final payload = prefs.getString(_storageKey);
    if (payload == null || payload.isEmpty) {
      return null;
    }

    try {
      final json = jsonDecode(payload);
      if (json is! Map) {
        await prefs.remove(_storageKey);
        return null;
      }
      return ServerProfile.fromJson(Map<String, dynamic>.from(json));
    } on Object {
      await prefs.remove(_storageKey);
      return null;
    }
  }

  @override
  Future<void> write(ServerProfile profile) async {
    final prefs = await _prefsFactory();
    await prefs.setString(_storageKey, jsonEncode(profile.toJson()));
  }

  @override
  Future<void> clear() async {
    final prefs = await _prefsFactory();
    await prefs.remove(_storageKey);
  }
}
