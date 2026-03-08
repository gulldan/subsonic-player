import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/platform_ui_scope.dart';
import 'package:flutter_sonicwave/app/router/app_router.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/core/ui/theme/app_tokens.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_artwork.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_artwork_tone.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_atmosphere.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_brand_mark.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_empty_state.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_panel.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_selectable_tile.dart';
import 'package:flutter_sonicwave/core/ui/widgets/app_user_badge.dart';
import 'package:flutter_sonicwave/core/utils/duration_formatter.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/library/presentation/library_view_model.dart';
import 'package:flutter_sonicwave/features/player/domain/player_track.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:go_router/go_router.dart';
import 'package:macos_ui/macos_ui.dart';

part 'app_shell_layouts.dart';
part 'app_shell_navigation.dart';
part 'app_shell_player.dart';
part 'app_shell_player_material.dart';
part 'app_shell_tabs.dart';
part 'app_shell_home_tabs.dart';
part 'app_shell_search_tab.dart';
part 'app_shell_library_tab.dart';
part 'app_shell_now_playing_tab.dart';
part 'app_shell_settings_tabs.dart';

/// Top-level tabs available in the authenticated shell.
enum AppTab {
  /// Dashboard and discovery content.
  home,

  /// Search across artists, albums, and tracks.
  search,

  /// Library browsing.
  library,

  /// Dedicated now-playing surface.
  nowPlaying,

  /// Session and app settings.
  settings,
}

/// Derived labels, icons, and routes for [AppTab].
extension AppTabX on AppTab {
  /// Human-readable tab label.
  String get label {
    switch (this) {
      case AppTab.home:
        return 'Home';
      case AppTab.search:
        return 'Search';
      case AppTab.library:
        return 'Library';
      case AppTab.nowPlaying:
        return 'Now Playing';
      case AppTab.settings:
        return 'Settings';
    }
  }

  /// Tab icon.
  IconData get icon {
    switch (this) {
      case AppTab.home:
        return Icons.home_outlined;
      case AppTab.search:
        return Icons.search_rounded;
      case AppTab.library:
        return Icons.library_music_outlined;
      case AppTab.nowPlaying:
        return Icons.sensors_rounded;
      case AppTab.settings:
        return Icons.settings_outlined;
    }
  }

  /// Route path used by the tab.
  String get route {
    switch (this) {
      case AppTab.home:
        return AppRoutes.home;
      case AppTab.search:
        return AppRoutes.search;
      case AppTab.library:
        return AppRoutes.library;
      case AppTab.nowPlaying:
        return AppRoutes.nowPlaying;
      case AppTab.settings:
        return AppRoutes.settings;
    }
  }
}

enum _SearchGenre {
  all,
  electronic,
  ambient,
  postRock,
  synthwave,
  darkAmbient,
  spaceRock,
}

extension _SearchGenreX on _SearchGenre {
  String get label {
    switch (this) {
      case _SearchGenre.all:
        return 'All';
      case _SearchGenre.electronic:
        return 'Electronic';
      case _SearchGenre.ambient:
        return 'Ambient';
      case _SearchGenre.postRock:
        return 'Post-Rock';
      case _SearchGenre.synthwave:
        return 'Synthwave';
      case _SearchGenre.darkAmbient:
        return 'Dark Ambient';
      case _SearchGenre.spaceRock:
        return 'Space Rock';
    }
  }
}

enum _LibrarySegment { tracks, albums, playlists, liked }

extension _LibrarySegmentX on _LibrarySegment {
  String get label {
    switch (this) {
      case _LibrarySegment.tracks:
        return 'Tracks';
      case _LibrarySegment.albums:
        return 'Albums';
      case _LibrarySegment.playlists:
        return 'Playlists';
      case _LibrarySegment.liked:
        return 'Liked';
    }
  }

  IconData get icon {
    switch (this) {
      case _LibrarySegment.tracks:
        return Icons.music_note_rounded;
      case _LibrarySegment.albums:
        return Icons.album_outlined;
      case _LibrarySegment.playlists:
        return Icons.queue_music_rounded;
      case _LibrarySegment.liked:
        return Icons.favorite_border_rounded;
    }
  }
}

class _ArtistSpotlight {
  const _ArtistSpotlight({
    required this.name,
    required this.genre,
    required this.artworkUrl,
  });

  final String name;
  final String genre;
  final Uri? artworkUrl;
}

/// Authenticated shell that adapts between desktop and compact layouts.
class AppShellScreen extends StatelessWidget {
  /// Creates the authenticated shell.
  const AppShellScreen({
    required this.tab,
    required this.session,
    required this.playerViewModel,
    required this.libraryViewModel,
    super.key,
  });

  /// Tab to display as active.
  final AppTab tab;

  /// Shared application session.
  final AppSession session;

  /// Shared player state.
  final PlayerViewModel playerViewModel;

  /// Shared library state.
  final LibraryViewModel libraryViewModel;

  @override
  Widget build(BuildContext context) {
    final controllers = _ShellControllers(
      session: session,
      player: playerViewModel,
      library: libraryViewModel,
    );

    if (PlatformUiScope.useMacos(context)) {
      return _MacosShell(tab: tab, controllers: controllers);
    }

    return Scaffold(
      body: AppAtmosphere(
        child: SafeArea(
          minimum: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final desktop = constraints.maxWidth >= 1080;
              if (!desktop) {
                return _CompactShell(tab: tab, controllers: controllers);
              }
              return _DesktopShell(tab: tab, controllers: controllers);
            },
          ),
        ),
      ),
    );
  }
}

class _ShellControllers {
  const _ShellControllers({
    required this.session,
    required this.player,
    required this.library,
  });

  final AppSession session;
  final PlayerViewModel player;
  final LibraryViewModel library;
}

class _NowPlayingArtwork extends StatelessWidget {
  const _NowPlayingArtwork({required this.url, this.cacheDimension});

  final Uri? url;
  final double? cacheDimension;

  @override
  Widget build(BuildContext context) {
    return AppArtwork(url: url, cacheDimension: cacheDimension, iconSize: 46);
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return AppEmptyState(icon: icon, title: title, description: description);
  }
}

Uri? _songArtworkUri(AppSession session, SubsonicSong song, {int size = 480}) {
  final coverArt = song.coverArt;
  if (coverArt == null) {
    return null;
  }
  return session.client?.getCoverArtUri(coverArt, size: size);
}

Uri? _albumArtworkUri(
  AppSession session,
  SubsonicAlbum album, {
  int size = 560,
}) {
  final coverArtId = album.coverArtId;
  if (coverArtId == null) {
    return null;
  }
  return session.client?.getCoverArtUri(coverArtId, size: size);
}

List<_ArtistSpotlight> _buildArtistSpotlights(_ShellControllers controllers) {
  final genres = _SearchGenre.values
      .where((genre) => genre != _SearchGenre.all)
      .map((genre) => genre.label)
      .toList(growable: false);
  final artists = <String, _ArtistSpotlight>{};

  for (final album in controllers.library.albums) {
    if (artists.length >= 6) {
      break;
    }
    artists.putIfAbsent(
      album.artist,
      () => _ArtistSpotlight(
        name: album.artist,
        genre: genres[artists.length % genres.length],
        artworkUrl: _albumArtworkUri(controllers.session, album),
      ),
    );
  }

  for (final song in controllers.library.featuredSongs) {
    if (artists.length >= 6) {
      break;
    }
    artists.putIfAbsent(
      song.artist,
      () => _ArtistSpotlight(
        name: song.artist,
        genre: genres[artists.length % genres.length],
        artworkUrl: _songArtworkUri(controllers.session, song),
      ),
    );
  }

  return artists.values.toList(growable: false);
}

List<SubsonicSong> _likedSongs(LibraryViewModel library) {
  return library.featuredSongs
      .where((song) => song.isStarred || song.rating > 0)
      .toList(growable: false);
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
