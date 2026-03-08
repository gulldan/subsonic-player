import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/player/data/player_audio_engine.dart';
import 'package:flutter_sonicwave/features/player/domain/player_track.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';

enum PlayerRepeatMode { off, all, one }

class PlayerViewModel extends ChangeNotifier {
  PlayerViewModel({PlayerAudioEngine? audioEngine, Random? random})
    : _audioEngine = audioEngine ?? JustAudioPlayerAudioEngine(),
      _random = random ?? Random() {
    _positionSub = _audioEngine.positionStream.listen(_handlePositionUpdate);
    _durationSub = _audioEngine.durationStream.listen(_handleDurationUpdate);
    _playingSub = _audioEngine.playingStream.listen(_handlePlayingUpdate);
  }

  final PlayerAudioEngine _audioEngine;
  final Random _random;
  late final StreamSubscription<Duration> _positionSub;
  late final StreamSubscription<Duration?> _durationSub;
  late final StreamSubscription<bool> _playingSub;

  AppSession? _session;

  List<PlayerTrack> _queue = const [];
  List<PlayerTrack> get queue => _queue;

  int _currentIndex = -1;
  int get currentIndex => _currentIndex;

  PlayerTrack? _track;
  PlayerTrack? get track => _track;

  bool _loadingTrack = false;
  bool get loadingTrack => _loadingTrack;

  bool _isPlaying = false;
  bool get isPlaying => _isPlaying;

  bool _shuffleEnabled = false;
  bool get shuffleEnabled => _shuffleEnabled;

  PlayerRepeatMode _repeatMode = PlayerRepeatMode.off;
  PlayerRepeatMode get repeatMode => _repeatMode;

  Duration _position = Duration.zero;
  Duration get position => _position;

  int _secondaryTab = 1;
  int get secondaryTab => _secondaryTab;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  bool _scrobbledForCurrent = false;

  bool get isFavorite => _track?.isFavorite ?? false;
  int get rating => _track?.rating ?? 0;

  double get progress {
    final total = _track?.duration.inMilliseconds ?? 0;
    if (total <= 0) {
      return 0;
    }
    final bounded = _position.inMilliseconds.clamp(0, total);
    return bounded / total;
  }

  void attachSession(AppSession session) {
    if (identical(_session, session)) {
      return;
    }
    _session?.removeListener(_handleSessionChange);
    _session = session;
    _session?.addListener(_handleSessionChange);
    _handleSessionChange();
  }

  Future<void> loadFeaturedTrack() async {
    final client = _session?.client;
    if (client == null) {
      return;
    }

    _loadingTrack = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final songs = await client.getRandomSongs(size: 24);
      if (songs.isEmpty) {
        await _setQueue(const [_fallbackTrack], startIndex: 0, autoPlay: false);
      } else {
        await setQueueFromSubsonicSongs(songs, startIndex: 0, autoPlay: false);
      }
    } on Object catch (error) {
      _errorMessage = 'Could not load track from server: $error';
      await _setQueue(const [_fallbackTrack], startIndex: 0, autoPlay: false);
    } finally {
      _loadingTrack = false;
      notifyListeners();
    }
  }

  Future<void> setQueueFromSubsonicSongs(
    List<SubsonicSong> songs, {
    int startIndex = 0,
    bool autoPlay = false,
  }) async {
    final client = _session?.client;
    if (client == null) {
      return;
    }

    final tracks = songs
        .map((song) => _mapSongToTrack(song, client))
        .where((track) => track.streamUrl != null)
        .toList(growable: false);

    if (tracks.isEmpty) {
      _errorMessage = 'No playable tracks were returned by the server.';
      notifyListeners();
      return;
    }

    await _setQueue(tracks, startIndex: startIndex, autoPlay: autoPlay);
  }

  Future<void> togglePlayback() async {
    if (_track == null) {
      return;
    }

    try {
      if (_isPlaying) {
        await _audioEngine.pause();
      } else {
        await _audioEngine.play();
      }
    } on Object catch (error) {
      _errorMessage = 'Could not control playback: $error';
      notifyListeners();
    }
  }

  Future<void> skipNext() async {
    final nextIndex = _resolveNextIndex();
    if (nextIndex == null) {
      return;
    }

    await _playAt(nextIndex, autoPlay: true, seekToStart: true);
  }

  Future<void> skipPrevious() async {
    if (_track == null) {
      return;
    }

    if (_position > const Duration(seconds: 3)) {
      await _audioEngine.seek(Duration.zero);
      return;
    }

    final previousIndex = _resolvePreviousIndex();
    if (previousIndex == null) {
      await _audioEngine.seek(Duration.zero);
      return;
    }

    await _playAt(previousIndex, autoPlay: true, seekToStart: true);
  }

  void toggleShuffle() {
    _shuffleEnabled = !_shuffleEnabled;
    notifyListeners();
  }

  void cycleRepeatMode() {
    switch (_repeatMode) {
      case PlayerRepeatMode.off:
        _repeatMode = PlayerRepeatMode.all;
      case PlayerRepeatMode.all:
        _repeatMode = PlayerRepeatMode.one;
      case PlayerRepeatMode.one:
        _repeatMode = PlayerRepeatMode.off;
    }
    notifyListeners();
  }

  void seekToFraction(double value) {
    final trackDurationMs = _track?.duration.inMilliseconds ?? 0;
    if (trackDurationMs <= 0) {
      return;
    }
    final clamped = value.clamp(0.0, 1.0);
    _position = Duration(milliseconds: (trackDurationMs * clamped).round());
    notifyListeners();
    unawaited(_audioEngine.seek(_position));
  }

  void selectSecondaryTab(int index) {
    if (_secondaryTab == index) {
      return;
    }
    _secondaryTab = index;
    notifyListeners();
  }

  Future<void> toggleFavorite() async {
    final client = _session?.client;
    final current = _track;
    if (client == null || current == null) {
      return;
    }

    try {
      if (current.isFavorite) {
        await client.unstar(current.id);
      } else {
        await client.star(current.id);
      }

      _applyTrackUpdate(current.copyWith(isFavorite: !current.isFavorite));
    } on Object catch (error) {
      _errorMessage = 'Could not update favorite status: $error';
      notifyListeners();
    }
  }

  Future<void> markDisliked() {
    return setRating(1);
  }

  Future<void> setRating(int value) async {
    final client = _session?.client;
    final current = _track;
    if (client == null || current == null) {
      return;
    }

    try {
      await client.setRating(songId: current.id, rating: value);
      _applyTrackUpdate(current.copyWith(rating: value));
    } on Object catch (error) {
      _errorMessage = 'Could not set rating: $error';
      notifyListeners();
    }
  }

  Future<void> _setQueue(
    List<PlayerTrack> tracks, {
    required int startIndex,
    required bool autoPlay,
  }) async {
    _queue = tracks;
    final boundedStart = startIndex.clamp(0, tracks.length - 1);
    _currentIndex = boundedStart;
    _track = tracks[boundedStart];
    _position = Duration.zero;
    _scrobbledForCurrent = false;

    await _setAudioSource(_track!);

    if (autoPlay) {
      await _audioEngine.play();
    } else {
      await _audioEngine.pause();
    }

    notifyListeners();
  }

  Future<void> _playAt(
    int index, {
    required bool autoPlay,
    required bool seekToStart,
  }) async {
    if (index < 0 || index >= _queue.length) {
      return;
    }

    _currentIndex = index;
    _track = _queue[index];
    _position = Duration.zero;
    _scrobbledForCurrent = false;

    await _setAudioSource(_track!);

    if (seekToStart) {
      await _audioEngine.seek(Duration.zero);
    }

    if (autoPlay) {
      await _audioEngine.play();
    }

    notifyListeners();
  }

  int? _resolveNextIndex() {
    if (_queue.isEmpty || _currentIndex < 0) {
      return null;
    }

    if (_repeatMode == PlayerRepeatMode.one) {
      return _currentIndex;
    }

    if (_shuffleEnabled && _queue.length > 1) {
      int candidate = _currentIndex;
      while (candidate == _currentIndex) {
        candidate = _random.nextInt(_queue.length);
      }
      return candidate;
    }

    final next = _currentIndex + 1;
    if (next < _queue.length) {
      return next;
    }

    if (_repeatMode == PlayerRepeatMode.all) {
      return 0;
    }

    return null;
  }

  int? _resolvePreviousIndex() {
    if (_queue.isEmpty || _currentIndex < 0) {
      return null;
    }

    if (_shuffleEnabled && _queue.length > 1) {
      int candidate = _currentIndex;
      while (candidate == _currentIndex) {
        candidate = _random.nextInt(_queue.length);
      }
      return candidate;
    }

    final previous = _currentIndex - 1;
    if (previous >= 0) {
      return previous;
    }

    if (_repeatMode == PlayerRepeatMode.all) {
      return _queue.length - 1;
    }

    return null;
  }

  Future<void> _setAudioSource(PlayerTrack track) async {
    if (track.streamUrl == null) {
      return;
    }
    await _audioEngine.stop();
    await _audioEngine.setSource(track.streamUrl!);
  }

  void _handlePositionUpdate(Duration position) {
    _position = position;
    _maybeScrobble(position);
    notifyListeners();
  }

  void _handleDurationUpdate(Duration? duration) {
    if (duration == null || _track == null) {
      return;
    }
    _applyTrackUpdate(_track!.copyWith(duration: duration), notify: true);
  }

  void _handlePlayingUpdate(bool isPlaying) {
    if (_isPlaying == isPlaying) {
      return;
    }
    _isPlaying = isPlaying;
    notifyListeners();
  }

  void _handleSessionChange() {
    if (_session?.status == AppSessionStatus.authenticated) {
      unawaited(loadFeaturedTrack());
      return;
    }

    unawaited(_audioEngine.stop());
    _queue = const [];
    _currentIndex = -1;
    _track = null;
    _position = Duration.zero;
    _isPlaying = false;
    _errorMessage = null;
    _scrobbledForCurrent = false;
    notifyListeners();
  }

  void _maybeScrobble(Duration position) {
    final client = _session?.client;
    final current = _track;
    if (client == null || current == null || _scrobbledForCurrent) {
      return;
    }

    final totalMs = current.duration.inMilliseconds;
    if (totalMs <= 0) {
      return;
    }

    if (position.inMilliseconds >= totalMs ~/ 2) {
      _scrobbledForCurrent = true;
      unawaited(
        client.scrobble(
          current.id,
          submission: true,
          time: DateTime.now().millisecondsSinceEpoch,
        ),
      );
    }
  }

  void _applyTrackUpdate(PlayerTrack updated, {bool notify = true}) {
    _track = updated;
    if (_currentIndex >= 0 && _currentIndex < _queue.length) {
      final mutable = _queue.toList(growable: true);
      mutable[_currentIndex] = updated;
      _queue = mutable;
    }
    if (notify) {
      notifyListeners();
    }
  }

  PlayerTrack _mapSongToTrack(SubsonicSong song, SubsonicApi client) {
    return PlayerTrack(
      id: song.id,
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      coverArtUrl: song.coverArt == null
          ? null
          : client.getCoverArtUri(song.coverArt!, size: 900),
      streamUrl: client.getStreamUri(song.id),
      isFavorite: song.isStarred,
      rating: song.rating,
    );
  }

  static const PlayerTrack _fallbackTrack = PlayerTrack(
    id: 'fallback-track',
    title: 'No track loaded',
    artist: 'SonicWave',
    duration: Duration(minutes: 3),
  );

  @override
  void dispose() {
    _session?.removeListener(_handleSessionChange);
    unawaited(_positionSub.cancel());
    unawaited(_durationSub.cancel());
    unawaited(_playingSub.cancel());
    unawaited(_audioEngine.dispose());
    super.dispose();
  }
}
