import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_api_exception.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_auth.dart';
import 'package:http/http.dart' as http;

/// Lightweight song model returned by the Subsonic API.
class SubsonicSong {
  /// Creates a song DTO.
  const SubsonicSong({
    required this.id,
    required this.title,
    required this.artist,
    required this.duration,
    this.coverArt,
    this.albumId,
    this.artistId,
    this.isStarred = false,
    this.rating = 0,
  });

  /// Creates a song DTO from a Subsonic JSON payload.
  factory SubsonicSong.fromJson(Map<String, dynamic> json) {
    final durationRaw = json['duration'];
    final seconds = durationRaw is int
        ? durationRaw
        : int.tryParse(durationRaw?.toString() ?? '') ?? 0;
    final ratingRaw = json['userRating'] ?? json['rating'];
    final rating = ratingRaw is int
        ? ratingRaw
        : int.tryParse(ratingRaw?.toString() ?? '') ?? 0;

    return SubsonicSong(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Unknown track',
      artist: json['artist'] as String? ?? 'Unknown artist',
      duration: Duration(seconds: seconds),
      coverArt: json['coverArt'] as String?,
      albumId: json['albumId'] as String?,
      artistId: json['artistId'] as String?,
      isStarred: json['starred'] != null,
      rating: rating,
    );
  }

  /// Song identifier.
  final String id;

  /// Display title.
  final String title;

  /// Display artist.
  final String artist;

  /// Track duration.
  final Duration duration;

  /// Cover art identifier.
  final String? coverArt;

  /// Album identifier.
  final String? albumId;

  /// Artist identifier.
  final String? artistId;

  /// Whether the user starred the song.
  final bool isStarred;

  /// User rating in the 0..5 range.
  final int rating;
}

/// Lightweight album model returned by the Subsonic API.
class SubsonicAlbum {
  /// Creates an album DTO.
  const SubsonicAlbum({
    required this.id,
    required this.name,
    required this.artist,
    required this.songCount,
    this.coverArtId,
  });

  /// Creates an album DTO from a Subsonic JSON payload.
  factory SubsonicAlbum.fromJson(Map<String, dynamic> json) {
    final countRaw = json['songCount'];
    final count = countRaw is int
        ? countRaw
        : int.tryParse(countRaw?.toString() ?? '') ?? 0;

    return SubsonicAlbum(
      id: json['id'] as String? ?? '',
      name:
          json['name'] as String? ??
          json['title'] as String? ??
          'Unknown album',
      artist: json['artist'] as String? ?? 'Unknown artist',
      songCount: count,
      coverArtId: json['coverArt'] as String?,
    );
  }

  /// Album identifier.
  final String id;

  /// Album title.
  final String name;

  /// Album artist.
  final String artist;

  /// Number of tracks in the album.
  final int songCount;

  /// Cover art identifier.
  final String? coverArtId;
}

/// Lightweight playlist model returned by the Subsonic API.
class SubsonicPlaylist {
  /// Creates a playlist DTO.
  const SubsonicPlaylist({
    required this.id,
    required this.name,
    required this.songCount,
    required this.duration,
    this.owner,
    this.coverArtId,
  });

  /// Creates a playlist DTO from a Subsonic JSON payload.
  factory SubsonicPlaylist.fromJson(Map<String, dynamic> json) {
    final countRaw = json['songCount'];
    final durationRaw = json['duration'];

    final songCount = countRaw is int
        ? countRaw
        : int.tryParse(countRaw?.toString() ?? '') ?? 0;
    final durationSeconds = durationRaw is int
        ? durationRaw
        : int.tryParse(durationRaw?.toString() ?? '') ?? 0;

    return SubsonicPlaylist(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unnamed playlist',
      songCount: songCount,
      duration: Duration(seconds: durationSeconds),
      owner: json['owner'] as String?,
      coverArtId: json['coverArt'] as String?,
    );
  }

  /// Playlist identifier.
  final String id;

  /// Playlist name.
  final String name;

  /// Number of songs in the playlist.
  final int songCount;

  /// Total playlist duration.
  final Duration duration;

  /// Playlist owner, if provided by the server.
  final String? owner;

  /// Cover art identifier.
  final String? coverArtId;
}

/// Contract used by the app to communicate with a Subsonic server.
abstract class SubsonicApi {
  /// Calls a raw Subsonic endpoint and returns the decoded root payload.
  Future<Map<String, dynamic>> call(
    String endpoint, {
    Map<String, Object?> params,
    bool includeAuth,
    bool includeFormat,
  });

  /// Verifies that the server is reachable and credentials are valid.
  Future<bool> ping();

  /// Returns a random song selection.
  Future<List<SubsonicSong>> getRandomSongs({int size});

  /// Returns albums from the requested album list category.
  Future<List<SubsonicAlbum>> getAlbumList2({
    String type,
    int size,
    int offset,
    String? musicFolderId,
  });

  /// Returns playlists visible to the current user.
  Future<List<SubsonicPlaylist>> getPlaylists({String? username});

  /// Returns songs from a playlist.
  Future<List<SubsonicSong>> getPlaylistSongs(String playlistId);

  /// Returns songs for an album.
  Future<List<SubsonicSong>> getAlbumSongs(String albumId);

  /// Searches songs matching the given query.
  Future<List<SubsonicSong>> searchSongs(String query, {int count});

  /// Stars a song for the current user.
  Future<void> star(String songId);

  /// Removes the star from a song for the current user.
  Future<void> unstar(String songId);

  /// Sets the user rating for a song.
  Future<void> setRating({required String songId, required int rating});

  /// Sends a scrobble event for a song.
  Future<void> scrobble(String songId, {bool submission, int? time});

  /// Builds the cover-art URL for the given identifier.
  Uri getCoverArtUri(String coverArtId, {int? size});

  /// Builds the stream URL for the given song identifier.
  Uri getStreamUri(String songId, {Map<String, Object?> params});

  /// Closes any owned resources.
  void close();
}

/// Creates a configured [SubsonicApi] for the given authenticated profile.
typedef SubsonicClientFactory = SubsonicApi Function(ServerProfile profile);

/// HTTP implementation of [SubsonicApi].
class SubsonicClient implements SubsonicApi {
  /// Creates an HTTP Subsonic client for [ServerProfile].
  SubsonicClient(
    this._profile, {
    http.Client? httpClient,
    Random? random,
    String clientName = 'SonicWaveFlutter',
    String apiVersion = '1.16.1',
    Duration requestTimeout = const Duration(seconds: 12),
  }) : _httpClient = httpClient ?? http.Client(),
       _clientName = clientName,
       _apiVersion = apiVersion,
       _salt = generateSalt(random: random),
       _requestTimeout = requestTimeout,
       _ownsHttpClient = httpClient == null {
    _token = buildToken(password: _profile.password, salt: _salt);
  }

  final ServerProfile _profile;
  final http.Client _httpClient;
  final String _clientName;
  final String _apiVersion;
  final String _salt;
  final Duration _requestTimeout;
  final bool _ownsHttpClient;
  late final String _token;

  String get _serverUrl => _profile.normalizedBaseUrl;

  @override
  Future<Map<String, dynamic>> call(
    String endpoint, {
    Map<String, Object?> params = const {},
    bool includeAuth = true,
    bool includeFormat = true,
  }) async {
    final uri = _buildUri(
      endpoint,
      params: params,
      includeAuth: includeAuth,
      includeFormat: includeFormat,
    );

    late final http.Response response;
    try {
      response = await _httpClient.get(uri).timeout(_requestTimeout);
    } on TimeoutException {
      throw SubsonicApiException(
        'Request timed out after ${_requestTimeout.inSeconds}s while '
        'calling $endpoint',
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw SubsonicApiException(
        'HTTP ${response.statusCode}: '
        "${response.reasonPhrase ?? 'Request failed'}",
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const SubsonicApiException(
        'Malformed Subsonic response: root payload is not an object',
      );
    }

    final root = decoded['subsonic-response'];
    if (root is! Map<String, dynamic>) {
      throw const SubsonicApiException(
        'Malformed Subsonic response: missing subsonic-response',
      );
    }

    if (root['status'] == 'failed') {
      final error = root['error'];
      if (error is Map<String, dynamic>) {
        final codeRaw = error['code'];
        throw SubsonicApiException(
          error['message'] as String? ?? 'Unknown Subsonic error',
          code: codeRaw is int
              ? codeRaw
              : int.tryParse(codeRaw?.toString() ?? ''),
        );
      }
      throw const SubsonicApiException('Unknown Subsonic error');
    }

    return root;
  }

  @override
  Future<bool> ping() async {
    try {
      await call('ping');
      return true;
    } on Object {
      return false;
    }
  }

  @override
  Future<List<SubsonicSong>> getRandomSongs({int size = 20}) async {
    final root = await call('getRandomSongs', params: {'size': size});
    final songs = _extractObjectList(
      root,
      containerKey: 'randomSongs',
      itemKey: 'song',
    );
    return songs.map(SubsonicSong.fromJson).toList(growable: false);
  }

  @override
  Future<List<SubsonicAlbum>> getAlbumList2({
    String type = 'newest',
    int size = 40,
    int offset = 0,
    String? musicFolderId,
  }) async {
    final root = await call(
      'getAlbumList2',
      params: {
        'type': type,
        'size': size,
        'offset': offset,
        'musicFolderId': musicFolderId,
      },
    );
    final albums = _extractObjectList(
      root,
      containerKey: 'albumList2',
      itemKey: 'album',
    );
    return albums.map(SubsonicAlbum.fromJson).toList(growable: false);
  }

  @override
  Future<List<SubsonicPlaylist>> getPlaylists({String? username}) async {
    final root = await call('getPlaylists', params: {'username': username});
    final playlists = _extractObjectList(
      root,
      containerKey: 'playlists',
      itemKey: 'playlist',
    );
    return playlists.map(SubsonicPlaylist.fromJson).toList(growable: false);
  }

  @override
  Future<List<SubsonicSong>> getPlaylistSongs(String playlistId) async {
    final root = await call('getPlaylist', params: {'id': playlistId});
    final songs = _extractObjectList(
      root,
      containerKey: 'playlist',
      itemKey: 'entry',
    );
    return songs.map(SubsonicSong.fromJson).toList(growable: false);
  }

  @override
  Future<List<SubsonicSong>> getAlbumSongs(String albumId) async {
    final root = await call('getAlbum', params: {'id': albumId});
    final songs = _extractObjectList(
      root,
      containerKey: 'album',
      itemKey: 'song',
    );
    return songs.map(SubsonicSong.fromJson).toList(growable: false);
  }

  @override
  Future<List<SubsonicSong>> searchSongs(String query, {int count = 60}) async {
    final root = await call(
      'search3',
      params: {
        'query': query,
        'artistCount': 0,
        'albumCount': 0,
        'songCount': count,
      },
    );
    final songs = _extractObjectList(
      root,
      containerKey: 'searchResult3',
      itemKey: 'song',
    );
    return songs.map(SubsonicSong.fromJson).toList(growable: false);
  }

  @override
  Future<void> star(String songId) {
    return call('star', params: {'id': songId});
  }

  @override
  Future<void> unstar(String songId) {
    return call('unstar', params: {'id': songId});
  }

  @override
  Future<void> setRating({required String songId, required int rating}) {
    if (rating < 0 || rating > 5) {
      throw const SubsonicApiException('Rating must be within 0..5 range');
    }
    return call('setRating', params: {'id': songId, 'rating': rating});
  }

  @override
  Future<void> scrobble(String songId, {bool submission = true, int? time}) {
    return call(
      'scrobble',
      params: {'id': songId, 'submission': submission, 'time': time},
    );
  }

  @override
  Uri getCoverArtUri(String coverArtId, {int? size}) {
    final params = <String, Object?>{'id': coverArtId};
    if (size != null) {
      params['size'] = size;
    }
    return _buildUri('getCoverArt', params: params, includeFormat: false);
  }

  @override
  Uri getStreamUri(String songId, {Map<String, Object?> params = const {}}) {
    return _buildUri(
      'stream',
      params: {'id': songId, ...params},
      includeFormat: false,
    );
  }

  @override
  void close() {
    if (_ownsHttpClient) {
      _httpClient.close();
    }
  }

  Uri _buildUri(
    String endpoint, {
    Map<String, Object?> params = const {},
    bool includeAuth = true,
    bool includeFormat = true,
  }) {
    final normalizedEndpoint = endpoint.contains('.')
        ? endpoint
        : '$endpoint.view';

    final allParams = <String, Object?>{
      if (includeAuth) ..._authParams(),
      if (includeFormat) 'f': 'json',
      ...params,
    };

    final queryParts = <String>[];

    for (final entry in allParams.entries) {
      final value = entry.value;
      if (value == null) {
        continue;
      }

      if (value is List) {
        for (final item in value) {
          queryParts.add(
            '${Uri.encodeQueryComponent(entry.key)}='
            '${Uri.encodeQueryComponent(item.toString())}',
          );
        }
        continue;
      }

      queryParts.add(
        '${Uri.encodeQueryComponent(entry.key)}='
        '${Uri.encodeQueryComponent(value.toString())}',
      );
    }

    final query = queryParts.isEmpty ? '' : '?${queryParts.join('&')}';
    return Uri.parse('$_serverUrl/rest/$normalizedEndpoint$query');
  }

  List<Map<String, dynamic>> _extractObjectList(
    Map<String, dynamic> root, {
    required String containerKey,
    required String itemKey,
  }) {
    final container = root[containerKey];
    if (container is! Map<String, dynamic>) {
      return const [];
    }

    final dynamic raw = container[itemKey];
    if (raw == null) {
      return const [];
    }
    if (raw is Map<String, dynamic>) {
      return [raw];
    }
    if (raw is List) {
      return raw.whereType<Map<String, dynamic>>().toList(growable: false);
    }
    return const [];
  }

  Map<String, String> _authParams() {
    return {
      'u': _profile.username,
      't': _token,
      's': _salt,
      'v': _apiVersion,
      'c': _clientName,
    };
  }
}
