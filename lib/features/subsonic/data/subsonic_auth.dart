import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';

/// Generates a random salt compatible with the Subsonic token flow.
String generateSalt({Random? random, int length = 10}) {
  final source = random ?? Random.secure();
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  final chars = List<String>.generate(
    length,
    (_) => alphabet[source.nextInt(alphabet.length)],
  );
  return chars.join();
}

/// Builds the Subsonic authentication token from a password and salt.
String buildToken({required String password, required String salt}) {
  final bytes = utf8.encode('$password$salt');
  return md5.convert(bytes).toString();
}
