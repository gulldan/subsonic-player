part of 'app_shell_screen.dart';

typedef _PlayerHeaderState = ({
  Uri? artworkUrl,
  String title,
  String artist,
  int rating,
});
typedef _PlayerProgressState = ({
  double progress,
  Duration position,
  Duration duration,
  bool enabled,
});
typedef _PlayerControlsState = ({
  bool shuffleEnabled,
  PlayerRepeatMode repeatMode,
  bool isPlaying,
  bool isFavorite,
});

_PlayerHeaderState _resolvePlayerHeaderState(PlayerViewModel player) {
  return (
    artworkUrl: player.track?.coverArtUrl,
    title: player.track?.title ?? 'No track selected',
    artist:
        player.track?.artist ?? 'Start a track from Home, Search, or Library',
    rating: player.rating,
  );
}

_PlayerProgressState _resolvePlayerProgressState(PlayerViewModel player) {
  return (
    progress: player.progress,
    position: player.position,
    duration: player.track?.duration ?? Duration.zero,
    enabled: player.track != null,
  );
}

_PlayerControlsState _resolvePlayerControlsState(PlayerViewModel player) {
  return (
    shuffleEnabled: player.shuffleEnabled,
    repeatMode: player.repeatMode,
    isPlaying: player.isPlaying,
    isFavorite: player.isFavorite,
  );
}
