part of 'app_shell_screen.dart';

class _DesktopPlayerDock extends StatelessWidget {
  const _DesktopPlayerDock({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final artworkUrl = controllers.player.track?.coverArtUrl;
        return AppArtworkToneBuilder(
          artworkUrl: artworkUrl,
          builder: (context, tone) {
            return SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                child: AppPanel(
                  tone: AppPanelTone.raised,
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                  backgroundColor: tone.surface.withValues(alpha: 0.78),
                  borderColor: tone.border.withValues(alpha: 0.68),
                  backgroundGradient: tone.cardGradient,
                  boxShadow: [
                    ...AppTokens.panelShadow,
                    BoxShadow(
                      blurRadius: 24,
                      spreadRadius: -18,
                      offset: const Offset(0, 12),
                      color: tone.glow.withValues(alpha: 0.34),
                    ),
                  ],
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            flex: 4,
                            child: AppPanel(
                              padding: const EdgeInsets.fromLTRB(
                                12,
                                12,
                                10,
                                12,
                              ),
                              backgroundColor: tone.surfaceRaised.withValues(
                                alpha: 0.72,
                              ),
                              borderColor: tone.border.withValues(alpha: 0.52),
                              child: _PlayerTrackSummary(
                                controllers: controllers,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            flex: 4,
                            child: AppPanel(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                              backgroundColor: tone.surfaceRaised.withValues(
                                alpha: 0.68,
                              ),
                              borderColor: tone.border.withValues(alpha: 0.48),
                              child: _PlayerTransportRow(
                                controllers: controllers,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            flex: 5,
                            child: AppPanel(
                              padding: const EdgeInsets.fromLTRB(
                                14,
                                10,
                                14,
                                10,
                              ),
                              backgroundColor: tone.surfaceRaised.withValues(
                                alpha: 0.68,
                              ),
                              borderColor: tone.border.withValues(alpha: 0.48),
                              child: _PlayerProgressSummary(
                                controllers: controllers,
                              ),
                            ),
                          ),
                        ],
                      ),
                      _DesktopPlayerError(controllers: controllers),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _CompactPlayerStrip extends StatelessWidget {
  const _CompactPlayerStrip({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);

    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final state = _resolvePlayerHeaderState(controllers.player);
        if (state.title == 'No track selected') {
          return const SizedBox.shrink();
        }

        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
            child: AppPanel(
              padding: const EdgeInsets.fromLTRB(10, 10, 12, 10),
              child: Row(
                children: [
                  SizedBox(
                    width: 48,
                    height: 48,
                    child: _NowPlayingArtwork(
                      url: state.artworkUrl,
                      cacheDimension: 180,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          state.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.labelLarge,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          state.artist,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  IconButton.filled(
                    onPressed: controllers.player.togglePlayback,
                    style: IconButton.styleFrom(
                      backgroundColor: palette.accent,
                      foregroundColor: palette.background,
                    ),
                    icon: Icon(
                      controllers.player.isPlaying
                          ? Icons.pause_rounded
                          : Icons.play_arrow_rounded,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _PlayerTrackSummary extends StatelessWidget {
  const _PlayerTrackSummary({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);

    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final state = _resolvePlayerHeaderState(controllers.player);
        return InkWell(
          onTap: () => context.go(AppRoutes.nowPlaying),
          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
          child: Row(
            children: [
              SizedBox(
                width: 56,
                height: 56,
                child: _NowPlayingArtwork(
                  url: state.artworkUrl,
                  cacheDimension: 200,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      state.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      state.artist,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: controllers.player.toggleFavorite,
                icon: Icon(
                  controllers.player.isFavorite
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                  color: controllers.player.isFavorite
                      ? palette.accent
                      : palette.textSecondary,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PlayerTransportRow extends StatelessWidget {
  const _PlayerTransportRow({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final state = _resolvePlayerControlsState(controllers.player);
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _DockControlButton(
              onPressed: controllers.player.toggleShuffle,
              icon: Icons.shuffle_rounded,
              active: state.shuffleEnabled,
            ),
            const SizedBox(width: 8),
            _DockControlButton(
              onPressed: controllers.player.skipPrevious,
              icon: Icons.skip_previous_rounded,
            ),
            const SizedBox(width: 10),
            FilledButton(
              onPressed: controllers.player.togglePlayback,
              style: FilledButton.styleFrom(
                shape: const CircleBorder(),
                minimumSize: const Size(54, 54),
                backgroundColor: Colors.white,
                foregroundColor: palette.background,
                padding: EdgeInsets.zero,
              ),
              child: Icon(
                state.isPlaying
                    ? Icons.pause_rounded
                    : Icons.play_arrow_rounded,
              ),
            ),
            const SizedBox(width: 10),
            _DockControlButton(
              onPressed: controllers.player.skipNext,
              icon: Icons.skip_next_rounded,
            ),
            const SizedBox(width: 8),
            _DockControlButton(
              onPressed: controllers.player.cycleRepeatMode,
              icon: state.repeatMode == PlayerRepeatMode.one
                  ? Icons.repeat_one_rounded
                  : Icons.repeat_rounded,
              active: state.repeatMode != PlayerRepeatMode.off,
            ),
          ],
        );
      },
    );
  }
}

class _DockControlButton extends StatelessWidget {
  const _DockControlButton({
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
        backgroundColor: active
            ? palette.accent.withValues(alpha: 0.18)
            : palette.surfaceAccent.withValues(alpha: 0.74),
      ),
      icon: Icon(
        icon,
        color: active ? palette.accentSoft : palette.textSecondary,
      ),
    );
  }
}

class _PlayerProgressSummary extends StatelessWidget {
  const _PlayerProgressSummary({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final state = _resolvePlayerProgressState(controllers.player);
        final queueSize = controllers.player.queue.length;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Playback',
                  style: theme.textTheme.bodySmall?.copyWith(
                    letterSpacing: 0.72,
                  ),
                ),
                const Spacer(),
                Text(
                  '$queueSize in queue',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  formatDuration(state.position),
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: SliderTheme(
                    data: Theme.of(context).sliderTheme.copyWith(
                      trackHeight: 4,
                      thumbShape: const RoundSliderThumbShape(
                        enabledThumbRadius: 5,
                      ),
                    ),
                    child: Slider(
                      value: state.progress,
                      onChanged: state.enabled
                          ? controllers.player.seekToFraction
                          : null,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  formatDuration(state.duration),
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _DesktopPlayerError extends StatelessWidget {
  const _DesktopPlayerError({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final errorMessage = controllers.player.errorMessage;
        if (errorMessage == null) {
          return const SizedBox.shrink();
        }

        return Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              errorMessage,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: palette.danger,
              ),
            ),
          ),
        );
      },
    );
  }
}
