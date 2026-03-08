class SubsonicApiException implements Exception {
  const SubsonicApiException(this.message, {this.code});

  final String message;
  final int? code;

  @override
  String toString() {
    if (code == null) {
      return 'SubsonicApiException($message)';
    }
    return 'SubsonicApiException(code: $code, message: $message)';
  }
}
