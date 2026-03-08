import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/auth/presentation/login_screen.dart';
import 'package:flutter_sonicwave/features/bootstrap/screens/bootstrap_screen.dart';
import 'package:flutter_sonicwave/features/library/presentation/library_view_model.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/shell/presentation/app_shell_screen.dart';
import 'package:go_router/go_router.dart';

/// Route paths used by the application shell.
class AppRoutes {
  const AppRoutes._();

  /// Bootstrap page shown while the session is being restored.
  static const String bootstrap = '/boot';

  /// Sign-in page for Subsonic credentials.
  static const String login = '/login';

  /// Default authenticated landing page.
  static const String home = '/app/home';

  /// Search page for artists, albums, and tracks.
  static const String search = '/app/search';

  /// Library page with tracks, albums, and playlists.
  static const String library = '/app/library';

  /// Dedicated full-size player page.
  static const String nowPlaying = '/app/now-playing';

  /// Settings page.
  static const String settings = '/app/settings';
}

/// Builds the application router with explicit state dependencies.
GoRouter buildRouter({
  required AppSession session,
  required PlayerViewModel playerViewModel,
  required LibraryViewModel libraryViewModel,
}) {
  return GoRouter(
    initialLocation: AppRoutes.bootstrap,
    refreshListenable: session,
    redirect: (context, state) {
      final isBootstrapPage = state.matchedLocation == AppRoutes.bootstrap;

      if (session.status == AppSessionStatus.bootstrapping) {
        return isBootstrapPage ? null : AppRoutes.bootstrap;
      }

      final isLoggedIn = session.status == AppSessionStatus.authenticated;
      final isLoginPage = state.matchedLocation == AppRoutes.login;

      if (isBootstrapPage) {
        return isLoggedIn ? AppRoutes.home : AppRoutes.login;
      }
      if (!isLoggedIn && !isLoginPage) {
        return AppRoutes.login;
      }
      if (isLoggedIn && isLoginPage) {
        return AppRoutes.home;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.bootstrap,
        pageBuilder: (context, state) =>
            const NoTransitionPage<void>(child: BootstrapScreen()),
      ),
      GoRoute(
        path: AppRoutes.login,
        pageBuilder: (context, state) => NoTransitionPage<void>(
          child: LoginScreen(session: session),
        ),
      ),
      GoRoute(
        path: AppRoutes.home,
        pageBuilder: (context, state) => NoTransitionPage<void>(
          child: AppShellScreen(
            tab: AppTab.home,
            session: session,
            playerViewModel: playerViewModel,
            libraryViewModel: libraryViewModel,
          ),
        ),
      ),
      GoRoute(
        path: AppRoutes.search,
        pageBuilder: (context, state) => NoTransitionPage<void>(
          child: AppShellScreen(
            tab: AppTab.search,
            session: session,
            playerViewModel: playerViewModel,
            libraryViewModel: libraryViewModel,
          ),
        ),
      ),
      GoRoute(
        path: AppRoutes.library,
        pageBuilder: (context, state) => NoTransitionPage<void>(
          child: AppShellScreen(
            tab: AppTab.library,
            session: session,
            playerViewModel: playerViewModel,
            libraryViewModel: libraryViewModel,
          ),
        ),
      ),
      GoRoute(
        path: AppRoutes.nowPlaying,
        pageBuilder: (context, state) => NoTransitionPage<void>(
          child: AppShellScreen(
            tab: AppTab.nowPlaying,
            session: session,
            playerViewModel: playerViewModel,
            libraryViewModel: libraryViewModel,
          ),
        ),
      ),
      GoRoute(
        path: AppRoutes.settings,
        pageBuilder: (context, state) => NoTransitionPage<void>(
          child: AppShellScreen(
            tab: AppTab.settings,
            session: session,
            playerViewModel: playerViewModel,
            libraryViewModel: libraryViewModel,
          ),
        ),
      ),
    ],
  );
}
