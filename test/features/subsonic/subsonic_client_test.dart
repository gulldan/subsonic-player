import 'dart:convert';

import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_api_exception.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  const profile = ServerProfile(
    baseUrl: 'https://music.example.com/rest/',
    username: 'demo',
    password: 'pass',
  );

  test('call normalizes endpoint and parses success response', () async {
    late Uri capturedUri;
    final client = SubsonicClient(
      profile,
      httpClient: MockClient((request) async {
        capturedUri = request.url;
        return http.Response(
          jsonEncode({
            'subsonic-response': {
              'status': 'ok',
              'version': '1.16.1',
              'ping': true,
            },
          }),
          200,
        );
      }),
    );

    final root = await client.call('ping');

    expect(capturedUri.path, '/rest/ping.view');
    expect(capturedUri.queryParameters['u'], 'demo');
    expect(capturedUri.queryParameters['v'], '1.16.1');
    expect(capturedUri.queryParameters['c'], 'SonicWaveFlutter');
    expect(capturedUri.queryParameters['f'], 'json');
    expect(root['ping'], true);
  });

  test('call throws SubsonicApiException on failed status', () async {
    final client = SubsonicClient(
      profile,
      httpClient: MockClient((request) async {
        return http.Response(
          jsonEncode({
            'subsonic-response': {
              'status': 'failed',
              'error': {'code': 40, 'message': 'Wrong credentials'},
            },
          }),
          200,
        );
      }),
    );

    expect(
      () => client.call('ping'),
      throwsA(
        isA<SubsonicApiException>()
            .having((e) => e.code, 'code', 40)
            .having((e) => e.message, 'message', 'Wrong credentials'),
      ),
    );
  });

  test('ping returns false when request throws', () async {
    final client = SubsonicClient(
      profile,
      httpClient: MockClient((request) async {
        return http.Response('bad gateway', 502);
      }),
    );

    final result = await client.ping();

    expect(result, isFalse);
  });

  test('getRandomSongs parses list and single object payloads', () async {
    final payloads = <Map<String, dynamic>>[
      {
        'subsonic-response': {
          'status': 'ok',
          'randomSongs': {
            'song': [
              {
                'id': '1',
                'title': 'Track 1',
                'artist': 'Artist 1',
                'duration': 100,
              },
              {
                'id': '2',
                'title': 'Track 2',
                'artist': 'Artist 2',
                'duration': 200,
              },
            ],
          },
        },
      },
      {
        'subsonic-response': {
          'status': 'ok',
          'randomSongs': {
            'song': {
              'id': '3',
              'title': 'Track 3',
              'artist': 'Artist 3',
              'duration': 300,
            },
          },
        },
      },
    ];
    var index = 0;
    final client = SubsonicClient(
      profile,
      httpClient: MockClient((request) async {
        final body = jsonEncode(payloads[index]);
        index += 1;
        return http.Response(body, 200);
      }),
    );

    final many = await client.getRandomSongs(size: 2);
    final one = await client.getRandomSongs(size: 1);

    expect(many.length, 2);
    expect(many.first.title, 'Track 1');
    expect(one.single.id, '3');
    expect(one.single.duration, const Duration(seconds: 300));
  });

  test('media URLs omit format and include auth params', () {
    final client = SubsonicClient(profile);

    final stream = client.getStreamUri('song-1', params: {'maxBitRate': 192});
    final cover = client.getCoverArtUri('cover-1', size: 800);

    expect(stream.path, '/rest/stream.view');
    expect(stream.queryParameters['id'], 'song-1');
    expect(stream.queryParameters['maxBitRate'], '192');
    expect(stream.queryParameters.containsKey('f'), isFalse);
    expect(stream.queryParameters['u'], 'demo');

    expect(cover.path, '/rest/getCoverArt.view');
    expect(cover.queryParameters['id'], 'cover-1');
    expect(cover.queryParameters['size'], '800');
    expect(cover.queryParameters.containsKey('f'), isFalse);
  });

  test('media URL builder supports repeated query parameters', () {
    final client = SubsonicClient(profile);

    final uri = client.getStreamUri(
      'song-1',
      params: {
        'bitRate': [128, 320],
      },
    );

    expect(uri.toString(), contains('bitRate=128'));
    expect(uri.toString(), contains('bitRate=320'));
  });

  test('getAlbumList2 and getPlaylists parse payloads', () async {
    final payloads = <Map<String, dynamic>>[
      {
        'subsonic-response': {
          'status': 'ok',
          'albumList2': {
            'album': [
              {
                'id': 'a1',
                'name': 'Album One',
                'artist': 'Artist One',
                'songCount': 9,
                'coverArt': 'ca1',
              },
            ],
          },
        },
      },
      {
        'subsonic-response': {
          'status': 'ok',
          'playlists': {
            'playlist': {
              'id': 'p1',
              'name': 'Playlist One',
              'songCount': 2,
              'duration': 300,
            },
          },
        },
      },
    ];
    var index = 0;
    final client = SubsonicClient(
      profile,
      httpClient: MockClient((request) async {
        final body = jsonEncode(payloads[index]);
        index += 1;
        return http.Response(body, 200);
      }),
    );

    final albums = await client.getAlbumList2(type: 'newest', size: 1);
    final playlists = await client.getPlaylists();

    expect(albums, hasLength(1));
    expect(albums.first.id, 'a1');
    expect(albums.first.coverArtId, 'ca1');

    expect(playlists, hasLength(1));
    expect(playlists.first.id, 'p1');
    expect(playlists.first.songCount, 2);
  });

  test('getPlaylistSongs and getAlbumSongs parse song lists', () async {
    final payloads = <Map<String, dynamic>>[
      {
        'subsonic-response': {
          'status': 'ok',
          'playlist': {
            'entry': [
              {'id': 's1', 'title': 'Track A', 'artist': 'A', 'duration': 60},
            ],
          },
        },
      },
      {
        'subsonic-response': {
          'status': 'ok',
          'album': {
            'song': {
              'id': 's2',
              'title': 'Track B',
              'artist': 'B',
              'duration': 120,
            },
          },
        },
      },
    ];
    var index = 0;
    final client = SubsonicClient(
      profile,
      httpClient: MockClient((request) async {
        final body = jsonEncode(payloads[index]);
        index += 1;
        return http.Response(body, 200);
      }),
    );

    final playlistSongs = await client.getPlaylistSongs('p1');
    final albumSongs = await client.getAlbumSongs('a1');

    expect(playlistSongs.single.id, 's1');
    expect(albumSongs.single.id, 's2');
    expect(albumSongs.single.duration, const Duration(seconds: 120));
  });

  test('searchSongs parses searchResult3 songs', () async {
    final client = SubsonicClient(
      profile,
      httpClient: MockClient((request) async {
        return http.Response(
          jsonEncode({
            'subsonic-response': {
              'status': 'ok',
              'searchResult3': {
                'song': [
                  {
                    'id': 'sx',
                    'title': 'Found',
                    'artist': 'Finder',
                    'duration': 33,
                  },
                ],
              },
            },
          }),
          200,
        );
      }),
    );

    final results = await client.searchSongs('found', count: 1);

    expect(results, hasLength(1));
    expect(results.first.title, 'Found');
  });

  test(
    'star, unstar, setRating and scrobble hit corresponding endpoints',
    () async {
      final urls = <Uri>[];
      final client = SubsonicClient(
        profile,
        httpClient: MockClient((request) async {
          urls.add(request.url);
          return http.Response(
            jsonEncode({
              'subsonic-response': {'status': 'ok'},
            }),
            200,
          );
        }),
      );

      await client.star('song-1');
      await client.unstar('song-1');
      await client.setRating(songId: 'song-1', rating: 5);
      await client.scrobble('song-1', submission: true, time: 1234);

      expect(urls[0].path, '/rest/star.view');
      expect(urls[1].path, '/rest/unstar.view');
      expect(urls[2].path, '/rest/setRating.view');
      expect(urls[2].queryParameters['rating'], '5');
      expect(urls[3].path, '/rest/scrobble.view');
      expect(urls[3].queryParameters['time'], '1234');
    },
  );

  test('setRating throws on invalid rating value', () {
    final client = SubsonicClient(profile);

    expect(
      () => client.setRating(songId: 'song-1', rating: 7),
      throwsA(
        isA<SubsonicApiException>().having(
          (e) => e.message,
          'message',
          'Rating must be within 0..5 range',
        ),
      ),
    );
  });
}
