import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/router/app_router.dart';
import 'package:flutter_sonicwave/core/utils/duration_formatter.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/library/presentation/library_view_model.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

enum AppTab { home, collections, playlists, settings }

extension AppTabX on AppTab {
  String get label {
    switch (this) {
      case AppTab.home:
        return 'Music';
      case AppTab.collections:
        return 'Collections';
      case AppTab.playlists:
        return 'Playlists';
      case AppTab.settings:
        return 'Settings';
    }
  }

  IconData get icon {
    switch (this) {
      case AppTab.home:
        return Icons.music_note_rounded;
      case AppTab.collections:
        return Icons.collections_bookmark_rounded;
      case AppTab.playlists:
        return Icons.queue_music_rounded;
      case AppTab.settings:
        return Icons.settings_rounded;
    }
  }

  String get route {
    switch (this) {
      case AppTab.home:
        return AppRoutes.home;
      case AppTab.collections:
        return AppRoutes.collections;
      case AppTab.playlists:
        return AppRoutes.playlists;
      case AppTab.settings:
        return AppRoutes.settings;
    }
  }
}

class AppShellScreen extends StatelessWidget {
  const AppShellScreen({super.key, required this.tab});

  final AppTab tab;

  @override
  Widget build(BuildContext context) {
    final library = context.watch<LibraryViewModel>();

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0E263A), Color(0xFF112A40), Color(0xFF0B1E30)],
          ),
        ),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final desktop = constraints.maxWidth >= 1100;
              if (!desktop) {
                return _CompactShell(tab: tab, library: library);
              }
              return _DesktopShell(tab: tab, library: library);
            },
          ),
        ),
      ),
    );
  }
}

class _DesktopShell extends StatelessWidget {
  const _DesktopShell({required this.tab, required this.library});

  final AppTab tab;
  final LibraryViewModel library;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
      child: Row(
        children: [
          _DesktopSidebar(tab: tab),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: _SurfaceCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _TopToolbar(library: library),
                        const SizedBox(height: 10),
                        Expanded(
                          child: _TabContent(tab: tab, library: library),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const _DesktopPlayerDock(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompactShell extends StatelessWidget {
  const _CompactShell({required this.tab, required this.library});

  final AppTab tab;
  final LibraryViewModel library;

  @override
  Widget build(BuildContext context) {
    final tabs = AppTab.values;
    return Column(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: _SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _TopToolbar(library: library),
                  const SizedBox(height: 10),
                  Expanded(
                    child: _TabContent(tab: tab, library: library),
                  ),
                ],
              ),
            ),
          ),
        ),
        NavigationBar(
          selectedIndex: tab.index,
          destinations: tabs
              .map(
                (item) => NavigationDestination(
                  icon: Icon(item.icon),
                  label: item.label,
                ),
              )
              .toList(growable: false),
          onDestinationSelected: (index) {
            context.go(tabs[index].route);
          },
        ),
      ],
    );
  }
}

class _DesktopSidebar extends StatelessWidget {
  const _DesktopSidebar({required this.tab});

  final AppTab tab;

  @override
  Widget build(BuildContext context) {
    final tabs = AppTab.values;
    return _SurfaceCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
      child: SizedBox(
        width: 238,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.only(bottom: 14),
              child: Text(
                'SonicWave',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
              ),
            ),
            Text(
              'Navidrome + Subsonic',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ...tabs.map((item) {
              final selected = item == tab;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => context.go(item.route),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 110),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: selected
                          ? const Color(0xFF24527E)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        Icon(item.icon, color: Colors.white, size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            item.label,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: selected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            const Spacer(),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0x2A87B6DC),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Desktop mode',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: const Color(0xFFC8DCF0),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopToolbar extends StatefulWidget {
  const _TopToolbar({required this.library});

  final LibraryViewModel library;

  @override
  State<_TopToolbar> createState() => _TopToolbarState();
}

class _TopToolbarState extends State<_TopToolbar> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<AppSession>();
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search_rounded),
              hintText: 'Search tracks, artists, albums',
              suffixIcon: widget.library.searching
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
            ),
            onSubmitted: (value) {
              unawaited(widget.library.search(value));
            },
          ),
        ),
        const SizedBox(width: 10),
        OutlinedButton.icon(
          onPressed: () => unawaited(widget.library.refresh()),
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('Refresh'),
        ),
        const SizedBox(width: 10),
        Tooltip(
          message: 'Signed in as ${session.profile?.username ?? '-'}',
          child: CircleAvatar(
            backgroundColor: const Color(0xFF24527E),
            child: Text(
              (session.profile?.username.isNotEmpty ?? false)
                  ? session.profile!.username[0].toUpperCase()
                  : '?',
            ),
          ),
        ),
      ],
    );
  }
}

class _TabContent extends StatelessWidget {
  const _TabContent({required this.tab, required this.library});

  final AppTab tab;
  final LibraryViewModel library;

  @override
  Widget build(BuildContext context) {
    if (library.loadingDashboard) {
      return const Center(child: CircularProgressIndicator());
    }

    if (library.errorMessage != null && library.featuredSongs.isEmpty) {
      return Center(
        child: Text(
          library.errorMessage!,
          style: Theme.of(context).textTheme.bodyLarge,
          textAlign: TextAlign.center,
        ),
      );
    }

    switch (tab) {
      case AppTab.home:
        return _HomeTab(library: library);
      case AppTab.collections:
        return _CollectionsTab(library: library);
      case AppTab.playlists:
        return _PlaylistsTab(library: library);
      case AppTab.settings:
        return const _SettingsTab();
    }
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab({required this.library});

  final LibraryViewModel library;

  @override
  Widget build(BuildContext context) {
    final hasSearch = library.searchQuery.isNotEmpty;
    final tracks = hasSearch ? library.searchResults : library.featuredSongs;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          hasSearch ? 'Search Results' : 'Quick Picks',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.separated(
            itemCount: tracks.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final track = tracks[index];
              return _TrackRow(
                song: track,
                onPlay: () {
                  if (hasSearch) {
                    unawaited(library.playSearchResultFrom(index));
                  } else {
                    unawaited(library.playFeaturedFrom(index));
                  }
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

class _CollectionsTab extends StatelessWidget {
  const _CollectionsTab({required this.library});

  final LibraryViewModel library;

  @override
  Widget build(BuildContext context) {
    final gridWidth = MediaQuery.sizeOf(context).width;
    final count = gridWidth > 1600
        ? 5
        : gridWidth > 1300
        ? 4
        : 3;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Albums', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Expanded(
          child: GridView.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: count,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 0.9,
            ),
            itemCount: library.albums.length,
            itemBuilder: (context, index) {
              final album = library.albums[index];
              return _AlbumCard(
                album: album,
                onPlay: () => unawaited(library.playAlbum(album)),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _PlaylistsTab extends StatelessWidget {
  const _PlaylistsTab({required this.library});

  final LibraryViewModel library;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 280,
          child: ListView.separated(
            itemCount: library.playlists.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final playlist = library.playlists[index];
              final selected = playlist.id == library.selectedPlaylistId;
              return InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => unawaited(library.selectPlaylist(playlist.id)),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: selected
                        ? const Color(0xFF24527E)
                        : const Color(0xFF15314B),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        playlist.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${playlist.songCount} tracks',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: library.loadingPlaylistDetails
              ? const Center(child: CircularProgressIndicator())
              : ListView.separated(
                  itemCount: library.selectedPlaylistSongs.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final song = library.selectedPlaylistSongs[index];
                    return _TrackRow(
                      song: song,
                      onPlay: () =>
                          unawaited(library.playPlaylistSongFrom(index)),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _SettingsTab extends StatelessWidget {
  const _SettingsTab();

  @override
  Widget build(BuildContext context) {
    final session = context.watch<AppSession>();
    return ListView(
      children: [
        Text('Settings', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 14),
        _SurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Server URL: ${session.profile?.baseUrl ?? '-'}'),
              const SizedBox(height: 6),
              Text('Username: ${session.profile?.username ?? '-'}'),
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: () => unawaited(session.signOut()),
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Sign out'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DesktopPlayerDock extends StatelessWidget {
  const _DesktopPlayerDock();

  @override
  Widget build(BuildContext context) {
    final player = context.watch<PlayerViewModel>();
    final theme = Theme.of(context);
    final track = player.track;

    return _SurfaceCard(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              SizedBox(
                width: 72,
                height: 72,
                child: _NowPlayingArtwork(url: track?.coverArtUrl),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Now Playing',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFFC6D9ED),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      track?.title ?? 'No track selected',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      track?.artist ?? 'Play a track from Music or Playlists',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              Wrap(
                spacing: 2,
                children: List<Widget>.generate(5, (index) {
                  final value = index + 1;
                  return IconButton(
                    onPressed: () => unawaited(player.setRating(value)),
                    icon: Icon(
                      player.rating >= value
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      color: const Color(0xFFFFD66E),
                    ),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Slider(
            value: player.progress,
            onChanged: player.track == null ? null : player.seekToFraction,
          ),
          Row(
            children: [
              Text(
                formatDuration(player.position),
                style: theme.textTheme.bodyMedium,
              ),
              const Spacer(),
              Text(
                formatDuration(track?.duration ?? Duration.zero),
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              IconButton(
                onPressed: player.toggleShuffle,
                icon: Icon(
                  Icons.shuffle_rounded,
                  color: player.shuffleEnabled
                      ? const Color(0xFF8CD3FF)
                      : Colors.white,
                ),
              ),
              IconButton(
                onPressed: player.skipPrevious,
                icon: const Icon(Icons.skip_previous_rounded),
              ),
              FilledButton.tonal(
                onPressed: player.togglePlayback,
                child: Icon(
                  player.isPlaying
                      ? Icons.pause_rounded
                      : Icons.play_arrow_rounded,
                ),
              ),
              IconButton(
                onPressed: player.skipNext,
                icon: const Icon(Icons.skip_next_rounded),
              ),
              IconButton(
                onPressed: player.cycleRepeatMode,
                icon: Icon(
                  player.repeatMode == PlayerRepeatMode.one
                      ? Icons.repeat_one_rounded
                      : Icons.repeat_rounded,
                  color: player.repeatMode == PlayerRepeatMode.off
                      ? Colors.white
                      : const Color(0xFF8CD3FF),
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: player.toggleFavorite,
                icon: Icon(
                  player.isFavorite
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                ),
                label: const Text('Favorite'),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: player.markDisliked,
                icon: const Icon(Icons.thumb_down_alt_outlined),
                label: const Text('Dislike'),
              ),
            ],
          ),
          if (player.errorMessage != null) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                player.errorMessage!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TrackRow extends StatelessWidget {
  const _TrackRow({required this.song, required this.onPlay});

  final SubsonicSong song;
  final VoidCallback onPlay;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF15314B),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: onPlay,
            icon: const Icon(Icons.play_arrow_rounded),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(song.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(
                  song.artist,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          Text(
            formatDuration(song.duration),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _AlbumCard extends StatelessWidget {
  const _AlbumCard({required this.album, required this.onPlay});

  final SubsonicAlbum album;
  final VoidCallback onPlay;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onPlay,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF15314B),
          borderRadius: BorderRadius.circular(14),
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _NowPlayingArtwork(
                url: album.coverArtId == null
                    ? null
                    : context.read<AppSession>().client?.getCoverArtUri(
                        album.coverArtId!,
                        size: 500,
                      ),
              ),
            ),
            const SizedBox(height: 8),
            Text(album.name, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(
              album.artist,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _NowPlayingArtwork extends StatelessWidget {
  const _NowPlayingArtwork({required this.url});

  final Uri? url;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: AspectRatio(
        aspectRatio: 1,
        child: url == null
            ? const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xFF1A3B59), Color(0xFF3C6386)],
                  ),
                ),
                child: Center(child: Icon(Icons.album_rounded, size: 56)),
              )
            : Image.network(
                url.toString(),
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return const ColoredBox(
                    color: Color(0xFF274768),
                    child: Center(
                      child: Icon(Icons.broken_image_rounded, size: 44),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xB2163551),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0x3A7BA6CA)),
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}
