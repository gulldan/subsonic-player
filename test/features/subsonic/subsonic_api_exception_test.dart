import 'package:flutter_sonicwave/features/subsonic/data/subsonic_api_exception.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('toString includes message and code when provided', () {
    const ex = SubsonicApiException('wrong credentials', code: 40);

    expect(
      ex.toString(),
      'SubsonicApiException(code: 40, message: wrong credentials)',
    );
  });

  test('toString includes message without code when absent', () {
    const ex = SubsonicApiException('network timeout');

    expect(ex.toString(), 'SubsonicApiException(network timeout)');
  });
}
