part of 'app_shell_screen.dart';

class _MacosShell extends StatelessWidget {
  const _MacosShell({required this.tab, required this.controllers});

  final AppTab tab;
  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    const tabs = AppTab.values;
    final palette = AppTheme.paletteOf(context);

    return AppAtmosphere(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 1080;

          return MacosScaffold(
            backgroundColor: Colors.transparent,
            children: [
              if (!compact)
                ResizablePane(
                  minSize: 248,
                  startSize: 264,
                  maxSize: 320,
                  resizableSide: ResizableSide.right,
                  builder: (context, scrollController) {
                    return Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
                      child: AppPanel(
                        tone: AppPanelTone.raised,
                        padding: const EdgeInsets.fromLTRB(12, 16, 12, 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 10),
                              child: AppBrandMark(compact: true),
                            ),
                            const SizedBox(height: 18),
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                              ),
                              child: Text(
                                'Browse',
                                style:
                                    MacosTheme.of(
                                      context,
                                    ).typography.footnote.copyWith(
                                      color: palette.textMuted,
                                      letterSpacing: 0.6,
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Flexible(
                              child: SidebarItems(
                                itemSize: SidebarItemSize.large,
                                selectedColor: palette.accent.withValues(
                                  alpha: 0.14,
                                ),
                                unselectedColor: Colors.transparent,
                                scrollController: scrollController,
                                currentIndex: tab.index,
                                onChanged: (index) =>
                                    context.go(tabs[index].route),
                                items: tabs
                                    .map(
                                      (item) => SidebarItem(
                                        leading: Icon(item.icon, size: 16),
                                        label: Text(item.label),
                                      ),
                                    )
                                    .toList(growable: false),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _SidebarNowPlayingLink(
                                  controllers: controllers,
                                ),
                                const SizedBox(height: 10),
                                _SidebarProfileSummary(
                                  session: controllers.session,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ContentArea(
                builder: (context, _) {
                  return Material(
                    type: MaterialType.transparency,
                    child: compact
                        ? _CompactShell(tab: tab, controllers: controllers)
                        : Column(
                            children: [
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.fromLTRB(
                                    30,
                                    26,
                                    26,
                                    0,
                                  ),
                                  child: _TabContent(
                                    tab: tab,
                                    controllers: controllers,
                                  ),
                                ),
                              ),
                              _DesktopPlayerDock(controllers: controllers),
                            ],
                          ),
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DesktopShell extends StatelessWidget {
  const _DesktopShell({required this.tab, required this.controllers});

  final AppTab tab;
  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _DesktopSidebar(tab: tab, controllers: controllers),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(30, 22, 26, 0),
                  child: _TabContent(tab: tab, controllers: controllers),
                ),
              ),
            ],
          ),
        ),
        _DesktopPlayerDock(controllers: controllers),
      ],
    );
  }
}

class _CompactShell extends StatelessWidget {
  const _CompactShell({required this.tab, required this.controllers});

  final AppTab tab;
  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    const tabs = AppTab.values;
    final palette = AppTheme.paletteOf(context);

    return Column(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
            child: _TabContent(tab: tab, controllers: controllers),
          ),
        ),
        _CompactPlayerStrip(controllers: controllers),
        Container(
          decoration: BoxDecoration(
            color: palette.surface.withValues(alpha: 0.94),
            border: Border(top: BorderSide(color: palette.border)),
          ),
          child: NavigationBar(
            backgroundColor: Colors.transparent,
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
        ),
      ],
    );
  }
}
