export interface ServerConfig {
  url: string;
  username: string;
  password: string;
  salt?: string;
  token?: string;
}

export interface SubsonicError {
  code: number;
  message: string;
}

export interface SubsonicResponse<T = Record<string, unknown>> {
  'subsonic-response': {
    status: 'ok' | 'failed';
    version: string;
    type?: string;
    serverVersion?: string;
    error?: SubsonicError;
  } & T;
}

export interface MusicFolder {
  id: number;
  name: string;
}

export interface Genre {
  songCount: number;
  albumCount: number;
  value: string;
}

export interface Artist {
  id: string;
  name: string;
  coverArt?: string;
  albumCount?: number;
  starred?: string;
  artistImageUrl?: string;
}

export interface ArtistIndex {
  name: string;
  artist: Artist[];
}

export interface ArtistsResponse {
  artists: {
    ignoredArticles: string;
    index: ArtistIndex[];
  };
}

export interface Album {
  id: string;
  name: string;
  artist?: string;
  artistId?: string;
  coverArt?: string;
  songCount?: number;
  duration?: number;
  playCount?: number;
  created?: string;
  starred?: string;
  year?: number;
  genre?: string;
  song?: Song[];
}

export interface Song {
  id: string;
  parent?: string;
  isDir?: boolean;
  title: string;
  album?: string;
  albumId?: string;
  artist?: string;
  artistId?: string;
  track?: number;
  year?: number;
  genre?: string;
  coverArt?: string;
  size?: number;
  contentType?: string;
  suffix?: string;
  transcodedContentType?: string;
  transcodedSuffix?: string;
  duration?: number;
  bitRate?: number;
  path?: string;
  playCount?: number;
  discNumber?: number;
  created?: string;
  starred?: string;
  type?: string;
}

export type Child = Song;

export interface Playlist {
  id: string;
  name: string;
  comment?: string;
  owner?: string;
  public?: boolean;
  songCount: number;
  duration: number;
  created?: string;
  changed?: string;
  coverArt?: string;
  entry?: Song[];
}

export interface SearchResult3 {
  artist?: Artist[];
  album?: Album[];
  song?: Song[];
}

export interface AlbumList2 {
  album?: Album[];
}

export interface ArtistInfo {
  biography?: string;
  musicBrainzId?: string;
  lastFmUrl?: string;
  smallImageUrl?: string;
  mediumImageUrl?: string;
  largeImageUrl?: string;
  similarArtist?: Artist[];
}

export interface NowPlayingEntry extends Song {
  username: string;
  minutesAgo: number;
  playerId: number;
  playerName?: string;
}

export interface StarredResponse {
  starred2: {
    artist?: Artist[];
    album?: Album[];
    song?: Song[];
  };
}

export interface ArtistResponse {
  artist: Artist & { album?: Album[] };
}

export interface AlbumResponse {
  album: Album;
}

export interface SongResponse {
  song: Song;
}

export interface PlaylistsResponse {
  playlists: {
    playlist: Playlist[];
  };
}

export interface PlaylistResponse {
  playlist: Playlist;
}

export interface GenresResponse {
  genres: {
    genre: Genre[];
  };
}

export interface SearchResult3Response {
  searchResult3: SearchResult3;
}

export interface AlbumList2Response {
  albumList2: AlbumList2;
}

export interface ArtistInfoResponse {
  artistInfo2: ArtistInfo;
}

export interface RandomSongsResponse {
  randomSongs: {
    song: Song[];
  };
}

export interface TopSongsResponse {
  topSongs: {
    song: Song[];
  };
}

export type AlbumListType =
  | 'newest'
  | 'frequent'
  | 'recent'
  | 'starred'
  | 'random'
  | 'alphabeticalByName'
  | 'alphabeticalByArtist'
  | 'highest'
  | 'byGenre'
  | 'byYear';
