part of 'app_shell_screen.dart';

class _NowPlayingTab extends StatelessWidget {
  const _NowPlayingTab({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final header = _resolvePlayerHeaderState(controllers.player);
        final progress = _resolvePlayerProgressState(controllers.player);
        final controls = _resolvePlayerControlsState(controllers.player);

        if (!progress.enabled) {
          return const _EmptyState(
            icon: Icons.play_circle_outline_rounded,
            title: 'Nothing is playing',
            description: 'Start a track from Home, Search, or Library.',
          );
        }

        final queue = controllers.player.queue;
        final currentIndex = controllers.player.currentIndex;
        final queueDepth = currentIndex < 0
            ? 0
            : queue.length - currentIndex - 1;
        final nextTracks = currentIndex < 0 || currentIndex >= queue.length - 1
            ? const <PlayerTrack>[]
            : queue.skip(currentIndex + 1).take(5).toList(growable: false);
        final remaining = _remainingDuration(progress);
        final currentPosition = currentIndex < 0 ? 0 : currentIndex + 1;
        final progressLabel = '${(progress.progress * 100).round()}%';

        return AppArtworkToneBuilder(
          artworkUrl: header.artworkUrl,
          builder: (context, tone) {
            return SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 28),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final wide = constraints.maxWidth >= 1380;
                  final medium = constraints.maxWidth >= 1100;
                  final heroPanel = _NowPlayingHeroPanel(
                    artworkUrl: header.artworkUrl,
                    title: header.title,
                    artist: header.artist,
                    tone: tone,
                    queuePosition: currentPosition,
                    queueLength: queue.length,
                    rating: header.rating,
                    queueDepth: queueDepth,
                  );
                  final commandDeck = _NowPlayingCommandDeck(
                    controllers: controllers,
                    header: header,
                    progress: progress,
                    controls: controls,
                    queueDepth: queueDepth,
                    remaining: remaining,
                    progressLabel: progressLabel,
                  );
                  final insightRail = _NowPlayingInsightRail(
                    header: header,
                    progress: progress,
                    controls: controls,
                    queueLength: queue.length,
                    queueDepth: queueDepth,
                    nextTracks: nextTracks,
                    remaining: remaining,
                  );

                  if (wide) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(width: 452, child: heroPanel),
                        const SizedBox(width: 24),
                        Expanded(child: commandDeck),
                        const SizedBox(width: 24),
                        SizedBox(width: 340, child: insightRail),
                      ],
                    );
                  }

                  if (medium) {
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(width: 420, child: heroPanel),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            children: [
                              commandDeck,
                              const SizedBox(height: 20),
                              insightRail,
                            ],
                          ),
                        ),
                      ],
                    );
                  }

                  return Column(
                    children: [
                      heroPanel,
                      const SizedBox(height: 18),
                      commandDeck,
                      const SizedBox(height: 18),
                      insightRail,
                    ],
                  );
                },
              ),
            );
          },
        );
      },
    );
  }
}

class _NowPlayingHeroPanel extends StatelessWidget {
  const _NowPlayingHeroPanel({
    required this.artworkUrl,
    required this.title,
    required this.artist,
    required this.tone,
    required this.queuePosition,
    required this.queueLength,
    required this.rating,
    required this.queueDepth,
  });

  final Uri? artworkUrl;
  final String title;
  final String artist;
  final AppArtworkTone tone;
  final int queuePosition;
  final int queueLength;
  final int rating;
  final int queueDepth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);

    return AppPanel(
      tone: AppPanelTone.accent,
      padding: const EdgeInsets.all(20),
      radius: 28,
      backgroundColor: tone.surfaceRaised.withValues(alpha: 0.82),
      borderColor: tone.border.withValues(alpha: 0.82),
      backgroundGradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          tone.highlight.withValues(alpha: 0.26),
          tone.accent.withValues(alpha: 0.22),
          palette.backgroundDeep,
        ],
        stops: const [0, 0.32, 1],
      ),
      boxShadow: [
        ...AppTokens.panelShadow,
        BoxShadow(
          blurRadius: 44,
          spreadRadius: -24,
          offset: const Offset(0, 24),
          color: tone.glow.withValues(alpha: 0.36),
        ),
      ],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$queuePosition of $queueLength in queue · $queueDepth up next',
            style: theme.textTheme.bodySmall?.copyWith(
              color: Colors.white.withValues(alpha: 0.72),
            ),
          ),
          const SizedBox(height: 18),
          AspectRatio(
            aspectRatio: 0.94,
            child: Stack(
              fit: StackFit.expand,
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppTokens.radiusXl),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.white.withValues(alpha: 0.22),
                        Colors.white.withValues(alpha: 0.05),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          _NowPlayingArtwork(
                            url: artworkUrl,
                            cacheDimension: 1080,
                          ),
                          DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  Colors.transparent,
                                  Colors.black.withValues(alpha: 0.22),
                                  Colors.black.withValues(alpha: 0.48),
                                ],
                                stops: const [0, 0.54, 0.8, 1],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 22,
                  right: 22,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.black.withValues(alpha: 0.34),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.12),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Icon(
                        Icons.graphic_eq_rounded,
                        color: tone.accentSoft,
                        size: 18,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 24,
                  right: 24,
                  bottom: 24,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                      color: Colors.black.withValues(alpha: 0.28),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      child: Row(
                        children: [
                          DecoratedBox(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: tone.accentSoft.withValues(alpha: 0.18),
                            ),
                            child: const Padding(
                              padding: EdgeInsets.all(10),
                              child: Icon(
                                Icons.play_arrow_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              rating > 0
                                  ? 'Rated $rating/5 by you'
                                  : 'Unrated, ready for a first impression',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.headlineLarge?.copyWith(
              color: Colors.white,
              height: 1.02,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            artist,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.titleMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.88),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Playback, queue, and track details in one place.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white.withValues(alpha: 0.78),
            ),
          ),
        ],
      ),
    );
  }
}

class _NowPlayingCommandDeck extends StatelessWidget {
  const _NowPlayingCommandDeck({
    required this.controllers,
    required this.header,
    required this.progress,
    required this.controls,
    required this.queueDepth,
    required this.remaining,
    required this.progressLabel,
  });

  final _ShellControllers controllers;
  final _PlayerHeaderState header;
  final _PlayerProgressState progress;
  final _PlayerControlsState controls;
  final int queueDepth;
  final Duration remaining;
  final String progressLabel;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 22),
      radius: 26,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${_repeatModeLabel(controls.repeatMode)} · '
            '${controls.shuffleEnabled ? 'Shuffle on' : 'Shuffle off'}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 18),
          Text(
            header.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.displayLarge?.copyWith(fontSize: 50),
          ),
          const SizedBox(height: 8),
          Text(
            header.artist,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.titleMedium?.copyWith(
              color: palette.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Transport controls, progress, and queue context.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 22),
          LayoutBuilder(
            builder: (context, constraints) {
              final columns = constraints.maxWidth >= 860 ? 4 : 2;
              final metrics = [
                _NowPlayingMetricTile(
                  label: 'Elapsed',
                  value: formatDuration(progress.position),
                  icon: Icons.timelapse_rounded,
                ),
                _NowPlayingMetricTile(
                  label: 'Remaining',
                  value: formatDuration(remaining),
                  icon: Icons.hourglass_bottom_rounded,
                ),
                _NowPlayingMetricTile(
                  label: 'Queue',
                  value: '$queueDepth upcoming',
                  icon: Icons.queue_music_rounded,
                ),
                _NowPlayingMetricTile(
                  label: 'Progress',
                  value: progressLabel,
                  icon: Icons.linear_scale_rounded,
                ),
              ];

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: metrics.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: columns == 4 ? 2.2 : 2.8,
                ),
                itemBuilder: (context, index) => metrics[index],
              );
            },
          ),
          const SizedBox(height: 22),
          SliderTheme(
            data: Theme.of(context).sliderTheme.copyWith(
              trackHeight: 8,
              thumbShape: const RoundSliderThumbShape(
                enabledThumbRadius: 7,
              ),
              overlayShape: SliderComponentShape.noOverlay,
              inactiveTrackColor: palette.surfaceAccent,
              activeTrackColor: palette.accentStrong,
              thumbColor: palette.accentStrong,
            ),
            child: Slider(
              value: progress.progress,
              onChanged: progress.enabled
                  ? controllers.player.seekToFraction
                  : null,
            ),
          ),
          Row(
            children: [
              Text(
                formatDuration(progress.position),
                style: theme.textTheme.bodySmall,
              ),
              const Spacer(),
              Text(progressLabel, style: theme.textTheme.bodySmall),
              const SizedBox(width: 14),
              Text(
                formatDuration(progress.duration),
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
          const SizedBox(height: 26),
          _LargeTransportControls(
            controllers: controllers,
            controls: controls,
          ),
          const SizedBox(height: 22),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _NowPlayingActionChip(
                label: controls.isFavorite ? 'Liked' : 'Like',
                icon: controls.isFavorite
                    ? Icons.favorite_rounded
                    : Icons.favorite_border_rounded,
                active: controls.isFavorite,
                onTap: controllers.player.toggleFavorite,
              ),
              _NowPlayingActionChip(
                label: 'Dislike',
                icon: Icons.thumb_down_alt_outlined,
                onTap: controllers.player.markDisliked,
              ),
              _NowPlayingActionChip(
                label: controls.shuffleEnabled ? 'Shuffle on' : 'Shuffle',
                icon: Icons.shuffle_rounded,
                active: controls.shuffleEnabled,
                onTap: controllers.player.toggleShuffle,
              ),
              _NowPlayingActionChip(
                label: _repeatModeLabel(controls.repeatMode),
                icon: controls.repeatMode == PlayerRepeatMode.one
                    ? Icons.repeat_one_rounded
                    : Icons.repeat_rounded,
                active: controls.repeatMode != PlayerRepeatMode.off,
                onTap: controllers.player.cycleRepeatMode,
              ),
            ],
          ),
          const SizedBox(height: 24),
          AppPanel(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            backgroundColor: palette.surface.withValues(alpha: 0.52),
            borderColor: palette.border.withValues(alpha: 0.72),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Rating', style: theme.textTheme.bodySmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: List<Widget>.generate(5, (index) {
                    final value = index + 1;
                    final active = value <= header.rating;
                    return IconButton.filledTonal(
                      onPressed: () =>
                          unawaited(controllers.player.setRating(value)),
                      style: IconButton.styleFrom(
                        minimumSize: const Size(42, 42),
                        backgroundColor: active
                            ? palette.accentStrong.withValues(alpha: 0.2)
                            : palette.surfaceAccent.withValues(alpha: 0.76),
                      ),
                      icon: Icon(
                        active
                            ? Icons.star_rounded
                            : Icons.star_outline_rounded,
                        color: active
                            ? palette.accentStrong
                            : palette.textMuted,
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NowPlayingInsightRail extends StatelessWidget {
  const _NowPlayingInsightRail({
    required this.header,
    required this.progress,
    required this.controls,
    required this.queueLength,
    required this.queueDepth,
    required this.nextTracks,
    required this.remaining,
  });

  final _PlayerHeaderState header;
  final _PlayerProgressState progress;
  final _PlayerControlsState controls;
  final int queueLength;
  final int queueDepth;
  final List<PlayerTrack> nextTracks;
  final Duration remaining;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _NowPlayingDetailsPanel(
          header: header,
          progress: progress,
          controls: controls,
          queueLength: queueLength,
          queueDepth: queueDepth,
          remaining: remaining,
        ),
        const SizedBox(height: 18),
        _NowPlayingQueuePanel(
          tracks: nextTracks,
          repeatMode: controls.repeatMode,
          shuffleEnabled: controls.shuffleEnabled,
        ),
      ],
    );
  }
}

class _NowPlayingDetailsPanel extends StatelessWidget {
  const _NowPlayingDetailsPanel({
    required this.header,
    required this.progress,
    required this.controls,
    required this.queueLength,
    required this.queueDepth,
    required this.remaining,
  });

  final _PlayerHeaderState header;
  final _PlayerProgressState progress;
  final _PlayerControlsState controls;
  final int queueLength;
  final int queueDepth;
  final Duration remaining;

  @override
  Widget build(BuildContext context) {
    return AppPanel(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _NowPlayingPanelHeader(
            title: 'Details',
            subtitle: 'Track, duration, and queue context.',
          ),
          const SizedBox(height: 18),
          _NowPlayingMetricRow(
            label: 'Track ID',
            value: _shortTrackId(header.title, header.artist),
          ),
          _NowPlayingMetricRow(
            label: 'Duration',
            value: formatDuration(progress.duration),
          ),
          _NowPlayingMetricRow(
            label: 'Remaining',
            value: formatDuration(remaining),
          ),
          _NowPlayingMetricRow(
            label: 'Queue span',
            value: '$queueLength loaded / $queueDepth pending',
          ),
          _NowPlayingMetricRow(
            label: 'Mood',
            value: controls.isFavorite
                ? 'Starred by you'
                : header.rating > 0
                ? 'Rated ${header.rating}/5'
                : 'Neutral',
          ),
        ],
      ),
    );
  }
}

class _NowPlayingQueuePanel extends StatelessWidget {
  const _NowPlayingQueuePanel({
    required this.tracks,
    required this.repeatMode,
    required this.shuffleEnabled,
  });

  final List<PlayerTrack> tracks;
  final PlayerRepeatMode repeatMode;
  final bool shuffleEnabled;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final upcomingDuration = tracks.fold<Duration>(
      Duration.zero,
      (total, track) => total + track.duration,
    );

    return AppPanel(
      tone: AppPanelTone.raised,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
      radius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _NowPlayingPanelHeader(
            title: 'Up next',
            subtitle: tracks.isEmpty
                ? 'Queue a few more tracks to keep the session going.'
                : '${tracks.length} upcoming, '
                      '${formatDuration(upcomingDuration)} queued ahead.',
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _NowPlayingShellChip(
                icon: Icons.shuffle_rounded,
                label: shuffleEnabled ? 'Shuffle on' : 'Shuffle off',
              ),
              _NowPlayingShellChip(
                icon: Icons.repeat_rounded,
                label: _repeatModeLabel(repeatMode),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (tracks.isEmpty)
            Text(
              'No upcoming tracks yet. Add a few tracks from the library.',
              style: theme.textTheme.bodyMedium,
            )
          else
            Column(
              children: tracks
                  .asMap()
                  .entries
                  .map(
                    (entry) => Padding(
                      padding: EdgeInsets.only(
                        bottom: entry.key == tracks.length - 1 ? 0 : 10,
                      ),
                      child: _NowPlayingQueueRow(
                        index: entry.key + 1,
                        track: entry.value,
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
        ],
      ),
    );
  }
}

class _NowPlayingQueueRow extends StatelessWidget {
  const _NowPlayingQueueRow({
    required this.index,
    required this.track,
  });

  final int index;
  final PlayerTrack track;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return AppPanel(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      radius: AppTokens.radiusMd,
      backgroundColor: palette.surface.withValues(alpha: 0.58),
      borderColor: palette.border.withValues(alpha: 0.74),
      child: Row(
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              color: palette.surfaceAccent.withValues(alpha: 0.86),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Text('$index', style: theme.textTheme.bodySmall),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  track.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelLarge,
                ),
                const SizedBox(height: 2),
                Text(
                  track.artist,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            formatDuration(track.duration),
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _NowPlayingMetricTile extends StatelessWidget {
  const _NowPlayingMetricTile({
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
    final theme = Theme.of(context);

    return AppPanel(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      radius: AppTokens.radiusMd,
      backgroundColor: palette.surface.withValues(alpha: 0.56),
      borderColor: palette.border.withValues(alpha: 0.72),
      child: Row(
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: palette.surfaceAccent.withValues(alpha: 0.86),
              border: Border.all(color: palette.borderStrong),
            ),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Icon(icon, size: 16, color: palette.accentStrong),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label.toUpperCase(), style: theme.textTheme.bodySmall),
                const SizedBox(height: 4),
                Text(value, style: theme.textTheme.labelLarge),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NowPlayingMetricRow extends StatelessWidget {
  const _NowPlayingMetricRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 88,
            child: Text(label, style: theme.textTheme.bodySmall),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class _NowPlayingPanelHeader extends StatelessWidget {
  const _NowPlayingPanelHeader({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: theme.textTheme.titleLarge),
        const SizedBox(height: 4),
        Text(subtitle, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}

class _NowPlayingShellChip extends StatelessWidget {
  const _NowPlayingShellChip({
    required this.icon,
    required this.label,
  });

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

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
              style: theme.textTheme.bodySmall?.copyWith(
                color: palette.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NowPlayingActionChip extends StatelessWidget {
  const _NowPlayingActionChip({
    required this.label,
    required this.icon,
    required this.onTap,
    this.active = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return AppSelectableTile(
      selected: active,
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      radius: AppTokens.radiusMd,
      backgroundColor: palette.surface.withValues(alpha: 0.52),
      borderColor: palette.border.withValues(alpha: 0.74),
      selectedColor: palette.accent.withValues(alpha: 0.16),
      selectedBorderColor: palette.accentStrong.withValues(alpha: 0.44),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: active ? palette.accentStrong : palette.textSecondary,
          ),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
    );
  }
}

class _LargeTransportControls extends StatelessWidget {
  const _LargeTransportControls({
    required this.controllers,
    required this.controls,
  });

  final _ShellControllers controllers;
  final _PlayerControlsState controls;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        _TransportIconButton(
          onPressed: controllers.player.toggleShuffle,
          icon: Icons.shuffle_rounded,
          active: controls.shuffleEnabled,
        ),
        _TransportIconButton(
          onPressed: controllers.player.skipPrevious,
          icon: Icons.skip_previous_rounded,
        ),
        FilledButton(
          onPressed: controllers.player.togglePlayback,
          style: FilledButton.styleFrom(
            shape: const CircleBorder(),
            minimumSize: const Size(82, 82),
            backgroundColor: palette.accentStrong,
            foregroundColor: palette.backgroundDeep,
          ),
          child: Icon(
            controls.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
            size: 34,
          ),
        ),
        _TransportIconButton(
          onPressed: controllers.player.skipNext,
          icon: Icons.skip_next_rounded,
        ),
        _TransportIconButton(
          onPressed: controllers.player.cycleRepeatMode,
          icon: controls.repeatMode == PlayerRepeatMode.one
              ? Icons.repeat_one_rounded
              : Icons.repeat_rounded,
          active: controls.repeatMode != PlayerRepeatMode.off,
        ),
      ],
    );
  }
}

class _TransportIconButton extends StatelessWidget {
  const _TransportIconButton({
    required this.onPressed,
    required this.icon,
    this.active = false,
  });

  final VoidCallback onPressed;
  final IconData icon;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return IconButton.filledTonal(
      onPressed: onPressed,
      style: IconButton.styleFrom(
        minimumSize: const Size(54, 54),
        backgroundColor: active
            ? palette.accentStrong.withValues(alpha: 0.18)
            : palette.surfaceAccent.withValues(alpha: 0.82),
      ),
      icon: Icon(
        icon,
        color: active ? palette.accentStrong : palette.textSecondary,
      ),
    );
  }
}

String _repeatModeLabel(PlayerRepeatMode mode) {
  return switch (mode) {
    PlayerRepeatMode.off => 'Repeat off',
    PlayerRepeatMode.all => 'Repeat all',
    PlayerRepeatMode.one => 'Repeat one',
  };
}

Duration _remainingDuration(_PlayerProgressState progress) {
  final remaining = progress.duration - progress.position;
  if (remaining.isNegative) {
    return Duration.zero;
  }
  return remaining;
}

String _shortTrackId(String title, String artist) {
  final titleHash = title.hashCode.abs().toRadixString(16).padLeft(5, '0');
  final artistHash = artist.hashCode.abs().toRadixString(16).padLeft(5, '0');
  return '${titleHash.substring(0, 5)}-${artistHash.substring(0, 5)}';
}
