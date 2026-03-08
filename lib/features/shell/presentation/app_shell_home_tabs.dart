part of 'app_shell_screen.dart';

class _HomeTab extends StatelessWidget {
  const _HomeTab({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controllers.library,
      builder: (context, child) {
        final library = controllers.library;
        final tracks = library.featuredSongs.take(8).toList(growable: false);
        final albums = library.albums.take(6).toList(growable: false);
        final artists = _buildArtistSpotlights(controllers);
        final likedTracks = _likedSongs(library);

        if (tracks.isEmpty && albums.isEmpty) {
          return const _EmptyState(
            icon: Icons.music_note_outlined,
            title: 'No tracks yet',
            description: 'Connect to your server and refresh the library.',
          );
        }

        final listenedHours = tracks.fold<int>(
          0,
          (sum, song) => sum + song.duration.inMinutes,
        );
        final featuredAlbum = albums.isNotEmpty ? albums.first : null;
        final featuredSong = tracks.isNotEmpty ? tracks.first : null;
        final stats =
            '${tracks.length} tracks · '
            '${library.albums.length} albums · '
            '${artists.length} artists';

        return ScrollConfiguration(
          behavior: ScrollConfiguration.of(
            context,
          ).copyWith(scrollbars: false),
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LayoutBuilder(
                  builder: (context, constraints) {
                    final stacked = constraints.maxWidth < 1180;
                    final commandDeck = _HomeCommandDeck(
                      stats: stats,
                      serverLabel: _serverDisplayLabel(controllers.session),
                      likedCount: likedTracks.length,
                      playlistCount: library.playlists.length,
                      onOpenLibrary: () => context.go(AppRoutes.library),
                      onOpenNowPlaying: () => context.go(AppRoutes.nowPlaying),
                    );
                    final signalRail = _HomeSignalRail(
                      albumsCount: library.albums.length,
                      artistsCount: artists.length,
                      likedCount: likedTracks.length,
                      queueCount: tracks.length,
                    );

                    if (stacked) {
                      return Column(
                        children: [
                          commandDeck,
                          const SizedBox(height: 18),
                          signalRail,
                        ],
                      );
                    }

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 10, child: commandDeck),
                        const SizedBox(width: 18),
                        SizedBox(width: 320, child: signalRail),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 26),
                _HomeHeroGrid(
                  session: controllers.session,
                  featuredAlbum: featuredAlbum,
                  featuredSong: featuredSong,
                  listenedHours: listenedHours,
                  playlistCount: library.playlists.length,
                  likedCount: likedTracks.length,
                  artistsCount: artists.length,
                  recentTracks: tracks,
                  onPlayFeatured: () {
                    if (featuredAlbum != null) {
                      unawaited(controllers.library.playAlbum(featuredAlbum));
                      return;
                    }
                    if (featuredSong != null) {
                      unawaited(controllers.library.playFeaturedFrom(0));
                    }
                  },
                ),
                const SizedBox(height: 30),
                _SectionHeader(
                  title: 'Quick play',
                  subtitle:
                      'Instant access to the tracks you are likely '
                      'to hit next.',
                  actionLabel: 'Open library',
                  onAction: () => context.go(AppRoutes.library),
                ),
                const SizedBox(height: 14),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final columns = constraints.maxWidth >= 1320
                        ? 3
                        : constraints.maxWidth >= 860
                        ? 2
                        : 1;
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: tracks.length.clamp(0, 6),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: columns == 1 ? 4.2 : 3.2,
                      ),
                      itemBuilder: (context, index) {
                        final song = tracks[index];
                        return _QuickPlayTile(
                          title: song.title,
                          subtitle: song.artist,
                          artworkUrl: _songArtworkUri(
                            controllers.session,
                            song,
                          ),
                          onTap: () => unawaited(
                            controllers.library.playFeaturedFrom(index),
                          ),
                        );
                      },
                    );
                  },
                ),
                const SizedBox(height: 30),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final stacked = constraints.maxWidth < 1180;
                    final artistsPanel = AppPanel(
                      tone: AppPanelTone.raised,
                      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SectionHeader(
                            title: 'Artist radar',
                            subtitle:
                                'People shaping the current library mood.',
                            actionLabel: 'Search',
                            onAction: () => context.go(AppRoutes.search),
                            compact: true,
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 12,
                            runSpacing: 12,
                            children: artists
                                .map(
                                  (artist) => SizedBox(
                                    width: 168,
                                    child: _ArtistTile(artist: artist),
                                  ),
                                )
                                .toList(growable: false),
                          ),
                        ],
                      ),
                    );

                    final recommendedPanel = Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionHeader(
                          title: 'Recommended',
                          subtitle:
                              'A tighter, artwork-first browse for '
                              'recent albums.',
                          actionLabel: 'Show all',
                          onAction: () => context.go(AppRoutes.library),
                        ),
                        const SizedBox(height: 14),
                        LayoutBuilder(
                          builder: (context, innerConstraints) {
                            final columns = innerConstraints.maxWidth >= 980
                                ? 3
                                : innerConstraints.maxWidth >= 620
                                ? 2
                                : 1;
                            return GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: albums.length,
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: columns,
                                    crossAxisSpacing: 16,
                                    mainAxisSpacing: 16,
                                    childAspectRatio: columns == 1
                                        ? 1.32
                                        : 0.92,
                                  ),
                              itemBuilder: (context, index) {
                                final album = albums[index];
                                return _AlbumTile(
                                  title: album.name,
                                  subtitle:
                                      '${album.artist} · '
                                      '${album.songCount} tracks',
                                  artworkUrl: _albumArtworkUri(
                                    controllers.session,
                                    album,
                                  ),
                                  onTap: () => unawaited(
                                    controllers.library.playAlbum(album),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ],
                    );

                    if (stacked) {
                      return Column(
                        children: [
                          artistsPanel,
                          const SizedBox(height: 22),
                          recommendedPanel,
                        ],
                      );
                    }

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(width: 364, child: artistsPanel),
                        const SizedBox(width: 22),
                        Expanded(child: recommendedPanel),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 30),
                _SectionHeader(
                  title: 'Recent plays',
                  subtitle:
                      'A cleaner queue-like view with quick context '
                      'and metadata.',
                  actionLabel: 'Now playing',
                  onAction: () => context.go(AppRoutes.nowPlaying),
                ),
                const SizedBox(height: 14),
                AppPanel(
                  tone: AppPanelTone.raised,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                  child: Column(
                    children: [
                      for (var index = 0; index < tracks.length; index++) ...[
                        _RecentTrackRow(
                          index: index + 1,
                          song: tracks[index],
                          artworkUrl: _songArtworkUri(
                            controllers.session,
                            tracks[index],
                            size: 160,
                          ),
                          onTap: () => unawaited(
                            controllers.library.playFeaturedFrom(index),
                          ),
                        ),
                        if (index != tracks.length - 1)
                          const Divider(
                            height: 1,
                            indent: 54,
                            endIndent: 18,
                          ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HomeOverviewPill extends StatelessWidget {
  const _HomeOverviewPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
        border: Border.all(color: palette.border.withValues(alpha: 0.6)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label.toUpperCase(),
              style: theme.textTheme.bodySmall?.copyWith(
                letterSpacing: 0.72,
                color: palette.textMuted,
              ),
            ),
            const SizedBox(height: 4),
            Text(value, style: theme.textTheme.labelLarge),
          ],
        ),
      ),
    );
  }
}

class _HomeCommandDeck extends StatelessWidget {
  const _HomeCommandDeck({
    required this.stats,
    required this.serverLabel,
    required this.likedCount,
    required this.playlistCount,
    required this.onOpenLibrary,
    required this.onOpenNowPlaying,
  });

  final String stats;
  final String serverLabel;
  final int likedCount;
  final int playlistCount;
  final VoidCallback onOpenLibrary;
  final VoidCallback onOpenNowPlaying;

  @override
  Widget build(BuildContext context) {
    return AppPanel(
      tone: AppPanelTone.accent,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 22),
      radius: 28,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _LibraryCapsule(icon: Icons.dns_rounded, label: serverLabel),
              _LibraryCapsule(
                icon: Icons.favorite_rounded,
                label: '$likedCount liked',
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Good afternoon',
            style: Theme.of(context).textTheme.displayLarge,
          ),
          const SizedBox(height: 10),
          Text(stats, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Text(
            'Pick up where you left off and move quickly between recent '
            'listening, albums, and the queue.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _HomeOverviewPill(
                label: 'Playlists',
                value: '$playlistCount collections',
              ),
              _HomeOverviewPill(
                label: 'Server',
                value: serverLabel,
              ),
            ],
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              FilledButton.icon(
                onPressed: onOpenLibrary,
                icon: const Icon(Icons.library_music_rounded),
                label: const Text('Open library'),
              ),
              OutlinedButton.icon(
                onPressed: onOpenNowPlaying,
                icon: const Icon(Icons.sensors_rounded),
                label: const Text('Now playing'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HomeSignalRail extends StatelessWidget {
  const _HomeSignalRail({
    required this.albumsCount,
    required this.artistsCount,
    required this.likedCount,
    required this.queueCount,
  });

  final int albumsCount;
  final int artistsCount;
  final int likedCount;
  final int queueCount;

  @override
  Widget build(BuildContext context) {
    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      radius: 26,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Overview', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(
            'Library totals and the current listening context.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 18),
          _LibraryMiniMetric(
            label: 'Albums',
            value: '$albumsCount',
            icon: Icons.album_outlined,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Artists',
            value: '$artistsCount',
            icon: Icons.graphic_eq_rounded,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Liked',
            value: '$likedCount',
            icon: Icons.favorite_border_rounded,
          ),
          const SizedBox(height: 10),
          _LibraryMiniMetric(
            label: 'Queue ready',
            value: '$queueCount',
            icon: Icons.queue_music_rounded,
          ),
        ],
      ),
    );
  }
}

class _HomeHeroGrid extends StatelessWidget {
  const _HomeHeroGrid({
    required this.session,
    required this.featuredAlbum,
    required this.featuredSong,
    required this.listenedHours,
    required this.playlistCount,
    required this.likedCount,
    required this.artistsCount,
    required this.recentTracks,
    required this.onPlayFeatured,
  });

  final AppSession session;
  final SubsonicAlbum? featuredAlbum;
  final SubsonicSong? featuredSong;
  final int listenedHours;
  final int playlistCount;
  final int likedCount;
  final int artistsCount;
  final List<SubsonicSong> recentTracks;
  final VoidCallback onPlayFeatured;

  @override
  Widget build(BuildContext context) {
    final heroArtwork = featuredAlbum != null
        ? _albumArtworkUri(session, featuredAlbum!)
        : featuredSong == null
        ? null
        : _songArtworkUri(session, featuredSong!);

    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 1100;
        final heroCard = SizedBox(
          height: stacked ? 390 : 440,
          child: _HeroFeatureCard(
            title: featuredAlbum?.name ?? featuredSong?.title ?? 'No music yet',
            subtitle: featuredAlbum != null
                ? '${featuredAlbum!.artist} · '
                      '${featuredAlbum!.songCount} tracks'
                : featuredSong?.artist ?? 'Pick a track to begin listening',
            artworkUrl: heroArtwork,
            onTap: onPlayFeatured,
          ),
        );

        final utilityGrid = SizedBox(
          height: stacked ? null : 440,
          child: _HeroUtilityGrid(
            listenedHours: listenedHours,
            playlistCount: playlistCount,
            likedCount: likedCount,
            artistsCount: artistsCount,
            highlightSong: featuredSong,
            recentTracks: recentTracks,
            session: session,
          ),
        );

        if (stacked) {
          return Column(
            children: [
              heroCard,
              const SizedBox(height: 14),
              utilityGrid,
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 13, child: heroCard),
            const SizedBox(width: 14),
            Expanded(flex: 8, child: utilityGrid),
          ],
        );
      },
    );
  }
}

class _HeroFeatureCard extends StatelessWidget {
  const _HeroFeatureCard({
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
    final theme = Theme.of(context);

    return AppArtworkToneBuilder(
      artworkUrl: artworkUrl,
      builder: (context, tone) {
        return DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTokens.radiusXl),
            boxShadow: [
              BoxShadow(
                blurRadius: 54,
                spreadRadius: -34,
                offset: const Offset(0, 28),
                color: tone.glow,
              ),
            ],
          ),
          child: AppSelectableTile(
            radius: AppTokens.radiusXl,
            onTap: onTap,
            padding: EdgeInsets.zero,
            backgroundColor: tone.surfaceRaised.withValues(alpha: 0.82),
            borderColor: tone.border.withValues(alpha: 0.72),
            hoverColor: tone.surfaceRaised.withValues(alpha: 0.92),
            hoverBorderColor: tone.border,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (artworkUrl != null)
                  Image.network(
                    artworkUrl.toString(),
                    fit: BoxFit.cover,
                    cacheWidth: 1280,
                    filterQuality: FilterQuality.low,
                  )
                else
                  const _ArtworkBackdrop(),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: tone.heroGradient,
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.08),
                        Colors.black.withValues(alpha: 0.08),
                        Colors.black.withValues(alpha: 0.54),
                      ],
                      stops: const [0, 0.28, 1],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _HeroLabelChip(
                            label: artworkUrl == null
                                ? 'Selection'
                                : 'Featured release',
                            fill: tone.accent.withValues(alpha: 0.18),
                            foreground: Colors.white,
                          ),
                        ],
                      ),
                      const Spacer(),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.displayLarge?.copyWith(
                                color: Colors.white,
                                height: 0.98,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              subtitle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      Row(
                        children: [
                          FilledButton.icon(
                            onPressed: onTap,
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: palette.background,
                              minimumSize: const Size(0, 48),
                            ),
                            icon: const Icon(Icons.play_arrow_rounded),
                            label: const Text('Play now'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HeroUtilityGrid extends StatelessWidget {
  const _HeroUtilityGrid({
    required this.listenedHours,
    required this.playlistCount,
    required this.likedCount,
    required this.artistsCount,
    required this.highlightSong,
    required this.recentTracks,
    required this.session,
  });

  final int listenedHours;
  final int playlistCount;
  final int likedCount;
  final int artistsCount;
  final SubsonicSong? highlightSong;
  final List<SubsonicSong> recentTracks;
  final AppSession session;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth < 480 ? 1 : 2;
        return GridView.count(
          shrinkWrap: true,
          crossAxisCount: columns,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: columns == 1 ? 2.85 : 0.82,
          children: [
            _HeroMetricCard(
              eyebrow: 'Weekly',
              value: '${listenedHours.clamp(1, 99)}h',
              subtitle: 'Listening this week',
              icon: Icons.schedule_rounded,
            ),
            _HeroMetricCard(
              eyebrow: 'Library',
              value: '$artistsCount artists',
              subtitle: '$playlistCount playlists · $likedCount liked',
              icon: Icons.grid_view_rounded,
            ),
            _HeroHighlightCard(
              title: highlightSong?.title ?? 'Fresh queue',
              subtitle: highlightSong?.artist ?? 'Start a track to build flow',
              artworkUrl: highlightSong == null
                  ? null
                  : _songArtworkUri(session, highlightSong!, size: 260),
            ),
            _HeroQueueCard(
              tracks: recentTracks.take(3).toList(growable: false),
            ),
          ],
        );
      },
    );
  }
}

class _HeroLabelChip extends StatelessWidget {
  const _HeroLabelChip({
    required this.label,
    required this.fill,
    required this.foreground,
  });

  final String label;
  final Color fill;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: foreground,
            letterSpacing: 0.28,
          ),
        ),
      ),
    );
  }
}

class _HeroMetricCard extends StatelessWidget {
  const _HeroMetricCard({
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
      tone: AppPanelTone.raised,
      padding: EdgeInsets.zero,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact =
              constraints.maxHeight < 176 || constraints.maxWidth < 200;
          final valueStyle = compact
              ? theme.textTheme.titleLarge?.copyWith(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                )
              : theme.textTheme.headlineMedium;

          return Padding(
            padding: EdgeInsets.all(compact ? 14 : 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: palette.surfaceAccent.withValues(alpha: 0.78),
                    borderRadius: BorderRadius.circular(AppTokens.radiusSm),
                    border: Border.all(color: palette.borderStrong),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(compact ? 7 : 8),
                    child: Icon(
                      icon,
                      size: compact ? 15 : 16,
                      color: palette.accentSoft,
                    ),
                  ),
                ),
                SizedBox(height: compact ? 14 : 20),
                Text(
                  eyebrow.toUpperCase(),
                  style: theme.textTheme.bodySmall?.copyWith(
                    letterSpacing: 0.74,
                  ),
                ),
                const SizedBox(height: 4),
                Text(value, style: valueStyle),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  maxLines: compact ? 1 : 2,
                  overflow: TextOverflow.ellipsis,
                  style: compact
                      ? theme.textTheme.bodySmall?.copyWith(
                          color: palette.textSecondary,
                        )
                      : theme.textTheme.bodyMedium,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HeroHighlightCard extends StatelessWidget {
  const _HeroHighlightCard({
    required this.title,
    required this.subtitle,
    required this.artworkUrl,
  });

  final String title;
  final String subtitle;
  final Uri? artworkUrl;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return AppArtworkToneBuilder(
      artworkUrl: artworkUrl,
      builder: (context, tone) {
        return AppPanel(
          tone: AppPanelTone.raised,
          padding: EdgeInsets.zero,
          backgroundColor: tone.surface.withValues(alpha: 0.82),
          borderColor: tone.border.withValues(alpha: 0.68),
          backgroundGradient: tone.cardGradient,
          boxShadow: [
            ...AppTokens.panelShadow,
            BoxShadow(
              blurRadius: 28,
              spreadRadius: -20,
              offset: const Offset(0, 14),
              color: tone.glow.withValues(alpha: 0.36),
            ),
          ],
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppTokens.radiusLg),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (artworkUrl != null)
                  Align(
                    alignment: Alignment.topRight,
                    child: SizedBox(
                      width: 112,
                      height: 112,
                      child: ClipRRect(
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(AppTokens.radiusMd),
                          topRight: Radius.circular(AppTokens.radiusLg),
                        ),
                        child: Image.network(
                          artworkUrl.toString(),
                          fit: BoxFit.cover,
                          cacheWidth: 320,
                          filterQuality: FilterQuality.low,
                          gaplessPlayback: true,
                          errorBuilder: (context, error, stackTrace) {
                            return DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    tone.surfaceRaised.withValues(alpha: 0.92),
                                    tone.surface.withValues(alpha: 0.92),
                                  ],
                                ),
                              ),
                              child: Icon(
                                Icons.album_rounded,
                                size: 28,
                                color: palette.textSecondary,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomLeft,
                      end: Alignment.topRight,
                      colors: [
                        Colors.black.withValues(alpha: 0.14),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Top this month',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: palette.textPrimary.withValues(alpha: 0.82),
                          letterSpacing: 0.68,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleLarge,
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
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HeroQueueCard extends StatelessWidget {
  const _HeroQueueCard({required this.tracks});

  final List<SubsonicSong> tracks;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return AppPanel(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Queue',
            style: theme.textTheme.bodySmall?.copyWith(letterSpacing: 0.68),
          ),
          const SizedBox(height: 10),
          if (tracks.isEmpty)
            Text(
              'Your queue will appear here after the first playback action.',
              style: theme.textTheme.bodyMedium,
            )
          else
            ...tracks.asMap().entries.map((entry) {
              final index = entry.key;
              final song = entry.value;
              return Padding(
                padding: EdgeInsets.only(
                  bottom: index == tracks.length - 1 ? 0 : 10,
                ),
                child: Row(
                  children: [
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: palette.surfaceAccent.withValues(alpha: 0.82),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 5,
                        ),
                        child: Text(
                          '${index + 1}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: palette.textPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            song.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.labelLarge,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            song.artist,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _QuickPlayTile extends StatelessWidget {
  const _QuickPlayTile({
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
      radius: AppTokens.radiusLg,
      padding: const EdgeInsets.fromLTRB(10, 10, 14, 10),
      backgroundColor: palette.surface.withValues(alpha: 0.64),
      borderColor: palette.border.withValues(alpha: 0.74),
      hoverColor: palette.surfaceRaised.withValues(alpha: 0.86),
      hoverBorderColor: palette.borderStrong.withValues(alpha: 0.92),
      child: Row(
        children: [
          SizedBox(
            width: 62,
            height: 62,
            child: _NowPlayingArtwork(url: artworkUrl, cacheDimension: 200),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          DecoratedBox(
            decoration: BoxDecoration(
              color: palette.surfaceAccent.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: palette.borderStrong),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Icon(
                Icons.play_arrow_rounded,
                color: palette.textPrimary,
                size: 18,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ArtistTile extends StatelessWidget {
  const _ArtistTile({required this.artist});

  final _ArtistSpotlight artist;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);

    return AppPanel(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 14),
      backgroundColor: palette.surface.withValues(alpha: 0.58),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(AppTokens.radiusMd),
            child: SizedBox(
              width: double.infinity,
              height: 122,
              child: artist.artworkUrl == null
                  ? const _ArtworkBackdrop()
                  : Image.network(
                      artist.artworkUrl.toString(),
                      fit: BoxFit.cover,
                      cacheWidth: 360,
                      filterQuality: FilterQuality.low,
                    ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            artist.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.labelLarge,
          ),
          const SizedBox(height: 4),
          Text(
            artist.genre,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: palette.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _AlbumTile extends StatelessWidget {
  const _AlbumTile({
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
      radius: AppTokens.radiusXl,
      padding: const EdgeInsets.all(10),
      backgroundColor: palette.surface.withValues(alpha: 0.62),
      borderColor: palette.border.withValues(alpha: 0.7),
      hoverColor: palette.surfaceRaised.withValues(alpha: 0.86),
      hoverBorderColor: palette.borderStrong.withValues(alpha: 0.88),
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
                    cacheDimension: 420,
                  ),
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.34),
                      borderRadius: BorderRadius.circular(999),
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

class _RecentTrackRow extends StatelessWidget {
  const _RecentTrackRow({
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

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTokens.radiusMd),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            SizedBox(
              width: 26,
              child: Text(
                '$index',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: palette.textMuted,
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              width: 42,
              height: 42,
              child: _NowPlayingArtwork(url: artworkUrl, cacheDimension: 140),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(song.title, style: theme.textTheme.labelLarge),
                  const SizedBox(height: 2),
                  Text(song.artist, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
            const SizedBox(width: 12),
            if (song.isStarred || song.rating > 0)
              DecoratedBox(
                decoration: BoxDecoration(
                  color: palette.surfaceAccent.withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: palette.border),
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
                        color: palette.accent,
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
            const SizedBox(width: 16),
            SizedBox(
              width: 56,
              child: Text(
                formatDuration(song.duration),
                textAlign: TextAlign.right,
                style: theme.textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: compact
                    ? theme.textTheme.titleLarge
                    : theme.textTheme.headlineMedium,
              ),
              const SizedBox(height: 4),
              Text(subtitle, style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
        if (actionLabel != null) ...[
          const SizedBox(width: 12),
          TextButton(
            onPressed: onAction,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  actionLabel!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: palette.textMuted,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.arrow_forward_rounded,
                  size: 14,
                  color: palette.textMuted,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _ArtworkBackdrop extends StatelessWidget {
  const _ArtworkBackdrop();

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            palette.spotlight.withValues(alpha: 0.3),
            palette.backgroundMid,
            palette.accent.withValues(alpha: 0.28),
          ],
        ),
      ),
    );
  }
}
