import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_sonicwave/features/auth/presentation/app_session.dart';
import 'package:flutter_sonicwave/features/player/presentation/player_view_model.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';

class LibraryViewModel extends ChangeNotifier {
  AppSession? _session;
  PlayerViewModel? _player;

  bool _loadingDashboard = false;
  bool get loadingDashboard => _loadingDashboard;

  bool _loadingPlaylistDetails = false;
  bool get loadingPlaylistDetails => _loadingPlaylistDetails;

  bool _searching = false;
  bool get searching => _searching;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  List<SubsonicSong> _featuredSongs = const [];
  List<SubsonicSong> get featuredSongs => _featuredSongs;

  List<SubsonicAlbum> _albums = const [];
  List<SubsonicAlbum> get albums => _albums;

  List<SubsonicPlaylist> _playlists = const [];
  List<SubsonicPlaylist> get playlists => _playlists;

  String? _selectedPlaylistId;
  String? get selectedPlaylistId => _selectedPlaylistId;

  List<SubsonicSong> _selectedPlaylistSongs = const [];
  List<SubsonicSong> get selectedPlaylistSongs => _selectedPlaylistSongs;

  List<SubsonicSong> _searchResults = const [];
  List<SubsonicSong> get searchResults => _searchResults;

  String _searchQuery = '';
  String get searchQuery => _searchQuery;

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

  Future<void> refresh() async {
    await _loadDashboard(forceReload: true);
  }

  Future<void> search(String query) async {
    final trimmed = query.trim();
    _searchQuery = trimmed;

    if (trimmed.isEmpty) {
      _searching = false;
      _searchResults = const [];
      notifyListeners();
      return;
    }

    final client = _session?.client;
    if (client == null) {
      return;
    }

    _searching = true;
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
        startIndex: 0,
        autoPlay: true,
      );
    } on Object catch (error) {
      _errorMessage = 'Could not load album tracks: $error';
      notifyListeners();
    }
  }

  Future<void> selectPlaylist(String playlistId) async {
    if (_selectedPlaylistId == playlistId &&
        _selectedPlaylistSongs.isNotEmpty) {
      return;
    }

    final client = _session?.client;
    if (client == null) {
      return;
    }

    _selectedPlaylistId = playlistId;
    _loadingPlaylistDetails = true;
    _selectedPlaylistSongs = const [];
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
      return;
    }
    if (!forceReload && _featuredSongs.isNotEmpty && _albums.isNotEmpty) {
      return;
    }

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

      if (_playlists.isNotEmpty) {
        final firstPlaylistId = _playlists.first.id;
        await selectPlaylist(firstPlaylistId);
      }
    } on Object catch (error) {
      _errorMessage = 'Could not load library data: $error';
    } finally {
      _loadingDashboard = false;
      notifyListeners();
    }
  }

  void _handleSessionChanged() {
    if (_session?.status == AppSessionStatus.authenticated) {
      unawaited(_loadDashboard());
      return;
    }

    _loadingDashboard = false;
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

  @override
  void dispose() {
    _session?.removeListener(_handleSessionChanged);
    super.dispose();
  }
}
