import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/app.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macos_ui/macos_ui.dart';

import 'support/fakes.dart';

void main() {
  testWidgets('shows login form when user is signed out', (tester) async {
    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi();
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    final app = SonicWaveApp(
      session: session,
      playerViewModel: playerViewModel,
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    expect(find.text('Log in to your Subsonic server'), findsOneWidget);
    expect(find.text('Connect and open player'), findsOneWidget);
    expect(find.text('Server URL'), findsOneWidget);
  });

  testWidgets('keeps material shell by default on macos platform', (
    tester,
  ) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.macOS;

    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi();
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    await tester.pumpWidget(
      SonicWaveApp(
        session: session,
        playerViewModel: playerViewModel,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(MacosScaffold), findsNothing);
    expect(find.byType(MaterialApp), findsOneWidget);

    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('shows bootstrap screen before restoring persisted session', (
    tester,
  ) async {
    final store = InMemoryServerProfileStore()
      ..profile = const ServerProfile(
        baseUrl: 'https://demo.navidrome.org',
        username: 'demo',
        password: 'demo',
      );
    final fakeApi = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: 'boot-song',
          title: 'Boot Track',
          artist: 'Boot Artist',
          duration: Duration(minutes: 3),
        ),
      ],
    );

    await tester.pumpWidget(
      SonicWaveApp(
        profileStore: store,
        clientFactory: (_) => fakeApi,
        playerViewModel: PlayerViewModel(audioEngine: FakePlayerAudioEngine()),
      ),
    );

    expect(find.text('Restoring session...'), findsOneWidget);

    await tester.pumpAndSettle();

    expect(find.text('Quick play'), findsOneWidget);
    expect(find.text('Boot Track'), findsAtLeastNWidgets(1));
  });

  testWidgets('renders macos scaffold when macos UI mode is enabled', (
    tester,
  ) async {
    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: 'm1',
          title: 'Mac Track',
          artist: 'Native Artist',
          duration: Duration(minutes: 4),
        ),
      ],
    );
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    final app = SonicWaveApp(
      session: session,
      playerViewModel: playerViewModel,
      useMacosUi: true,
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();
    expect(find.byType(MacosScaffold), findsOneWidget);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await tester.pumpAndSettle();

    expect(find.byType(MacosScaffold), findsOneWidget);
    expect(find.text('Good afternoon'), findsOneWidget);
    expect(find.byType(ToolBar), findsNothing);
    expect(find.text('Native macOS tuned UI'), findsNothing);
  });

  testWidgets('renders wide macos layout with sidebar navigation', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1720, 1080);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: 'mw1',
          title: 'Wide Track',
          artist: 'Wide Artist',
          duration: Duration(minutes: 5),
        ),
      ],
    );
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    final app = SonicWaveApp(
      session: session,
      playerViewModel: playerViewModel,
      useMacosUi: true,
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    expect(
      find.text('Subsonic access with a calmer, sharper shell.'),
      findsOneWidget,
    );
    expect(
      find.text('Design primitives now live outside feature code'),
      findsOneWidget,
    );

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await tester.pumpAndSettle();

    expect(find.byType(SidebarItems), findsOneWidget);
    expect(find.text('Home'), findsAtLeastNWidgets(1));
    expect(find.text('Wide Track'), findsAtLeastNWidgets(1));
  });

  testWidgets('navigates to desktop shell after successful sign in', (
    tester,
  ) async {
    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: '123',
          title: 'Synthwave Ride',
          artist: 'Night Driver',
          duration: Duration(minutes: 3, seconds: 20),
          coverArt: 'cover123',
        ),
      ],
    );
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    final app = SonicWaveApp(
      session: session,
      playerViewModel: playerViewModel,
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );

    await tester.pumpAndSettle();

    expect(find.text('Quick play'), findsOneWidget);
    expect(find.text('Synthwave Ride'), findsAtLeastNWidgets(1));
    expect(find.text('Night Driver'), findsAtLeastNWidgets(1));
  });

  testWidgets('shows connection error details when sign in fails', (
    tester,
  ) async {
    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(callError: Exception('401 unauthorized'));
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    final app = SonicWaveApp(
      session: session,
      playerViewModel: playerViewModel,
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    final submitButton = find.text('Connect and open player');
    await tester.ensureVisible(submitButton);
    await tester.tap(submitButton);
    await tester.pumpAndSettle();

    expect(find.textContaining('Technical details'), findsOneWidget);
    expect(find.textContaining('401 unauthorized'), findsOneWidget);
  });

  testWidgets('uses desktop layout without vertical scroll in player', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(2880, 1800);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: '777',
          title: 'Desktop Track',
          artist: 'Desktop Artist',
          duration: Duration(minutes: 4),
          coverArt: 'cover777',
        ),
      ],
    );
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    final app = SonicWaveApp(
      session: session,
      playerViewModel: playerViewModel,
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await tester.pumpAndSettle();

    expect(find.text('Desktop Track'), findsAtLeastNWidgets(1));
    expect(find.text('Library'), findsAtLeastNWidgets(1));
    expect(find.text('Now Playing'), findsAtLeastNWidgets(1));
  });

  testWidgets('desktop shell supports navigation and player actions', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(2880, 1800);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    const playlist = SubsonicPlaylist(
      id: 'playlist-1',
      name: 'Favorites',
      songCount: 1,
      duration: Duration(minutes: 3),
    );
    const playlistSong = SubsonicSong(
      id: 'playlist-song',
      title: 'Playlist Song',
      artist: 'Playlist Artist',
      duration: Duration(minutes: 3),
    );
    const album = SubsonicAlbum(
      id: 'album-1',
      name: 'Album One',
      artist: 'Album Artist',
      songCount: 8,
    );

    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: 'desktop-song',
          title: 'Desktop Controls Song',
          artist: 'Desktop Artist',
          duration: Duration(minutes: 4),
          coverArt: 'cover-d',
        ),
      ],
      albums: const [album],
      playlists: const [playlist],
      playlistSongsById: const {
        'playlist-1': [playlistSong],
      },
    );
    final session = AppSession(
      profileStore: store,
      clientFactory: (_) => fakeApi,
    );
    await session.bootstrap();
    final playerViewModel = PlayerViewModel(
      audioEngine: FakePlayerAudioEngine(),
    );

    final app = SonicWaveApp(
      session: session,
      playerViewModel: playerViewModel,
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('Library').first);
    await tester.pumpAndSettle();
    expect(find.text('Tracks'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('Playlists').first);
    await tester.pumpAndSettle();
    expect(find.text('Favorites'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('Settings').first);
    await tester.pumpAndSettle();
    expect(find.text('Settings'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('Now Playing').first);
    await tester.pumpAndSettle();

    final likeTrack = find.text('Like').first;
    await tester.ensureVisible(likeTrack);
    await tester.tap(likeTrack);
    await tester.pumpAndSettle();
    expect(fakeApi.starCount, 1);

    final unlikeTrack = find.text('Liked').first;
    await tester.ensureVisible(unlikeTrack);
    await tester.tap(unlikeTrack);
    await tester.pumpAndSettle();
    expect(fakeApi.unstarCount, 1);

    final rateTrack = find.byIcon(Icons.star_outline_rounded).first;
    await tester.ensureVisible(rateTrack);
    await tester.tap(rateTrack);
    await tester.pumpAndSettle();
    expect(fakeApi.ratingCount, greaterThan(0));

    final dislikeTrack = find.text('Dislike').first;
    await tester.ensureVisible(dislikeTrack);
    await tester.tap(dislikeTrack);
    await tester.pumpAndSettle();
    expect(fakeApi.lastRating, 1);
  });
}
