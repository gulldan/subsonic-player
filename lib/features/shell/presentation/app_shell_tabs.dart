part of 'app_shell_screen.dart';

class _TabContent extends StatelessWidget {
  const _TabContent({required this.tab, required this.controllers});

  final AppTab tab;
  final _ShellControllers controllers;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controllers.library,
      builder: (context, child) {
        final library = controllers.library;
        if (library.loadingDashboard) {
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        }

        if (library.errorMessage != null && library.featuredSongs.isEmpty) {
          return _EmptyState(
            icon: Icons.wifi_off_rounded,
            title: 'Could not load your library',
            description: library.errorMessage!,
          );
        }

        switch (tab) {
          case AppTab.home:
            return _HomeTab(controllers: controllers);
          case AppTab.search:
            return _SearchTab(controllers: controllers);
          case AppTab.library:
            return _LibraryTab(controllers: controllers);
          case AppTab.nowPlaying:
            return _NowPlayingTab(controllers: controllers);
          case AppTab.settings:
            return _SettingsTab(controllers: controllers);
        }
      },
    );
  }
}
