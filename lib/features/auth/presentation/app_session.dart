import 'package:flutter/foundation.dart';
import 'package:flutter_sonicwave/features/auth/data/server_profile_store.dart';
import 'package:flutter_sonicwave/features/auth/domain/server_profile.dart';
import 'package:flutter_sonicwave/features/subsonic/data/subsonic_client.dart';

/// Lifecycle states for the authenticated application session.
enum AppSessionStatus {
  /// Session restoration or sign-in is in progress.
  bootstrapping,

  /// No active authenticated session exists.
  unauthenticated,

  /// The user is signed in and a client is ready.
  authenticated,
}

/// Owns authentication state and the currently active Subsonic client.
class AppSession extends ChangeNotifier {
  /// Creates a session coordinator.
  AppSession({
    required ServerProfileStore profileStore,
    required SubsonicClientFactory clientFactory,
  }) : _profileStore = profileStore,
       _clientFactory = clientFactory;

  final ServerProfileStore _profileStore;
  final SubsonicClientFactory _clientFactory;

  AppSessionStatus _status = AppSessionStatus.bootstrapping;

  /// Current lifecycle status of the session.
  AppSessionStatus get status => _status;

  ServerProfile? _profile;

  /// Authenticated server profile, if available.
  ServerProfile? get profile => _profile;

  SubsonicApi? _client;

  /// Active API client for authenticated requests, if available.
  SubsonicApi? get client => _client;

  String? _errorMessage;

  /// Last user-visible connection or restore error.
  String? get errorMessage => _errorMessage;

  /// Whether the session is currently restoring or authenticating.
  bool get isBusy => _status == AppSessionStatus.bootstrapping;

  /// Restores a persisted session, if one is available.
  Future<void> bootstrap() async {
    _status = AppSessionStatus.bootstrapping;
    _errorMessage = null;
    notifyListeners();

    try {
      final profile = await _profileStore.read();
      if (profile == null) {
        _setSignedOut();
        return;
      }

      await _authenticate(profile, persistProfile: false);
    } on Object catch (error) {
      _closeClient();
      _status = AppSessionStatus.unauthenticated;
      _profile = null;
      _client = null;
      _errorMessage =
          'Saved session could not be restored. Technical details: $error';
      notifyListeners();
    }
  }

  /// Attempts to sign in with the provided server credentials.
  Future<bool> signIn({
    required String serverUrl,
    required String username,
    required String password,
    bool rememberMe = true,
  }) async {
    final candidateProfile = ServerProfile(
      baseUrl: serverUrl,
      username: username,
      password: password,
    );
    final authenticated = await _authenticate(
      candidateProfile,
      persistProfile: rememberMe,
    );
    if (authenticated && !rememberMe) {
      await _profileStore.clear();
    }
    return authenticated;
  }

  /// Signs out and clears any persisted server profile.
  Future<void> signOut() async {
    await _profileStore.clear();
    _closeClient();
    _setSignedOut();
  }

  Future<bool> _authenticate(
    ServerProfile profile, {
    required bool persistProfile,
  }) async {
    _status = AppSessionStatus.bootstrapping;
    _errorMessage = null;
    notifyListeners();

    _closeClient();
    final client = _clientFactory(profile);
    try {
      await client.call('ping');
    } on Object catch (error) {
      client.close();
      _status = AppSessionStatus.unauthenticated;
      _errorMessage = _buildConnectionError(profile: profile, error: error);
      notifyListeners();
      return false;
    }

    _client = client;
    _profile = profile;
    _status = AppSessionStatus.authenticated;
    notifyListeners();

    if (persistProfile) {
      await _profileStore.write(profile);
    }

    return true;
  }

  String _buildConnectionError({
    required ServerProfile profile,
    required Object error,
  }) {
    final details = error.toString();
    final urlHint = profile.baseUrl.startsWith('http://')
        ? ' Your server uses http://. On Apple platforms, this can be blocked by transport security policy.'
        : '';
    return 'Unable to connect to Subsonic server. '
        'Verify URL and credentials. '
        'Technical details: $details.$urlHint';
  }

  void _setSignedOut() {
    _status = AppSessionStatus.unauthenticated;
    _profile = null;
    _client = null;
    _errorMessage = null;
    notifyListeners();
  }

  void _closeClient() {
    _client?.close();
    _client = null;
  }

  @override
  void dispose() {
    _closeClient();
    super.dispose();
  }
}
