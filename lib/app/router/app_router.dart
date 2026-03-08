import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/auth/presentation/login_screen.dart';
import 'package:flutter_sonicwave/features/shell/presentation/app_shell_screen.dart';
import 'package:go_router/go_router.dart';

class AppRoutes {
  const AppRoutes._();

  static const String login = '/login';
  static const String home = '/app/home';
  static const String collections = '/app/collections';
  static const String playlists = '/app/playlists';
  static const String settings = '/app/settings';
}

GoRouter buildRouter(AppSession session) {
  return GoRouter(
    initialLocation: AppRoutes.login,
    refreshListenable: session,
    redirect: (context, state) {
      if (session.status == AppSessionStatus.bootstrapping) {
        return state.matchedLocation == AppRoutes.login
            ? null
            : AppRoutes.login;
      }

      final isLoggedIn = session.status == AppSessionStatus.authenticated;
      final isLoginPage = state.matchedLocation == AppRoutes.login;

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
        path: AppRoutes.login,
        pageBuilder: (context, state) =>
            const NoTransitionPage<void>(child: LoginScreen()),
      ),
      GoRoute(
        path: AppRoutes.home,
        pageBuilder: (context, state) => const NoTransitionPage<void>(
          child: AppShellScreen(tab: AppTab.home),
        ),
      ),
      GoRoute(
        path: AppRoutes.collections,
        pageBuilder: (context, state) => const NoTransitionPage<void>(
          child: AppShellScreen(tab: AppTab.collections),
        ),
      ),
      GoRoute(
        path: AppRoutes.playlists,
        pageBuilder: (context, state) => const NoTransitionPage<void>(
          child: AppShellScreen(tab: AppTab.playlists),
        ),
      ),
      GoRoute(
        path: AppRoutes.settings,
        pageBuilder: (context, state) => const NoTransitionPage<void>(
          child: AppShellScreen(tab: AppTab.settings),
        ),
      ),
    ],
  );
}
