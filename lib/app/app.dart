import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/router/app_router.dart';
import 'package:flutter_sonicwave/app/theme/app_theme.dart';
import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/data/shared_prefs_server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/library/presentation/library_view_model.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

class SonicWaveApp extends StatefulWidget {
  const SonicWaveApp({
    super.key,
    this.session,
    this.playerViewModel,
    this.libraryViewModel,
    this.router,
    this.profileStore,
    this.clientFactory,
  });

  final AppSession? session;
  final PlayerViewModel? playerViewModel;
  final LibraryViewModel? libraryViewModel;
  final GoRouter? router;
  final ServerProfileStore? profileStore;
  final SubsonicClientFactory? clientFactory;

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

  @override
  void initState() {
    super.initState();

    _session =
        widget.session ??
        AppSession(
          profileStore: widget.profileStore ?? SharedPrefsServerProfileStore(),
          clientFactory:
              widget.clientFactory ?? ((profile) => SubsonicClient(profile)),
        );
    _ownsSession = widget.session == null;

    _playerViewModel = widget.playerViewModel ?? PlayerViewModel();
    _ownsPlayer = widget.playerViewModel == null;
    _playerViewModel.attachSession(_session);

    _libraryViewModel = widget.libraryViewModel ?? LibraryViewModel();
    _ownsLibrary = widget.libraryViewModel == null;
    _libraryViewModel.attach(session: _session, player: _playerViewModel);

    _router = widget.router ?? buildRouter(_session);
    _ownsRouter = widget.router == null;

    if (_ownsSession) {
      _session.bootstrap();
    }
  }

  @override
  void dispose() {
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
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AppSession>.value(value: _session),
        ChangeNotifierProvider<PlayerViewModel>.value(value: _playerViewModel),
        ChangeNotifierProvider<LibraryViewModel>.value(
          value: _libraryViewModel,
        ),
      ],
      child: MaterialApp.router(
        title: 'SonicWave',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.build(),
        routerConfig: _router,
      ),
    );
  }
}
