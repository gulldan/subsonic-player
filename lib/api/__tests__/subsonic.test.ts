import { describe, expect, mock, test } from 'bun:test';

// Mock all native dependencies before importing SubsonicClient
mock.module('react-native', () => ({
  Platform: { OS: 'ios' },
}));
mock.module('expo/fetch', () => ({
  fetch: globalThis.fetch,
}));
mock.module('@/lib/query-client', () => ({
  getApiUrl: () => 'https://proxy.example.com/',
}));

const { SubsonicClient } = await import('../subsonic');

const config = {
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
});
