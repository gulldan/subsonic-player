import 'dart:math';

import 'package:flutter_sonicwave/features/subsonic/data/subsonic_auth.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('generateSalt returns expected length and charset', () {
    final salt = generateSalt(random: Random(1), length: 12);

    expect(salt.length, 12);
    expect(RegExp(r'^[a-z0-9]{12}$').hasMatch(salt), isTrue);
  });

  test('buildToken computes MD5 hash for password+salt', () {
    final token = buildToken(password: 'secret', salt: 'abc123');

    expect(token, 'f22ae4f5eacb35c993e910606a413410');
  });
}
