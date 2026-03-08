import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';

/// Bridges Flutter playback state into native macOS media integrations.
class MacosDesktopIntegration {
  /// Creates and starts the macOS desktop integration bridge.
  MacosDesktopIntegration({
    required AppSession session,
    required PlayerViewModel player,
    MethodChannel? methodChannel,
    EventChannel? eventChannel,
  }) : _session = session,
       _player = player,
       _methodChannel =
           methodChannel ?? const MethodChannel(_methodChannelName),
       _eventChannel = eventChannel ?? const EventChannel(_eventChannelName) {
    if (!_supportsDesktopIntegration) {
      return;
    }

    _session.addListener(_handleStateChanged);
    _player.addListener(_handleStateChanged);
    _positionTicker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_disposed || !_player.isPlaying) {
        return;
      }
      unawaited(_sync(forcePosition: true));
    });
    _listenForNativeCommands();
    unawaited(_sync(forceMetadata: true, forcePosition: true));
  }

  static const String _methodChannelName =
      'flutter_sonicwave/macos_desktop/methods';
  static const String _eventChannelName =
      'flutter_sonicwave/macos_desktop/events';

  static bool get _supportsDesktopIntegration =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.macOS;

  final AppSession _session;
  final PlayerViewModel _player;
  final MethodChannel _methodChannel;
  final EventChannel _eventChannel;

  StreamSubscription<dynamic>? _commandSubscription;
  Timer? _positionTicker;
  bool _disposed = false;
  String? _lastMetadataSignature;
  int? _lastPositionBucket;

  /// Stops listening to player/session updates and tears down the bridge.
  Future<void> dispose() async {
    if (_disposed) {
      return;
    }
    _disposed = true;
    _session.removeListener(_handleStateChanged);
    _player.removeListener(_handleStateChanged);
    _positionTicker?.cancel();
    await _commandSubscription?.cancel();
  }

  void _handleStateChanged() {
    unawaited(_sync());
  }

  Future<void> _sync({
    bool forceMetadata = false,
    bool forcePosition = false,
  }) async {
    if (_disposed || !_supportsDesktopIntegration) {
      return;
    }

    final payload = _buildPayload();
    final metadataSignature = _buildMetadataSignature(payload);
    final positionBucket = ((payload['positionMs'] as int?) ?? 0) ~/ 1000;

    final metadataChanged =
        forceMetadata || metadataSignature != _lastMetadataSignature;
    final positionChanged =
        forcePosition || positionBucket != _lastPositionBucket;

    if (!metadataChanged && !positionChanged) {
      return;
    }

    _lastMetadataSignature = metadataSignature;
    _lastPositionBucket = positionBucket;

    try {
      await _methodChannel.invokeMethod<void>('syncPlaybackState', payload);
    } on MissingPluginException {
      // Widget tests and non-native environments can run without the channel.
    } on PlatformException {
      // The native host may not be ready yet during early startup.
    }
  }

  Map<String, Object?> _buildPayload() {
    final track = _player.track;
    return <String, Object?>{
      'authenticated': _session.status == AppSessionStatus.authenticated,
      'title': track?.title,
      'artist': track?.artist,
      'durationMs': track?.duration.inMilliseconds ?? 0,
      'positionMs': _player.position.inMilliseconds,
      'isPlaying': _player.isPlaying,
      'isFavorite': _player.isFavorite,
      'rating': _player.rating,
      'shuffleEnabled': _player.shuffleEnabled,
      'repeatMode': _player.repeatMode.name,
      'artworkUrl': track?.coverArtUrl?.toString(),
      'serverLabel': _serverDisplayLabel(_session),
      'userLabel': _userDisplayLabel(_session),
    };
  }

  String _buildMetadataSignature(Map<String, Object?> payload) {
    return <Object?>[
      payload['authenticated'],
      payload['title'],
      payload['artist'],
      payload['durationMs'],
      payload['isPlaying'],
      payload['isFavorite'],
      payload['rating'],
      payload['shuffleEnabled'],
      payload['repeatMode'],
      payload['artworkUrl'],
      payload['serverLabel'],
      payload['userLabel'],
    ].join('|');
  }

  void _listenForNativeCommands() {
    try {
      _commandSubscription = _eventChannel.receiveBroadcastStream().listen(
        _handleNativeCommand,
        onError: (_) {},
      );
    } on MissingPluginException {
      // Safe to ignore outside a native macOS runner.
    }
  }

  void _handleNativeCommand(dynamic event) {
    if (_disposed || event is! Map<Object?, Object?>) {
      return;
    }

    final command = event['command']?.toString();
    switch (command) {
      case 'togglePlayPause':
        unawaited(_player.togglePlayback());
      case 'play':
        if (!_player.isPlaying) {
          unawaited(_player.togglePlayback());
        }
      case 'pause':
        if (_player.isPlaying) {
          unawaited(_player.togglePlayback());
        }
      case 'nextTrack':
        unawaited(_player.skipNext());
      case 'previousTrack':
        unawaited(_player.skipPrevious());
      case 'toggleFavorite':
        unawaited(_player.toggleFavorite());
      case 'setRating':
        final value = (event['value'] as num?)?.toInt();
        if (value != null) {
          unawaited(_player.setRating(value.clamp(0, 5)));
        }
      case 'setShuffle':
        final enabled = event['enabled'];
        if (enabled is bool) {
          _player.setShuffleEnabled(enabled: enabled);
        }
      case 'setRepeatMode':
        final mode = event['mode']?.toString();
        if (mode != null) {
          _player.setRepeatMode(_repeatModeFromName(mode));
        }
      case 'seekToPosition':
        final seconds = (event['seconds'] as num?)?.toDouble();
        if (seconds != null) {
          unawaited(
            _player.seekToPosition(
              Duration(milliseconds: (seconds * 1000).round()),
            ),
          );
        }
      default:
        return;
    }
  }

  PlayerRepeatMode _repeatModeFromName(String value) {
    return switch (value) {
      'all' => PlayerRepeatMode.all,
      'one' => PlayerRepeatMode.one,
      _ => PlayerRepeatMode.off,
    };
  }
}

String _serverDisplayLabel(AppSession session) {
  final baseUrl = session.profile?.normalizedBaseUrl;
  if (baseUrl == null || baseUrl.isEmpty) {
    return 'Subsonic';
  }

  final uri = Uri.tryParse(baseUrl);
  final host = uri?.host;
  if (host == null || host.isEmpty) {
    return 'Subsonic';
  }
  if (host.contains('navidrome')) {
    return 'Navidrome';
  }

  final parts = host.split('.');
  final label = parts.first;
  if (label.isEmpty) {
    return host;
  }

  return '${label[0].toUpperCase()}${label.substring(1)}';
}

String _userDisplayLabel(AppSession session) {
  final username = session.profile?.username;
  if (username == null || username.trim().isEmpty) {
    return 'Guest';
  }
  return username.trim();
}
