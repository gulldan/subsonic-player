import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fakes.dart';

void main() {
  test('loadFeaturedTrack uses Subsonic random song', () async {
    final api = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: '42',
          title: 'Space Song',
          artist: 'Beach House',
          duration: Duration(minutes: 5),
          coverArt: 'cover42',
        ),
      ],
    );
    final session = AppSession(
      profileStore: InMemoryServerProfileStore(),
      clientFactory: (_) => api,
    );
    final audio = FakePlayerAudioEngine();
    final vm = PlayerViewModel(audioEngine: audio)..attachSession(session);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await vm.loadFeaturedTrack();

    expect(vm.track, isNotNull);
    expect(vm.track?.title, 'Space Song');
    expect(vm.track?.streamUrl, isNotNull);
    expect(audio.source, isNotNull);
  });

  test('togglePlayback toggles state only when track exists', () async {
    final api = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: '10',
          title: 'Track',
          artist: 'Artist',
          duration: Duration(minutes: 3),
        ),
      ],
    );
    final session = AppSession(
      profileStore: InMemoryServerProfileStore(),
      clientFactory: (_) => api,
    );
    final audio = FakePlayerAudioEngine();
    final vm = PlayerViewModel(audioEngine: audio)..attachSession(session);

    await vm.togglePlayback();
    expect(vm.isPlaying, isFalse);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await vm.loadFeaturedTrack();

    await vm.togglePlayback();
    expect(vm.isPlaying, isTrue);
    await vm.togglePlayback();
    expect(vm.isPlaying, isFalse);
  });

  test('seekToFraction clamps values and updates progress', () async {
    final api = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: '12',
          title: 'Track',
          artist: 'Artist',
          duration: Duration(minutes: 4),
        ),
      ],
    );
    final session = AppSession(
      profileStore: InMemoryServerProfileStore(),
      clientFactory: (_) => api,
    );
    final audio = FakePlayerAudioEngine();
    final vm = PlayerViewModel(audioEngine: audio)..attachSession(session);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await vm.loadFeaturedTrack();

    vm.seekToFraction(1.8);
    expect(vm.progress, 1);
    expect(audio.lastSeekPosition, const Duration(minutes: 4));

    vm.seekToFraction(-1);
    expect(vm.progress, 0);
    expect(audio.lastSeekPosition, Duration.zero);
  });

  test('seekToPosition, shuffle, and repeat can be set explicitly', () async {
    final api = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: '12',
          title: 'Track',
          artist: 'Artist',
          duration: Duration(minutes: 4),
        ),
      ],
    );
    final session = AppSession(
      profileStore: InMemoryServerProfileStore(),
      clientFactory: (_) => api,
    );
    final audio = FakePlayerAudioEngine();
    final vm = PlayerViewModel(audioEngine: audio)..attachSession(session);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await vm.loadFeaturedTrack();

    await vm.seekToPosition(const Duration(minutes: 9));
    expect(vm.progress, 1);
    expect(audio.lastSeekPosition, const Duration(minutes: 4));

    vm.setShuffleEnabled(enabled: true);
    expect(vm.shuffleEnabled, isTrue);

    vm.setRepeatMode(PlayerRepeatMode.one);
    expect(vm.repeatMode, PlayerRepeatMode.one);
  });

  test('selectSecondaryTab updates current tab index', () {
    final vm = PlayerViewModel(audioEngine: FakePlayerAudioEngine());

    expect(vm.secondaryTab, 1);

    vm.selectSecondaryTab(2);

    expect(vm.secondaryTab, 2);
  });

  test('skipNext and skipPrevious navigate queue with repeat mode', () async {
    final api = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: 'a',
          title: 'A',
          artist: 'Artist',
          duration: Duration(minutes: 3),
        ),
        SubsonicSong(
          id: 'b',
          title: 'B',
          artist: 'Artist',
          duration: Duration(minutes: 3),
        ),
      ],
    );
    final audio = FakePlayerAudioEngine();
    final session = AppSession(
      profileStore: InMemoryServerProfileStore(),
      clientFactory: (_) => api,
    );
    final vm = PlayerViewModel(audioEngine: audio)..attachSession(session);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await vm.setQueueFromSubsonicSongs(api.randomSongs);

    expect(vm.track?.id, 'a');

    await vm.skipNext();
    expect(vm.track?.id, 'b');

    await vm.skipNext();
    expect(vm.track?.id, 'b');

    vm.cycleRepeatMode(); // all
    await vm.skipNext();
    expect(vm.track?.id, 'a');

    await vm.skipPrevious();
    expect(vm.track?.id, 'b');
  });

  test(
    'favorite and rating actions call Subsonic API and update state',
    () async {
      final api = FakeSubsonicApi(
        randomSongs: const [
          SubsonicSong(
            id: 'track-1',
            title: 'Song',
            artist: 'Artist',
            duration: Duration(minutes: 3),
          ),
        ],
      );
      final audio = FakePlayerAudioEngine();
      final session = AppSession(
        profileStore: InMemoryServerProfileStore(),
        clientFactory: (_) => api,
      );
      final vm = PlayerViewModel(audioEngine: audio)..attachSession(session);

      await session.signIn(
        serverUrl: 'https://demo.navidrome.org',
        username: 'demo',
        password: 'demo',
      );
      await vm.setQueueFromSubsonicSongs(api.randomSongs);

      expect(vm.isFavorite, isFalse);

      await vm.toggleFavorite();
      expect(api.starCount, 1);
      expect(vm.isFavorite, isTrue);

      await vm.toggleFavorite();
      expect(api.unstarCount, 1);
      expect(vm.isFavorite, isFalse);

      await vm.setRating(5);
      expect(api.ratingCount, 1);
      expect(api.lastRating, 5);
      expect(vm.rating, 5);

      await vm.markDisliked();
      expect(api.ratingCount, 2);
      expect(api.lastRating, 1);
      expect(vm.rating, 1);
    },
  );

  test('scrobble is sent after half of track duration', () async {
    final api = FakeSubsonicApi(
      randomSongs: const [
        SubsonicSong(
          id: 'scrobble-song',
          title: 'Scrobble',
          artist: 'Artist',
          duration: Duration(minutes: 4),
        ),
      ],
    );
    final audio = FakePlayerAudioEngine();
    final session = AppSession(
      profileStore: InMemoryServerProfileStore(),
      clientFactory: (_) => api,
    );
    final vm = PlayerViewModel(audioEngine: audio)..attachSession(session);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await vm.setQueueFromSubsonicSongs(api.randomSongs);

    audio.emitPosition(const Duration(minutes: 2, seconds: 1));
    await Future<void>.delayed(Duration.zero);

    expect(api.scrobbleCount, 1);
  });
}
