import 'package:flutter_sonicwave/features/auth/data/shared_prefs_server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('writes and reads profile from preferences', () async {
    final store = SharedPrefsServerProfileStore();
    const profile = ServerProfile(
      baseUrl: 'https://music.example.com',
      username: 'alice',
      password: 'secret',
    );

    await store.write(profile);
    final loaded = await store.read();

    expect(loaded, isNotNull);
    expect(loaded?.baseUrl, 'https://music.example.com');
    expect(loaded?.username, 'alice');
    expect(loaded?.password, 'secret');
  });

  test('read returns null for missing payload', () async {
    final store = SharedPrefsServerProfileStore();

    final loaded = await store.read();

    expect(loaded, isNull);
  });

  test('read clears corrupted payload instead of throwing', () async {
    SharedPreferences.setMockInitialValues({
      'subsonic_server_profile': '{invalid-json',
    });
    final store = SharedPrefsServerProfileStore();

    final loaded = await store.read();
    final prefs = await SharedPreferences.getInstance();

    expect(loaded, isNull);
    expect(prefs.containsKey('subsonic_server_profile'), isFalse);
  });

  test('clear removes saved profile', () async {
    final store = SharedPrefsServerProfileStore();
    const profile = ServerProfile(
      baseUrl: 'https://music.example.com',
      username: 'alice',
      password: 'secret',
    );

    await store.write(profile);
    await store.clear();

    final loaded = await store.read();
    expect(loaded, isNull);
  });
}
