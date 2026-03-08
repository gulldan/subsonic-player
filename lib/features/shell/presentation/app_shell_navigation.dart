part of 'app_shell_screen.dart';

class _DesktopSidebar extends StatelessWidget {
  const _DesktopSidebar({required this.tab, required this.controllers});

  final AppTab tab;
  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    const tabs = AppTab.values;
    final palette = AppTheme.paletteOf(context);

    return SizedBox(
      width: 264,
      child: Padding(
        padding: const EdgeInsets.only(right: 18),
        child: AppPanel(
          tone: AppPanelTone.raised,
          padding: const EdgeInsets.fromLTRB(14, 18, 14, 14),
          backgroundColor: palette.surface.withValues(alpha: 0.66),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10),
                child: AppBrandMark(compact: true),
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text(
                  'Browse',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    letterSpacing: 0.7,
                    fontWeight: FontWeight.w700,
                    color: palette.textMuted,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              ...tabs.map((item) {
                final selected = item == tab;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _SidebarDestination(
                    selected: selected,
                    icon: item.icon,
                    label: item.label,
                    onTap: () => context.go(item.route),
                  ),
                );
              }),
              const Spacer(),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _SidebarNowPlayingLink(controllers: controllers),
                  const SizedBox(height: 12),
                  _SidebarProfileSummary(session: controllers.session),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SidebarNowPlayingLink extends StatelessWidget {
  const _SidebarNowPlayingLink({required this.controllers});

  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final palette = AppTheme.paletteOf(context);

    return ListenableBuilder(
      listenable: controllers.player,
      builder: (context, child) {
        final state = _resolvePlayerHeaderState(controllers.player);
        if (state.title == 'No track selected') {
          return const SizedBox.shrink();
        }

        return AppArtworkToneBuilder(
          artworkUrl: state.artworkUrl,
          builder: (context, tone) {
            return AppSelectableTile(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
              radius: AppTokens.radiusLg,
              onTap: () => context.go(AppRoutes.nowPlaying),
              backgroundColor: tone.surface.withValues(alpha: 0.7),
              borderColor: tone.border.withValues(alpha: 0.68),
              hoverColor: tone.surfaceRaised.withValues(alpha: 0.82),
              hoverBorderColor: tone.border,
              child: Row(
                children: [
                  SizedBox(
                    width: 42,
                    height: 42,
                    child: _NowPlayingArtwork(
                      url: state.artworkUrl,
                      cacheDimension: 160,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Now playing',
                          style: theme.textTheme.bodySmall?.copyWith(
                            letterSpacing: 0.66,
                            color: palette.textMuted,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          state.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.labelLarge,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          state.artist,
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
          },
        );
      },
    );
  }
}

class _SidebarProfileSummary extends StatelessWidget {
  const _SidebarProfileSummary({required this.session});

  final AppSession session;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);
    final theme = Theme.of(context);
    final userLabel = _userDisplayLabel(session);

    return AppPanel(
      tone: AppPanelTone.accent,
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      child: Row(
        children: [
          AppUserBadge(
            label: userLabel,
            fillColor: palette.accent.withValues(alpha: 0.18),
            borderColor: palette.accent.withValues(alpha: 0.34),
            textColor: palette.textPrimary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: palette.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _serverDisplayLabel(session),
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
  }
}

class _SidebarDestination extends StatelessWidget {
  const _SidebarDestination({
    required this.selected,
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final bool selected;
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.paletteOf(context);

    return AppSelectableTile(
      selected: selected,
      onTap: onTap,
      backgroundColor: Colors.transparent,
      borderColor: Colors.transparent,
      hoverColor: palette.surfaceAccent.withValues(alpha: 0.46),
      hoverBorderColor: palette.border.withValues(alpha: 0.24),
      selectedColor: palette.accent.withValues(alpha: 0.16),
      selectedBorderColor: palette.accent.withValues(alpha: 0.34),
      child: Row(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOutCubic,
            width: 4,
            height: 18,
            decoration: BoxDecoration(
              color: selected ? palette.accent : Colors.transparent,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(width: 10),
          Icon(
            icon,
            size: 17,
            color: selected ? palette.accent : palette.textSecondary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? palette.textPrimary : palette.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
