import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('normalizedBaseUrl trims slashes and /rest suffix', () {
    const profile = ServerProfile(
      baseUrl: 'https://music.example.com/rest///',
      username: 'demo',
      password: 'demo',
    );

    expect(profile.normalizedBaseUrl, 'https://music.example.com');
  });

  test('toJson and fromJson preserve values', () {
    const profile = ServerProfile(
      baseUrl: 'https://music.example.com',
      username: 'demo',
      password: 'secret',
    );

    final json = profile.toJson();
    final restored = ServerProfile.fromJson(json);

    expect(restored.baseUrl, profile.baseUrl);
    expect(restored.username, profile.username);
    expect(restored.password, profile.password);
  });
}
