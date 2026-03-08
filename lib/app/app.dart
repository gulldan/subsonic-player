import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_sonicwave/app/platform/macos_desktop_integration.dart';
import 'package:flutter_sonicwave/app/platform/macos_platform_menu_bar.dart';
import 'package:flutter_sonicwave/app/platform_ui_scope.dart';
import 'package:flutter_sonicwave/app/router/app_router.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/data/shared_prefs_server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/library/presentation/library_view_model.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:go_router/go_router.dart';
import 'package:macos_ui/macos_ui.dart';

/// Root application widget that wires routing, state, and platform UI.
class SonicWaveApp extends StatefulWidget {
  /// Creates the root application widget.
  const SonicWaveApp({
    super.key,
    this.session,
    this.playerViewModel,
    this.libraryViewModel,
    this.router,
    this.profileStore,
    this.clientFactory,
    this.useMacosUi,
  });

  /// Optional session instance used for tests or custom composition.
  final AppSession? session;

  /// Optional player state used for tests or custom composition.
  final PlayerViewModel? playerViewModel;

  /// Optional library state used for tests or custom composition.
  final LibraryViewModel? libraryViewModel;

  /// Optional prebuilt router configuration.
  final GoRouter? router;

  /// Optional profile store override.
  final ServerProfileStore? profileStore;

  /// Optional Subsonic client factory override.
  final SubsonicClientFactory? clientFactory;

  /// Forces the macOS shell when set.
  final bool? useMacosUi;

  @override
  State<SonicWaveApp> createState() => _SonicWaveAppState();
}

class _SonicWaveAppState extends State<SonicWaveApp> {
  late final bool _ownsSession;
  late final bool _ownsPlayer;
  late final bool _ownsLibrary;
  late final bool _ownsRouter;
  late final AppSession _session;
  late final PlayerViewModel _playerViewModel;
  late final LibraryViewModel _libraryViewModel;
  late final GoRouter _router;
  MacosDesktopIntegration? _desktopIntegration;

  @override
  void initState() {
    super.initState();

    _session =
        widget.session ??
        AppSession(
          profileStore: widget.profileStore ?? SharedPrefsServerProfileStore(),
          clientFactory: widget.clientFactory ?? SubsonicClient.new,
        );
    _ownsSession = widget.session == null;

    _playerViewModel = widget.playerViewModel ?? PlayerViewModel();
    _ownsPlayer = widget.playerViewModel == null;
    _playerViewModel.attachSession(_session);

    _libraryViewModel = widget.libraryViewModel ?? LibraryViewModel();
    _ownsLibrary = widget.libraryViewModel == null;
    _libraryViewModel.attach(session: _session, player: _playerViewModel);

    _router =
        widget.router ??
        buildRouter(
          session: _session,
          playerViewModel: _playerViewModel,
          libraryViewModel: _libraryViewModel,
        );
    _ownsRouter = widget.router == null;

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.macOS) {
      _desktopIntegration = MacosDesktopIntegration(
        session: _session,
        player: _playerViewModel,
      );
    }

    if (_ownsSession) {
      unawaited(_session.bootstrap());
    }
  }

  @override
  void dispose() {
    if (_desktopIntegration case final integration?) {
      unawaited(integration.dispose());
    }
    if (_ownsRouter) {
      _router.dispose();
    }
    if (_ownsPlayer) {
      _playerViewModel.dispose();
    }
    if (_ownsLibrary) {
      _libraryViewModel.dispose();
    }
    if (_ownsSession) {
      _session.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final useMacosUi = widget.useMacosUi ?? false;

    if (useMacosUi) {
      return MacosApp.router(
        title: 'Aurio',
        debugShowCheckedModeBanner: false,
        themeMode: ThemeMode.dark,
        theme: AppTheme.buildMacos(Brightness.dark),
        darkTheme: AppTheme.buildMacos(Brightness.dark),
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
        ],
        routerConfig: _router,
        builder: (context, child) {
          return MacosPlatformMenuBar(
            session: _session,
            player: _playerViewModel,
            library: _libraryViewModel,
            router: _router,
            child: MacosWindow(
              disableWallpaperTinting: true,
              child: PlatformUiScope(
                useMacosUi: true,
                child: child ?? const SizedBox.shrink(),
              ),
            ),
          );
        },
      );
    }

    return MaterialApp.router(
      title: 'Aurio',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      theme: AppTheme.buildMaterial(Brightness.dark),
      darkTheme: AppTheme.buildMaterial(Brightness.dark),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      routerConfig: _router,
      builder: (context, child) {
        return MacosPlatformMenuBar(
          session: _session,
          player: _playerViewModel,
          library: _libraryViewModel,
          router: _router,
          child: PlatformUiScope(
            useMacosUi: false,
            child: child ?? const SizedBox.shrink(),
          ),
        );
      },
    );
  }
}
