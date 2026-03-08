/// Wraps a Subsonic API failure with an optional server error code.
class SubsonicApiException implements Exception {
  /// Creates an exception for a failed Subsonic request.
  const SubsonicApiException(this.message, {this.code});

  /// Human-readable failure description.
  final String message;

  /// Optional error code returned by the server.
  final int? code;

  @override
  String toString() {
    if (code == null) {
      return 'SubsonicApiException($message)';
    }
    return 'SubsonicApiException(code: $code, message: $message)';
  }
}
