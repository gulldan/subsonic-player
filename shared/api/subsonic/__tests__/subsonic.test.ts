import { describe, expect, mock, test } from 'bun:test';

// Mock all native dependencies before importing SubsonicClient
mock.module('react-native', () => ({
  Platform: { OS: 'ios' },
}));
mock.module('expo/fetch', () => ({
  fetch: globalThis.fetch,
}));
mock.module('@/shared/query/client', () => ({
  getApiUrl: () => 'https://proxy.example.com/',
}));

const { SubsonicClient } = await import('../subsonic');

const config: {
  url: string;
  username: string;
  password: string;
  salt: string;
  token: string;
  apiKey?: string;
} = {
  url: 'https://demo.subsonic.org',
  username: 'testuser',
  password: 'testpass',
  salt: 'abcdef',
  token: 'precomputedtoken',
};

function makeClient(overrides: Partial<typeof config> = {}) {
  return new SubsonicClient({ ...config, ...overrides });
}

function params(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

function okResponse(payload: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      'subsonic-response': {
        status: 'ok',
        version: '1.16.1',
        ...payload,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

describe('SubsonicClient', () => {
  describe('getCoverArtUrl', () => {
    test('builds correct direct URL with id and size params', () => {
      const client = makeClient();
      const url = client.getCoverArtUrl('al-123', 300);
      expect(url).toContain('/rest/getCoverArt.view?');
      const p = params(url);
      expect(p.get('id')).toBe('al-123');
      expect(p.get('size')).toBe('300');
    });

    test('does NOT include f=json parameter', () => {
      const client = makeClient();
      const url = client.getCoverArtUrl('al-123', 300);
      expect(params(url).has('f')).toBe(false);
    });

    test('includes auth params', () => {
      const client = makeClient();
      const url = client.getCoverArtUrl('al-123');
      const p = params(url);
      expect(p.get('u')).toBe('testuser');
      expect(p.get('t')).toBe('precomputedtoken');
      expect(p.get('s')).toBe('abcdef');
      expect(p.get('v')).toBe('1.16.1');
      expect(p.get('c')).toBe('SonicWave');
    });

    test('omits size param when not provided', () => {
      const client = makeClient();
      const url = client.getCoverArtUrl('al-123');
      expect(params(url).has('size')).toBe(false);
    });
  });

  describe('getStreamUrl', () => {
    test('builds correct URL without f=json', () => {
      const client = makeClient();
      const url = client.getStreamUrl('song-456');
      expect(url).toContain('/rest/stream.view?');
      const p = params(url);
      expect(p.get('id')).toBe('song-456');
      expect(p.has('f')).toBe(false);
    });

    test('includes auth params', () => {
      const client = makeClient();
      const url = client.getStreamUrl('song-456');
      const p = params(url);
      expect(p.get('u')).toBe('testuser');
      expect(p.get('t')).toBe('precomputedtoken');
      expect(p.get('s')).toBe('abcdef');
    });
  });

  describe('additional URL builders', () => {
    test('getAvatarUrl builds endpoint without format', () => {
      const client = makeClient();
      const url = client.getAvatarUrl('alice');
      expect(url).toContain('/rest/getAvatar.view?');
      const p = params(url);
      expect(p.get('username')).toBe('alice');
      expect(p.has('f')).toBe(false);
    });

    test('getStreamUrl supports Navidrome stream options', () => {
      const client = makeClient();
      const url = client.getStreamUrl('song-456', {
        maxBitRate: 192,
        format: 'opus',
        timeOffset: 15,
        estimateContentLength: true,
      });
      const p = params(url);
      expect(p.get('id')).toBe('song-456');
      expect(p.get('maxBitRate')).toBe('192');
      expect(p.get('format')).toBe('opus');
      expect(p.get('timeOffset')).toBe('15');
      expect(p.get('estimateContentLength')).toBe('true');
      expect(p.has('f')).toBe(false);
    });

    test('getDownloadUrl builds endpoint without format', () => {
      const client = makeClient();
      const url = client.getDownloadUrl('song-456');
      expect(url).toContain('/rest/download.view?');
      const p = params(url);
      expect(p.get('id')).toBe('song-456');
      expect(p.has('f')).toBe(false);
    });

    test('getDownloadUrl supports Navidrome transcoding options', () => {
      const client = makeClient();
      const url = client.getDownloadUrl('song-456', {
        maxBitRate: 128,
        format: 'mp3',
      });
      const p = params(url);
      expect(p.get('id')).toBe('song-456');
      expect(p.get('maxBitRate')).toBe('128');
      expect(p.get('format')).toBe('mp3');
    });

    test('getHlsUrl supports repeated bitRate values', () => {
      const client = makeClient();
      const url = client.getHlsUrl('song-456', [128, 320], 2);
      expect(url).toContain('/rest/hls.m3u8?');
      const p = params(url);
      expect(p.get('id')).toBe('song-456');
      expect(p.getAll('bitRate')).toEqual(['128', '320']);
      expect(p.get('audioTrack')).toBe('2');
      expect(p.has('f')).toBe(false);
    });

    test('getTranscodeStreamUrl builds endpoint with transcode params', () => {
      const client = makeClient();
      const url = client.getTranscodeStreamUrl('song-456', 'song', 'token-123', 12);
      expect(url).toContain('/rest/getTranscodeStream.view?');
      const p = params(url);
      expect(p.get('mediaId')).toBe('song-456');
      expect(p.get('mediaType')).toBe('song');
      expect(p.get('transcodeParams')).toBe('token-123');
      expect(p.get('offset')).toBe('12');
      expect(p.has('f')).toBe(false);
    });
  });

  describe('auth params', () => {
    test('u, t, s, v, c are included in all URLs', () => {
      const client = makeClient();
      const coverUrl = client.getCoverArtUrl('x');
      const streamUrl = client.getStreamUrl('x');
      for (const url of [coverUrl, streamUrl]) {
        const p = params(url);
        expect(p.has('u')).toBe(true);
        expect(p.has('t')).toBe(true);
        expect(p.has('s')).toBe(true);
        expect(p.has('v')).toBe(true);
        expect(p.has('c')).toBe(true);
      }
    });
  });

  describe('getServerUrl', () => {
    test('strips trailing slashes', () => {
      const client = makeClient({ url: 'https://example.com///' });
      const url = client.getCoverArtUrl('x');
      expect(url).toContain('https://example.com/rest/');
    });

    test('strips trailing /rest suffix', () => {
      const client = makeClient({ url: 'https://example.com/rest' });
      const url = client.getCoverArtUrl('x');
      expect(url).not.toContain('/rest/rest/');
      expect(url).toContain('https://example.com/rest/');
    });

    test('strips trailing slash then /rest', () => {
      const client = makeClient({ url: 'https://example.com/rest/' });
      const url = client.getCoverArtUrl('x');
      expect(url).not.toContain('/rest/rest/');
    });
  });

  describe('normalizeEndpoint', () => {
    test('adds .view suffix to endpoints without a dot', () => {
      const client = makeClient();
      const url = client.getCoverArtUrl('x');
      expect(url).toContain('getCoverArt.view');
    });
  });

  describe('request methods', () => {
    test('getOpenSubsonicExtensions first requests endpoint without auth', async () => {
      const client = makeClient();
      const calls: Array<{ url: string; init?: RequestInit }> = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        return okResponse({ openSubsonicExtensions: [] });
      }) as unknown as typeof fetch;

      try {
        await client.getOpenSubsonicExtensions();
      } finally {
        globalThis.fetch = originalFetch;
      }

      expect(calls).toHaveLength(1);
      const p = params(calls[0].url);
      expect(p.get('v')).toBe('1.16.1');
      expect(p.get('c')).toBe('SonicWave');
      expect(p.get('f')).toBe('json');
      expect(p.has('u')).toBe(false);
      expect(p.has('t')).toBe(false);
      expect(p.has('s')).toBe(false);
    });

    test('savePlayQueue forwards repeated ids and defaults current/position', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.savePlayQueue(['a', 'b']);
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.getAll('id')).toEqual(['a', 'b']);
      expect(p.get('current')).toBe('a');
      expect(p.get('position')).toBe('0');
    });

    test('getAlbumList forwards Navidrome/Subsonic list filters', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({ albumList: { album: [] } });
      }) as unknown as typeof fetch;

      try {
        await client.getAlbumList('byGenre', 30, 4, {
          genre: 'Rock',
          fromYear: 1990,
          toYear: 1999,
          musicFolderId: 2,
        });
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.get('type')).toBe('byGenre');
      expect(p.get('size')).toBe('30');
      expect(p.get('offset')).toBe('4');
      expect(p.get('genre')).toBe('Rock');
      expect(p.get('fromYear')).toBe('1990');
      expect(p.get('toYear')).toBe('1999');
      expect(p.get('musicFolderId')).toBe('2');
    });

    test('search2 forwards paging and folder filters', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({ searchResult2: {} });
      }) as unknown as typeof fetch;

      try {
        await client.search2('dream', {
          artistCount: 5,
          artistOffset: 1,
          albumCount: 6,
          albumOffset: 2,
          songCount: 7,
          songOffset: 3,
          musicFolderId: 10,
        });
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.get('query')).toBe('dream');
      expect(p.get('artistCount')).toBe('5');
      expect(p.get('artistOffset')).toBe('1');
      expect(p.get('albumCount')).toBe('6');
      expect(p.get('albumOffset')).toBe('2');
      expect(p.get('songCount')).toBe('7');
      expect(p.get('songOffset')).toBe('3');
      expect(p.get('musicFolderId')).toBe('10');
    });

    test('star forwards repeated id params', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.star(['song-1', 'song-2'], ['album-1'], ['artist-1', 'artist-2']);
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.getAll('id')).toEqual(['song-1', 'song-2']);
      expect(p.getAll('albumId')).toEqual(['album-1']);
      expect(p.getAll('artistId')).toEqual(['artist-1', 'artist-2']);
    });

    test('scrobble supports repeated IDs and submission metadata', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.scrobble(['song-1', 'song-2'], 1700000000000, true);
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.getAll('id')).toEqual(['song-1', 'song-2']);
      expect(p.get('time')).toBe('1700000000000');
      expect(p.get('submission')).toBe('true');
    });

    test('createBookmark forwards id/position/comment', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.createBookmark('song-9', 12345, 'resume');
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.get('id')).toBe('song-9');
      expect(p.get('position')).toBe('12345');
      expect(p.get('comment')).toBe('resume');
    });

    test('createShare forwards repeated ids and optional metadata', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({ shares: { share: [] } });
      }) as unknown as typeof fetch;

      try {
        await client.createShare(['song-1', 'album-2'], 'public link', 1700000000000);
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.getAll('id')).toEqual(['song-1', 'album-2']);
      expect(p.get('description')).toBe('public link');
      expect(p.get('expires')).toBe('1700000000000');
    });

    test('internet radio CRUD uses homepageUrl param', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.createInternetRadioStation('https://radio.example/stream', 'Radio One', 'https://radio.example');
        await client.updateInternetRadioStation('station-1', 'https://radio2.example/stream', 'Radio Two', undefined);
        await client.deleteInternetRadioStation('station-1');
      } finally {
        globalThis.fetch = originalFetch;
      }

      const createParams = params(calls[0]);
      expect(createParams.get('streamUrl')).toBe('https://radio.example/stream');
      expect(createParams.get('name')).toBe('Radio One');
      expect(createParams.get('homepageUrl')).toBe('https://radio.example');

      const updateParams = params(calls[1]);
      expect(updateParams.get('id')).toBe('station-1');
      expect(updateParams.get('streamUrl')).toBe('https://radio2.example/stream');
      expect(updateParams.get('name')).toBe('Radio Two');

      const deleteParams = params(calls[2]);
      expect(deleteParams.get('id')).toBe('station-1');
    });

    test('scan and user endpoints send expected params', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({ user: { username: 'testuser' }, users: { user: [] }, scanStatus: { scanning: false } });
      }) as unknown as typeof fetch;

      try {
        await client.getUser('ignored-by-navidrome');
        await client.getUsers();
        await client.getScanStatus();
        await client.startScan(true);
      } finally {
        globalThis.fetch = originalFetch;
      }

      expect(params(calls[0]).get('username')).toBe('ignored-by-navidrome');
      expect(params(calls[1]).get('username')).toBeNull();
      expect(params(calls[3]).get('fullScan')).toBe('true');
    });

    test('tokenInfo includes auth params by default', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({ tokenInfo: { username: 'testuser' } });
      }) as unknown as typeof fetch;

      try {
        await client.tokenInfo();
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.get('u')).toBe('testuser');
      expect(p.get('t')).toBe('precomputedtoken');
      expect(p.get('s')).toBe('abcdef');
    });

    test('savePlayQueue can clear server queue with empty payload', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.savePlayQueue([]);
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.has('id')).toBe(false);
      expect(p.has('current')).toBe(false);
      expect(p.has('position')).toBe(false);
    });

    test('updatePlaylist sends multi-value parameters', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.updatePlaylist({
          playlistId: 'pl-1',
          name: 'Updated',
          public: true,
          songIdToAdd: ['s1', 's2'],
          songIndexToRemove: [1, 4],
        });
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.get('playlistId')).toBe('pl-1');
      expect(p.get('name')).toBe('Updated');
      expect(p.get('public')).toBe('true');
      expect(p.getAll('songIdToAdd')).toEqual(['s1', 's2']);
      expect(p.getAll('songIndexToRemove')).toEqual(['1', '4']);
    });

    test('getTranscodeDecision sends POST with JSON body', async () => {
      const client = makeClient();
      const calls: Array<{ url: string; init?: RequestInit }> = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        return okResponse({
          transcodeDecision: { canDirectPlay: false, canTranscode: true },
        });
      }) as unknown as typeof fetch;

      try {
        await client.getTranscodeDecision('song-1', 'song', { name: 'client-a' });
      } finally {
        globalThis.fetch = originalFetch;
      }

      expect(calls).toHaveLength(1);
      const p = params(calls[0].url);
      expect(p.get('mediaId')).toBe('song-1');
      expect(p.get('mediaType')).toBe('song');
      expect(calls[0].init?.method).toBe('POST');
      expect((calls[0].init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      expect(calls[0].init?.body).toBe(JSON.stringify({ name: 'client-a' }));
    });

    test('setRating rejects invalid values', async () => {
      const client = makeClient();
      await expect(client.setRating('song-1', -1)).rejects.toThrow('rating must be an integer from 0 to 5');
      await expect(client.setRating('song-1', 6)).rejects.toThrow('rating must be an integer from 0 to 5');
      await expect(client.setRating('song-1', 1.5)).rejects.toThrow('rating must be an integer from 0 to 5');
    });

    test('request wrappers forward params for extended endpoints', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({
          license: { valid: true },
          musicFolders: { musicFolder: [] },
          indexes: { ignoredArticles: '', lastModified: 0 },
          directory: { id: 'dir-1', name: 'Dir' },
          song: { id: 'song-1', title: 'Song' },
          artistInfo: {},
          artistInfo2: {},
          albumInfo: {},
          similarSongs: { song: [] },
          similarSongs2: { song: [] },
          starred: {},
          nowPlaying: { entry: [] },
          randomSongs: { song: [] },
          songsByGenre: { song: [] },
          searchResult3: {},
          playlists: { playlist: [] },
          lyrics: {},
          lyricsList: {},
          playQueue: { entry: [] },
          playQueueByIndex: { entry: [] },
          user: { username: 'testuser' },
          users: { user: [] },
          scanStatus: { scanning: false },
        });
      }) as unknown as typeof fetch;

      try {
        await client.getLicense();
        await client.getMusicFolders();
        await client.getIndexes(3, 111);
        await client.getMusicDirectory('dir-1');
        await client.getSong('song-1');
        await client.getArtistInfo('artist-1', 5, true);
        await client.getArtistInfo2('artist-2', 7, false);
        await client.getAlbumInfo('album-1');
        await client.getAlbumInfo2('album-2');
        await client.getSimilarSongs('artist-1', 12);
        await client.getSimilarSongs2('artist-2', 13);
        await client.getStarred(4);
        await client.getNowPlaying();
        await client.getRandomSongs(15, 'Rock');
        await client.getSongsByGenre('Rock', 9, 2, 5);
        await client.search3('query', 1, 2, 3, 4, 5, 6, 7);
        await client.getPlaylists('nav-user');
        await client.getLyrics('Artist', 'Title');
        await client.getLyricsBySongId('song-lyric-1');
        await client.getPlayQueue();
        await client.getPlayQueueByIndex();
        await client.getUser('nav-user');
        await client.getUsers();
        await client.startScan(false);
      } finally {
        globalThis.fetch = originalFetch;
      }

      expect(calls[2]).toContain('/rest/getIndexes.view?');
      const indexesParams = params(calls[2]);
      expect(indexesParams.get('musicFolderId')).toBe('3');
      expect(indexesParams.get('ifModifiedSince')).toBe('111');

      expect(calls[5]).toContain('/rest/getArtistInfo.view?');
      expect(params(calls[5]).get('includeNotPresent')).toBe('true');
      expect(params(calls[6]).get('includeNotPresent')).toBe('false');

      expect(calls[14]).toContain('/rest/getSongsByGenre.view?');
      const songsByGenreParams = params(calls[14]);
      expect(songsByGenreParams.get('genre')).toBe('Rock');
      expect(songsByGenreParams.get('count')).toBe('9');
      expect(songsByGenreParams.get('offset')).toBe('2');
      expect(songsByGenreParams.get('musicFolderId')).toBe('5');

      expect(calls[15]).toContain('/rest/search3.view?');
      const search3Params = params(calls[15]);
      expect(search3Params.get('artistOffset')).toBe('4');
      expect(search3Params.get('albumOffset')).toBe('5');
      expect(search3Params.get('songOffset')).toBe('6');
      expect(search3Params.get('musicFolderId')).toBe('7');

      expect(calls[16]).toContain('/rest/getPlaylists.view?');
      expect(params(calls[16]).get('username')).toBe('nav-user');
      expect(params(calls[23]).get('fullScan')).toBe('false');
    });

    test('savePlayQueueByIndex forwards repeated ids and explicit index values', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.savePlayQueueByIndex(['s1', 's2'], 1, 4500);
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.getAll('id')).toEqual(['s1', 's2']);
      expect(p.get('currentIndex')).toBe('1');
      expect(p.get('position')).toBe('4500');
    });

    test('updateShare forwards metadata updates', async () => {
      const client = makeClient();
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse();
      }) as unknown as typeof fetch;

      try {
        await client.updateShare('share-1', 'renamed', 0);
      } finally {
        globalThis.fetch = originalFetch;
      }

      const p = params(calls[0]);
      expect(p.get('id')).toBe('share-1');
      expect(p.get('description')).toBe('renamed');
      expect(p.get('expires')).toBe('0');
    });

    test('ping returns false on HTTP error', async () => {
      const client = makeClient();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async () => new Response('fail', { status: 500 })) as unknown as typeof fetch;

      try {
        await expect(client.ping()).resolves.toBe(false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('request throws for failed subsonic-response payload', async () => {
      const client = makeClient();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(
        async () =>
          new Response(
            JSON.stringify({
              'subsonic-response': {
                status: 'failed',
                version: '1.16.1',
                error: { code: 40, message: 'Wrong credentials' },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
      ) as unknown as typeof fetch;

      try {
        await expect(client.getLicense()).rejects.toThrow('Subsonic error 40: Wrong credentials');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('apiKey auth and generated token branches are supported', async () => {
      const apiKeyClient = makeClient({ apiKey: 'key-123', salt: undefined, token: undefined });
      const apiKeyUrl = apiKeyClient.getCoverArtUrl('cover-1');
      const apiKeyParams = params(apiKeyUrl);
      expect(apiKeyParams.get('apiKey')).toBe('key-123');
      expect(apiKeyParams.has('u')).toBe(false);
      expect(apiKeyParams.has('t')).toBe(false);
      expect(apiKeyParams.has('s')).toBe(false);

      const generatedAuthClient = new SubsonicClient({
        url: 'https://demo.subsonic.org',
        username: 'u1',
        password: 'p1',
      });
      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({ playlists: { playlist: [] } });
      }) as unknown as typeof fetch;

      try {
        await generatedAuthClient.getPlaylists();
      } finally {
        globalThis.fetch = originalFetch;
      }

      const generatedAuthParams = params(calls[0]);
      expect(generatedAuthParams.get('u')).toBe('u1');
      expect(generatedAuthParams.get('s')).toBeTruthy();
      expect(generatedAuthParams.get('t')).toBeTruthy();
    });

    test('proxy URL path is used when proxy base URL is configured', async () => {
      const client = makeClient();
      (client as unknown as { proxyBaseUrl: string }).proxyBaseUrl = 'https://proxy.example.com/';

      const calls: string[] = [];
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return okResponse({ artists: { ignoredArticles: '', index: [] } });
      }) as unknown as typeof fetch;

      try {
        await client.getArtists();
      } finally {
        globalThis.fetch = originalFetch;
      }

      expect(calls[0]).toContain('https://proxy.example.com/api/subsonic/getArtists.view?');
      expect(params(calls[0]).get('serverUrl')).toBe('https://demo.subsonic.org');
    });
  });
});
