export interface ServerConfig {
  url: string;
  username: string;
  password: string;
  apiKey?: string;
  salt?: string;
  token?: string;
}

export interface SubsonicError {
  code: number;
  message: string;
  helpUrl?: string;
}

export interface SubsonicResponse<T = Record<string, unknown>> {
  'subsonic-response': {
    status: 'ok' | 'failed';
    version: string;
    type?: string;
    serverVersion?: string;
    openSubsonic?: boolean;
    error?: SubsonicError;
  } & T;
}

export interface License {
  valid: boolean;
  email?: string;
  licenseExpires?: string;
  trialExpires?: string;
}

interface MusicFolder {
  id: string | number;
  name: string;
}

export interface MusicFolders {
  musicFolder: MusicFolder[];
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
  rating?: number;
  artistImageUrl?: string;
}

export interface ArtistIndex {
  name: string;
  artist: Artist[];
}

interface Index {
  name: string;
  artist?: Artist[];
}

export interface Indexes {
  ignoredArticles: string;
  lastModified: number;
  shortcut?: Artist[];
  child?: Child[];
  index?: Index[];
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
  rating?: number;
  userRating?: number;
  averageRating?: number;
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
  bitDepth?: number;
  samplingRate?: number;
  channelCount?: number;
  path?: string;
  playCount?: number;
  discNumber?: number;
  created?: string;
  starred?: string;
  rating?: number;
  userRating?: number;
  averageRating?: number;
  bookmarkPosition?: number;
  type?: string;
  mediaType?: string;
}

type Child = Song;

export interface Directory {
  id: string;
  parent?: string;
  name: string;
  starred?: string;
  userRating?: number;
  averageRating?: number;
  playCount?: number;
  child?: Child[];
}

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

export interface SearchResult2 {
  artist?: Artist[];
  album?: Song[];
  song?: Song[];
}

export interface SearchResult3 {
  artist?: Artist[];
  album?: Album[];
  song?: Song[];
}

export interface AlbumList {
  album?: Album[];
}

export type AlbumList2 = AlbumList;

export interface ArtistInfo {
  biography?: string;
  musicBrainzId?: string;
  lastFmUrl?: string;
  smallImageUrl?: string;
  mediumImageUrl?: string;
  largeImageUrl?: string;
  similarArtist?: Artist[];
}

export interface AlbumInfo {
  notes?: string;
  musicBrainzId?: string;
  lastFmUrl?: string;
  smallImageUrl?: string;
  mediumImageUrl?: string;
  largeImageUrl?: string;
}

export interface SimilarSongs {
  song?: Song[];
}

export interface OpenSubsonicExtension {
  name: string;
  versions: number[];
}

export interface OpenSubsonicExtensionsResponse {
  openSubsonicExtensions: OpenSubsonicExtension[];
}

interface NowPlayingEntry extends Song {
  username: string;
  minutesAgo: number;
  playerId: number;
  playerName?: string;
}

export interface NowPlaying {
  entry: NowPlayingEntry[];
}

export interface Starred {
  artist?: Artist[];
  album?: Song[];
  song?: Song[];
}

export interface Starred2 {
  artist?: Artist[];
  album?: Album[];
  song?: Song[];
}

export interface Lyrics {
  artist?: string;
  title?: string;
  value?: string;
}

interface StructuredLyricsLine {
  start?: number;
  value: string;
}

interface StructuredLyrics {
  displayArtist?: string;
  displayTitle?: string;
  lang?: string;
  offset?: number;
  synced?: boolean;
  line?: StructuredLyricsLine[];
}

export interface LyricsList {
  structuredLyrics?: StructuredLyrics[];
}

export interface Bookmark {
  position: number;
  username: string;
  comment?: string;
  created: string;
  changed: string;
  entry: Song;
}

export interface Bookmarks {
  bookmark?: Bookmark[];
}

export interface Share {
  id: string;
  url: string;
  description?: string;
  username: string;
  created: string;
  expires?: string;
  lastVisited?: string;
  visitCount: number;
  entry?: Song[];
}

export interface Shares {
  share?: Share[];
}

export interface InternetRadioStation {
  id: string;
  name: string;
  streamUrl: string;
  homePageUrl?: string;
  homepageUrl?: string;
}

export interface InternetRadioStations {
  internetRadioStation?: InternetRadioStation[];
}

export interface User {
  username: string;
  scrobblingEnabled?: boolean;
  maxBitRate?: number;
  adminRole?: boolean;
  settingsRole?: boolean;
  downloadRole?: boolean;
  uploadRole?: boolean;
  playlistRole?: boolean;
  coverArtRole?: boolean;
  commentRole?: boolean;
  podcastRole?: boolean;
  streamRole?: boolean;
  jukeboxRole?: boolean;
  shareRole?: boolean;
  videoConversionRole?: boolean;
  avatarLastChanged?: string;
  folder?: Array<string | number>;
}

export interface Users {
  user?: User[];
}

export interface ScanStatus {
  scanning: boolean;
  count?: number;
  lastScan?: string | number;
  folderCount?: number;
}

export interface TokenInfo {
  username: string;
}

export interface LyricsResponse {
  lyrics: Lyrics;
}

export interface LyricsBySongIdResponse {
  lyricsList: LyricsList;
}

export interface PlayQueue {
  current?: string;
  position?: number;
  username?: string;
  changed?: string;
  changedBy?: string;
  entry?: Song[];
}

export interface PlayQueueByIndex {
  currentIndex?: number;
  position?: number;
  username?: string;
  changed?: string;
  changedBy?: string;
  entry?: Song[];
}

export interface PlayQueueResponse {
  playQueue: PlayQueue;
}

export interface PlayQueueByIndexResponse {
  playQueueByIndex: PlayQueueByIndex;
}

export type TranscodeMediaType = 'song' | 'podcast';

interface StreamDetails {
  protocol?: string;
  container?: string;
  codec?: string;
  audioChannels?: number;
  audioBitrate?: number;
  audioProfile?: string;
  audioSamplerate?: number;
  audioBitdepth?: number;
}

export interface TranscodeDecision {
  canDirectPlay: boolean;
  canTranscode: boolean;
  transcodeReason?: string[];
  errorReason?: string;
  transcodeParams?: string;
  sourceStream?: StreamDetails;
  transcodeStream?: StreamDetails;
}

export interface TranscodeDecisionResponse {
  transcodeDecision: TranscodeDecision;
}

export interface LicenseResponse {
  license: License;
}

export interface MusicFoldersResponse {
  musicFolders: MusicFolders;
}

export interface IndexesResponse {
  indexes: Indexes;
}

export interface MusicDirectoryResponse {
  directory: Directory;
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

export interface SearchResult2Response {
  searchResult2: SearchResult2;
}

export interface SearchResult3Response {
  searchResult3: SearchResult3;
}

export interface AlbumListResponse {
  albumList: AlbumList;
}

export interface AlbumList2Response {
  albumList2: AlbumList2;
}

export interface ArtistInfoResponse {
  artistInfo: ArtistInfo;
}

export interface ArtistInfo2Response {
  artistInfo2: ArtistInfo;
}

export interface AlbumInfoResponse {
  albumInfo: AlbumInfo;
}

export interface SimilarSongsResponse {
  similarSongs: SimilarSongs;
}

export interface SimilarSongs2Response {
  similarSongs2: SimilarSongs;
}

export interface StarredLegacyResponse {
  starred: Starred;
}

export interface StarredResponse {
  starred2: Starred2;
}

export interface NowPlayingResponse {
  nowPlaying: NowPlaying;
}

export interface RandomSongsResponse {
  randomSongs: {
    song: Song[];
  };
}

export interface SongsByGenreResponse {
  songsByGenre: {
    song?: Song[];
  };
}

export interface TopSongsResponse {
  topSongs: {
    song: Song[];
  };
}

export interface BookmarksResponse {
  bookmarks: Bookmarks;
}

export interface SharesResponse {
  shares: Shares;
}

export interface InternetRadioStationsResponse {
  internetRadioStations: InternetRadioStations;
}

export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: Users;
}

export interface ScanStatusResponse {
  scanStatus: ScanStatus;
}

export interface TokenInfoResponse {
  tokenInfo: TokenInfo;
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
