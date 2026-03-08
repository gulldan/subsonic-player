import 'package:flutter/material.dart';
import 'package:flutter_sonicwave/app/app.dart';
import 'package:flutter_sonicwave/app/router/app_router.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fakes.dart';

void main() {
  testWidgets('shows login form when user is signed out', (tester) async {
    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(pingResult: true);
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
      router: buildRouter(session),
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    expect(find.text('Log in to your Subsonic server'), findsOneWidget);
    expect(find.text('Connect and open player'), findsOneWidget);
    expect(find.text('Server URL'), findsOneWidget);
  });

  testWidgets('navigates to desktop shell after successful sign in', (
    tester,
  ) async {
    final store = InMemoryServerProfileStore();
    final fakeApi = FakeSubsonicApi(
      pingResult: true,
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
      router: buildRouter(session),
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );

    await tester.pumpAndSettle();

    expect(find.text('Quick Picks'), findsOneWidget);
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
      router: buildRouter(session),
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Connect and open player'));
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
      router: buildRouter(session),
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
    expect(find.text('Collections'), findsAtLeastNWidgets(1));
    expect(find.byType(SingleChildScrollView), findsNothing);
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
      router: buildRouter(session),
    );

    await tester.pumpWidget(app);
    await tester.pumpAndSettle();

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await tester.pumpAndSettle();

    expect(find.text('Now Playing'), findsOneWidget);

    await tester.tap(find.text('Collections').first);
    await tester.pumpAndSettle();
    expect(find.text('Albums'), findsOneWidget);

    await tester.tap(find.text('Playlists').first);
    await tester.pumpAndSettle();
    expect(find.text('Favorites'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('Settings').first);
    await tester.pumpAndSettle();
    expect(find.text('Settings'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('Music').first);
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.favorite_border_rounded).first);
    await tester.pumpAndSettle();
    expect(fakeApi.starCount, 1);

    await tester.tap(find.byIcon(Icons.favorite_rounded).first);
    await tester.pumpAndSettle();
    expect(fakeApi.unstarCount, 1);

    await tester.tap(find.byIcon(Icons.star_outline_rounded).first);
    await tester.pumpAndSettle();
    expect(fakeApi.ratingCount, greaterThan(0));

    await tester.tap(find.byIcon(Icons.thumb_down_alt_outlined).first);
    await tester.pumpAndSettle();
    expect(fakeApi.lastRating, 1);
  });
}
