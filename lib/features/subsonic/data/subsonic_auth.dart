import 'dart:math';
import 'dart:convert';

import 'package:crypto/crypto.dart';

String generateSalt({Random? random, int length = 10}) {
  final source = random ?? Random.secure();
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  final chars = List<String>.generate(
    length,
    (_) => alphabet[source.nextInt(alphabet.length)],
  );
  return chars.join();
}

String buildToken({required String password, required String salt}) {
  final bytes = utf8.encode('$password$salt');
  return md5.convert(bytes).toString();
}
