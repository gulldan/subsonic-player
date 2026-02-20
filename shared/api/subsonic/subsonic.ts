import { Platform } from 'react-native';
import { getApiUrl } from '@/shared/query/client';
import { md5 } from './md5';
import type {
  AlbumInfoResponse,
  AlbumList2Response,
  AlbumListResponse,
  AlbumListType,
  AlbumResponse,
  ArtistInfo2Response,
  ArtistInfoResponse,
  ArtistResponse,
  ArtistsResponse,
  BookmarksResponse,
  GenresResponse,
  IndexesResponse,
  InternetRadioStationsResponse,
  LicenseResponse,
  LyricsBySongIdResponse,
  LyricsResponse,
  MusicDirectoryResponse,
  MusicFoldersResponse,
  NowPlayingResponse,
  OpenSubsonicExtensionsResponse,
  PlaylistResponse,
  PlaylistsResponse,
  PlayQueueByIndexResponse,
  PlayQueueResponse,
  RandomSongsResponse,
  ScanStatusResponse,
  SearchResult2Response,
  SearchResult3Response,
  ServerConfig,
  SharesResponse,
  SimilarSongs2Response,
  SimilarSongsResponse,
  SongResponse,
  SongsByGenreResponse,
  StarredLegacyResponse,
  StarredResponse,
  SubsonicResponse,
  TokenInfoResponse,
  TopSongsResponse,
  TranscodeDecisionResponse,
  TranscodeMediaType,
  UserResponse,
  UsersResponse,
} from './types';

const API_VERSION = '1.16.1';
const CLIENT_NAME = 'SonicWave';
const IS_WEB = Platform.OS === 'web';

type EntityId = string | number;
type RepeatedEntityId = EntityId | EntityId[];

type AlbumListParams = {
  genre?: string;
  fromYear?: number;
  toYear?: number;
  musicFolderId?: EntityId;
};

type SearchQueryParams = {
  artistCount?: number;
  artistOffset?: number;
  albumCount?: number;
  albumOffset?: number;
  songCount?: number;
  songOffset?: number;
  musicFolderId?: EntityId;
};

type StreamOptions = {
  maxBitRate?: number;
  format?: string;
  timeOffset?: number;
  size?: number;
  estimateContentLength?: boolean;
  converted?: boolean;
};

type PrimitiveQueryParam = string | number | boolean;
type QueryParam = PrimitiveQueryParam | PrimitiveQueryParam[] | undefined | null;
type QueryParams = Record<string, QueryParam>;

interface RequestOptions {
  includeAuth?: boolean;
  includeFormat?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: BodyInit | null;
}

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
    if (config.apiKey || (config.salt && config.token)) {
      this.salt = config.salt ?? '';
      this.token = config.token ?? '';
      this.authReady = Promise.resolve();
    } else {
      this.authReady = this.generateAuth();
    }
  }

  private async generateAuth(): Promise<void> {
    if (this.config.apiKey) {
      return;
    }
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

  private buildAuthParams(includeFormat = true, includeAuth = true): Record<string, string> {
    const params: Record<string, string> = {};
    if (includeAuth) {
      if (this.config.apiKey) {
        params.apiKey = this.config.apiKey;
      } else {
        params.u = this.config.username;
        params.t = this.token;
        params.s = this.salt;
      }
    }
    params.v = API_VERSION;
    params.c = CLIENT_NAME;
    if (includeFormat) {
      params.f = 'json';
    }
    return params;
  }

  private appendQueryParams(searchParams: URLSearchParams, params: QueryParams): void {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        for (const item of value) {
          searchParams.append(key, String(item));
        }
        continue;
      }

      searchParams.set(key, String(value));
    }
  }

  private buildDirectUrl(endpoint: string, params: QueryParams = {}, includeFormat = true, includeAuth = true): string {
    const base = `${this.getServerUrl()}/rest/${this.normalizeEndpoint(endpoint)}`;
    const searchParams = new URLSearchParams();
    const authParams = this.buildAuthParams(includeFormat, includeAuth);
    this.appendQueryParams(searchParams, authParams);
    this.appendQueryParams(searchParams, params);
    return `${base}?${searchParams.toString()}`;
  }

  private buildProxyUrl(endpoint: string, params: QueryParams = {}, includeFormat = true, includeAuth = true): string {
    const base = `${this.proxyBaseUrl}api/subsonic/${this.normalizeEndpoint(endpoint)}`;
    const searchParams = new URLSearchParams();
    searchParams.set('serverUrl', this.getServerUrl());
    const authParams = this.buildAuthParams(includeFormat, includeAuth);
    this.appendQueryParams(searchParams, authParams);
    this.appendQueryParams(searchParams, params);
    return `${base}?${searchParams.toString()}`;
  }

  private buildMediaRetrievalUrl(endpoint: string, params: QueryParams = {}): string {
    if (this.proxyBaseUrl) {
      return this.buildProxyUrl(endpoint, params, false);
    }
    return this.buildDirectUrl(endpoint, params, false);
  }

  private async request<T>(endpoint: string, params: QueryParams = {}, options: RequestOptions = {}): Promise<T> {
    await this.authReady;

    const includeAuth = options.includeAuth ?? true;
    const includeFormat = options.includeFormat ?? true;
    const method = options.method ?? 'GET';
    const url = this.proxyBaseUrl
      ? this.buildProxyUrl(endpoint, params, includeFormat, includeAuth)
      : this.buildDirectUrl(endpoint, params, includeFormat, includeAuth);

    const response = await fetch(url, {
      method,
      headers: options.headers,
      body: options.body,
    });

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

  async getLicense(): Promise<LicenseResponse> {
    return this.request<LicenseResponse>('getLicense');
  }

  async getOpenSubsonicExtensions(): Promise<OpenSubsonicExtensionsResponse> {
    try {
      return await this.request<OpenSubsonicExtensionsResponse>(
        'getOpenSubsonicExtensions',
        {},
        { includeAuth: false },
      );
    } catch {
      return this.request<OpenSubsonicExtensionsResponse>('getOpenSubsonicExtensions');
    }
  }

  async tokenInfo(): Promise<TokenInfoResponse> {
    return this.request<TokenInfoResponse>('tokenInfo');
  }

  async getMusicFolders(): Promise<MusicFoldersResponse> {
    return this.request<MusicFoldersResponse>('getMusicFolders');
  }

  async getIndexes(musicFolderId?: EntityId, ifModifiedSince?: number): Promise<IndexesResponse> {
    return this.request<IndexesResponse>('getIndexes', { musicFolderId, ifModifiedSince });
  }

  async getMusicDirectory(id: string): Promise<MusicDirectoryResponse> {
    return this.request<MusicDirectoryResponse>('getMusicDirectory', { id });
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

  async getSong(id: string): Promise<SongResponse> {
    return this.request<SongResponse>('getSong', { id });
  }

  async getGenres(): Promise<GenresResponse> {
    return this.request<GenresResponse>('getGenres');
  }

  async getArtistInfo(id: string, count?: number, includeNotPresent?: boolean): Promise<ArtistInfoResponse> {
    return this.request<ArtistInfoResponse>('getArtistInfo', { id, count, includeNotPresent });
  }

  async getArtistInfo2(id: string, count?: number, includeNotPresent?: boolean): Promise<ArtistInfo2Response> {
    return this.request<ArtistInfo2Response>('getArtistInfo2', { id, count, includeNotPresent });
  }

  async getAlbumInfo(id: string): Promise<AlbumInfoResponse> {
    return this.request<AlbumInfoResponse>('getAlbumInfo', { id });
  }

  async getAlbumInfo2(id: string): Promise<AlbumInfoResponse> {
    return this.request<AlbumInfoResponse>('getAlbumInfo2', { id });
  }

  async getTopSongs(artist: string, count: number = 10): Promise<TopSongsResponse> {
    return this.request<TopSongsResponse>('getTopSongs', { artist, count });
  }

  async getSimilarSongs(id: string, count: number = 50): Promise<SimilarSongsResponse> {
    return this.request<SimilarSongsResponse>('getSimilarSongs', { id, count });
  }

  async getSimilarSongs2(id: string, count: number = 50): Promise<SimilarSongs2Response> {
    return this.request<SimilarSongs2Response>('getSimilarSongs2', { id, count });
  }

  async getAlbumList(
    type: AlbumListType,
    size: number = 20,
    offset: number = 0,
    extraParams: AlbumListParams = {},
  ): Promise<AlbumListResponse> {
    return this.request<AlbumListResponse>('getAlbumList', { type, size, offset, ...extraParams });
  }

  async getAlbumList2(
    type: AlbumListType,
    size: number = 20,
    offset: number = 0,
    extraParams: AlbumListParams = {},
  ): Promise<AlbumList2Response> {
    return this.request<AlbumList2Response>('getAlbumList2', { type, size, offset, ...extraParams });
  }

  async getStarred(musicFolderId?: EntityId): Promise<StarredLegacyResponse> {
    return this.request<StarredLegacyResponse>('getStarred', { musicFolderId });
  }

  async getStarred2(musicFolderId?: EntityId): Promise<StarredResponse> {
    return this.request<StarredResponse>('getStarred2', { musicFolderId });
  }

  async getNowPlaying(): Promise<NowPlayingResponse> {
    return this.request<NowPlayingResponse>('getNowPlaying');
  }

  async getRandomSongs(size: number = 20, genre?: string): Promise<RandomSongsResponse> {
    return this.request<RandomSongsResponse>('getRandomSongs', { size, genre });
  }

  async getSongsByGenre(
    genre: string,
    count: number = 20,
    offset: number = 0,
    musicFolderId?: EntityId,
  ): Promise<SongsByGenreResponse> {
    return this.request<SongsByGenreResponse>('getSongsByGenre', {
      genre,
      count,
      offset,
      musicFolderId,
    });
  }

  async search2(query: string, params: SearchQueryParams = {}): Promise<SearchResult2Response> {
    return this.request<SearchResult2Response>('search2', {
      query,
      artistCount: params.artistCount,
      artistOffset: params.artistOffset,
      albumCount: params.albumCount,
      albumOffset: params.albumOffset,
      songCount: params.songCount,
      songOffset: params.songOffset,
      musicFolderId: params.musicFolderId,
    });
  }

  async search3(
    query: string,
    artistCount: number = 20,
    albumCount: number = 20,
    songCount: number = 20,
    artistOffset: number = 0,
    albumOffset: number = 0,
    songOffset: number = 0,
    musicFolderId?: EntityId,
  ): Promise<SearchResult3Response> {
    return this.request<SearchResult3Response>('search3', {
      query,
      artistCount,
      artistOffset,
      albumCount,
      albumOffset,
      songCount,
      songOffset,
      musicFolderId,
    });
  }

  async getPlaylists(username?: string): Promise<PlaylistsResponse> {
    return this.request<PlaylistsResponse>('getPlaylists', { username });
  }

  async getPlaylist(id: string): Promise<PlaylistResponse> {
    return this.request<PlaylistResponse>('getPlaylist', { id });
  }

  async createPlaylist(name: string, songIds: string[] = [], playlistId?: string): Promise<PlaylistResponse> {
    return this.request<PlaylistResponse>('createPlaylist', {
      playlistId,
      name,
      songId: songIds,
    });
  }

  async updatePlaylist(params: {
    playlistId: string;
    name?: string;
    comment?: string;
    public?: boolean;
    songIdToAdd?: string[];
    songIndexToRemove?: number[];
  }): Promise<void> {
    await this.request('updatePlaylist', params);
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.request('deletePlaylist', { id });
  }

  async star(id?: RepeatedEntityId, albumId?: RepeatedEntityId, artistId?: RepeatedEntityId): Promise<void> {
    await this.request('star', { id, albumId, artistId });
  }

  async unstar(id?: RepeatedEntityId, albumId?: RepeatedEntityId, artistId?: RepeatedEntityId): Promise<void> {
    await this.request('unstar', { id, albumId, artistId });
  }

  async setRating(id: string, rating: number): Promise<void> {
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      throw new Error('rating must be an integer from 0 to 5');
    }
    await this.request('setRating', { id, rating });
  }

  async scrobble(ids: string | string[], time?: number, submission?: boolean): Promise<void> {
    await this.request('scrobble', { id: ids, time, submission });
  }

  async getLyrics(artist?: string, title?: string): Promise<LyricsResponse> {
    return this.request<LyricsResponse>('getLyrics', { artist, title });
  }

  async getLyricsBySongId(id: string): Promise<LyricsBySongIdResponse> {
    return this.request<LyricsBySongIdResponse>('getLyricsBySongId', { id });
  }

  async getBookmarks(): Promise<BookmarksResponse> {
    return this.request<BookmarksResponse>('getBookmarks');
  }

  async createBookmark(id: string, position: number, comment?: string): Promise<void> {
    await this.request('createBookmark', { id, position, comment });
  }

  async deleteBookmark(id: string): Promise<void> {
    await this.request('deleteBookmark', { id });
  }

  async getPlayQueue(): Promise<PlayQueueResponse> {
    return this.request<PlayQueueResponse>('getPlayQueue');
  }

  async savePlayQueue(songIds: string[], current?: string, position?: number): Promise<void> {
    const params: QueryParams = {};
    if (songIds.length > 0) {
      params.id = songIds;
      params.current = current ?? songIds[0];
      params.position = position ?? 0;
    }
    await this.request('savePlayQueue', params);
  }

  async getPlayQueueByIndex(): Promise<PlayQueueByIndexResponse> {
    return this.request<PlayQueueByIndexResponse>('getPlayQueueByIndex');
  }

  async savePlayQueueByIndex(songIds: string[], currentIndex?: number, position?: number): Promise<void> {
    const params: QueryParams = {};
    if (songIds.length > 0) {
      params.id = songIds;
      params.currentIndex = currentIndex ?? 0;
      params.position = position ?? 0;
    }
    await this.request('savePlayQueueByIndex', params);
  }

  async getShares(): Promise<SharesResponse> {
    return this.request<SharesResponse>('getShares');
  }

  async createShare(ids: string[], description?: string, expires?: number): Promise<SharesResponse> {
    return this.request<SharesResponse>('createShare', { id: ids, description, expires });
  }

  async updateShare(id: string, description?: string, expires?: number): Promise<void> {
    await this.request('updateShare', { id, description, expires });
  }

  async deleteShare(id: string): Promise<void> {
    await this.request('deleteShare', { id });
  }

  async getInternetRadioStations(): Promise<InternetRadioStationsResponse> {
    return this.request<InternetRadioStationsResponse>('getInternetRadioStations');
  }

  async createInternetRadioStation(streamUrl: string, name: string, homepageUrl?: string): Promise<void> {
    await this.request('createInternetRadioStation', { streamUrl, name, homepageUrl });
  }

  async updateInternetRadioStation(id: string, streamUrl: string, name: string, homepageUrl?: string): Promise<void> {
    await this.request('updateInternetRadioStation', { id, streamUrl, name, homepageUrl });
  }

  async deleteInternetRadioStation(id: string): Promise<void> {
    await this.request('deleteInternetRadioStation', { id });
  }

  async getUser(username: string): Promise<UserResponse> {
    return this.request<UserResponse>('getUser', { username });
  }

  async getUsers(): Promise<UsersResponse> {
    return this.request<UsersResponse>('getUsers');
  }

  async getScanStatus(): Promise<ScanStatusResponse> {
    return this.request<ScanStatusResponse>('getScanStatus');
  }

  async startScan(fullScan?: boolean): Promise<ScanStatusResponse> {
    return this.request<ScanStatusResponse>('startScan', { fullScan });
  }

  async getTranscodeDecision(
    mediaId: string,
    mediaType: TranscodeMediaType,
    clientInfo: unknown,
  ): Promise<TranscodeDecisionResponse> {
    return this.request<TranscodeDecisionResponse>(
      'getTranscodeDecision',
      { mediaId, mediaType },
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientInfo),
      },
    );
  }

  getCoverArtUrl(id: string, size?: number): string {
    const params: QueryParams = { id, size };
    return this.buildMediaRetrievalUrl('getCoverArt', params);
  }

  getAvatarUrl(username: string): string {
    return this.buildMediaRetrievalUrl('getAvatar', { username });
  }

  getStreamUrl(id: string, options: StreamOptions = {}): string {
    return this.buildMediaRetrievalUrl('stream', { id, ...options });
  }

  getDownloadUrl(id: string, options: StreamOptions = {}): string {
    return this.buildMediaRetrievalUrl('download', { id, ...options });
  }

  getHlsUrl(id: string, bitRates?: Array<number | string>, audioTrack?: number): string {
    const params: QueryParams = { id };
    if (bitRates && bitRates.length > 0) {
      params.bitRate = bitRates;
    }
    if (audioTrack !== undefined) {
      params.audioTrack = audioTrack;
    }
    return this.buildMediaRetrievalUrl('hls.m3u8', params);
  }

  getTranscodeStreamUrl(
    mediaId: string,
    mediaType: TranscodeMediaType,
    transcodeParams: string,
    offset: number = 0,
  ): string {
    return this.buildMediaRetrievalUrl('getTranscodeStream', {
      mediaId,
      mediaType,
      transcodeParams,
      offset,
    });
  }
}
