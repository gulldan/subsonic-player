import 'dart:async';

import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/player/data/player_audio_engine.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';

class InMemoryServerProfileStore implements ServerProfileStore {
  ServerProfile? profile;

  @override
  Future<void> clear() async {
    profile = null;
  }

  @override
  Future<ServerProfile?> read() async {
    return profile;
  }

  @override
  Future<void> write(ServerProfile profile) async {
    this.profile = profile;
  }
}

class FakeSubsonicApi implements SubsonicApi {
  FakeSubsonicApi({
    this.pingResult = true,
    this.randomSongs = const [],
    this.albums = const [],
    this.playlists = const [],
    this.playlistSongsById = const {},
    this.albumSongsById = const {},
    this.searchSongsResults = const [],
    this.callResponse = const {'status': 'ok', 'version': '1.16.1'},
    this.callError,
  });

  bool pingResult;
  List<SubsonicSong> randomSongs;
  List<SubsonicAlbum> albums;
  List<SubsonicPlaylist> playlists;
  Map<String, List<SubsonicSong>> playlistSongsById;
  Map<String, List<SubsonicSong>> albumSongsById;
  List<SubsonicSong> searchSongsResults;
  Map<String, dynamic> callResponse;
  Object? callError;
  int callCount = 0;
  int pingCount = 0;
  int starCount = 0;
  int unstarCount = 0;
  int ratingCount = 0;
  int scrobbleCount = 0;
  String? lastStarSongId;
  String? lastUnstarSongId;
  String? lastRatedSongId;
  int? lastRating;
  bool closed = false;

  @override
  Future<Map<String, dynamic>> call(
    String endpoint, {
    Map<String, Object?> params = const {},
    bool includeAuth = true,
    bool includeFormat = true,
  }) async {
    callCount += 1;
    if (callError != null) {
      throw callError!;
    }
    return callResponse;
  }

  @override
  void close() {
    closed = true;
  }

  @override
  Uri getCoverArtUri(String coverArtId, {int? size}) {
    final query = <String, String>{'id': coverArtId};
    if (size != null) {
      query['size'] = '$size';
    }
    return Uri.parse(
      'https://example.test/rest/getCoverArt.view',
    ).replace(queryParameters: query);
  }

  @override
  Future<List<SubsonicSong>> getRandomSongs({int size = 1}) async {
    return randomSongs;
  }

  @override
  Future<List<SubsonicAlbum>> getAlbumList2({
    String type = 'newest',
    int size = 40,
    int offset = 0,
    String? musicFolderId,
  }) async {
    return albums;
  }

  @override
  Future<List<SubsonicPlaylist>> getPlaylists({String? username}) async {
    return playlists;
  }

  @override
  Future<List<SubsonicSong>> getPlaylistSongs(String playlistId) async {
    return playlistSongsById[playlistId] ?? const [];
  }

  @override
  Future<List<SubsonicSong>> getAlbumSongs(String albumId) async {
    return albumSongsById[albumId] ?? const [];
  }

  @override
  Future<List<SubsonicSong>> searchSongs(String query, {int count = 60}) async {
    return searchSongsResults;
  }

  @override
  Future<void> star(String songId) async {
    starCount += 1;
    lastStarSongId = songId;
  }

  @override
  Future<void> unstar(String songId) async {
    unstarCount += 1;
    lastUnstarSongId = songId;
  }

  @override
  Future<void> setRating({required String songId, required int rating}) async {
    ratingCount += 1;
    lastRatedSongId = songId;
    lastRating = rating;
  }

  @override
  Future<void> scrobble(
    String songId, {
    bool submission = true,
    int? time,
  }) async {
    scrobbleCount += 1;
  }

  @override
  Uri getStreamUri(String songId, {Map<String, Object?> params = const {}}) {
    final query = {
      'id': songId,
      ...params.map((key, value) => MapEntry(key, '$value')),
    };
    return Uri.parse(
      'https://example.test/rest/stream.view',
    ).replace(queryParameters: query);
  }

  @override
  Future<bool> ping() async {
    pingCount += 1;
    return pingResult;
  }
}

class FakePlayerAudioEngine implements PlayerAudioEngine {
  final StreamController<Duration> _positionController =
      StreamController<Duration>.broadcast();
  final StreamController<Duration?> _durationController =
      StreamController<Duration?>.broadcast();
  final StreamController<bool> _playingController =
      StreamController<bool>.broadcast();

  Uri? source;
  Duration? lastSeekPosition;
  bool isPlaying = false;
  bool stopped = false;
  bool disposed = false;

  @override
  Stream<Duration?> get durationStream => _durationController.stream;

  @override
  Stream<bool> get playingStream => _playingController.stream;

  @override
  Stream<Duration> get positionStream => _positionController.stream;

  @override
  Future<void> dispose() async {
    disposed = true;
    await _positionController.close();
    await _durationController.close();
    await _playingController.close();
  }

  @override
  Future<void> pause() async {
    isPlaying = false;
    _playingController.add(false);
  }

  @override
  Future<void> play() async {
    isPlaying = true;
    _playingController.add(true);
  }

  @override
  Future<void> seek(Duration position) async {
    lastSeekPosition = position;
    _positionController.add(position);
  }

  @override
  Future<void> setSource(Uri source) async {
    this.source = source;
  }

  @override
  Future<void> stop() async {
    stopped = true;
    isPlaying = false;
    _playingController.add(false);
    _positionController.add(Duration.zero);
  }

  void emitDuration(Duration duration) {
    _durationController.add(duration);
  }

  void emitPosition(Duration position) {
    _positionController.add(position);
  }

  void emitPlaying(bool playing) {
    isPlaying = playing;
    _playingController.add(playing);
  }
}
