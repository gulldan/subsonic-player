part of 'app_shell_screen.dart';

class _LibraryTab extends StatefulWidget {
  const _LibraryTab({required this.controllers});

  final _ShellControllers controllers;

  @override
  State<_LibraryTab> createState() => _LibraryTabState();
}

class _LibraryTabState extends State<_LibraryTab> {
  _LibrarySegment _segment = _LibrarySegment.tracks;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controllers.library,
      builder: (context, child) {
        final library = widget.controllers.library;
        final likedTracks = _likedSongs(library);

        return SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _LibraryHeroSection(
                segment: _segment,
                featuredSongs: library.featuredSongs,
                albums: library.albums,
                playlists: library.playlists,
                likedTracks: likedTracks,
                onRefresh: () =>
                    unawaited(widget.controllers.library.refresh()),
                onChanged: (segment) {
                  setState(() {
                    _segment = segment;
                  });
                },
              ),
              const SizedBox(height: 22),
              _LibrarySummaryGrid(
                featuredSongs: library.featuredSongs,
                albums: library.albums,
                playlists: library.playlists,
                likedTracks: likedTracks,
              ),
              const SizedBox(height: 22),
              switch (_segment) {
                _LibrarySegment.tracks => _LibraryTrackWorkspace(
                  title: 'All tracks',
                  subtitle:
                      'Fast-scanning rows with large hit targets and clear '
                      'session context.',
                  songs: library.featuredSongs,
                  session: widget.controllers.session,
                  onTapSong: (index) => unawaited(
                    widget.controllers.library.playFeaturedFrom(index),
                  ),
                  onRefresh: () => unawaited(
                    widget.controllers.library.refresh(),
                  ),
                ),
                _LibrarySegment.albums => _LibraryAlbumWorkspace(
                  title: 'Albums',
                  subtitle:
                      'Artwork-led browsing tuned for wide windows and quick '
                      'pattern recognition.',
                  albums: library.albums,
                  session: widget.controllers.session,
                  onTapAlbum: (album) => unawaited(
                    widget.controllers.library.playAlbum(album),
                  ),
                ),
                _LibrarySegment.playlists => _LibraryPlaylistWorkspace(
                  controllers: widget.controllers,
                ),
                _LibrarySegment.liked =>
                  likedTracks.isEmpty
                      ? const _EmptyState(
                          icon: Icons.favorite_border_rounded,
                          title: 'No liked tracks yet',
                          description:
                              'Star songs from the player to collect them '
                              'here.',
                        )
                      : _LibraryTrackWorkspace(
                          title: 'Liked tracks',
                          subtitle:
                              'Every starred or rated song, staged as a replay '
                              'queue you can jump through quickly.',
                          songs: likedTracks,
                          session: widget.controllers.session,
                          onTapSong: (index) => unawaited(
                            widget.controllers.player.setQueueFromSubsonicSongs(
                              likedTracks,
                              startIndex: index,
                              autoPlay: true,
                            ),
                          ),
                          onRefresh: () => unawaited(
                            widget.controllers.library.refresh(),
                          ),
                        ),
              },
            ],
          ),
        );
      },
    );
  }
}

class _LibraryHeroSection extends StatelessWidget {
  const _LibraryHeroSection({
    required this.segment,
    required this.featuredSongs,
    required this.albums,
    required this.playlists,
    required this.likedTracks,
    required this.onRefresh,
    required this.onChanged,
  });

  final _LibrarySegment segment;
  final List<SubsonicSong> featuredSongs;
  final List<SubsonicAlbum> albums;
  final List<SubsonicPlaylist> playlists;
  final List<SubsonicSong> likedTracks;
  final VoidCallback onRefresh;
  final ValueChanged<_LibrarySegment> onChanged;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 1180;
        final commandDeck = AppPanel(
          tone: AppPanelTone.accent,
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 22),
          radius: 28,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${albums.length} albums · ${playlists.length} playlists · '
                '${likedTracks.length} liked',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 18),
              Text(
                'Library',
                style: Theme.of(context).textTheme.displayLarge,
              ),
              const SizedBox(height: 10),
              Text(
                'Browse albums, tracks, and playlists without losing the feel '
                'of a proper desktop catalogue.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 22),
              AppPanel(
                padding: const EdgeInsets.all(10),
                backgroundColor: AppTheme.paletteOf(
                  context,
                ).surface.withValues(alpha: 0.46),
                borderColor: AppTheme.paletteOf(
                  context,
                ).borderStrong.withValues(alpha: 0.42),
                child: _LibrarySegmentedControl(
                  value: segment,
                  onChanged: onChanged,
                ),
              ),
            ],
          ),
        );
        final pulsePanel = _LibraryPulsePanel(
          activeSegment: segment,
          featuredSongs: featuredSongs,
          albums: albums,
          playlists: playlists,
          likedTracks: likedTracks,
          onRefresh: onRefresh,
        );

        if (wide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 8, child: commandDeck),
              const SizedBox(width: 18),
              SizedBox(width: 320, child: pulsePanel),
            ],
          );
        }

        return Column(
          children: [
            commandDeck,
            const SizedBox(height: 18),
            pulsePanel,
          ],
        );
      },
    );
  }
}

class _LibraryPulsePanel extends StatelessWidget {
  const _LibraryPulsePanel({
    required this.activeSegment,
    required this.featuredSongs,
    required this.albums,
    required this.playlists,
    required this.likedTracks,
    required this.onRefresh,
  });

  final _LibrarySegment activeSegment;
  final List<SubsonicSong> featuredSongs;
  final List<SubsonicAlbum> albums;
  final List<SubsonicPlaylist> playlists;
  final List<SubsonicSong> likedTracks;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final totalTracks = featuredSongs.length;
    final likedShare = totalTracks == 0
        ? 0.0
        : likedTracks.length / totalTracks;

    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      radius: 26,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Overview',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(
            'Current section, library totals, and a quick refresh.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 18),
          _LibraryMiniMetric(
            label: 'Focus',
            value: activeSegment.label,
            icon: activeSegment.icon,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Albums',
            value: '${albums.length}',
            icon: Icons.album_outlined,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Playlists',
            value: '${playlists.length}',
            icon: Icons.queue_music_rounded,
          ),
          const SizedBox(height: 18),
          LinearProgressIndicator(value: likedShare),
          const SizedBox(height: 8),
          Text(
            '${(likedShare * 100).round()}% of visible tracks are liked',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 18),
          FilledButton.icon(
            onPressed: onRefresh,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Refresh library'),
          ),
        ],
      ),
    );
  }
}

class _LibrarySummaryGrid extends StatelessWidget {
  const _LibrarySummaryGrid({
    required this.featuredSongs,
    required this.albums,
    required this.playlists,
    required this.likedTracks,
  });

  final List<SubsonicSong> featuredSongs;
  final List<SubsonicAlbum> albums;
  final List<SubsonicPlaylist> playlists;
  final List<SubsonicSong> likedTracks;

  @override
  Widget build(BuildContext context) {
    final cards = [
      _LibrarySummaryCard(
        eyebrow: 'Tracks',
        value: '${featuredSongs.length}',
        subtitle: 'Server-backed songs ready to queue',
        icon: Icons.music_note_rounded,
      ),
      _LibrarySummaryCard(
        eyebrow: 'Albums',
        value: '${albums.length}',
        subtitle: 'Artwork-led browse surfaces',
        icon: Icons.album_rounded,
      ),
      _LibrarySummaryCard(
        eyebrow: 'Playlists',
        value: '${playlists.length}',
        subtitle: 'Saved mixes and collections',
        icon: Icons.queue_music_rounded,
      ),
      _LibrarySummaryCard(
        eyebrow: 'Play time',
        value: formatDuration(_totalSongDuration(featuredSongs)),
        subtitle: '${likedTracks.length} liked tracks in rotation',
        icon: Icons.schedule_rounded,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 1260
            ? 4
            : constraints.maxWidth >= 860
            ? 2
            : 1;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: cards.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            childAspectRatio: columns == 1 ? 3.6 : 2.05,
          ),
          itemBuilder: (context, index) => cards[index],
        );
      },
    );
  }
}

class _LibrarySummaryCard extends StatelessWidget {
  const _LibrarySummaryCard({
    required this.eyebrow,
    required this.value,
    required this.subtitle,
    required this.icon,
  });

  final String eyebrow;
  final String value;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return AppPanel(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  color: palette.surfaceAccent.withValues(alpha: 0.86),
                  border: Border.all(color: palette.borderStrong),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Icon(icon, color: palette.accentStrong, size: 18),
                ),
              ),
              const Spacer(),
              Text(
                eyebrow.toUpperCase(),
                style: theme.textTheme.bodySmall?.copyWith(letterSpacing: 0.72),
              ),
            ],
          ),
          const Spacer(),
          Text(value, style: theme.textTheme.headlineMedium),
          const SizedBox(height: 6),
          Text(subtitle, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _LibraryTrackWorkspace extends StatelessWidget {
  const _LibraryTrackWorkspace({
    required this.title,
    required this.subtitle,
    required this.songs,
    required this.session,
    required this.onTapSong,
    required this.onRefresh,
  });

  final String title;
  final String subtitle;
  final List<SubsonicSong> songs;
  final AppSession session;
  final ValueChanged<int> onTapSong;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    if (songs.isEmpty) {
      return const _EmptyState(
        icon: Icons.library_music_outlined,
        title: 'No tracks available',
        description: 'Your server returned an empty collection.',
      );
    }

    final totalDuration = _totalSongDuration(songs);
    final starredCount = songs.where((song) => song.isStarred).length;

    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 1160;
        final sidePanel = AppPanel(
          tone: AppPanelTone.raised,
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
          radius: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 18),
              _LibraryMiniMetric(
                label: 'Tracks',
                value: '${songs.length}',
                icon: Icons.music_note_rounded,
              ),
              const SizedBox(height: 10),
              _LibraryMiniMetric(
                label: 'Play time',
                value: formatDuration(totalDuration),
                icon: Icons.schedule_rounded,
              ),
              const SizedBox(height: 10),
              _LibraryMiniMetric(
                label: 'Starred',
                value: '$starredCount',
                icon: Icons.favorite_rounded,
              ),
              const SizedBox(height: 18),
              FilledButton.icon(
                onPressed: () => onTapSong(0),
                icon: const Icon(Icons.play_arrow_rounded),
                label: const Text('Play from top'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Refresh'),
              ),
            ],
          ),
        );
        final listPanel = _LibraryTrackListCard(
          title: title,
          subtitle: subtitle,
          songs: songs,
          session: session,
          onTapSong: onTapSong,
        );

        if (wide) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(width: 300, child: sidePanel),
              const SizedBox(width: 18),
              Expanded(child: listPanel),
            ],
          );
        }

        return Column(
          children: [
            sidePanel,
            const SizedBox(height: 18),
            listPanel,
          ],
        );
      },
    );
  }
}

class _LibraryTrackListCard extends StatelessWidget {
  const _LibraryTrackListCard({
    required this.title,
    required this.subtitle,
    required this.songs,
    required this.session,
    required this.onTapSong,
  });

  final String title;
  final String subtitle;
  final List<SubsonicSong> songs;
  final AppSession session;
  final ValueChanged<int> onTapSong;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(title: title, subtitle: subtitle, compact: true),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: [
                SizedBox(
                  width: 54,
                  child: Text('#', style: theme.textTheme.bodySmall),
                ),
                const Expanded(
                  flex: 5,
                  child: Text('Track'),
                ),
                const Expanded(
                  flex: 3,
                  child: Text('Artist'),
                ),
                SizedBox(
                  width: 90,
                  child: Text(
                    'Length',
                    textAlign: TextAlign.right,
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          for (var index = 0; index < songs.length; index++) ...[
            _LibraryTrackRow(
              index: index + 1,
              song: songs[index],
              artworkUrl: _songArtworkUri(session, songs[index], size: 180),
              onTap: () => onTapSong(index),
            ),
            if (index != songs.length - 1) const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class _LibraryTrackRow extends StatelessWidget {
  const _LibraryTrackRow({
    required this.index,
    required this.song,
    required this.artworkUrl,
    required this.onTap,
  });

  final int index;
  final SubsonicSong song;
  final Uri? artworkUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return AppSelectableTile(
      onTap: onTap,
      backgroundColor: palette.surface.withValues(alpha: 0.54),
      borderColor: palette.border.withValues(alpha: 0.72),
      hoverColor: palette.surfaceRaised.withValues(alpha: 0.9),
      hoverBorderColor: palette.borderStrong.withValues(alpha: 0.9),
      child: Row(
        children: [
          SizedBox(
            width: 42,
            child: Text('$index', style: theme.textTheme.bodySmall),
          ),
          SizedBox(
            width: 46,
            height: 46,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: _NowPlayingArtwork(
                url: artworkUrl,
                cacheDimension: 180,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 5,
            child: Text(song.title, style: theme.textTheme.labelLarge),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 3,
            child: Text(song.artist, style: theme.textTheme.bodyMedium),
          ),
          const SizedBox(width: 12),
          if (song.isStarred || song.rating > 0)
            DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: palette.surfaceAccent.withValues(alpha: 0.86),
                border: Border.all(color: palette.borderStrong),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      song.isStarred
                          ? Icons.favorite_rounded
                          : Icons.star_rounded,
                      size: 14,
                      color: palette.accentStrong,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      song.isStarred ? 'Liked' : '${song.rating}/5',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: palette.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(width: 14),
          SizedBox(
            width: 62,
            child: Text(
              formatDuration(song.duration),
              textAlign: TextAlign.right,
              style: theme.textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}

class _LibraryAlbumWorkspace extends StatelessWidget {
  const _LibraryAlbumWorkspace({
    required this.title,
    required this.subtitle,
    required this.albums,
    required this.session,
    required this.onTapAlbum,
  });

  final String title;
  final String subtitle;
  final List<SubsonicAlbum> albums;
  final AppSession session;
  final ValueChanged<SubsonicAlbum> onTapAlbum;

  @override
  Widget build(BuildContext context) {
    if (albums.isEmpty) {
      return const _EmptyState(
        icon: Icons.album_outlined,
        title: 'No albums available',
        description: 'Your server returned an empty collection.',
      );
    }

    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(title: title, subtitle: subtitle),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 1260
                  ? 4
                  : constraints.maxWidth >= 920
                  ? 3
                  : constraints.maxWidth >= 560
                  ? 2
                  : 1;

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: albums.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: columns == 1 ? 1.34 : 0.92,
                ),
                itemBuilder: (context, index) {
                  final album = albums[index];
                  return _LibraryAlbumTile(
                    title: album.name,
                    subtitle: '${album.artist} · ${album.songCount} tracks',
                    artworkUrl: _albumArtworkUri(session, album, size: 640),
                    onTap: () => onTapAlbum(album),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class _LibraryAlbumTile extends StatelessWidget {
  const _LibraryAlbumTile({
    required this.title,
    required this.subtitle,
    required this.artworkUrl,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final Uri? artworkUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return AppSelectableTile(
      onTap: onTap,
      radius: 22,
      padding: const EdgeInsets.all(10),
      backgroundColor: palette.surface.withValues(alpha: 0.58),
      borderColor: palette.border.withValues(alpha: 0.72),
      hoverColor: palette.surfaceRaised.withValues(alpha: 0.88),
      hoverBorderColor: palette.borderStrong.withValues(alpha: 0.92),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                  child: _NowPlayingArtwork(
                    url: artworkUrl,
                    cacheDimension: 640,
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.42),
                      ],
                      stops: const [0, 0.56, 1],
                    ),
                  ),
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999),
                      color: Colors.black.withValues(alpha: 0.3),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                    ),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      child: Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _LibraryPlaylistWorkspace extends StatelessWidget {
  const _LibraryPlaylistWorkspace({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    final library = controllers.library;

    if (library.playlists.isEmpty) {
      return const _EmptyState(
        icon: Icons.queue_music_rounded,
        title: 'No playlists found',
        description: 'Create a playlist in your server to see it here.',
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 980;
        final playlistPanel = AppPanel(
          radius: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionHeader(
                title: 'Playlists',
                subtitle:
                    'Pick a collection to inspect or send into the queue.',
                compact: true,
              ),
              const SizedBox(height: 14),
              for (final playlist in library.playlists) ...[
                _LibraryPlaylistTile(
                  playlist: playlist,
                  session: controllers.session,
                  selected: playlist.id == library.selectedPlaylistId,
                  onTap: () => unawaited(
                    controllers.library.selectPlaylist(playlist.id),
                  ),
                ),
                if (playlist != library.playlists.last)
                  const SizedBox(height: 10),
              ],
            ],
          ),
        );
        final detailsPanel = library.loadingPlaylistDetails
            ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
            : library.selectedPlaylistSongs.isEmpty
            ? const _EmptyState(
                icon: Icons.playlist_play_rounded,
                title: 'Select a playlist',
                description: 'Choose one from the list to inspect its tracks.',
              )
            : Column(
                children: [
                  _LibraryPlaylistOverview(
                    playlist: library.playlists.firstWhere(
                      (playlist) => playlist.id == library.selectedPlaylistId,
                    ),
                  ),
                  const SizedBox(height: 18),
                  _LibraryTrackListCard(
                    title: 'Playlist tracks',
                    subtitle:
                        'Playback remains one click away '
                        'from the list surface.',
                    songs: library.selectedPlaylistSongs,
                    session: controllers.session,
                    onTapSong: (index) => unawaited(
                      controllers.library.playPlaylistSongFrom(index),
                    ),
                  ),
                ],
              );

        if (stacked) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              playlistPanel,
              const SizedBox(height: 18),
              detailsPanel,
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 320, child: playlistPanel),
            const SizedBox(width: 18),
            Expanded(child: detailsPanel),
          ],
        );
      },
    );
  }
}

class _LibraryPlaylistTile extends StatelessWidget {
  const _LibraryPlaylistTile({
    required this.playlist,
    required this.session,
    required this.selected,
    required this.onTap,
  });

  final SubsonicPlaylist playlist;
  final AppSession session;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return AppSelectableTile(
      selected: selected,
      onTap: onTap,
      backgroundColor: palette.surface.withValues(alpha: 0.54),
      borderColor: palette.border.withValues(alpha: 0.72),
      hoverColor: palette.surfaceRaised.withValues(alpha: 0.88),
      hoverBorderColor: palette.borderStrong.withValues(alpha: 0.92),
      selectedColor: palette.accent.withValues(alpha: 0.16),
      selectedBorderColor: palette.accentStrong.withValues(alpha: 0.42),
      child: Row(
        children: [
          SizedBox(
            width: 52,
            height: 52,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: _NowPlayingArtwork(
                url: _playlistArtworkUri(session, playlist, size: 220),
                cacheDimension: 220,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  playlist.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  '${playlist.songCount} tracks · '
                  '${formatDuration(playlist.duration)}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LibraryPlaylistOverview extends StatelessWidget {
  const _LibraryPlaylistOverview({required this.playlist});

  final SubsonicPlaylist playlist;

  @override
  Widget build(BuildContext context) {
    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            playlist.name,
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 6),
          Text(
            playlist.owner == null
                ? 'Shared playlist'
                : 'Owned by ${playlist.owner}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _LibraryCapsule(
                icon: Icons.music_note_rounded,
                label: '${playlist.songCount} tracks',
              ),
              _LibraryCapsule(
                icon: Icons.schedule_rounded,
                label: formatDuration(playlist.duration),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LibrarySegmentedControl extends StatelessWidget {
  const _LibrarySegmentedControl({
    required this.value,
    required this.onChanged,
  });

  final _LibrarySegment value;
  final ValueChanged<_LibrarySegment> onChanged;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _LibrarySegment.values
          .map(
            (segment) => AppSelectableTile(
              selected: segment == value,
              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 11,
              ),
              radius: 18,
              onTap: () => onChanged(segment),
              backgroundColor: Colors.transparent,
              borderColor: Colors.transparent,
              hoverColor: palette.surfaceRaised.withValues(alpha: 0.68),
              hoverBorderColor: Colors.transparent,
              selectedColor: palette.surfaceRaised.withValues(alpha: 0.96),
              selectedBorderColor: palette.accentStrong.withValues(alpha: 0.34),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    segment.icon,
                    size: 16,
                    color: segment == value
                        ? palette.accentStrong
                        : palette.textMuted,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    segment.label,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: segment == value
                          ? palette.textPrimary
                          : palette.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(growable: false),
    );
  }
}

class _LibraryCapsule extends StatelessWidget {
  const _LibraryCapsule({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: palette.border.withValues(alpha: 0.58)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: palette.textMuted),
            const SizedBox(width: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: palette.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LibraryMiniMetric extends StatelessWidget {
  const _LibraryMiniMetric({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: palette.border.withValues(alpha: 0.5)),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 11),
        child: Row(
          children: [
            Icon(icon, size: 15, color: palette.textMuted),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: palette.textSecondary,
                ),
              ),
            ),
            Text(value, style: Theme.of(context).textTheme.labelLarge),
          ],
        ),
      ),
    );
  }
}

Duration _totalSongDuration(List<SubsonicSong> songs) {
  return songs.fold<Duration>(
    Duration.zero,
    (total, song) => total + song.duration,
  );
}

Uri? _playlistArtworkUri(
  AppSession session,
  SubsonicPlaylist playlist, {
  int size = 320,
}) {
  final coverArtId = playlist.coverArtId;
  if (coverArtId == null) {
    return null;
  }
  return session.client?.getCoverArtUri(coverArtId, size: size);
}
