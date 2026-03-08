import 'dart:async';

import 'package:just_audio/just_audio.dart';

/// Abstraction over audio playback to keep the player view model testable.
abstract class PlayerAudioEngine {
  /// Emits the current playback position.
  Stream<Duration> get positionStream;

  /// Emits the known track duration when available.
  Stream<Duration?> get durationStream;

  /// Emits whether playback is currently active.
  Stream<bool> get playingStream;

  /// Sets the current track source.
  Future<void> setSource(Uri source);

  /// Starts playback.
  Future<void> play();

  /// Pauses playback.
  Future<void> pause();

  /// Seeks to a specific position in the current track.
  Future<void> seek(Duration position);

  /// Stops playback.
  Future<void> stop();

  /// Releases any owned resources.
  Future<void> dispose();
}

/// Production audio engine backed by `just_audio`.
class JustAudioPlayerAudioEngine implements PlayerAudioEngine {
  /// Creates a `just_audio`-backed engine.
  JustAudioPlayerAudioEngine({AudioPlayer? player})
    : _player = player ?? AudioPlayer();

  final AudioPlayer _player;

  @override
  Stream<Duration> get positionStream => _player.positionStream;

  @override
  Stream<Duration?> get durationStream => _player.durationStream;

  @override
  Stream<bool> get playingStream =>
      _player.playerStateStream.map((state) => state.playing).distinct();

  @override
  Future<void> setSource(Uri source) async {
    await _player.setAudioSource(AudioSource.uri(source));
  }

  @override
  Future<void> pause() {
    return _player.pause();
  }

  @override
  Future<void> play() {
    return _player.play();
  }

  @override
  Future<void> seek(Duration position) {
    return _player.seek(position);
  }

  @override
  Future<void> stop() {
    return _player.stop();
  }

  @override
  Future<void> dispose() {
    return _player.dispose();
  }
}

/// No-op audio engine used by tests and unsupported environments.
class NoopPlayerAudioEngine implements PlayerAudioEngine {
  /// Creates a no-op engine.
  const NoopPlayerAudioEngine();

  @override
  Stream<Duration?> get durationStream => const Stream.empty();

  @override
  Stream<bool> get playingStream => const Stream.empty();

  @override
  Stream<Duration> get positionStream => const Stream.empty();

  @override
  Future<void> dispose() async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> play() async {}

  @override
  Future<void> seek(Duration position) async {}

  @override
  Future<void> setSource(Uri source) async {}

  @override
  Future<void> stop() async {}
}
