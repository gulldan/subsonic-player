import 'dart:async';

import 'package:just_audio/just_audio.dart';

abstract class PlayerAudioEngine {
  Stream<Duration> get positionStream;
  Stream<Duration?> get durationStream;
  Stream<bool> get playingStream;

  Future<void> setSource(Uri source);
  Future<void> play();
  Future<void> pause();
  Future<void> seek(Duration position);
  Future<void> stop();
  Future<void> dispose();
}

class JustAudioPlayerAudioEngine implements PlayerAudioEngine {
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

class NoopPlayerAudioEngine implements PlayerAudioEngine {
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
