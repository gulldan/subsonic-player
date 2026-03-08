class ServerProfile {
  const ServerProfile({
    required this.baseUrl,
    required this.username,
    required this.password,
  });

  final String baseUrl;
  final String username;
  final String password;

  String get normalizedBaseUrl {
    final trimmed = baseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    return trimmed.replaceFirst(RegExp(r'/rest$', caseSensitive: false), '');
  }

  Map<String, dynamic> toJson() {
    return {'baseUrl': baseUrl, 'username': username, 'password': password};
  }

  static ServerProfile fromJson(Map<String, dynamic> json) {
    return ServerProfile(
      baseUrl: json['baseUrl'] as String? ?? '',
      username: json['username'] as String? ?? '',
      password: json['password'] as String? ?? '',
    );
  }
}
