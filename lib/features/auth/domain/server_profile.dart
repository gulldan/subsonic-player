/// Connection settings required to authenticate with a Subsonic server.
class ServerProfile {
  /// Creates a server profile.
  const ServerProfile({
    required this.baseUrl,
    required this.username,
    required this.password,
  });

  /// Creates a profile from a serialized JSON payload.
  factory ServerProfile.fromJson(Map<String, dynamic> json) {
    return ServerProfile(
      baseUrl: json['baseUrl'] as String? ?? '',
      username: json['username'] as String? ?? '',
      password: json['password'] as String? ?? '',
    );
  }

  /// Raw server URL entered by the user.
  final String baseUrl;

  /// Login name used for authentication.
  final String username;

  /// Password used for authentication.
  final String password;

  /// Normalized server URL without trailing slashes or `/rest`.
  String get normalizedBaseUrl {
    final trimmed = baseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    return trimmed.replaceFirst(RegExp(r'/rest$', caseSensitive: false), '');
  }

  /// Serializes the profile to JSON.
  Map<String, dynamic> toJson() {
    return {'baseUrl': baseUrl, 'username': username, 'password': password};
  }
}
