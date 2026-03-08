import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/library/presentation/library_view_model.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fakes.dart';

void main() {
  test('refresh loads featured songs, albums and playlists', () async {
    const featured = SubsonicSong(
      id: 'song-1',
      title: 'Featured Song',
      artist: 'Artist A',
      duration: Duration(minutes: 3),
      coverArt: 'cover-1',
    );
    const playlistSong = SubsonicSong(
      id: 'song-2',
      title: 'Playlist Song',
      artist: 'Artist B',
      duration: Duration(minutes: 4),
    );
    const album = SubsonicAlbum(
      id: 'album-1',
      name: 'Latest Album',
      artist: 'Artist A',
      songCount: 10,
      coverArtId: 'cover-a',
    );
    const playlist = SubsonicPlaylist(
      id: 'playlist-1',
      name: 'Top Tracks',
      songCount: 2,
      duration: Duration(minutes: 8),
    );

    final api = FakeSubsonicApi(
      randomSongs: const [featured],
      albums: const [album],
      playlists: const [playlist],
      playlistSongsById: const {
        'playlist-1': [playlistSong],
      },
    );
    final session = AppSession(
      profileStore: InMemoryServerProfileStore(),
      clientFactory: (_) => api,
    );
    final player = PlayerViewModel(audioEngine: FakePlayerAudioEngine());
    player.attachSession(session);

    final library = LibraryViewModel();
    library.attach(session: session, player: player);

    await session.signIn(
      serverUrl: 'https://demo.navidrome.org',
      username: 'demo',
      password: 'demo',
    );
    await library.refresh();

    expect(library.featuredSongs, hasLength(1));
    expect(library.albums, hasLength(1));
    expect(library.playlists, hasLength(1));
    expect(library.selectedPlaylistId, 'playlist-1');
    expect(library.selectedPlaylistSongs, hasLength(1));
  });

  test(
    'search returns results and can start playback from result list',
    () async {
      const searchSong = SubsonicSong(
        id: 'song-search',
        title: 'Search Song',
        artist: 'Search Artist',
        duration: Duration(minutes: 5),
      );

      final api = FakeSubsonicApi(
        randomSongs: const [searchSong],
        searchSongsResults: const [searchSong],
      );
      final audio = FakePlayerAudioEngine();
      final session = AppSession(
        profileStore: InMemoryServerProfileStore(),
        clientFactory: (_) => api,
      );
      final player = PlayerViewModel(audioEngine: audio);
      player.attachSession(session);

      final library = LibraryViewModel();
      library.attach(session: session, player: player);

      await session.signIn(
        serverUrl: 'https://demo.navidrome.org',
        username: 'demo',
        password: 'demo',
      );

      await library.search('search song');

      expect(library.searchResults, hasLength(1));
      expect(library.searchResults.first.title, 'Search Song');

      await library.playSearchResultFrom(0);

      expect(player.track?.title, 'Search Song');
      expect(audio.source, isNotNull);
    },
  );

  test(
    'selectPlaylist and playPlaylistSongFrom queue selected playlist tracks',
    () async {
      const playlistTrack = SubsonicSong(
        id: 'song-p',
        title: 'Playlist Loaded Song',
        artist: 'DJ',
        duration: Duration(minutes: 3),
      );
      const playlist = SubsonicPlaylist(
        id: 'playlist-42',
        name: 'Queue Test',
        songCount: 1,
        duration: Duration(minutes: 3),
      );

      final api = FakeSubsonicApi(
        randomSongs: const [playlistTrack],
        playlists: const [playlist],
        playlistSongsById: const {
          'playlist-42': [playlistTrack],
        },
      );
      final audio = FakePlayerAudioEngine();
      final session = AppSession(
        profileStore: InMemoryServerProfileStore(),
        clientFactory: (_) => api,
      );
      final player = PlayerViewModel(audioEngine: audio);
      player.attachSession(session);

      final library = LibraryViewModel();
      library.attach(session: session, player: player);

      await session.signIn(
        serverUrl: 'https://demo.navidrome.org',
        username: 'demo',
        password: 'demo',
      );
      await library.refresh();
      await library.selectPlaylist('playlist-42');

      expect(library.selectedPlaylistSongs, hasLength(1));

      await library.playPlaylistSongFrom(0);

      expect(player.track?.id, 'song-p');
      expect(audio.source?.queryParameters['id'], 'song-p');
    },
  );
}
