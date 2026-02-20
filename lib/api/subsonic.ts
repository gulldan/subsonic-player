import { md5 } from './md5';
import { Platform } from 'react-native';
import { getApiUrl } from '@/lib/query-client';
import type {
  ServerConfig,
  SubsonicResponse,
  ArtistsResponse,
  ArtistResponse,
  AlbumResponse,
  AlbumList2Response,
  RandomSongsResponse,
  SearchResult3Response,
  PlaylistsResponse,
  PlaylistResponse,
  GenresResponse,
  StarredResponse,
  ArtistInfoResponse,
  SongResponse,
  TopSongsResponse,
  AlbumListType,
} from './types';

const API_VERSION = '1.16.1';
const CLIENT_NAME = 'SonicWave';
const IS_WEB = Platform.OS === 'web';

type AlbumList2Params = {
  genre?: string;
  fromYear?: number;
  toYear?: number;
};

export class SubsonicClient {
  private config: ServerConfig;
  private salt: string = '';
  private token: string = '';
  private authReady: Promise<void>;
  private proxyBaseUrl: string = '';

  constructor(config: ServerConfig) {
    this.config = config;
    if (IS_WEB) {
      try {
        this.proxyBaseUrl = getApiUrl();
      } catch {
        this.proxyBaseUrl = '';
      }
    }
    if (config.salt && config.token) {
      this.salt = config.salt;
      this.token = config.token;
      this.authReady = Promise.resolve();
    } else {
      this.authReady = this.generateAuth();
    }
  }

  private async generateAuth(): Promise<void> {
    this.salt = Math.random().toString(36).substring(2, 12);
    this.token = md5(this.config.password + this.salt);
  }

  private getServerUrl(): string {
    return this.config.url
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/rest$/i, '');
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint.includes('.') ? endpoint : `${endpoint}.view`;
  }

  private buildAuthParams(): Record<string, string> {
    return {
      u: this.config.username,
      t: this.token,
      s: this.salt,
      v: API_VERSION,
      c: CLIENT_NAME,
      f: 'json',
    };
  }

  private buildDirectUrl(endpoint: string, params: Record<string, string | number | undefined> = {}): string {
    const base = `${this.getServerUrl()}/rest/${this.normalizeEndpoint(endpoint)}`;
    const searchParams = new URLSearchParams();
    const authParams = this.buildAuthParams();
    for (const [key, value] of Object.entries(authParams)) {
      searchParams.set(key, value);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    return `${base}?${searchParams.toString()}`;
  }

  private buildProxyUrl(endpoint: string, params: Record<string, string | number | undefined> = {}): string {
    const base = `${this.proxyBaseUrl}api/subsonic/${this.normalizeEndpoint(endpoint)}`;
    const searchParams = new URLSearchParams();
    searchParams.set('serverUrl', this.getServerUrl());
    const authParams = this.buildAuthParams();
    for (const [key, value] of Object.entries(authParams)) {
      searchParams.set(key, value);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    return `${base}?${searchParams.toString()}`;
  }

  private async request<T>(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    await this.authReady;

    const url = this.proxyBaseUrl
      ? this.buildProxyUrl(endpoint, params)
      : this.buildDirectUrl(endpoint, params);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: SubsonicResponse<T> = await response.json();
    const subResponse = data['subsonic-response'];

    if (subResponse.status === 'failed') {
      const error = subResponse.error;
      throw new Error(error ? `Subsonic error ${error.code}: ${error.message}` : 'Unknown Subsonic error');
    }

    return subResponse as unknown as T;
  }

  async ping(): Promise<boolean> {
    try {
      await this.request('ping');
      return true;
    } catch {
      return false;
    }
  }

  async getArtists(): Promise<ArtistsResponse> {
    return this.request<ArtistsResponse>('getArtists');
  }

  async getArtist(id: string): Promise<ArtistResponse> {
    return this.request<ArtistResponse>('getArtist', { id });
  }

  async getAlbum(id: string): Promise<AlbumResponse> {
    return this.request<AlbumResponse>('getAlbum', { id });
  }

  async getAlbumList2(
    type: AlbumListType,
    size: number = 20,
    offset: number = 0,
    extraParams: AlbumList2Params = {}
  ): Promise<AlbumList2Response> {
    return this.request<AlbumList2Response>('getAlbumList2', { type, size, offset, ...extraParams });
  }

  async getRandomSongs(size: number = 20, genre?: string): Promise<RandomSongsResponse> {
    return this.request<RandomSongsResponse>('getRandomSongs', { size, genre });
  }

  async search3(
    query: string,
    artistCount: number = 20,
    albumCount: number = 20,
    songCount: number = 20,
  ): Promise<SearchResult3Response> {
    return this.request<SearchResult3Response>('search3', {
      query,
      artistCount,
      albumCount,
      songCount,
    });
  }

  async getPlaylists(): Promise<PlaylistsResponse> {
    return this.request<PlaylistsResponse>('getPlaylists');
  }

  async getPlaylist(id: string): Promise<PlaylistResponse> {
    return this.request<PlaylistResponse>('getPlaylist', { id });
  }

  async createPlaylist(name: string, songIds: string[]): Promise<PlaylistResponse> {
    await this.authReady;
    const searchParams = new URLSearchParams();
    if (this.proxyBaseUrl) {
      searchParams.set('serverUrl', this.getServerUrl());
    }
    const authParams = this.buildAuthParams();
    for (const [key, value] of Object.entries(authParams)) {
      searchParams.set(key, value);
    }
    searchParams.set('name', name);
    for (const songId of songIds) {
      searchParams.append('songId', songId);
    }

    const endpoint = this.normalizeEndpoint('createPlaylist');
    const base = this.proxyBaseUrl
      ? `${this.proxyBaseUrl}api/subsonic/${endpoint}`
      : `${this.getServerUrl()}/rest/${endpoint}`;
    const url = `${base}?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: SubsonicResponse<PlaylistResponse> = await response.json();
    const subResponse = data['subsonic-response'];

    if (subResponse.status === 'failed') {
      const error = subResponse.error;
      throw new Error(error ? `Subsonic error ${error.code}: ${error.message}` : 'Unknown Subsonic error');
    }

    return subResponse as unknown as PlaylistResponse;
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.request('deletePlaylist', { id });
  }

  async star(id?: string, albumId?: string, artistId?: string): Promise<void> {
    await this.request('star', { id, albumId, artistId });
  }

  async unstar(id?: string, albumId?: string, artistId?: string): Promise<void> {
    await this.request('unstar', { id, albumId, artistId });
  }

  async getStarred2(): Promise<StarredResponse> {
    return this.request<StarredResponse>('getStarred2');
  }

  async getGenres(): Promise<GenresResponse> {
    return this.request<GenresResponse>('getGenres');
  }

  getCoverArtUrl(id: string, size?: number): string {
    const params: Record<string, string | number | undefined> = { id };
    if (size !== undefined) {
      params.size = size;
    }
    if (this.proxyBaseUrl) {
      return this.buildProxyUrl('getCoverArt', params);
    }
    return this.buildDirectUrl('getCoverArt', params);
  }

  getStreamUrl(id: string): string {
    if (this.proxyBaseUrl) {
      return this.buildProxyUrl('stream', { id });
    }
    return this.buildDirectUrl('stream', { id });
  }

  async getTopSongs(artist: string, count: number = 10): Promise<TopSongsResponse> {
    return this.request<TopSongsResponse>('getTopSongs', { artist, count });
  }

  async getArtistInfo2(id: string): Promise<ArtistInfoResponse> {
    return this.request<ArtistInfoResponse>('getArtistInfo2', { id });
  }

  async scrobble(id: string): Promise<void> {
    await this.request('scrobble', { id });
  }

  async getSong(id: string): Promise<SongResponse> {
    return this.request<SongResponse>('getSong', { id });
  }
}
