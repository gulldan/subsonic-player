import * as Crypto from 'expo-crypto';
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
  AlbumListType,
} from './types';

const API_VERSION = '1.16.1';
const CLIENT_NAME = 'SonicWave';

export class SubsonicClient {
  private config: ServerConfig;
  private salt: string = '';
  private token: string = '';
  private authReady: Promise<void>;

  constructor(config: ServerConfig) {
    this.config = config;
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
    this.token = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      this.config.password + this.salt,
    );
  }

  getSalt(): string {
    return this.salt;
  }

  getToken(): string {
    return this.token;
  }

  private getBaseUrl(): string {
    const url = this.config.url.replace(/\/+$/, '');
    return url;
  }

  private buildUrl(endpoint: string, params: Record<string, string | number | undefined> = {}): string {
    const base = `${this.getBaseUrl()}/rest/${endpoint}`;
    const searchParams = new URLSearchParams();
    searchParams.set('u', this.config.username);
    searchParams.set('t', this.token);
    searchParams.set('s', this.salt);
    searchParams.set('v', API_VERSION);
    searchParams.set('c', CLIENT_NAME);
    searchParams.set('f', 'json');

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }

    return `${base}?${searchParams.toString()}`;
  }

  private async request<T>(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    await this.authReady;
    const url = this.buildUrl(endpoint, params);
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

  async getAlbumList2(type: AlbumListType, size: number = 20, offset: number = 0): Promise<AlbumList2Response> {
    return this.request<AlbumList2Response>('getAlbumList2', { type, size, offset });
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
    const params: Record<string, string | number | undefined> = { name };
    await this.authReady;
    const base = `${this.getBaseUrl()}/rest/createPlaylist`;
    const searchParams = new URLSearchParams();
    searchParams.set('u', this.config.username);
    searchParams.set('t', this.token);
    searchParams.set('s', this.salt);
    searchParams.set('v', API_VERSION);
    searchParams.set('c', CLIENT_NAME);
    searchParams.set('f', 'json');
    searchParams.set('name', name);
    for (const songId of songIds) {
      searchParams.append('songId', songId);
    }
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
    return this.buildUrl('getCoverArt', params);
  }

  getStreamUrl(id: string): string {
    return this.buildUrl('stream', { id });
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
