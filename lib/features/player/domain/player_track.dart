/// Normalized track model used by the player UI and audio engine.
class PlayerTrack {
  /// Creates a player track.
  const PlayerTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.duration,
    this.coverArtUrl,
    this.streamUrl,
    this.isFavorite = false,
    this.rating = 0,
  });

  /// Unique track identifier.
  final String id;

  /// Display title.
  final String title;

  /// Display artist name.
  final String artist;

  /// Track duration.
  final Duration duration;

  /// Optional cover artwork URL.
  final Uri? coverArtUrl;

  /// Optional stream URL resolved from the API.
  final Uri? streamUrl;

  /// Whether the current user starred the track.
  final bool isFavorite;

  /// User rating in the Subsonic 0-5 range.
  final int rating;

  /// Returns a copy with selected fields replaced.
  PlayerTrack copyWith({
    String? id,
    String? title,
    String? artist,
    Duration? duration,
    Uri? coverArtUrl,
    Uri? streamUrl,
    bool? isFavorite,
    int? rating,
  }) {
    return PlayerTrack(
      id: id ?? this.id,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      duration: duration ?? this.duration,
      coverArtUrl: coverArtUrl ?? this.coverArtUrl,
      streamUrl: streamUrl ?? this.streamUrl,
      isFavorite: isFavorite ?? this.isFavorite,
      rating: rating ?? this.rating,
    );
  }
}
