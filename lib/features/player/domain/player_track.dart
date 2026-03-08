class PlayerTrack {
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

  final String id;
  final String title;
  final String artist;
  final Duration duration;
  final Uri? coverArtUrl;
  final Uri? streamUrl;
  final bool isFavorite;
  final int rating;

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
