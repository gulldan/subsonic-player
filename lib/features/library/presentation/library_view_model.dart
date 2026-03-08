import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';

/// Loads library content and coordinates it with the player queue.
class LibraryViewModel extends ChangeNotifier {
  AppSession? _session;
  PlayerViewModel? _player;
  Future<void>? _dashboardLoadOperation;

  bool _loadingDashboard = false;

  /// Whether the dashboard sections are being refreshed.
  bool get loadingDashboard => _loadingDashboard;

  bool _loadingPlaylistDetails = false;

  /// Whether playlist track details are being loaded.
  bool get loadingPlaylistDetails => _loadingPlaylistDetails;

  bool _searching = false;

  /// Whether a search request is in flight.
  bool get searching => _searching;

  String? _errorMessage;

  /// Last user-visible error produced by the library flow.
  String? get errorMessage => _errorMessage;

  List<SubsonicSong> _featuredSongs = const [];

  /// Featured songs shown on the dashboard.
  List<SubsonicSong> get featuredSongs => _featuredSongs;

  List<SubsonicAlbum> _albums = const [];

  /// Albums shown in collections sections.
  List<SubsonicAlbum> get albums => _albums;

  List<SubsonicPlaylist> _playlists = const [];

  /// Available playlists for the current account.
  List<SubsonicPlaylist> get playlists => _playlists;

  String? _selectedPlaylistId;

  /// Identifier of the currently selected playlist.
  String? get selectedPlaylistId => _selectedPlaylistId;

  List<SubsonicSong> _selectedPlaylistSongs = const [];

  /// Tracks for the selected playlist.
  List<SubsonicSong> get selectedPlaylistSongs => _selectedPlaylistSongs;

  List<SubsonicSong> _searchResults = const [];

  /// Search results for the current query.
  List<SubsonicSong> get searchResults => _searchResults;

  String _searchQuery = '';

  /// Last submitted search query.
  String get searchQuery => _searchQuery;

  /// Attaches session and player dependencies.
  void attach({required AppSession session, required PlayerViewModel player}) {
    if (identical(_session, session) && identical(_player, player)) {
      return;
    }

    _session?.removeListener(_handleSessionChanged);
    _session = session;
    _player = player;
    _session?.addListener(_handleSessionChanged);

    _handleSessionChanged();
  }

  /// Reloads dashboard content from the server.
  Future<void> refresh() async {
    await _loadDashboard(forceReload: true);
  }

  /// Searches the server for tracks matching [query].
  Future<void> search(String query) async {
    final trimmed = query.trim();
    _searchQuery = trimmed;

    if (trimmed.isEmpty) {
      _searching = false;
      _errorMessage = null;
      _searchResults = const [];
      notifyListeners();
      return;
    }

    final client = _session?.client;
    if (client == null) {
      return;
    }

    _searching = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _searchResults = await client.searchSongs(trimmed, count: 60);
    } on Object catch (error) {
      _errorMessage = 'Search failed: $error';
      _searchResults = const [];
    } finally {
      _searching = false;
      notifyListeners();
    }
  }

  /// Starts playback from the featured songs list.
  Future<void> playFeaturedFrom(int index) async {
    if (index < 0 || index >= _featuredSongs.length) {
      return;
    }
    await _player?.setQueueFromSubsonicSongs(
      _featuredSongs,
      startIndex: index,
      autoPlay: true,
    );
  }

  /// Starts playback from the search results list.
  Future<void> playSearchResultFrom(int index) async {
    if (index < 0 || index >= _searchResults.length) {
      return;
    }
    await _player?.setQueueFromSubsonicSongs(
      _searchResults,
      startIndex: index,
      autoPlay: true,
    );
  }

  /// Starts playback from the selected playlist.
  Future<void> playPlaylistSongFrom(int index) async {
    if (index < 0 || index >= _selectedPlaylistSongs.length) {
      return;
    }
    await _player?.setQueueFromSubsonicSongs(
      _selectedPlaylistSongs,
      startIndex: index,
      autoPlay: true,
    );
  }

  /// Loads an album and starts playback from its first track.
  Future<void> playAlbum(SubsonicAlbum album) async {
    final client = _session?.client;
    if (client == null) {
      return;
    }

    try {
      final songs = await client.getAlbumSongs(album.id);
      if (songs.isEmpty) {
        return;
      }
      await _player?.setQueueFromSubsonicSongs(
        songs,
        autoPlay: true,
      );
    } on Object catch (error) {
      _errorMessage = 'Could not load album tracks: $error';
      notifyListeners();
    }
  }

  /// Loads the selected playlist details.
  Future<void> selectPlaylist(String playlistId) async {
    await _selectPlaylist(playlistId);
  }

  Future<void> _selectPlaylist(
    String playlistId, {
    bool forceReload = false,
    bool clearCurrent = true,
  }) async {
    if (!forceReload &&
        _selectedPlaylistId == playlistId &&
        _selectedPlaylistSongs.isNotEmpty) {
      return;
    }

    final client = _session?.client;
    if (client == null) {
      return;
    }

    _selectedPlaylistId = playlistId;
    _loadingPlaylistDetails = true;
    if (clearCurrent) {
      _selectedPlaylistSongs = const [];
    }
    notifyListeners();

    try {
      _selectedPlaylistSongs = await client.getPlaylistSongs(playlistId);
    } on Object catch (error) {
      _errorMessage = 'Could not load playlist tracks: $error';
      _selectedPlaylistSongs = const [];
    } finally {
      _loadingPlaylistDetails = false;
      notifyListeners();
    }
  }

  Future<void> _loadDashboard({bool forceReload = false}) async {
    final client = _session?.client;
    if (client == null) {
      return;
    }
    if (_loadingDashboard) {
      await (_dashboardLoadOperation ?? Future<void>.value());
      return;
    }
    if (!forceReload && _featuredSongs.isNotEmpty && _albums.isNotEmpty) {
      return;
    }

    final loadOperation = _performDashboardLoad(
      client,
      forceReload: forceReload,
    );
    _dashboardLoadOperation = loadOperation;
    await loadOperation;
  }

  Future<void> _performDashboardLoad(
    SubsonicApi client, {
    required bool forceReload,
  }) async {
    _loadingDashboard = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final featuredFuture = client.getRandomSongs(size: 32);
      final albumsFuture = client.getAlbumList2(type: 'newest', size: 40);
      final playlistsFuture = client.getPlaylists();

      final results = await Future.wait<dynamic>([
        featuredFuture,
        albumsFuture,
        playlistsFuture,
      ]);

      _featuredSongs = results[0] as List<SubsonicSong>;
      _albums = results[1] as List<SubsonicAlbum>;
      _playlists = results[2] as List<SubsonicPlaylist>;

      if (_player?.track == null && _featuredSongs.isNotEmpty) {
        await _player?.setQueueFromSubsonicSongs(
          _featuredSongs,
        );
      }

      final selectedPlaylistId = _resolveSelectedPlaylistId();
      if (selectedPlaylistId != null) {
        await _selectPlaylist(
          selectedPlaylistId,
          forceReload: forceReload,
          clearCurrent: selectedPlaylistId != _selectedPlaylistId,
        );
      }
    } on Object catch (error) {
      _errorMessage = 'Could not load library data: $error';
    } finally {
      _loadingDashboard = false;
      _dashboardLoadOperation = null;
      notifyListeners();
    }
  }

  void _handleSessionChanged() {
    if (_session?.status == AppSessionStatus.authenticated) {
      unawaited(_loadDashboard());
      return;
    }

    _loadingDashboard = false;
    _dashboardLoadOperation = null;
    _loadingPlaylistDetails = false;
    _searching = false;
    _errorMessage = null;
    _featuredSongs = const [];
    _albums = const [];
    _playlists = const [];
    _selectedPlaylistId = null;
    _selectedPlaylistSongs = const [];
    _searchResults = const [];
    _searchQuery = '';
    notifyListeners();
  }

  String? _resolveSelectedPlaylistId() {
    if (_playlists.isEmpty) {
      return null;
    }

    final currentId = _selectedPlaylistId;
    if (currentId == null) {
      return _playlists.first.id;
    }

    final hasCurrent = _playlists.any((playlist) => playlist.id == currentId);
    return hasCurrent ? currentId : _playlists.first.id;
  }

  @override
  void dispose() {
    _session?.removeListener(_handleSessionChanged);
    super.dispose();
  }
}
