import 'dart:convert';

import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SharedPrefsServerProfileStore implements ServerProfileStore {
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
    final json = jsonDecode(payload);
    if (json is! Map<String, dynamic>) {
      return null;
    }
    return ServerProfile.fromJson(json);
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
